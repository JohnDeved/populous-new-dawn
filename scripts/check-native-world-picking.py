"""Execute the original mixed painter's hit ownership on supplied draw queues.
Usage: python scripts/check-native-world-picking.py EXE
Raster consumers are intercepted; original hit branches, scaling and order execute.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu, ROOT
cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x1000000)
people, pool, camera, starts, frames, sequence = 0x2000000,0x2010000,0x2020000,0x2030000,0x2040000,0x2050000
stack,stop=0x2ffd000,0x2ffe000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def consume(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4+(24 if a==0x47d8a0 else 0))
for a in (0x45efd0,0x45f4a0,0x45f9d0,0x47d8a0,0x460970):
 cpu.hook_add(UC_HOOK_CODE,consume,begin=a,end=a)
for a,v in [(0x74a350,camera),(0x59df44,starts),(0x59df48,frames)]:write(a,'I',v)
for i in range(256):write(starts+i*6,'BBI',0,1,sequence)
write(sequence,'H',0);write(frames,'HBBBB',0,22,30,0,0)
write(0x89c6f0,'B',0);write(0x89c669,'I',0);write(0x89c661,'I',0)
write(0xafc2f4,'I',0x2060000);write(0x9bcfc8,'I',0x2070000);write(0x9bcfd8,'I',0x2080000)
write(0xa30720,'I',0x2080100);write(0x2080002,'B',4);write(0x895da4,'I',0x80000000)
write(0x76108c,'BB',0,0);write(0x895da8,'I',0);write(0x8a03e4+12,'B',0)

def native(commands,mouse=(100,100),bucket=2001,frame=(22,30),view=None,flags=0):
 write(frames+2,'BB',*frame);write(0x89c669,'I',flags)
 if view:
  write(camera+0x2a,'i',view['scale']);write(0x87ca6c,'ii',view['spriteScale'],view['shamanScale'])
 cpu.mem_write(0x75d50c,bytes(0xe01*4));write(0x87caa0,'hh',*mouse);write(0x8a03e4,'I',0)
 for i,c in enumerate(commands):
  q=pool+i*70;p=people+c.get('id',1)*256
  cpu.mem_write(q,bytes(70));write(q+2,'I',q+70 if i+1<len(commands) else 0)
  if c['kind']=='person':
   cpu.mem_write(p,bytes(256));write(p+0x24,'H',c['id']);write(p+0x2a,'BBB',1,c.get('model',2),19)
   write(p+0x35,'H',128 if c.get('eligible',True) else 0);write(p+0x3a,'B',14)
   write(p+0xc,'I',c.get('flags2',0))
   if c.get('building'):
    b=c['building'];write(0x8a03e4,'I',512 if c.get('terrainBuilding') else 0);write(0x8a03ec,'H',100|0x4000)
    write(0x890390+400,'I',people+100*256);write(people+100*256+0x2b,'BB',b['model'],b['state'])
   write(q,'B',13);write(q+6,'Ihh',p,*c.get('anchor',[100,120]))
  elif c['kind']=='bounds':
   write(p+0x24,'H',c['id']);write(q,'B',21);write(q+6,'Ihhhh',p,*c.get('bounds',[0,0,300,300]))
  else:
   write(q,'B',0 if c['kind']=='ground' else 6);write(q+0x45,'B',0);write(q+0x42,'H',c.get('id',0))
   for j,point in enumerate(c.get('points',[[0,0],[300,0],[0,300]])):write(q+6+j*20,'ff',*point)
 write(0x75d50c+(bucket-1)*4,'I',pool)
 write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack)
 try:cpu.emu_start(0x4673b0,stop,count=1000000)
 except Exception:print('Failed',hex(cpu.reg_read(UC_X86_REG_EIP)),commands);raise
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 return [read(0x87cac2,'H'),read(0x87cace,'H')]

rng=random.Random(0x4673b0)
cases=[]
for trial in range(1024):
 mouse=[rng.randrange(85,116),rng.randrange(85,116)]
 commands=[dict(kind='bounds',id=id,bounds=[rng.randrange(-50,101),rng.randrange(-50,101),rng.randrange(100,350),rng.randrange(100,350)]) for id in (3,4,5)]
 for i in range(12):
  kind=rng.choice(['person','model','ground'])
  if kind=='person':commands.append(dict(kind=kind,id=6+i,anchor=[rng.randrange(80,121),rng.randrange(100,141)],eligible=bool(rng.randrange(4))))
  else:
   offset=rng.choice([0,.25,.5,.75])
   points=[[0+offset,0+offset],[rng.randrange(100,301)+offset,0+offset],[0+offset,rng.randrange(100,301)+offset]]
   if trial%4==0:points.reverse()
   commands.append(dict(kind=kind,points=points,**({'id':rng.choice([3,4,5])} if kind=='model' else {})))
 expected=native(commands,mouse)
 translated=[]
 for c in commands:
  if c['kind']=='person':
   x,y=c['anchor'];translated.append(dict(kind='person',id=c['id'],eligible=c['eligible'],bounds=dict(x=x-11,y=y-30,width=22,height=30)))
  elif c['kind']=='bounds':
   x,y,right,bottom=c['bounds'];translated.append(dict(kind='bounds',id=c['id'],bounds=dict(x=x,y=y,width=right-x,height=bottom-y)))
  else:translated.append(dict(c,points=[dict(x=x,y=y) for x,y in c['points']]))
 cases.append(dict(commands=translated,point=dict(x=mouse[0],y=mouse[1]),expected=None if not any(expected) else dict(kind='person' if expected[0] else 'model',id=expected[0] or expected[1])))
js="""import {pickQueuedObjects} from './app/world-picking.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>pickQueuedObjects(c.commands,c.point))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(a,c) in enumerate(zip(actual,cases)):assert a==c['expected'],(i,a,c)
print('PASS: 1024 complete native mixed painter queues; person/model/ground replacement, frame rectangles, first-face consumption, bounds and pixel rounding')
# Compare the actual rectangle written by the full person painter, including
# ordinary/shaman scaling and every supported native view preset.
views=json.loads((ROOT/'app/original-camera.json').read_text())['views']
rectangles=[]
for trial in range(256):
 view=rng.choice(views);flags=rng.choice([0,128,256,512]);model=rng.choice([2,7])
 width,height=rng.randrange(1,256),rng.randrange(1,256);bucket=rng.randrange(1,3586)
 native([dict(kind='person',id=1,model=model)],(100,120),bucket,(width,height),view,flags)
 x,y,w,h=struct.unpack('<hhhh',cpu.mem_read(0x87cac4,8))
 rectangles.append(dict(point=dict(x=100,y=120),frame=dict(nativeWidth=width,nativeHeight=height),bucket=-bucket if model==7 else bucket,flags=flags,view=view,scaled=bool(model==7 or flags),expected=dict(x=x,y=y,width=w,height=h) if read(0x87cac2,'H') else None))

