"""Execute complete 00423900 selection queue construction; no callees replaced."""
import json,struct,subprocess,sys,random
from pathlib import Path
from decomp import native_cpu,ROOT
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_FPCW
c,identity=native_cpu(Path(sys.argv[1]));c.mem_map(0x2000000,0x200000)
ctx,pool,stack,stop=0x2000000,0x2010000,0x21fd000,0x21fe000
w=lambda a,f,*v:c.mem_write(a,struct.pack('<'+f,*v))
r=lambda a,f:struct.unpack('<'+f,c.mem_read(a,struct.calcsize('<'+f)))[0]
c.reg_write(UC_X86_REG_FPCW,0x27f)
rng=random.Random(0x423900);cases=[]
for trial in range(512):
 width,height=[(640,480),(1920,1080),(3440,1440)][trial%3]
 borders=bool(trial&1);w(ctx+100,'II',512,512);w(ctx+157,'B',borders)
 w(0x87ca90,'HH',width,height);w(0x75d504,'II',pool+100000,pool);c.mem_write(0x75d50c,bytes(3585*4))
 points=[dict(x=rng.randrange(-width,width*2)/2,y=rng.randrange(-height,height*2)/2,z=rng.choice([-30000,-28400,-28000,0,8000,28672,32000]),flags=rng.randrange(512)*128) for _ in range(6)]
 for i,p in enumerate(points):w(0x74daf8+(i+1)*32,'iiiffII',0,135,p['z'],p['x'],p['y'],32,p['flags'])
 triangles=[[0,1,2],[0,2,3],[0,3,4],[0,4,5]]
 for i,ids in enumerate(triangles):w(0x6513f0+i*6,'3h',*[j+1 for j in ids])
 w(stack,'III',stop,ctx,4);c.reg_write(UC_X86_REG_ESP,stack);c.emu_start(0x423900,stop,count=200000)
 assert c.reg_read(UC_X86_REG_EIP)==stop
 buckets={}
 for bucket in range(3585):
  at=r(0x75d50c+bucket*4,'I')
  while at:buckets[at]=bucket;at=r(at+2,'I')
 draws=[];at=pool
 while at<r(0x75d508,'I'):
  kind=r(at,'B');corner=kind==28 and bool(r(at+47,'B'))
  count=3 if kind==27 else 1 if corner else 2
  draws.append(dict(kind='fill' if kind==27 else 'corner' if corner else 'edge',points=[[r(at+6+i*20,'f'),r(at+10+i*20,'f')] for i in range(count)],bucket=buckets[at],direction=0 if kind==27 else r(at+46,'B'),visible=not bool(r(at+67,'B')) if kind==27 else True))
  at+=68 if kind==27 else 48
 cases.append(dict(points=points,triangles=triangles,width=width,height=height,borders=borders,expected=draws))
js="""import {selectionDraws} from './app/selection-raster.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>selectionDraws(c.triangles.map(ids=>ids.map(i=>c.points[i])),c.width,c.height,c.borders).map(d=>({...d,points:d.points.map(p=>[p.x,p.y])})))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(a,c) in enumerate(zip(actual,cases)):assert a==c['expected'],(i,a,c)
fixture=dict(executableSha256=identity['sha256'],cases=cases)
p=ROOT/'tests/fixtures/selection-raster.json'
if '--record' in sys.argv:p.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(p.read_text())==fixture
print(f'PASS: {len(cases)} complete native selection draw queues, shared corners, visibility and depth buckets')
