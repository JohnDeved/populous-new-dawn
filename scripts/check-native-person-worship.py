"""Compare the original complete worship command body (27).
World movement, placement, route ownership and presentation consumers are supplied;
phase decisions, signed ranges, frame gates, flags and prayer RNG execute natively.
Usage: python scripts/check-native-person-worship.py /path/to/d3dpoptb.exe [--record]
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x100000)
p,head,other,trigger,vstart,stack,stop=0x2000000,0x2001000,0x2002000,0x2003000,0x2010000,0x20fd000,0x20fe000
fields={'id':(0x24,'H'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'counter':(0x2e,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'target':(0x72,'H'),'animationMode':(0xa8,'B'),'vehicle':(0x9f,'H'),'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a):return dict(x=read(a,'H'),y=read(a+2,'H'))
def person():return {**{k:read(p+a,f) for k,(a,f) in fields.items()},'velocity':dict(zip(('x','y','z'),struct.unpack('<hhh',cpu.mem_read(p+0x43,6))))}
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return bool(cpu.reg_read(UC_X86_REG_EAX)&255)
events=[];config={}
def consume(cpu,address,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP);value=0
 if address==0x43c340:
  events.append(['find']);place=config['place'];value=place['mode'] if place else 0
  if place:write(read(sp+12,'I'),'HH',place['point']['x'],place['point']['y']);write(read(sp+16,'I'),'I',place['slot'])
  write(p+0x10,'I',(read(p+0x10,'I')&~0x10000000)|(0x10000000 if config['routeFailed'] else 0))
 elif address==0x4e9d80:
  to=point(read(sp+8,'I'));events.append(['destination',to]);write(p+0x4f,'6H',to['x'],to['y'],to['x'],to['y'],to['x'],to['y']);write(p+0xc,'I',(read(p+0xc,'I')&~128)|0x1000)
 elif address==0x4d4f40:events.append(['recover']);write(p+0x5f,'h',40)
 elif address==0x466c80:events.append(['disembark']);write(p+0x9f,'H',0)
 elif address==0x402e70:events.append(['anchor',point(read(sp+8,'I'))])
 elif address==0x4ee580:
  to=point(read(sp+8,'I'));events.append(['relocate',to]);write(p+0x3d,'HH',to['x'],to['y'])
 elif address==0x44e940:value=100
 elif address==0x4ea460:events.append(['releaseRoute'])
 elif address==0x4d4040:events.append(['animation',read(sp+8,'I')])
 elif address==0x48a050:events.append(['sound',read(sp+8,'I')])
 cpu.reg_write(UC_X86_REG_EAX,value);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x43c340,0x4e9d80,0x4d4f40,0x466c80,0x402e70,0x4ee580,0x44e940,0x4ea460,0x4d4040,0x48a050):cpu.hook_add(UC_HOOK_CODE,consume,begin=a,end=a)
write(0x59df44,'I',vstart)
for i in range(256):write(vstart+i*6+1,'B',8)
write(0x890394,'I',p);write(0x890398,'I',head);write(0x89039c,'I',other);write(0x8903a0,'I',trigger)
def insert(address,id):
 q=point(address+0x3d);cell=(q['y']>>9)*128+(q['x']>>9);a=0x8a03ea+cell*16
 write(address+0x20,'H',read(a,'H'));write(a,'H',id)
rng=random.Random(0x43bcc0);cases=[]
for trial in range(4096):
 for a in (p,head,other,trigger):cpu.mem_write(a,bytes(256))
 cpu.mem_write(0x8a03e4,bytes(16384*16))
 x,y=rng.choice([(1000,2000),(32600,32800),(65500,100)])
 h=dict(x=x,y=y,angle=rng.randrange(4)*512,nextSlot=rng.randrange(50),slotTimer=rng.randrange(17))
 write(head+0x3d,'HH',x,y);write(head+0x26,'h',h['angle']);write(head+0x2a,'BB',5,9);write(head+0x31,'BB',h['nextSlot'],h['slotTimer'])
 u={key:0 for key in fields};u.update(id=1,model=rng.choice([2,3,7]),state=10,substate=trial%4,counter=rng.randrange(256),x=x,y=y,h=100,target=2,
  goalX=(x+rng.choice([0,11,12,1591,1592]))&65535,goalY=y,destinationX=(x+rng.choice([0,11,1079,1080]))&65535,destinationY=y,
  flags2=rng.choice([0,4,0x2000,0x200000,0x40000000,0x40000004,0x40200000]),flags3=0,flags4=rng.choice([0,16,0x10000000,0x10000010]),speed=rng.choice([0,0,1,256]),timer=rng.choice([0,1,2,24]),animationMode=rng.randrange(3),vehicle=rng.choice([0,0,0,5]),object=10,renderFlags=258,f1=rng.choice([0,1,2]),f2=rng.choice([0,6,7,8]))
 u['turnAngle']=u['destinationX'];u['turnY']=u['destinationY']
 for k,(a,f) in fields.items():write(p+a,f,u[k])
 write(p+0x2a,'B',1);write(p+0x43,'hhh',1,2,3);u['velocity']=dict(x=1,y=2,z=3)
 occupied=bool(rng.randrange(3)==0);shaman_only=bool(rng.randrange(2))
 if occupied:
  write(other+0x3d,'HH',u['destinationX'],u['destinationY']);write(other+0x2a,'B',1);insert(other,3)
 if shaman_only:
  write(trigger+0x3d,'HH',x,y);write(trigger+0x2a,'BB',6,6);write(trigger+0x6d,'B',16);insert(trigger,4)
 mode=rng.randrange(3);config=dict(place=dict(mode=mode,slot=rng.choice([0,1,49]),point=dict(x=(x+2)&65535,y=y)) if mode else None,routeFailed=bool(rng.randrange(3)==0),occupied=occupied,shamanOnly=shaman_only)
 seed=rng.getrandbits(32);write(0x89bc72,'I',seed);write(0x89d178,'I',0x12345678);events=[]
 done=call(0x43bcc0,p)
 assert read(0x89d178,'I')==0x12345678
 after=dict(person=person(),head={**h,'nextSlot':read(head+0x31,'B'),'slotTimer':read(head+0x32,'B')},randomState=read(0x89bc72,'I'),done=done,events=events.copy())
 cases.append(dict(person=u,head=h,randomState=seed,config=config,expected=after))
js="""import {stepWorshipPerson} from './app/person-worship.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const p=c.person,events=[],config=c.config,occupied={x:p.turnAngle,y:p.turnY};const effects={findPlace:()=>{events.push(['find']);p.flags4=((p.flags4&~0x10000000)|(config.routeFailed?0x10000000:0))>>>0;return config.place},occupied:to=>config.occupied&&to.x===occupied.x&&to.y===occupied.y,shamanOnly:()=>config.shamanOnly,destination:to=>{events.push(['destination',{...to}]);p.goalX=p.destinationX=p.turnAngle=to.x;p.goalY=p.destinationY=p.turnY=to.y;p.flags2=((p.flags2&~128)|0x1000)>>>0},recover:()=>{events.push(['recover']);p.speed=40},disembark:()=>{events.push(['disembark']);p.vehicle=0},anchor:to=>events.push(['anchor',{x:to.x,y:to.y}]),relocate:to=>{events.push(['relocate',{...to}]);p.x=to.x;p.y=to.y;p.h=100},releaseRoute:()=>events.push(['releaseRoute']),animation:object=>events.push(['animation',object]),sound:cue=>events.push(['sound',cue])};const done=stepWorshipPerson(c,p,c.head,Array(256).fill(8),effects);return{person:p,head:c.head,randomState:c.randomState,done,events}})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(c,a) in enumerate(zip(cases,actual)):assert a==c['expected'],(i,c,a)
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/person-worship.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[::17]),separators=(',',':'))+'\n')
print('PASS: 4,096 complete native command-27 bodies; approach/slot/arrival/prayer phases, frame and RNG gates, retry, sound and flags')
