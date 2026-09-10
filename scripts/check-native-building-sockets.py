"""Compare complete 00404540 sockets with original assets and smoke.txt corrections.
Terrain height is a supplied deterministic consumer; placement/correction arithmetic
executes natively. Usage: python SCRIPT EXE
"""
import json,struct,subprocess,sys,random,hashlib
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,load_native_shapes,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x100000)
objects,shapes,p,out,stack,stop=0x2000000,0x2030000,0x2040000,0x2041000,0x20fd000,0x20fe000
load_native_shapes(cpu,exe,objects,shapes)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def terrain(x,y):return ((x>>4)+(y>>3))%2048-512
def height(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);x,y=read(sp+4,'H'),read(sp+8,'H')
 c.reg_write(UC_X86_REG_EAX,terrain(x,y)&65535);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,height,begin=0x44e940,end=0x44e940)
source=exe.parent/'data/smoke.txt';raw=source.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='48d460819cdbc7d32ae7253150752c3d2ea641b07d797d0914525545f5e19cb1'
# Supply the loader's parsed table. The entire original lookup/correction leaf runs.
for line in raw.decode('ascii').splitlines():
 parts=line.split('#',1)[0].split()
 if parts:
  assert parts[0]=='SMOKE' and len(parts)==6
  model,angle,x,h,y=map(int,parts[1:]);write(0x5f0558+(model*4+angle)*6,'hhh',x,h,y)
rng=random.Random(0x404540);cases=[];expected=[]
for object in range(158):
 for angle in range(4):
  for slot in range(6):
   b=dict(object=object,angle=angle*512,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]))
   cpu.mem_write(p,bytes(256));write(p+0x33,'H',object);write(p+0x26,'H',angle*512);write(p+0x7a,'HH',b['anchorX'],b['anchorY'])
   write(stack,'4I',stop,p,slot,out);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x404540,stop,count=100000)
   assert cpu.reg_read(UC_X86_REG_EIP)==stop
   offset=cpu.reg_read(UC_X86_REG_EAX);offset=(offset^0x80000000)-0x80000000
   x,y,h=struct.unpack('<HHh',cpu.mem_read(out,6));assert h==((terrain(x,y)+offset+32768)&65535)-32768
   cases.append(dict(b=b,slot=slot));expected.append(dict(x=x,y=y,heightOffset=offset))
js="""import{buildingSocketPoint}from'./app/building-shapes.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>buildingSocketPoint(c.b,c.slot))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(a,e) in enumerate(zip(actual,expected)):
 assert a==e,(cases[i],a,e)
print(f'PASS: {len(cases)} full native building socket calls, all 158 objects/four orientations/six sockets, original tribe offsets, wrapped XY and terrain/display heights')
