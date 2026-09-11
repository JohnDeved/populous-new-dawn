"""Compare complete state-33 initialization (004d9580) and body (004d9650).
Route construction, class initialization, audio and notification consumers are
supplied; field changes, retry cadence, limits and consumer order execute natively.
Usage: python scripts/check-native-route-recovery.py EXE [--record]
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x20000)
p,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x4d9650);rules=json.loads((ROOT/'app/original-rules.json').read_text())
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
fields={'state':(0x2c,'B'),'substate':(0x2d,'B'),'model':(0x2b,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),
 'counter':(0x2e,'B'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'life':(0x6e,'h'),'cargo':(0x78,'h'),
 'flags2':(0xc,'I'),'flags4':(0x10,'I'),'flags3':(0x14,'I'),'x':(0x3d,'H'),'y':(0x3f,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'commandPhase':(0xaa,'B'),'animationMode':(0xa8,'B'),
 'motionTimer':(0x61,'h'),'previousState':(0x7d,'B')}
def person():return {k:read(p+off,f) for k,(off,f) in fields.items()}
def log(name,*args):events.append([name,*args,person()])
def consumer(c,address,size,_):
 sp=c.reg_read(UC_X86_REG_ESP);a,b,d=struct.unpack('<III',c.mem_read(sp+4,12));result=0
 if address==0x4d4040:log('animation',b&65535)
 elif address==0x4ea460:log('release')
 elif address==0x48a050:log('sound',b);assert a==0 and d==1
 elif address==0x499d90:log('notify',a,b)
 elif address==0x4ed640:log('initialize')
 elif address==0x40a3f0:log('adjacentBuilding');result=case['building']
 elif address==0x44f750:result=case['slope']
 elif address==0x4ea920:log('build',read(sp+16,'I')&255);result=case['route']
 elif address==0x4ec680:log('clearFailure',a)
 elif address==0x4ea400:log('attach',b&65535)
 else:raise AssertionError(hex(address))
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x4ea460,0x48a050,0x499d90,0x4ed640,0x40a3f0,0x44f750,0x4ea920,0x4ec680,0x4ea400]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
write(0x96aa74,'I',0x96aaba)
cases=[]
for n in range(8192):
 pp={k:0 for k in fields};pp.update(state=33,substate=rng.randrange(5),model=2+n%6,tribe=n%4,physics=n%20,
  counter=rng.choice([0,1,7,8,127,128,255]),speed=rng.randrange(-32768,32768),timer=rng.choice([-32768,0,31,32,351,352,863,864,32767]),
  life=rng.choice([-32768,0,55,56,1000,32767]),cargo=rng.choice([0,100]),flags2=rng.getrandbits(32),flags4=rng.getrandbits(32),flags3=rng.getrandbits(32),
  x=rng.randrange(65536),y=rng.randrange(65536),goalX=rng.randrange(65536),goalY=rng.randrange(65536),
  commandPhase=rng.choice([0,1,8,127,128,255]),animationMode=rng.choice([0,1,2,3,4,8,9,127,128,255]),motionTimer=rng.randrange(300),previousState=10)
 w=dict(gameFlags=rng.choice([0,2,32]),loadFlags=rng.choice([0,0x4000000]),playerTribe=rng.randrange(4),turn=rng.randrange(0x100000000),lastOrderTurn=0,
  tribe=dict(flags=rng.choice([0,32]),flags2=rng.choice([0,64]),playerType=rng.randrange(3)))
 w['lastOrderTurn']=(w['turn']-rng.choice([0,1,2,3,128,0xffffffff]))&0xffffffff
 case=dict(p=pp,w=w,mode='initialize' if n%2 else 'step',slope=rng.choice([0,32767,65535]),passable=bool(n&4),building=rng.choice([0,0,39]),route=rng.choice([0,0,1,399]))
 cpu.mem_write(p,bytes(256))
 for k,(off,f) in fields.items():write(p+off,f,pp[k])
 write(0x89d17c,'I',w['gameFlags']);write(0x89c665,'I',w['loadFlags']);write(0x89c6f0,'B',w['playerTribe']);write(0x89d184,'I',w['turn']);write(0x89bc22,'I',w['lastOrderTurn'])
 t=0x89d1c8+pp['tribe']*0xc65
 write(t+0x93d,'I',w['tribe']['flags']);write(t+0x941,'I',w['tribe']['flags2']);write(t+0xc1f,'B',w['tribe']['playerType'])
 cpu.mem_write(0x96aaba,bytes([255 if case['passable'] else 0])*8192)
 # Terrain slope and adjacent-building consumers are explicitly supplied.
 cpu.mem_write(0x8a03e4,bytes(16384*16));events=[]
 write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x4d9580 if case['mode']=='initialize' else 0x4d9650,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 case['unsupported']=case['slope']>rules['personSlopeLimits'][pp['physics']] if rules['personPhysicsFlags'][pp['physics']]&8 else not case['passable']
 cases.append(dict(input=copy.deepcopy(case),expected=dict(p=person(),events=copy.deepcopy(events))))
js="""
import {initializeRouteRecovery,stepRouteRecovery} from './app/person-route-recovery.ts';let text='';for await(const c of process.stdin)text+=c;
console.log(JSON.stringify(JSON.parse(text).map(({input:c})=>{const p=c.p,events=[],log=(name,...args)=>events.push([name,...args,structuredClone(p)]);
 const e={animation:(_,o)=>log('animation',o&65535),release:()=>log('release'),sound:cue=>log('sound',cue),notify:(flags,message)=>log('notify',flags,message),unsupportedGround:()=>c.unsupported,adjacentBuilding:()=>{log('adjacentBuilding');return c.building;},build:option=>{log('build',option);return c.route;},clearFailure:id=>log('clearFailure',id),attach:id=>log('attach',id),initialize:()=>log('initialize')};
 (c.mode==='initialize'?initializeRouteRecovery:stepRouteRecovery)(c.w,p,e);return {p,events};})))
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
for i,(a,c) in enumerate(zip(json.loads(r.stdout),cases)):
 if a!=c['expected']:
  out=Path('/private/tmp/populous-route-recovery-failure.json');out.write_text(json.dumps(dict(case=c,actual=a),indent=2));raise AssertionError((i,str(out)))
print('PASS: 8192 native route-recovery initializers/body visits, retry cadence, life limits, all fields and ordered consumers.')
if '--record' in sys.argv:(ROOT/'tests/fixtures/route-recovery.json').write_text(json.dumps(cases[::31],separators=(',',':'))+'\n')
