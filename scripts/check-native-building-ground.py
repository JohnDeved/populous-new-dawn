"""Compare original building origin, ground writes and plan foundation heights.
Usage: python scripts/check-native-building-ground.py EXE [--record]
0x403f00 runs fully except its final terrain queue; 0x403d50 and 0x4b8220
supply only cell insertion (and model-10 cliff setup). Terrain sampling and
shape/grade/average consumers execute natively. Fixtures need no original EXE.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import ROOT,native_cpu,configure_native_constants,load_native_shapes
exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
unit,stack,stop=0x2008000,0x203d000,0x203e000
shapes=json.loads((ROOT/'app/original-shapes.json').read_text());rules=json.loads((ROOT/'app/original-rules.json').read_text())
rng=random.Random(0x403f00);events=[]
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def leaf(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x44ddf0:events.append([read(sp+4,'H'),read(sp+8,'i'),read(sp+12,'B')])
 elif a==0x4ee580:
  p=read(sp+4,'I');to=read(sp+8,'I');c.mem_write(p+0x3d,bytes(c.mem_read(to,6)))
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x44ddf0,0x4ee580,0x42cfc0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
cases=[];expected=[]
for model in range(1,20):
 for direction in range(4):
  for trial in range(16):
   obj=rules['buildingObjects'][model]
   if rules['buildingFlags'][model]&0x2000:obj+=(trial%3)*12+(trial%4)*3
   elif rules['buildingFlags'][model]&0x4000:obj+=trial%4
   pose=dict(object=obj,angle=direction*512,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]))
   shape=shapes['shapes'][shapes['objects'][obj][direction]]
   # Valid, signed extremes, uniform rounding boundaries, slopes and seams.
   seed=rng.randrange(10000);flat=[0,1,31,32,33,63,64,95,96,97,1024,1025,-1,-32768,32767,None][trial]
   heights=[flat if flat is not None else ((i*17+seed)^(i>>7))%1500-100 for i in range(16384)]
   flags=[(i+seed)&1 for i in range(16384)]
   land=bytearray(16384*16)
   for i,h in enumerate(heights):struct.pack_into('<Ih',land,i*16,flags[i],h)
   cpu.mem_write(0x8a03e4,bytes(land));cpu.mem_write(unit,bytes(256))
   write(unit+0x33,'h',obj);write(unit+0x26,'h',pose['angle']);write(unit+0x2b,'B',model);write(unit+0x7a,'HH',pose['anchorX'],pose['anchorY'])
   call(0x403d50,unit);position=dict(x=read(unit+0x3d,'H'),y=read(unit+0x3f,'H'));positionHeight=read(unit+0x41,'h')
   events=[];call(0x403f00,unit)
   after=list(struct.unpack('<'+'Ih10x'*16384,cpu.mem_read(0x8a03e4,16384*16)))[1::2]
   changes=[[i,h] for i,h in enumerate(after) if h!=heights[i]]
   cpu.mem_write(0x8a03e4,bytes(land));cpu.mem_write(unit,bytes(256))
   origin=((pose['anchorX']//256-shape['x'])&255)|(((pose['anchorY']//256-shape['y'])&255)<<8)
   write(unit+0x3d,'HHh',pose['anchorX'],pose['anchorY'],217)
   write(unit+0x68,'H',origin);write(unit+0x9b,'B',shapes['objects'][obj][direction]);write(unit+0x9e,'B',model)
   levelFlags=0x4000 if trial%2 else 0;write(0x89c669,'I',levelFlags)
   # Degenerate non-building shape records have no average; don't execute divide-by-zero.
   grade=[v for v in shapes['cells'][shape['offset']:shape['offset']+shape['width']*shape['height']] if v&2]
   planHeight=None
   if grade or model in [10,13,14]:
    call(0x4b8220,unit);planHeight=read(unit+0x41,'h')
   cases.append(dict(pose=pose,model=model,seed=seed,flat=flat,levelFlags=levelFlags))
   expected.append(dict(position=position,positionHeight=positionHeight,changes=changes,events=events,planHeight=planHeight))
js="""
import shapes from './app/original-shapes.json' with {type:'json'};
import {buildingPosition,levelBuildingGround,buildingPlanHeight} from './app/building-shapes.ts';
import {terrainPointHeight} from './app/native-terrain.ts';
let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(({c,e})=>{
 const heights=Int16Array.from({length:16384},(_,i)=>c.flat??(((i*17+c.seed)^(i>>7))%1500-100));
 const flags=Uint32Array.from({length:16384},(_,i)=>(i+c.seed)&1);const land={heights,flags};
 const position=buildingPosition(c.pose),positionHeight=terrainPointHeight(land,position);
 const planHeight=e.planHeight===null?null:buildingPlanHeight(land,c.pose,c.model,terrainPointHeight(land,{x:c.pose.anchorX - shapes.shapes[shapes.objects[c.pose.object][c.pose.angle/512]].x*256,y:c.pose.anchorY-shapes.shapes[shapes.objects[c.pose.object][c.pose.angle/512]].y*256}),c.levelFlags);
 const before=heights.slice(),events=[];levelBuildingGround(heights,c.pose,c.model,(cell,radius)=>events.push([cell,radius,1]));
 const changes=[];heights.forEach((h,i)=>{if(h!==before[i])changes.push([i,h])});return {position,positionHeight,changes,events,planHeight};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps([dict(c=c,e=e) for c,e in zip(cases,expected)]),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(actual,expected)):
 if a!=b:
  Path('/private/tmp/populous-ground-mismatch.json').write_text(json.dumps(dict(case=cases[i],browser=a,native=b),indent=2));raise AssertionError((i,cases[i],a,b))
if '--record' in sys.argv:
 indices=[i for i,c in enumerate(cases) if c['model'] in [1,3,4,5,7,13,14,18] and (i%16 in [0,7,15])]
 fixture=dict(executableSha256=hashlib.sha256(exe.read_bytes()).hexdigest(),cases=[cases[i] for i in indices],expected=[expected[i] for i in indices])
 (ROOT/'tests/fixtures/building-ground.json').write_text(json.dumps(fixture,separators=(',',':'))+'\n')
print(f'PASS: {len(cases):,} native building ground/origin calls and {sum(e["planHeight"] is not None for e in expected):,} plan height initializers')
