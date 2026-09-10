"""Run complete original person layer renderers against the shipped TS/atlas.
Usage: python scripts/check-native-sprite-layers.py /path/to/d3dpoptb.exe
--record updates the reviewed regression fixture; never run it in a normal check.
"""
import hashlib, importlib.util, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from PIL import Image
from decomp import native_cpu, ROOT

exe = Path(sys.argv[1]); cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x1000000)
bank, frames, elements, camera, stack, stop = 0x2000000, 0x2100000, 0x2200000, 0x2400000, 0x2ffd000, 0x2ffe000
units = json.loads((ROOT/'app/original-units.json').read_text())
views = json.loads((ROOT/'app/original-camera.json').read_text())['views']
rules = json.loads((ROOT/'app/original-rules.json').read_text())
def write(a, fmt, *values): cpu.mem_write(a, struct.pack('<'+fmt, *values))
def read(a, fmt): return struct.unpack('<'+fmt, cpu.mem_read(a, struct.calcsize('<'+fmt)))[0]
spec = importlib.util.spec_from_file_location('importer', ROOT/'scripts/import-original.py')
importer = importlib.util.module_from_spec(spec); spec.loader.exec_module(importer)
raw = importer.sprites((exe.parent/'data/hspr0-0.dat').read_bytes(), (exe.parent/'data/pal0-c.dat').read_bytes())
for i,(w,h,_) in enumerate(raw): write(bank+(i+1)*8, 'IHH', 0,w,h)
vfra = (exe.parent/'data/vfra-0.ani').read_bytes()
# Loaded VFRA draw records omit the two-byte next-frame link.
cpu.mem_write(frames,b''.join(vfra[i:i+6] for i in range(0,len(vfra),8)))
vele = bytearray((exe.parent/'data/vele-0.ani').read_bytes())
for i in range(0,len(vele),10): struct.pack_into('<H',vele,i,struct.unpack_from('<H',vele,i)[0]//6*8)
cpu.mem_write(elements,bytes(vele))
write(0x59df18,'I',bank); write(0x59df48,'I',frames); write(0x59df4c,'I',elements); write(0x74a350,'I',camera)
packed = {p['source']: i for i,p in enumerate(units['pieces'])}
atlas = Image.open(ROOT/f"public/original/{units['atlas']}.png").convert('RGBA')
assert atlas.size == (units['width'],units['height'])
hashes = []
for i,p in enumerate(units['pieces']):
    w,h,data=raw[p['source']]; assert (w,h)==(p['w'],p['h'])
    x=i%units['columns']*units['cell']; y=i//units['columns']*units['cell']
    assert atlas.crop((x,y,x+w,y+h)).tobytes()==data, ('atlas piece',i,p['source'])
    hashes.append(hashlib.sha256(data).hexdigest())
def submit(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP); source=(read(sp+12,'I')-bank)//8-1
    w,h=raw[source][:2] if a==0x5162e0 else (read(sp+16,'i'),read(sp+20,'i'))
    draws.append(dict(piece=packed[source], x=read(sp+4,'i'), y=read(sp+8,'i'),w=w,h=h,flags=read(0x5da074,'I')))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for address in (0x5162e0,0x516430): cpu.hook_add(UC_HOOK_CODE,submit,begin=address,end=address)
def native(frame, options, view):
    global draws
    owner=options['owner']; person=options['person']; variant=options['variant']
    address=0x45efd0 if owner==-1 else 0x45f9d0 if person else 0x45f4a0
    write(0x89d164,'B',int(options['scale'])); write(0x89bc86,'i',options['bucket'])
    write(camera+0x2a,'i',view['scale']);write(0x87ca6c,'ii',view['spriteScale'],view['shamanScale']);write(0x89c669,'I',options['levelFlags'])
    args=[stop,units['frames'][frame]['source'],0,0,options['flags'],owner,person,variant]
    write(stack,'8I',*[x&0xffffffff for x in args]);cpu.reg_write(UC_X86_REG_ESP,stack);draws=[]
    cpu.emu_start(address,stop,count=20000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return draws
rng=random.Random(0x45f9d0);cases=[]
for frame in range(len(units['frames'])):
    for owner in (-1,0,1):
        descriptor=rng.choice(rules['animationDescriptors'][14:19])
        options=dict(owner=owner,person=descriptor['person'],variant=descriptor['variant'],flags=rng.randrange(8),bucket=rng.choice([-3585,-1792,-1,1,1791,1792,2700,3585]),scale=bool(rng.randrange(2)),levelFlags=rng.choice([0,0x100,0x380]))
        view=rng.choice(views);cases.append(dict(frame=frame,options=options,view=view,draws=native(frame,options,view)))
js="""import {spriteLayers} from './app/sprite-layers.ts';import u from './app/original-units.json' with {type:'json'};let s='';for await(const c of process.stdin)s+=c;for(const c of JSON.parse(s)){const got=spriteLayers(u.frames[c.frame].layers,u.pieces,c.options,c.view);if(JSON.stringify(got)!==JSON.stringify(c.draws))throw Error(JSON.stringify({case:c,got}));}"""
result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=ROOT)
assert result.returncode==0,result.stderr
print(f'PASS: {len(cases):,} complete native layer draws; {len(hashes):,} atlas pieces match original RGBA',flush=True)
# Smaller durable fixtures exercise live imported states/owners/directions independently
# of TS. Pixel hashes below prevent an importer/atlas change silently updating expectations.
fixtures=[]
for signature,states in units['animations'].items():
    team,kind=signature.split('-');shaman=kind=='shaman';owner=-1 if shaman or team=='wild' else 0 if team=='blue' else 1
    for state in ('idle','walk','work','attack','airborne','die','launch','stagger','idleShift','idleLook','idleScratch'):
        if state not in states:continue
        for direction,cycle in enumerate(states[state]):
            step=(direction*3)%len(cycle['frames']);frame=cycle['frames'][step]
            options=dict(owner=owner,person=2 if kind=='warrior' else 0,variant=2 if kind=='warrior' else 0,flags=int(cycle['flip'])|(2 if state in ('airborne','die','launch') else 0),bucket=-2000 if shaman else 2000,scale=True,levelFlags=0x100)
            view=views[0]
            fixtures.append(dict(signature=signature,state=state,direction=direction,step=step,frame=frame,options=options,view=view,draws=native(frame,options,view),pixels=native(frame,{**options,'scale':shaman,'levelFlags':0},{**view,'shamanScale':256})))
fixture=dict(atlasSha256=hashlib.sha256((ROOT/f"public/original/{units['atlas']}.png").read_bytes()).hexdigest(),executableSha256=hashlib.sha256(exe.read_bytes()).hexdigest(),pieceHashes=hashes,cases=fixtures)
path=ROOT/'tests/fixtures/unit-sprites.json'
if '--record' in sys.argv:
    path.parent.mkdir(exist_ok=True);path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else: assert json.loads(path.read_text())==fixture,'Native fixture drift; review before --record'
print(f'PASS: {len(fixtures)} reviewed unit/state/direction fixtures')
