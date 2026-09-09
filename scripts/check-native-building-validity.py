"""Run complete 0044ee50 and all its callees; no intercepted decision helpers.
Usage: python SCRIPT EXE [--record]. Portable snapshots retain sparse cell input.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu, configure_native_constants
exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x10000)
tribe, objects, stack, stop = 0x2000000, 0x2002000, 0x200d000, 0x200e000
rng = random.Random(0x44ee50)
def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
def index(cell): return ((cell & 0xfe00) >> 9) * 128 + ((cell & 254) >> 1)
def offset(cell,x,y): return (((cell & 255) + x * 2) & 255) | ((((cell >> 8) + y * 2) & 255) << 8)
land_base = bytes(16384 * 16)
cases, expected = [], []
for model in range(1, 20):
 for n in range(160):
  cell = rng.choice([0, 2, 0xfefe, 0xfe00, 0xfe, rng.randrange(65536)])
  mode = n % 20
  data = {}
  for y in range(-2,3):
   for x in range(-2,3):
    i=index(offset(cell,x,y));data[i]=dict(index=i,height=128,flags=0,category=0,building=0)
  i=index(cell);center=data[i]
  owner=rng.randrange(4);player=rng.randrange(3);flags=rng.randrange(1024)
  land_flags=rng.choice([0,8]);level_flags=rng.choice([0,4]);plan=rng.choice([0,0,1,65535,32768])
  mask=rng.choice([1,3,9,17,33,129]);computer=bool(n&1)
  record=dict(model=rng.choice([1,4,4,7]),tribe=rng.randrange(4))
  scenery=[]
  if mode==1:data[index(offset(cell,1,1))]['height']=rng.choice([288,289,32767,-32768])
  if mode==2:
   center['flags']=2;scenery=[dict(model=rng.choice([9,12,1,11]),**{'class':5})]
  if mode in [3,4,12,13,14]:
   at=center if mode in [3,4] else data[index(offset(cell,-1,-1))]
   at['building']=rng.choice([1,0xfc01]);at['flags']=rng.choice([0,512,1024,1536])
  if mode==5:land_flags=0;level_flags=4;player=0
  if mode==6:center['flags']=rng.choice([0x10000,0x4000000,0x4010000])
  if mode==7:center['category']=rng.randrange(1,16)
  if mode==8:data[index(offset(cell,1,0))]['category']=rng.randrange(1,16)
  if mode==9:data[index(offset(cell,2,2))]['category']=rng.randrange(1,16)
  if mode==10:
   for d in data.values():
    d['height']=rng.randrange(-64,400);d['category']=rng.randrange(16)
  if mode==11:data[index(offset(cell,-1,-1))]['height']=rng.choice([288,289])
  if mode==15:
   center['flags']=0x4010002;scenery=[dict(model=9,**{'class':5})]
  if mode==16:center['flags']=8
  if mode==17:scenery=[dict(model=9,**{'class':5})] # Missing cell flag deliberately hides the chain.
  if mode==18:center['flags']=2;scenery=[dict(model=9,**{'class':1}),dict(model=9,**{'class':5})]
  if mode==19:
   mask=rng.randrange(256);center['flags']=rng.choice([0,2,8,10]);scenery=[dict(model=rng.randrange(20),**{'class':rng.choice([1,5])})]
  cpu.mem_write(0x8a03e4,land_base);cpu.mem_write(tribe,bytes(0x1000));cpu.mem_write(objects,bytes(0x1000))
  write(tribe+0xc22,'B',owner);write(tribe+0xc1f,'B',player);write(tribe+0x93d,'I',flags)
  write(0x89c661,'I',land_flags);write(0x895da8,'I',level_flags)
  write(0x890390+4,'I',objects);write(objects+0x9e,'B',record['model']);write(objects+0x2f,'B',record['tribe'])
  for d in data.values():
   a=0x8a03e4+d['index']*16;write(a,'Ih',d['flags'],d['height']);write(a+8,'H',d['building']);write(a+12,'B',d['category'])
  for j,s in enumerate(scenery):
   a=objects+(j+1)*256;write(0x890390+(j+2)*4,'I',a);write(a+0x2a,'BB',s['class'],s['model']);write(a+0x20,'H',j+3 if j+1<len(scenery) else 0)
  if scenery:write(0x8a03e4+i*16+6,'H',2)
  write(stack,'7I',stop,tribe,cell,mask,model,plan,int(computer));cpu.reg_write(UC_X86_REG_ESP,stack)
  cpu.emu_start(0x44ee50,stop,count=100000)
  assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
  cases.append(dict(cell=cell,mask=mask,model=model,plan=plan,computer=computer,tribe=dict(tribe=owner,playerType=player,flags=flags),landFlags=land_flags,levelFlags=level_flags,cells=list(data.values()),building=record,scenery=scenery))
  expected.append(dict(valid=bool(cpu.reg_read(UC_X86_REG_EAX)&255),flags=read(tribe+0x93d,'I')))
js="""
import {buildingCellValid} from './app/building-validity.ts';
let s='';for await(const b of process.stdin)s+=b;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const land={heights:new Int16Array(16384),flags:new Uint32Array(16384),categories:new Uint8Array(16384),buildingIds:new Uint16Array(16384)};
 for(const d of c.cells){land.heights[d.index]=d.height;land.flags[d.index]=d.flags;land.categories[d.index]=d.category;land.buildingIds[d.index]=d.building;}
 const tribe={...c.tribe},w={land,landFlags:c.landFlags,levelFlags:c.levelFlags,building:()=>c.building,scenery:()=>c.scenery};
 return {valid:buildingCellValid(w,tribe,c.cell,c.mask,c.model,c.plan,c.computer),flags:tribe.flags};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for n,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  p=Path('/private/tmp/populous-validity-mismatch.json');p.write_text(json.dumps(dict(case=cases[n],actual=a,expected=e),indent=2));raise AssertionError(f'case {n}: {p}')
assert len(actual)==len(expected)
if '--record' in sys.argv:
 selected=range(0,len(cases),7)
 (ROOT/'tests/fixtures/building-validity.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in selected],expected=[expected[i] for i in selected]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native cell-validity calls: scenery, fog, overlap, neighbors, slopes, shore masks, wrapped cells and exact feedback flags; no intercepted callees')
