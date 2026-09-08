"""Compare imported footprint geometry with the supplied game's unmodified x86.
Usage: python scripts/check-native-building-shapes.py /path/to/d3dpoptb.exe
Requires objects/shapes.dat and objects/objs0-2.dat beside the executable.
Only the shape loader's file-I/O leaves are supplied; relocation and all geometry
(including angle, integer steps and wrap-distance leaves) execute natively.
"""
import importlib.util,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];source=Path(sys.argv[1]).parent
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
objects,shapes,p,out,stack,stop=0x2000000,0x2003000,0x2006000,0x2006100,0x201d000,0x201e000
raw=(source/'objects/shapes.dat').read_bytes();objs=(source/'objects/objs0-2.dat').read_bytes()
assert len(raw)==4604 and len(objs)==158*54
cpu.mem_write(objects,objs);cpu.mem_write(shapes,raw);cpu.mem_write(0x895ec1,struct.pack('<I',objects));cpu.mem_write(0x59df3c,struct.pack('<I',shapes))
assert struct.unpack('<I',cpu.mem_read(0x5ca2ec,4))[0]==64
spec=importlib.util.spec_from_file_location('assets',root/'scripts/import-original.py');assets=importlib.util.module_from_spec(spec);spec.loader.exec_module(assets)
imported=json.loads((root/'app/original-shapes.json').read_text());assert assets.building_shapes(raw,objs)==imported
for invalid in [b'',raw[:3072]]:
    try:assets.building_shapes(invalid,objs)
    except AssertionError:pass
    else:raise AssertionError('Truncated shapes accepted')
def call(address,*args):
    cpu.mem_write(stack,struct.pack('<'+'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]));cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
# Verify loader relocation against the raw shape record offsets. I/O hooks are
# removed before any geometry comparison, so nested geometry cannot be mocked.
def success(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,1)
    cpu.reg_write(UC_X86_REG_EIP,struct.unpack('<I',cpu.mem_read(sp,4))[0]);cpu.reg_write(UC_X86_REG_ESP,sp+4)
# Addresses come from the actual loader call instructions, verified with Capstone.
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
md=Cs(CS_ARCH_X86,CS_MODE_32)
leaves=[]
for i in md.disasm(bytes(cpu.mem_read(0x40c880,144)),0x40c880):
    if i.mnemonic=='ret':break
    if i.mnemonic=='call':leaves.append(int(i.op_str,16))
assert len(leaves)==2,leaves
hooks=[cpu.hook_add(UC_HOOK_CODE,success,begin=a,end=a) for a in leaves]
call(0x40c880)
for h in hooks:cpu.hook_del(h)
for i in range(64):assert struct.unpack('<I',cpu.mem_read(shapes+i*48+44,4))[0]==shapes+3072+imported['shapes'][i]['offset']
print('PASS: native relocation of all 64 shape records and exact importer/raw asset comparison')
rng=random.Random(0x409710);cases=[];expected=[]
poses=[(i,a*512) for i,row in enumerate(imported['objects']) for a in range(len(row))]
for object_,angle in poses:
    for trial in range(12):
        x,y=(rng.choice([0,512,32256,32768,65024]),rng.choice([0,512,32256,32768,65024])) if trial<8 else (rng.randrange(128)*512,rng.randrange(128)*512)
        b=dict(object=object_,angle=angle,anchorX=x,anchorY=y)
        cpu.mem_write(p,bytes(256));cpu.mem_write(p+0x26,struct.pack('<H',angle));cpu.mem_write(p+0x33,struct.pack('<h',object_));cpu.mem_write(p+0x7a,struct.pack('<HH',x,y))
        for mode in ['inside','outside','queue','approach']:
            index=[-128,-1,0,1,2,3,7,15,31,63,100,127][trial]
            address={'inside':0x404420,'outside':0x4044b0,'queue':0x409710,'approach':0x40a460}[mode]
            point=dict(x=(x+rng.randrange(-1536,1537))&65535,y=(y+rng.randrange(-1536,1537))&65535)
            cpu.mem_write(out+16,struct.pack('<HH',point['x'],point['y']))
            call(address,p,out+16,out) if mode=='approach' else call(address,p,index,out) if mode=='queue' else call(address,p,out)
            px,py=struct.unpack('<HH',cpu.mem_read(out,4));cases.append(dict(b=b,mode=mode,index=index,point=point));expected.append(dict(x=px,y=py))
js="""import {buildingInsidePoint,buildingOutsidePoint,buildingQueuePoint,buildingApproachPoint} from './app/building-shapes.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>c.mode==='approach'?buildingApproachPoint(c.b,c.point):c.mode==='inside'?buildingInsidePoint(c.b):c.mode==='outside'?buildingOutsidePoint(c.b):buildingQueuePoint(c.b,c.index))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        path=Path('/private/tmp/populous-shape-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(path)))
print(f'PASS: {len(cases)} native inside/outside/queue/approach points across {len(poses)} object/orientation pairs, wrap boundaries and signed queue slots; no geometry leaves supplied')
