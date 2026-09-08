"""Compare complete 0x403a00 footprint writes and 0x450d50 cell shade.
Footprint shade/texture consumers are supplied and ordered; shape traversal runs
on original relocated bank-2 data. Shade comparisons execute all native code.
Usage: python scripts/check-native-building-footprints.py /path/to/d3dpoptb.exe
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,load_native_shapes
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x30000);p,stack,stop=0x2006000,0x202d000,0x202e000;load_native_shapes(cpu,exe,0x2000000,0x2003000)
rng=random.Random(0x403a00)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,timeout=1000000,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
 return cpu.reg_read(UC_X86_REG_EAX)
def compare(js,data,expected,label):
 r=subprocess.run(['node','--input-type=module','-e',"let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);"+js],input=json.dumps(data),capture_output=True,text=True,cwd=root)
 assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(label,i,a,b)
 print(f'PASS: {len(expected):,} native {label} comparisons',flush=True)
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP)
 if a==0x450d50:
  addr=read(sp+4,'I');index=(addr-0x8a03e4)//16;events.append(['shade',index,read(addr,'I'),read(addr+8,'H'),read(addr+11,'B')]);result=(index*7+turn)%23-3
 else:events.append(['refresh',read(sp+4,'H'),read(sp+8,'h')]);result=0
 cpu.reg_write(UC_X86_REG_EAX,result&0xffffffff);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
hooks=[cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a) for a in [0x450d50,0x4bdd40]]
base=bytes(rng.randrange(256) for _ in range(16384*16));cpu.mem_write(0x8a03e4,base)
def packed():return b''.join(bytes(cpu.mem_read(0x8a03e4+i*16,4))+bytes(cpu.mem_read(0x8a03e4+i*16+8,2))+bytes(cpu.mem_read(0x8a03e4+i*16+11,1))+bytes(cpu.mem_read(0x8a03e4+i*16+14,1)) for i in range(16384))
initial=dict(flags=[read(0x8a03e4+i*16,'I') for i in range(16384)],buildingIds=[read(0x8a03e4+i*16+8,'H') for i in range(16384)],owners=[read(0x8a03e4+i*16+11,'B') for i in range(16384)],shadows=[read(0x8a03e4+i*16+14,'B') for i in range(16384)])
shapes=json.loads((root/'app/original-shapes.json').read_text());ops=[];expected=[]
# Every imported object and orientation; add/remove/change/update modes cycle.
for turn,(obj,angle) in enumerate((o,a*512) for o,row in enumerate(shapes['objects']) for a in range(len(row))):
 b=dict(object=obj,angle=angle,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]),id=rng.randrange(1,1024),tribe=turn%4);mode=[1,0,4,2,3,255][turn%6]
 cpu.mem_write(p,bytes(256));write(p+0x33,'h',obj);write(p+0x26,'H',angle);write(p+0x24,'H',b['id']);write(p+0x2f,'B',b['tribe']);write(p+0x7a,'HH',b['anchorX'],b['anchorY']);events=[]
 call(0x403a00,p,mode);ops.append(dict(b=b,mode=mode));expected.append(dict(hash=hashlib.sha256(packed()).hexdigest(),events=events))
compare("""import {registerBuildingFootprint} from './app/building-shapes.ts';import {createHash} from 'node:crypto';
 const l={flags:Uint32Array.from(input.initial.flags),buildingIds:Uint16Array.from(input.initial.buildingIds),owners:Uint8Array.from(input.initial.owners),shadows:Uint8Array.from(input.initial.shadows)};
 console.log(JSON.stringify(input.ops.map((op,turn)=>{const events=[];registerBuildingFootprint(l,op.b,op.mode,i=>{events.push(['shade',i,l.flags[i],l.buildingIds[i],l.owners[i]]);return (i*7+turn)%23-3;},(cell,radius)=>events.push(['refresh',cell,radius]));
 const b=Buffer.alloc(16384*8);for(let i=0;i<16384;i++){b.writeUInt32LE(l.flags[i],i*8);b.writeUInt16LE(l.buildingIds[i],i*8+4);b[i*8+6]=l.owners[i];b[i*8+7]=l.shadows[i];}return {hash:createHash('sha256').update(b).digest('hex'),events};})));""",dict(initial=initial,ops=ops),expected,'footprint map/consumer')
for h in hooks:cpu.hook_del(h)
cases=[];expected=[]
for i in range(4096):
 b=dict(**{'class':rng.choice([0,2])},model=i%20,state=rng.choice([0,1,2]),flags2=rng.choice([0,1]),stage=rng.choice([0,1,2,3,4,127,128,255])) if i%7 else None
 objects=[dict(**{'class':rng.choice([1,5,5])},model=rng.randrange(20)) for _ in range(i%8)];flags=rng.choice([0,0x200]);cell=0x8a03e4
 write(cell,'I',flags);write(cell+8,'H',1 if b else 0);write(cell+6,'H',2 if objects else 0)
 if b:
  write(0x890394,'I',p);cpu.mem_write(p,bytes(256));write(p+0x2a,'BBB',b['class'],b['model'],b['state']);write(p+0xc,'I',b['flags2']);write(p+0x78,'B',b['stage'])
 for j,o in enumerate(objects):
  addr=p+(j+1)*256;write(0x890390+(j+2)*4,'I',addr);cpu.mem_write(addr,bytes(256));write(addr+0x2a,'BB',o['class'],o['model']);write(addr+0x20,'H',j+3 if j+1<len(objects) else 0)
 result=call(0x450d50,cell);expected.append(result if result<0x80000000 else result-0x100000000);cases.append(dict(flags=flags,b=b,objects=objects))
compare("import {nativeCellShade} from './app/building-shapes.ts';console.log(JSON.stringify(input.map(c=>nativeCellShade(c.flags,c.b,c.objects))));",cases,expected,'cell shade')
