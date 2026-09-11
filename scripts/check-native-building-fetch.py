"""Execute complete task 7 plus native approaches, waits, geometry and timber transfer.
Resource search/cache results, route submission, final animation/audio and changes
in scenery/building work are supplied leaves. Usage: python SCRIPT EXE [--record]
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu, configure_native_constants, load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x60000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
p,site,target,building,stack,stop=0x2010000,0x2011000,0x2012000,0x2013000,0x205d000,0x205e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());shapes=json.loads((ROOT/'app/original-shapes.json').read_text());rng=random.Random(0x496750)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if a in [0x4e9d80,0x4e9dd0]:
  to=read(sp+8,'I');x=read(to,'H');y=read(to+2,'H');events.append(['destination',dict(x=x,y=y),a==0x4e9dd0])
  if a==0x4e9dd0:return
  write(p+0x4f,'HH',x,y)
  if case['routeFails']:write(p+0x10,'I',read(p+0x10,'I')|0x10000000)
 elif a==0x4ea460:events.append(['releaseMotion']);return
 elif a==0x4d4040:events.append(['animation',read(sp+8,'H')])
 elif a==0x48a050:events.append(['sound',read(sp+8,'H'),read(sp+12,'H')])
 elif a==0x4935c0:
  events.append(['refresh',read(sp+8,'H'),read(sp+12,'H'),read(read(sp+16,'I')+0x24,'H')]);write(read(sp+4,'I'),'B',case['refreshedIndex'])
 elif a==0x493910:
  events.append(['find',read(sp+4,'i')]);result=case['findStatus']
  if not result:write(read(sp+8,'I'),'I',target)
 elif a==0x493f10:
  events.append(['loose',(read(sp+4,'I')-0x8a03e4)//16,read(sp+8,'b')]);result=target if case['loose'] else 0
 elif a==0x4a8e20:events.append(['reserve',read(read(sp+4,'I')+0x24,'H')]);return
 elif a==0x4a7860:
  events.append(['transfer',read(read(sp+4,'I')+0x24,'H'),read(read(sp+8,'I')+0x24,'H'),read(sp+12,'i')]);return
 elif a==0x4a79f0:
  obj=read(sp+4,'I');write(obj+0x84,'h',read(obj+0x84,'h')+read(sp+8,'i'))
 elif a==0x4ba2c0:
  obj=read(sp+4,'I');write(obj+0x96,'h',read(obj+0x96,'h')+read(sp+8,'i'))
 else:raise AssertionError(hex(a))
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4e9d80,0x4e9dd0,0x4ea460,0x4d4040,0x48a050,0x4935c0,0x493910,0x493f10,0x4a8e20,0x4a7860,0x4a79f0,0x4ba2c0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
fields={'id':(0x24,'H'),'model':(0x2b,'B'),'state':(0x2c,'B'),'physics':(0x30,'B'),'counter':(0x2e,'B'),'tribe':(0x2f,'b'),
'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),
'speed':(0x5f,'h'),'timer':(0x70,'h'),'target':(0x72,'H'),'cargo':(0x78,'H'),'angle':(0x26,'H'),'heading':(0x5d,'H'),
 'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H')}
cases=[];expected=[]
for model in [1,2,3,4,5,7]:
 for phase in [0,1,2,3,4,5,17,22,24,27,50,255]:
  for trial in range(128):
   angle=trial%4*512;obj=rules['buildingObjects'][model];index=shapes['objects'][obj][angle//512];shape=shapes['shapes'][index]
   cx=rng.choice([0,2,126,128,250]);cy=rng.choice([0,2,126,128,250]);ax=((cx+shape['x'])*256)&65535;ay=((cy+shape['y'])*256)&65535
   outside=dict(x=(cx*256+shape['outside'][0]*64)&65535,y=(cy*256+shape['outside'][1]*64)&65535)
   inside=dict(x=(cx*256+shape['inside'][0]*64)&65535,y=(cy*256+shape['inside'][1]*64)&65535)
   person={key:0 for key in fields};person.update(id=1,model=rng.choice([2,3,5,7]),state=10,physics=rng.randrange(20),counter=rng.choice([0,1,2,3,4,7,8,31,32,255]),tribe=rng.choice([-1,0,1]),
    x=(outside['x']+rng.choice([0,111,112,247,248,311,312,1024,1025,1079,1080,32767,65535]))&65535,y=outside['y'],
    flags2=rng.choice([0,128,0x8000,0x80000,0x88080]),flags3=rng.choice([0,0x80000]),flags4=rng.choice([0,1,0x10407,0x10000000]),assignment=rng.choice([0,16,272]),
    speed=rng.choice([0,32]),timer=rng.choice([-32768,-1,0,1,2,3,8,16,1024]),target=2,cargo=rng.choice([0,0,1,99,100,250,65535]),angle=rng.randrange(2048),heading=rng.randrange(2048),
    goalX=outside['x'],goalY=outside['y'])
   task=dict(task=7,busy=rng.choice([0,1,255]),phase=phase,restart=bool(rng.randrange(8)==0))
   s=dict(id=3,**{'class':rng.choice([9,9,2])},model=model,building=rng.choice([0,4]),flags3=rng.getrandbits(32),searchIndex=rng.choice([0,17,119,255]),angle=angle,
    outside=outside,inside=inside,occupied=rng.choice([0,0,1,1024,65535]),work=rng.choice([0,100,rules['buildingLife'][model]-1,rules['buildingLife'][model]+1]))
   t=dict(id=2,**{'class':rng.choice([5,5,0])},model=rng.choice([1,2,6,11]),flags2=rng.choice([0,0,1]),flags4=rng.choice([0,0,0x100000]),wood=rng.choice([0,1,99,100,101,250,400,32767]),
    reservations=rng.choice([0,1,2,254,255]),reservationTimer=rng.randrange(256),x=(outside['x']+rng.choice([0,111,112,32768,65535]))&65535,y=outside['y'])
   case=dict(person=person,task=task,site=s,target=t,seed=rng.getrandbits(32),refreshedIndex=rng.choice([0,17,119,255]),findStatus=rng.randrange(4),loose=bool(rng.randrange(2)),routeFails=bool(rng.randrange(8)==0))
   for ptr in [p,site,target,building]:cpu.mem_write(ptr,bytes(256))
   cpu.mem_write(0x8a03e4,bytes(16384*16));write(0x890390,'I',0)
   for id_,ptr in [(1,p),(2,target),(3,site),(4,building)]:write(0x890390+id_*4,'I',ptr)
   for key,(offset,fmt) in fields.items():write(p+offset,fmt,person[key])
   write(p+0x2a,'B',1);write(p+0xc,'I',person['flags2']|(0x40000000 if task['restart'] else 0));write(p+0xa8,'B',phase);write(p+0xaa,'B',task['busy']);write(p+0x89,'H',3)
   for ptr,id_ in [(site,3),(building,4)]:
    write(ptr+0x24,'H',id_);write(ptr+0x2a,'BB',s['class'] if ptr==site else 2,model);write(ptr+0x26,'H',angle);write(ptr+0x33,'H',obj);write(ptr+0x7a,'HH',ax,ay)
   write(site+0x68,'H',cx|(cy<<8));write(site+0x9b,'B',index);write(site+0x9e,'B',model);write(site+0x92,'H',s['building']);write(site+0x14,'I',s['flags3']);write(site+0x66,'B',s['searchIndex']);write(site+0x96,'h',s['work'])
   write(target+0x24,'H',2);write(target+0x2a,'BB',t['class'],t['model']);write(target+0xc,'I',t['flags2']);write(target+0x10,'I',t['flags4']);write(target+0x84,'h',t['wood'])
   write(target+0x31,'BB',t['reservations'],t['reservationTimer']);write(target+0x3d,'HH',t['x'],t['y']);write(0x89d178,'I',case['seed'])
   cell=(person['y']>>9)*128+(person['x']>>9);write(0x8a03e4+cell*16+8,'H',s['occupied'])
   events=[];write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x496750,stop,count=200000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
   result={key:read(p+offset,fmt) for key,(offset,fmt) in fields.items()};restart=bool(result['flags2']&0x40000000);result['flags2']&=~0x40000000
   out_site={**s,'flags3':read(site+0x14,'I'),'searchIndex':read(site+0x66,'B'),'work':read(site+0x96,'h')}
   out_target={**t,'flags4':read(target+0x10,'I'),'reservations':read(target+0x31,'B'),'reservationTimer':read(target+0x32,'B'),'wood':read(target+0x84,'h')}
   cases.append(case);expected.append(dict(result=cpu.reg_read(UC_X86_REG_EAX)&255,person=result,task=dict(task=7,busy=read(p+0xaa,'B'),phase=read(p+0xa8,'B'),restart=restart),site=out_site,target=out_target,randomState=read(0x89d178,'I'),events=events))
js="""import {fetchCase} from './scripts/compare-building-fetch.mjs';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(fetchCase)));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-building-fetch-mismatch.json').write_text(json.dumps(dict(index=i,case=cases[i],actual=a,expected=e),indent=2));raise AssertionError('See /private/tmp/populous-building-fetch-mismatch.json')
if '--record' in sys.argv:
 indexes=set(range(0,len(cases),17));seen=set()
 for i,(c,e) in enumerate(zip(cases,expected)):
  key=(c['task']['phase'],c['task']['restart'],e['task']['phase'],e['result'],tuple(v[0] for v in e['events']),e['target']['reservations']<c['target']['reservations'])
  if key not in seen:indexes.add(i);seen.add(key)
 indexes=sorted(indexes)
 (ROOT/'tests/fixtures/building-fetch.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} native task-7 visits: all phases, geometry/arrival, timers, route failures, reservation, transfer limits, poses/audio and RNG; resource searches and final world submissions supplied')
