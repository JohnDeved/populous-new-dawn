"""Compare 0x408080 settling/collapse decisions and 0x40b860 dock lanes.
Native shape, height steps, averages and lane checks execute. World notification,
class initialization, linked-object removal and warning allocation are supplied.
Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants,load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
unit,linked,stack,stop=0x2008000,0x2009000,0x203d000,0x203e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());shapes=json.loads((ROOT/'app/original-shapes.json').read_text())
rng=random.Random(0x408080);events=[]
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=200000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def hook(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x44f2f0:
  cell=read(sp+8,'H');events.append(['height',((cell&0xfe00)>>9)*128+((cell&254)>>1)])
 elif a==0x4ed640:
  assert read(unit+0x2c,'B')==3;write(unit+12,'I',read(unit+12,'I')|0x100000);write(unit+0x67,'b',2);events.append(['collapse'])
 elif a==0x4ef180:events.append(['indicator'])
 elif a==0x4ed8a0:
  assert [read(sp+i,'I') for i in [4,8]]==[7,83];events.append(['dock']);c.reg_write(UC_X86_REG_EAX,0)
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x44ddf0,0x44df40,0x44f2f0,0x4ed6f0,0x4ed640,0x4ef180,0x4ed8a0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
fields={'state':(0x2c,'B'),'flags2':(12,'I'),'h':(0x41,'h'),'flooded':(0x5f,'h'),'delay':(0x67,'b'),'reason':(0x2d,'B')}
cases=[];expected=[]
for model in range(1,20):
 for direction in range(4):
  for mode in range(20):
   obj=rules['buildingObjects'][model]
   if rules['buildingFlags'][model]&0x2000:obj+=(mode%3)*12+(mode%4)*3
   elif rules['buildingFlags'][model]&0x4000:obj+=mode%4
   pose=dict(object=obj,angle=direction*512,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]))
   shape=shapes['shapes'][shapes['objects'][obj][direction]]
   cells=[]
   for y in range(shape['height']):
    for x in range(shape['width']):
     mask=shapes['cells'][shape['offset']+y*shape['width']+x]
     if mask:
      i=(((pose['anchorY']//256-shape['y']+2*y)&255)//2)*128+((pose['anchorX']//256-shape['x']+2*x)&255)//2
      h=128
      if mode in [2,3,4]:h=128+(len(cells)%3-1)*[1,8,400][mode-2]
      if mode in [5,6,7,8]:h=0 if len(cells)%[2,3,5,1][mode-5]==0 else 128
      if mode==9:h=-1
      if mode==10:h=32767 if len(cells)%2 else -32768
      cells.append(dict(index=i,mask=mask,height=h))
   b=dict(**pose,model=model,state=3 if mode==11 else 2,flags2=4|(0x100000 if mode==12 else 0),counter=mode%4 if mode in [13,14,15] else 0,h=1 if model in [13,14] else 128,flooded=2 if mode==16 else 0,delay=[0,1,7,-1][mode%4],reason=0)
   cpu.mem_write(unit,bytes(256));cpu.mem_write(linked,bytes(256));cpu.mem_write(0x8a03e4,bytes(16384*16))
   # Empty cell chains resolve id zero to null; a valid local indicator is optional.
   write(0x890390,'II',0,linked);write(0x89c6f0,'B',0);write(linked+0x2a,'B',7)
   indicator=mode==17
   write(unit+0x92,'H',int(indicator));write(unit+0x33,'h',obj);write(unit+0x26,'h',pose['angle'])
   write(unit+0x2b,'B',model);write(unit+0x2e,'B',b['counter']);write(unit+0x7a,'HH',pose['anchorX'],pose['anchorY'])
   write(unit+0x3d,'HH',pose['anchorX'],pose['anchorY'])
   for k,(o,f) in fields.items():write(unit+o,f,b[k])
   for c in cells:write(0x8a03e4+c['index']*16,'Ih',0x20000,c['height'])
   events=[];call(0x408080,unit)
   cases.append(dict(b=b,cells=cells,indicator=indicator))
   expected.append(dict(b={k:read(unit+o,f) for k,(o,f) in fields.items()},cells=[[c['index'],read(0x8a03e4+c['index']*16+4,'h'),read(0x8a03e4+c['index']*16,'I')] for c in cells],events=events.copy(),indicator=read(unit+0x92,'H')))
js="""
import {stepBuildingTerrain,dockLaneClear} from './app/building-terrain.ts';
let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const b={...c.b},land={heights:new Int16Array(16384),flags:new Uint32Array(16384)},events=[];let indicator=+c.indicator;
 c.cells.forEach(v=>{land.heights[v.index]=v.height;land.flags[v.index]=0x20000});
 stepBuildingTerrain(land,b,{indicator:()=>{if(indicator){events.push(['indicator']);indicator=0}},terrainChanged:i=>events.push(['height',i]),attachment:()=>{},occupants:()=>{},dock:()=>{if(!dockLaneClear(land.heights,b))events.push(['dock'])},collapse:()=>{b.flags2|=0x100000;b.delay=2;events.push(['collapse'])}});
 return {b:Object.fromEntries(['state','flags2','h','flooded','delay','reason'].map(k=>[k,b[k]])),cells:c.cells.map(v=>[v.index,land.heights[v.index],land.flags[v.index]]),events,indicator};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for i,(a,b) in enumerate(zip(actual,expected)):
 if a!=b:
  Path('/private/tmp/populous-building-terrain-mismatch.json').write_text(json.dumps(dict(case=cases[i],browser=a,native=b),indent=2));raise AssertionError((i,cases[i]['b'],a,b))
if '--record' in sys.argv:
 keep=[i for i in range(len(cases)) if i%20 in [0,3,4,6,8,17] or cases[i]['b']['model'] in [1,13,18]]
 (ROOT/'tests/fixtures/building-terrain.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in keep],expected=[expected[i] for i in keep]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases):,} native building terrain calls')
