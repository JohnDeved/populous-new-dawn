"""Capture 004673b0 type 1c before GPU submission; texture-cache placement is supplied."""
import sys,struct,json,subprocess,random
from pathlib import Path
from decomp import native_cpu,ROOT
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX,UC_X86_REG_FPCW
c,identity=native_cpu(Path(sys.argv[1]));c.mem_map(0x2000000,0x100000)
p,stack,stop=0x2000000,0x20fd000,0x20fe000
w=lambda a,f,*v:c.mem_write(a,struct.pack('<'+f,*v))
r=lambda a,f:struct.unpack('<'+f,c.mem_read(a,struct.calcsize('<'+f)))[0]
w(0xafc2f4,'I',0x2020000)
out=[];cases=[];capture_count=2
def hook(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x487e30:
  w(r(sp+8,'I'),'I6f',0,0,0,1,1,1/32,0)
  c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,r(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+20)
 else:
  out.append([list(struct.unpack('<8f',c.mem_read(r(sp+j*4,'I'),32))) for j in (1,2,3)])
  if len(out)==capture_count:c.reg_write(UC_X86_REG_EIP,stop)
  else:c.reg_write(UC_X86_REG_EIP,r(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+28)
for a in (0x487e30,0x47d8a0):c.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
for trial in range(32):
 for corner,direction in [(k//4,k%4) for k in range(8)]:
  c.mem_write(0x75d50c,bytes(3585*4));w(0x75d50c+3584*4,'I',p)
  c.mem_write(p,bytes(70));w(p,'B',28)
  for offset,x,y in [(6,100+trial/16,120-trial*32),(26,230-trial*8,200+trial/8)]:w(p+offset,'ffIII',x,y,0,0,32)
  w(p+46,'BB',direction,corner)
  w(stack,'I',stop);c.reg_write(UC_X86_REG_ESP,stack);out.clear();c.emu_start(0x4673b0,stop,count=200000)
  assert len(out)==2 and r(0xd1c008,'B')==(31 if corner else 23)
  cases.append(dict(corner=bool(corner),direction=direction,a=dict(x=100+trial/16,y=120-trial*32),b=dict(x=230-trial*8,y=200+trial/8),expected=[[[v[0],v[1],v[6],v[7]] for v in t] for t in out]))

js="""import {dragBorderQuad,dragBorderUV} from './app/drag-border.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const q=dragBorderQuad(c.a,c.b,c.direction,c.corner);return [0,1,2,0,2,3].map(i=>[q[i].x,q[i].y,...dragBorderUV[i]]);})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for result,case in zip(actual,cases):assert result==[p for t in case['expected'] for p in t],(result,case)
fixture=dict(executableSha256=identity['sha256'],cases=cases)
p=ROOT/'tests/fixtures/drag-border.json'
print(f'PASS: {len(cases)} native edge/corner submissions, all four directions, 8-pixel extrusion and two triangle UVs')

# Capture complete perimeter splitting before terrain-list allocation.
c.reg_write(UC_X86_REG_FPCW,0x27f) # MSVC double-precision x87 control.
points=[]
def crossing(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP);xy=r(sp+8,'I');points.append(dict(x=r(xy,'H'),y=r(xy+2,'H'),mode=r(sp+12,'I')))
 c.reg_write(UC_X86_REG_EIP,r(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
c.hook_add(UC_HOOK_CODE,crossing,begin=0x423e80,end=0x423e80)
rng=random.Random(0x424320);crossings=[]
for trial in range(512):
 start=[rng.randrange(65536),rng.randrange(65536)]
 end=[v+rng.randrange(-10240,10241) for v in start]
 # Unwrap the low side exactly as in the live drag quad.
 for axis in (0,1):
  if end[axis]<0:start[axis]+=65536;end[axis]+=65536
 w(0x2000000,'2H',*[v&65535 for v in start]);w(0x2000008,'2H',*[v&65535 for v in end])
 w(stack,'5I',stop,0,0x2000000,0x2000008,0x100);c.reg_write(UC_X86_REG_ESP,stack)
 points.clear();c.emu_start(0x424320,stop,count=200000)
 assert c.reg_read(UC_X86_REG_EIP)==stop
 crossings.append(dict(a=dict(zip(['x','y'],start)),b=dict(zip(['x','y'],end)),expected=list(points)))
js="""import {dragBorderCrossings} from './app/drag-border.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>dragBorderCrossings(c.a,c.b).map(p=>({...p,x:p.x&65535,y:p.y&65535})))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(crossings).encode(),cwd=ROOT))
for i,(result,case) in enumerate(zip(actual,crossings)):assert result==case['expected'],(i,case['a'],case['b'],[(a,b) for a,b in zip(result,case['expected']) if a!=b][:4])
fixture['crossings']=crossings
if '--record' in sys.argv:p.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(p.read_text())==fixture
print(f'PASS: {len(crossings)} native perimeter splits across cell sides, both diagonals and wrapped seams')

# Type 1b uses the whole fill tile and one triangle; execute its real UV consumer.
capture_count=1;fills=[];polygon=0x2000000
for trial in range(64):
 c.mem_write(0x75d50c,bytes(3585*4));w(0x75d50c+3584*4,'I',polygon)
 c.mem_write(polygon,bytes(70));w(polygon,'B',27);w(polygon+66,'BB',15,0)
 points=[[100+trial/16,100-trial*32],[230-trial*8,100+trial/8],[100+trial/16,230+trial/8]]
 for i,((x,y),(u,v)) in enumerate(zip(points,[(0,0),(2097151,2097151),(0,2097151)])):w(polygon+6+i*20,'ffIII',x,y,u,v,32)
 w(stack,'I',stop);c.reg_write(UC_X86_REG_ESP,stack);out.clear();c.emu_start(0x4673b0,stop,count=200000)
 assert len(out)==1
 fills.append(dict(points=points,expected=[[v[0],v[1],v[6],v[7]] for v in out[0]]))
js="""import {selectionFillUV} from './app/drag-border.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>c.points.map((p,i)=>[...p,...selectionFillUV[i]]))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(fills).encode(),cwd=ROOT))
for result,case in zip(actual,fills):assert result==case['expected']
fixture=dict(executableSha256=identity['sha256'],cases=fills);p=ROOT/'tests/fixtures/selection-fill.json'
if '--record' in sys.argv:p.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(p.read_text())==fixture
print('PASS: 64 original type-1b fill triangles and exact default-bilinear UVs')
