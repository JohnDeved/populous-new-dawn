"""Compare building attack phase 3 and its approach/damage/shake helpers with x86.
Real shape geometry, RNG, movement recovery, animation, damage and shake run.
Destination, defender query/removal, encounters, sound and reservation release
are supplied consumers, not claims of complete world lifecycle integration.
Usage: python SCRIPT EXE [--record]
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,load_native_shapes,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
raw_objects,raw_shapes,base,order,stack,stop=0x2000000,0x2003000,0x2010000,0x2020000,0x203e000,0x203f000
load_native_shapes(cpu,exe,raw_objects,raw_shapes)
rng=random.Random(0x51b149)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(i):return base+i*256
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=10000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)&255
shape_data=json.loads((ROOT/'app/original-shapes.json').read_text());poses=[(i,j*512) for i,row in enumerate(shape_data['objects']) for j in range(len(row))]
starts=list(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()))
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()))
counts=0x2021000
write(0x59df44,'I',counts)
for i,(start,_) in enumerate(starts):
 frame,seen=start,set()
 while frame and frame not in seen:seen.add(frame);frame=frames[frame][-1]
 assert frame in [0,start];write(counts+i*6+1,'B',len(seen)&255)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),
 'counter':(0x2e,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),
 'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'speed':(0x5f,'h'),'cargo':(0x78,'h'),
 'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),
 'assignment':(0x76,'H'),'timer':(0x70,'h'),'target':(0x72,'h'),'slowTurn':(0x7e,'b'),
 'workTarget':(0x89,'H'),'animationMode':(0xa8,'B'),'commandPhase':(0xaa,'B'),
 'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),'anchorX':(0x68,'H'),'anchorY':(0x6a,'H'),'anchorFlags':(0x82,'B'),'disguise':(0xb2,'B')}
rules=json.loads((ROOT/'app/original-rules.json').read_text())

p,b,defender=ptr(1),ptr(2),ptr(3)
bfields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'tribe':(0x2f,'b'),
 'flags2':(0xc,'I'),'flags3':(0x14,'I'),'buildingFlags':(0x9c,'H'),'renderFlags':(0x35,'H'),
 'tilt':(0x6c,'h'),'roll':(0x6e,'h'),'remaining':(0xa7,'b'),'damage':(0x9e,'h'),'attacker':(0xaf,'B'),
 'object':(0x33,'H'),'angle':(0x26,'H'),'anchorX':(0x7a,'H'),'anchorY':(0x7c,'H'),'x':(0x3d,'H'),'y':(0x3f,'H')}
def record(a,fs):return {k:read(a+off,f) for k,(off,f) in fs.items()}
def world():return dict(randomState=read(0x89d178,'I'),levelFlags2=read(0x895da4,'I'),playerTribe=read(0x89c6f0,'B'),attackAlert=read(0x89ce60,'B'),attackCell=read(0x89c6e5,'H'),tribes=[dict(flags=read(0x89db05+i*0xc65,'I'),playerType=0) for i in range(4)])
def log(name,*args):events.append([name,*args,record(p,fields),record(b,bfields),world()])
def effect(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);arg=lambda i:read(sp+4+i*4,'I');value=0
 if a==0x4d4040:log('animation',arg(1)&65535);return
 if a in [0x4e9d80,0x4e9dd0]:
  to=arg(1);point=dict(x=read(to,'H'),y=read(to+2,'H'));log('planned' if a==0x4e9d80 else 'direct',point);write(p+0x4f,'HH',point['x'],point['y'])
 elif a==0x51e300:log('defenders');value=int(case['defenders'])
 elif a==0x407490:assert arg(1)==0;log('remove');value=defender if case['remove'] else 0
 elif a==0x51e150:assert arg(1)==defender;log('encounter',arg(2)&255,read(defender+0xc,'I'))
 elif a==0x4ea460:log('release')
 elif a==0x48a050:log('sound',arg(1),arg(2))
 else:raise AssertionError(hex(a))
 c.reg_write(UC_X86_REG_EAX,value);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x4e9d80,0x4e9dd0,0x51e300,0x407490,0x51e150,0x4ea460,0x48a050]:cpu.hook_add(UC_HOOK_CODE,effect,begin=a,end=a)
cases=[];expected=[];calls=0;phases=set()
for n in range(10304):
 mode='attack' if n<6144 else ['outside','inside','position','damage','shake'][(n-6144)%5] if n<10240 else 'sequence'
 model=2+n%6;obj,draw=rules['animationObjects'][rules['personAnimationObjects'][model]]
 pp={k:0 for k in fields};pp.update(id=1,**{'class':1},model=model,state=10,substate=3,counter=n&255,tribe=rng.choice([0,1,2,3]),
  physics=rules['personModels'][model]['physics'],flags2=rng.choice([0,128,0x8000,0x40000000,0x40008080,0x80000]),flags3=rng.choice([0,0x80000]),
  flags4=rng.choice([0,4,0x400,0x800,0x1000,0x1400,0x10007]),assignment=rng.choice([0,16,512,528]),speed=rng.randrange(100),cargo=rng.choice([0,100]),
  angle=rng.randrange(2048),heading=rng.randrange(2048),timer=rng.choice([-32768,-1,0,1,2,16,64,32767]),target=2,workTarget=2,
  animationMode=rng.choice([23,30,31,37,46,52,53]),object=obj,draw=draw,f1=rng.randrange(5),f2=rng.randrange(3),renderFlags=rng.choice([0,16,0x4000,0x4010]),
  anchorX=600,anchorY=123,anchorFlags=255,disguise=rng.randrange(256))
 object_,angle=rng.choice(poses);x=rng.choice([0,512,32256,32768,65024]);y=rng.choice([0,512,32256,32768,65024])
 bb=dict(id=2,**{'class':rng.choice([2,2,2,2,9])},model=rng.choice([1,2,3,4,5,6,7,8,9,19]),state=rng.choice([1,2,3,4]),tribe=rng.randrange(4),flags2=0,flags3=rng.choice([0,0,128]),buildingFlags=rng.choice([0,2,4,6,16,256]),renderFlags=32,tilt=100,roll=-200,remaining=-1,damage=rng.choice([-32768,-1,0,100,32767]),attacker=255,object=object_,angle=angle,anchorX=x,anchorY=y,x=x,y=y)
 shape=shape_data['shapes'][shape_data['objects'][object_][angle//512]]
 inside=dict(x=(x-shape['x']*256+shape['inside'][0]*64)&65535,y=(y-shape['y']*256+shape['inside'][1]*64)&65535)
 pp.update(x=(inside['x']+rng.choice([0,111,112,311,312,1000]))&65535,y=(inside['y']+rng.choice([0,111,112]))&65535,goalX=inside['x'],goalY=inside['y'])
 ww=dict(randomState=rng.getrandbits(32),levelFlags2=rng.choice([0,0,0x4000000]),playerTribe=rng.randrange(4),attackAlert=rng.randrange(2),attackCell=12345,tribes=[dict(flags=rng.choice([0,8,0x8000,0xffffffff]),playerType=0) for _ in range(4)])
 if mode=='sequence':
  bb.update({'class':2,'tribe':(pp['tribe']+1)%4,'state':2,'flags3':0});pp.update(assignment=16,flags2=128,animationMode=[30,31,37,46,52,53][n%6]);ww['levelFlags2']=0
 if mode=='damage':pp['tribe']=rng.choice([-1,0,1,2,3])
 occupied=[(y>>9)*128+(x>>9)] if n%3 else []
 case=dict(mode=mode,p=pp,b=bb,w=ww,defender=dict(flags2=rng.getrandbits(32)),alert=n%3,defenders=bool(n&2),remove=bool(n&4),occupied=occupied,radius=rng.choice([-128,0,1,56,112,255]))
 for a,fs,values in [(p,fields,pp),(b,bfields,bb)]:
  cpu.mem_write(a,bytes(256))
  for k,(off,f) in fs.items():write(a+off,f,values[k])
 cpu.mem_write(defender,bytes(256));write(defender+0xc,'I',case['defender']['flags2']);write(0x890394,'III',p,b,defender)
 write(order,'BBHHHH',19,0,1,0,0,0);write(0x89d178,'I',ww['randomState']);write(0x89d167,'B',case['alert']);write(0x89c6f0,'B',ww['playerTribe']);write(0x89d17c,'I',0)
 write(0x895da4,'I',ww['levelFlags2']);write(0x89ce60,'B',ww['attackAlert']);write(0x89c6e5,'H',ww['attackCell'])
 for i,t in enumerate(ww['tribes']):write(0x89db05+i*0xc65,'I',t['flags']);write(0x89d1c8+i*0xc65+0xc1f,'B',0)
 cpu.mem_write(0x8a03e4,bytes(16384*16))
 for index in occupied:write(0x8a03e4+index*16+8,'H',2)
 events=[]
 if mode=='outside':result=bool(call(0x438f20,p,case['radius']))
 elif mode=='inside':result=bool(call(0x439030,p))
 elif mode=='position':result=bool(call(0x439480,p))
 elif mode=='damage':call(0x409140,b,p);result=None
 elif mode=='shake':call(0x407810,b,case['radius']);result=None
 elif mode=='attack':result=call(0x51a2a0,p,order)
 else:
  result=[]
  for turn in range(96):
   phases.add(read(p+0xa8,'B'));value=call(0x51a2a0,p,order);calls+=1
   result.append(dict(p=record(p,fields),b=record(b,bfields),w=world(),value=value))
   if read(p+0x2d,'B')==0:break
   if turn<95:write(p+0x2e,'B',(read(p+0x2e,'B')+1)&255);write(p+0x3d,'HH',read(p+0x4f,'H'),read(p+0x51,'H'))
 if mode!='sequence':calls+=1
 cases.append(case);expected.append(dict(p=record(p,fields),b=record(b,bfields),w=world(),defender=dict(flags2=read(defender+0xc,'I')),events=copy.deepcopy(events),alert=read(0x89d167,'B'),result=result))
js="import {runBuildingAttack} from './tests/building-attack-case.mjs';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(runBuildingAttack)));"
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(actual,expected)):
 if a!=b:
  path=Path('/private/tmp/populous-building-attack-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=b,browser=a),indent=2));raise AssertionError((i,str(path)))
assert phases=={23,30,31,37,46,52,53},phases
print(f'PASS: {calls} native building-attack/helper calls, 64 sequences; real geometry, recovery, animation, RNG, damage and shaking; world destination/occupant/encounter/audio consumers supplied')
if '--record' in sys.argv:
 captures=sorted(set(range(0,10240,29))|set(range(10240,10247)))
 (ROOT/'tests/fixtures/building-attack.json').write_text(json.dumps(dict(identity=identity,cases=[dict(input=cases[i],expected=expected[i]) for i in captures]),separators=(',',':'))+'\n')