occupants=[]
for flags2 in [0,0x800000]:
 for terrainBuilding in [False,True]:
  for model in [1,4,5]:
   for state in [1,2]:
    c=dict(kind='person',id=1,flags2=flags2,terrainBuilding=terrainBuilding,building=dict(model=model,state=state))
    occupants.append(dict(person=dict(flags2=flags2),building=c['building'] if terrainBuilding else None,expected=bool(native([c])[0])))
js="""import {personInCompletedTower} from './app/person-selection.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>!personInCompletedTower(c.person,c.building))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(occupants).encode(),cwd=ROOT))
assert actual==[c['expected'] for c in occupants]
print('PASS: 24 complete native painter occupant gates, including recorded terrain building and completed tower state')

boxes=[]
for trial in range(256):
 points=[dict(screenX=rng.randrange(-1000,4000)+rng.choice([0,.25,.5,.75]),screenY=rng.randrange(-1000,2000)+rng.choice([0,.25,.5,.75]),z=rng.randrange(-40000,40000)) for _ in range(rng.randrange(3,25))]
 cpu.mem_write(0x75d50c,bytes(0xe01*4));write(0x75d508,'I',pool);write(0x75d504,'I',pool+4096);write(people+4,'h',len(points))
 for i,p in enumerate(points):write(0x74daf8+i*32+8,'iff',p['z'],p['screenX'],p['screenY'])
 write(stack,'III',stop,people,people);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x475550,stop,count=10000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 left,top,right,bottom=struct.unpack('<hhhh',cpu.mem_read(pool+10,8))
 heads=struct.unpack('<3585I',cpu.mem_read(0x75d50c,3585*4))
 boxes.append(dict(points=points,expected=dict(bounds=dict(x=left,y=top,width=right-left,height=bottom-top),bucket=heads.index(pool))))
js="""import {personHitBounds,modelHitBounds,inHitBounds} from './app/world-picking.ts';let s='';for await(const c of process.stdin)s+=c;const d=JSON.parse(s);console.log(JSON.stringify({rectangles:d.rectangles.map(c=>{const b=personHitBounds(c.point,c.frame,c.bucket,c.flags,c.view,c.scaled);return inHitBounds(c.point,b)?b:null}),boxes:d.boxes.map(c=>modelHitBounds(c.points))}));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(rectangles=rectangles,boxes=boxes)).encode(),cwd=ROOT))
for key,captures in [('rectangles',rectangles),('boxes',boxes)]:
 for i,(a,c) in enumerate(zip(actual[key],captures)):assert a==c['expected'],(key,i,a,c)
print('PASS: 256 native person header/scaling rectangles and 256 original model-bounds submissions')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/world-picking.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[:64],rectangles=rectangles[:32],boxes=boxes[:32],occupants=occupants),separators=(',',':'))+'\n')
