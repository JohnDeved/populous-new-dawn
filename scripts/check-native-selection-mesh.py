import struct,sys,json
from pathlib import Path
from decomp import native_cpu,ROOT
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_FPCW
c,identity=native_cpu(Path(sys.argv[1]));c.mem_map(0x2000000,0x400000)
pool,stack,stop=0x2200000,0x23fd000,0x23fe000
w=lambda a,f,*v:c.mem_write(a,struct.pack('<'+f,*v))
r=lambda a,f:struct.unpack('<'+f,c.mem_read(a,struct.calcsize('<'+f)))[0]
c.reg_write(UC_X86_REG_FPCW,0x27f)
w(0x74a350,'I',0x2000000);w(0x2000024,'HH',0,0)
w(0x89c6f0,'B',0);w(0x89c6e7,'B',9)
w(0x89d1c8+0x32,'H',0);w(0x89d1c8+0x8b3,'4H',100,100,1500,1500)
for i in range(16384):w(0x8a03e4+i*16,'Ih',0,135)
w(0x75d504,'II',pool+1000000,pool)
records=[];original={};shape={}
def capture(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x424eb0:
  context=r(sp+4,'I');shape.update(corners=[dict(x=r(context+48+i*4,'H'),y=r(context+50+i*4,'H')) for i in range(4)],camera=r(context+80,'I'),quadrant=r(context+156,'B'))
  for i in range(1,r(0x6513e4,'I')+1):original[i]=dict(x=r(0x74daf8+i*32,'i')&65535,y=r(0x74daf8+i*32+8,'i')&65535,flags=r(0x74daf8+i*32+24,'I')&0xff00)
  return
 if a==0x46de00:
  p=r(sp+4,'I');w(p+12,'ff',float(r(p,'i')),float(r(p+8,'i')))
 else:
  if records:
   offset=len(records[0]);repairs=[]
   for poly in range(1,r(0x6513e8,'I')+1):
    ids=[j for j in struct.unpack('<7h',c.mem_read(0x659730+poly*14,14)) if j>0]
    if len(ids)==7:repairs.append(dict(index=offset+4,triangle=[original[ids[j]] for j in (0,5,6)]))
    offset+=max(0,len(ids)-2)
   shape['repairs']=repairs
  count=r(sp+8,'I');triangles=[]
  for i in range(count):
   ids=struct.unpack('<3h',c.mem_read(0x6513f0+i*6,6))
   if min(ids)<=0:continue
   triangles.append([original[j] for j in ids])
  records.append(triangles)
 c.reg_write(UC_X86_REG_EIP,r(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x46de00,0x423900,0x424eb0):c.hook_add(UC_HOOK_CODE,capture,begin=a,end=a)

import random,subprocess
rng=random.Random(0x422fc0);cases=[]
for trial in range(512):
 start=[rng.randrange(65536),rng.randrange(65536)];end=[(v+rng.randrange(-6000,6001))&65535 for v in start]
 if trial==0:start=[100,100];end=[1500,1500]
 w(0x89d1c8+0x32,'H',(trial*16)&2047);w(0x89d1c8+0x8b3,'4H',*start,*end)
 records.clear();shape.clear();original.clear()
 w(stack,'I',stop);c.reg_write(UC_X86_REG_ESP,stack);c.emu_start(0x422fc0,stop,count=5000000)
 assert c.reg_read(UC_X86_REG_EIP)==stop
 cases.append(dict(**shape,expected=sum(records,[])))

js="""import {selectionMesh} from './app/selection-mesh.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>selectionMesh(c.corners,c.camera,c.quadrant).map(t=>t.map(p=>({...p,x:p.x&65535,y:p.y&65535}))))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(result,case) in enumerate(zip(actual,cases)):
 expected=list(case['expected'])
 for repair in case['repairs']:expected.insert(repair['index'],repair['triangle'])
 if result!=expected:
  print('mismatch',i,len(result),len(case['expected']), {k:v for k,v in case.items() if k!='expected'})
  for j,(a,b) in enumerate(zip(result,expected)):
   if a!=b:print(j,a,b);break
  Path('/private/tmp/selection-mesh-mismatch.json').write_text(json.dumps(dict(case=case,actual=result)))
  raise AssertionError(i)
fixture=dict(executableSha256=identity['sha256'],cases=cases)
p=ROOT/'tests/fixtures/selection-mesh.json'
if '--record' in sys.argv:p.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(p.read_text())==fixture
print('PASS',len(cases),'native selection meshes;',sum(len(c['repairs']) for c in cases),'documented seven-point fan repairs')
