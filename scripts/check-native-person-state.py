"""Compare native person initialization, order startup and animation selection.
Usage: python scripts/check-native-person-state.py /path/to/d3dpoptb.exe
Requires the original levels/constant.dat beside the executable. Complex world
consumers are intercepted; initializer/startup flags, configured speeds, RNG,
selection counts, facing math and animation-object selection execute natively.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants

root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
# Match the shipped LEVELS/constant.dat settings, not the executable defaults.
# Resolve addresses and native widths through its own constant descriptor table.
configure_native_constants(cpu, Path(sys.argv[1]))
p,stack,stop=0x2000000,0x201d000,0x201e000
tribes=0x89d1c8;rng=random.Random(0x4d2740);actions=[]

def write(a,fmt,*v):cpu.mem_write(a,struct.pack(fmt,*v))
def call(a,*args):
    write(stack,'<'+'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))

def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);a,b=struct.unpack('<II',cpu.mem_read(sp+4,8))
    if address==0x4d6f90:actions.append(['idleApproach'])
    elif address==0x4d7330:actions.append(['resting'])
    elif address==0x4dfac0:actions.append(['specialBattle'])
    elif address==0x4e0af0:actions.append(['celebration'])
    elif address==0x4d4040:actions.append(['animation',(b<<16>>16)&65535])
    elif address==0x409580:actions.append(['training',struct.unpack('<H',cpu.mem_read(a+0x24,2))[0]])
    elif address==0x4d56f0:actions.append(['formation',a&65535])
    elif address==0x4ea460:actions.append(['motion'])
    elif address==0x432260:actions.append(['orders'])
    elif address==0x4d3250:actions.append(['occupant-animation'])
    elif address==0x4d80e0:actions.append(['occupancy',b])
    cpu.reg_write(UC_X86_REG_EAX,7 if address==0x4d3250 else 0);cpu.reg_write(UC_X86_REG_EIP,struct.unpack('<I',cpu.mem_read(sp,4))[0]);cpu.reg_write(UC_X86_REG_ESP,sp+4)
hooks={a:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a) for a in [0x4d4040,0x409580,0x4d56f0,0x4ea460,0x432260,0x4e0af0,0x4dfac0,0x4d6f90,0x4d7330,0x4d3250,0x4d80e0,0x40a3f0]}

fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),
 'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),
 'selectionFlags':(0x7a,'B'),'commandCursor':(0xa6,'B'),'immediateCommand':(0x9b,'H'),
 'orderLocation':(0x83,'H'),'commandStatus':(0xa7,'B'),'workTarget':(0x89,'H'),
 'tribe':(0x2f,'b'),'previousState':(0x7d,'B'),'physics':(0x30,'B'),'renderFlags':(0x35,'H'),
 'statusFlags':(0xb2,'B'),'workFlags':(0x9d,'H'),'stateObject':(0x87,'H'),'speed':(0x5f,'h'),
 'timer':(0x70,'h'),'target':(0x72,'h'),'reservationNext':(0x85,'H'),'formationCell':(0x80,'H'),
 'cargo':(0x78,'H'),'animationMode':(0xa8,'B'),'vehicle':(0x9f,'H'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),
 'motionTimer':(0x61,'H'),'motionMode':(0x66,'B'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),
 'savedVehicle':(0xa1,'H'),'commandPhase':(0xaa,'B'),'commandAux':(0xa9,'B'),'orderDelay':(0xab,'B')}

def fixture(c):
    global actions
    actions=[];cpu.mem_write(p,bytes(512));cpu.mem_write(tribes,bytes(4*0xc65));cpu.mem_write(0x938830,bytes(8000));cpu.mem_write(0x890390,bytes(4096))
    u=c['person'];write(p+0x24,'<H',1);write(p+0x2a,'<B',1)
    for key,(offset,fmt) in fields.items():write(p+offset,'<'+fmt,u[key])
    write(p+0x8b,'<8H',*u['commands']);write(0x890394,'<I',p)
    for id_ in [100,101]:
        obj=p+1024+id_*256;cpu.mem_write(obj,bytes(256));write(obj+0x24,'<H',id_);write(obj+0x2a,'<B',2);write(0x890390+id_*4,'<I',obj)
    for id_,order in c['orders']:
        write(0x938830+id_*10,'<BB4H',order['model'],order['flags'],1,0,order['a'],order.get('b',0))
    write(0x89d178,'<I',c['randomState']);write(0x89c661,'<B',c['facingFlags']&8);write(0x98f746,'<B',c['facingFlags']&16)
    for i,t in enumerate(c['tribes']):
        a=tribes+i*0xc65;write(a+0x24,'<HH',t['x'],t['y']);write(a+0x32,'<H',t['angle']);write(a+0x92d,'<i',t['selectedCount']);write(a+0x941,'<I',t['flags'])

def read_person(address):
    out={'id':struct.unpack('<H',cpu.mem_read(address+0x24,2))[0],'commands':list(struct.unpack('<8H',cpu.mem_read(address+0x8b,16)))}
    for key,(offset,fmt) in fields.items():out[key]=struct.unpack('<'+fmt,cpu.mem_read(address+offset,struct.calcsize(fmt)))[0]
    return out
def snapshot(c):
    out=read_person(p)
    ts=[]
    for i,t in enumerate(c['tribes']):
        a=tribes+i*0xc65;ts.append(dict(t,selectedCount=struct.unpack('<i',cpu.mem_read(a+0x92d,4))[0],flags=struct.unpack('<I',cpu.mem_read(a+0x941,4))[0]))
    return dict(person=out,tribes=ts,randomState=struct.unpack('<I',cpu.mem_read(0x89d178,4))[0],actions=actions)

cases=[];expected=[]
for trial in range(6656):
    u={key:rng.randrange(256 if fmt in ['B','b'] else 65536) for key,(_,fmt) in fields.items()}
    for key in ['flags2','flags3','flags4']:u[key]=rng.getrandbits(32)
    for key in ['speed','timer']:u[key]=rng.randrange(-128,256)
    u.update(id=1,model=trial%9,state=10 if trial%2 else 14,previousState=rng.randrange(46),physics=trial%20,
        tribe=trial%4,target=rng.choice([100,101]),vehicle=0,commands=[rng.choice([0,1,2,256,257]) for _ in range(8)],
        commandCursor=rng.randrange(8),immediateCommand=rng.choice([0,1,2,256,257]),angle=rng.randrange(2048))
    if u['previousState']!=14:u['vehicle']=rng.choice([0,100])
    if trial>=1536:u.update(state=41 if trial<2048 else 36 if trial<2560 else 39 if trial<3072 else 1,vehicle=0)
    if trial>=4096:u.update(state=17 if trial<4608 else 19,vehicle=0)
    if trial>=5120:u.update(state=8,vehicle=0)
    if trial>=5632:u.update(state=26,vehicle=0)
    if trial>=6144:u.update(state=21,vehicle=0)
    c=dict(person=u,orders=[[i,dict(model=rng.choice([6,8,8]),flags=trial%2,a=rng.choice([100,101]))] for i in [1,2,256,257]],
        randomState=rng.getrandbits(32),facingFlags=trial%4*8,
        tribes=[dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(2048),selectedCount=rng.choice([0,1,7,-1]),flags=rng.getrandbits(32)) for _ in range(4)])
    fixture(c);call(0x4d2740,p);cases.append(c);expected.append(snapshot(c))

js="""import {initializePersonState} from './app/person-state.ts';import {emptyPersonOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const actions=[],p=c.person,records=Array.from({length:800},emptyPersonOrder);for(const [id,o] of c.orders)Object.assign(records[id],o);
const w={randomState:c.randomState,instantFacing:!!c.facingFlags,levelFlags:0,tribes:c.tribes,orders:{records,cursor:1,active:0}};
initializePersonState(w,p,{occupying:()=>{actions.push(['occupant-animation']);p.timer=7;actions.push(['occupancy',0],['motion']);},idleApproach:()=>actions.push(['idleApproach']),resting:()=>actions.push(['resting']),specialBattle:()=>actions.push(['specialBattle']),celebrate:()=>actions.push(['celebration']),deselectPassengers:()=>{throw Error('uncovered passenger mutation');},rebuildTrainingQueue:id=>actions.push(['training',id]),
rebuildFormation:cell=>actions.push(['formation',cell]),releaseMotion:()=>actions.push(['motion']),startOrders:()=>actions.push(['orders']),setAnimation:(_,id)=>actions.push(['animation',id&65535])});
return {person:p,tribes:w.tribes,randomState:w.randomState,actions};})));"""
def browser(js,cases):
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=root);assert r.returncode==0,r.stderr;return json.loads(r.stdout)
actual=browser(js,cases);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        path=Path('/private/tmp/populous-state-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(path)))
print('PASS: 6656 native state-1/8/10/14/17/19/21/26/36/39/41 initializers, flags, RNG, selection counts and camera-relative facing; world effects supplied')
for address in (0x4d3250,0x4d80e0,0x40a3f0):cpu.hook_del(hooks.pop(address))

cases=[];expected=[]
for state in range(46):
    for model in range(9):
        for option in range(16):
            flags2=0x8000|(0x80000 if option&1 else 0);flags4=0x400 if option&2 else 0
            speed=0 if option&4 else 64;cargo=1 if option&8 else 0
            cpu.mem_write(p,bytes(256));write(p+0x2b,'<BB',model,state);write(p+0xc,'<II',flags2,flags4);write(p+0x5f,'<h',speed);write(p+0x78,'<H',cargo)
            actions=[];call(0x4d3ea0,p)
            cases.append(dict(state=state,model=model,flags2=flags2,flags4=flags4,speed=speed,cargo=cargo))
            expected.append(dict(object=actions[0][1] if actions else -1,flags2=struct.unpack('<I',cpu.mem_read(p+0xc,4))[0]))
actual=browser("""import {personAnimationObject} from './app/person-state.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(p=>({object:personAnimationObject(p),flags2:p.flags2}))));""",cases)
for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(i,cases[i],a,b)
assert len(actual)==len(expected)
print(f'PASS: {len(cases)} native animation-object selections across all 46 states and 9 models')

# Replace the previous startup boundary with the actual native startup/configure
# routines. Supply destination, adjacency and building-exit world consumers.
cpu.hook_del(hooks[0x432260])
startup_case={}
def startup_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);a,b=struct.unpack('<II',cpu.mem_read(sp+4,8));result=0
    if address==0x4e9d80:actions.append(['destination',*struct.unpack('<hh',cpu.mem_read(b,4))])
    elif address==0x40a3f0:
        actions.append(['adjacent',b]);id_=startup_case.get('adjacent',{}).get(str(b),0)
        if id_:result=struct.unpack('<I',cpu.mem_read(0x890390+id_*4,4))[0]
    elif address==0x409ed0:actions.append(['leave'])
    elif address==0x520170:
        id_=struct.unpack('<H',cpu.mem_read(b+0x24,2))[0];actions.append(['canStay',id_]);result=int(startup_case.get('canStay',False))
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,struct.unpack('<I',cpu.mem_read(sp,4))[0]);cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4e9d80,0x40a3f0,0x409ed0,0x520170]:cpu.hook_add(UC_HOOK_CODE,startup_leaf,begin=a,end=a)

cases=[];expected=[]
plain_models=[0,1,2,3,4,5,8,9,12,13,14,15,16,17,18,20,22,23,24,26,27,29,32,33,34]
for trial in range(1280):
    u={key:rng.randrange(256 if fmt in ['B','b'] else 65536) for key,(_,fmt) in fields.items()}
    for key in ['flags2','flags3','flags4']:u[key]=rng.getrandbits(32)
    for key in ['speed','timer']:u[key]=rng.randrange(-128,256)
    u.update(id=1,model=trial%9,state=10,previousState=14,physics=trial%20,tribe=trial%4,target=100,vehicle=0,
        commands=[rng.choice([0,1,2]) for _ in range(8)],commandCursor=trial%8,immediateCommand=rng.choice([0,1,2]),
        commandStatus=rng.choice([0,8,21,28,31]))
    # Reconcile-only cases also exercise its command-presence/cancellation rules.
    kind='reconcile' if trial%4==0 else 'start'
    c=dict(kind=kind,person=u,orders=[[i,dict(model=plain_models[(trial+i)%len(plain_models)],flags=trial%2,a=rng.choice([0,100,101]))] for i in [1,2]],
        randomState=rng.getrandbits(32),facingFlags=0,adjacent={'0':rng.choice([0,100,101]),'4':rng.choice([0,100])},canStay=bool(trial%3),
        tribes=[dict(x=0,y=0,angle=0,selectedCount=0,flags=0) for _ in range(4)])
    if kind=='start' and trial%2==0:
        for _,o in c['orders']:
            if o['model'] in [3,5,9,12,13,15,17,20,24,26,32]:
                o['a']=rng.choice([0,0x7ffe,0x8001,0xfefe,0xffff]);o['b']=rng.randrange(65536)
    fixture(c);startup_case=c;call(0x43d510 if kind=='reconcile' else 0x432260,p);cases.append(c);expected.append(snapshot(c))
js="""import {startPersonOrders,reconcileOrderBuilding} from './app/person-order-start.ts';import {emptyPersonOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const actions=[],p=c.person,records=Array.from({length:800},emptyPersonOrder);for(const [id,o] of c.orders)Object.assign(records[id],o);
const w={randomState:c.randomState,instantFacing:false,levelFlags:0,tribes:c.tribes,orders:{records,cursor:1,active:0}},unexpected=()=>{throw Error('uncovered world consumer');};
const effects={setAnimation:(_,id)=>actions.push(['animation',id&65535]),setDestination:(_,x,y)=>actions.push(['destination',x,y]),commandPosition:unexpected,allowVehicleOrder:unexpected,
initializeCommand:unexpected,adjacentBuilding:(_,model)=>{actions.push(['adjacent',model]);return c.adjacent[model]??0;},canStayForTarget:(_,id)=>{if(![100,101].includes(id))return false;actions.push(['canStay',id]);return c.canStay;},
leaveBuilding:()=>actions.push(['leave']),resetVehicleMovement:unexpected,leaveSelectedVehicle:unexpected,initializeState:unexpected};
(c.kind==='reconcile'?reconcileOrderBuilding:startPersonOrders)(w,p,effects);return {person:p,tribes:w.tribes,randomState:w.randomState,actions};})));"""
actual=browser(js,cases);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        path=Path('/private/tmp/populous-order-start-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(path)))
print('PASS: 1280 native order-startup/building-reconciliation cases; destination and building world consumers supplied')

# Verify configured speed values directly: selection state 14 zeroes its speed,
# so its initializer comparison alone only proves RNG consumption, not the draw.
cases=[];expected=[]
for physics in range(20):
    for option in range(32):
        u={key:0 for key in fields};u.update(id=1,model=option%9,state=10,physics=physics,tribe=0,
            flags3=0x80000 if option&1 else 0,flags2=0x8000|(0x80000 if option&2 else 0),
            flags4=0x400 if option&4 else 0,cargo=1 if option&8 else 0,commands=[0]*8)
        c=dict(person=u,orders=[],randomState=rng.getrandbits(32),facingFlags=0,
            tribes=[dict(x=0,y=0,angle=0,selectedCount=0,flags=0) for _ in range(4)])
        fixture(c);call(0x4d4f40,p);cases.append(c);expected.append(snapshot(c))
actual=browser("""import {recoverPersonMovement} from './app/person-state.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const actions=[],w={randomState:c.randomState};recoverPersonMovement(w,c.person,(_,id)=>actions.push(['animation',id&65535]));
return {person:c.person,tribes:c.tribes,randomState:w.randomState,actions};})));""",cases)
assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(i,a,b)
print('PASS: 640 native speed/recovery calls with shipped balance overrides, signed speeds and animation selection')

# Native training phase 4 -> 5 -> 6, with actual selector, initialization,
# shared command attachment and selected-person release. Only the same world
# consumers above and command target preparation remain intercepted.
def prepare_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);id_,model,data=struct.unpack('<III',cpu.mem_read(sp+4,12))
    a,b=struct.unpack('<HH',cpu.mem_read(data,4));actions.append(['prepare',model&255,a,b])
    write(0x938830+(id_&65535)*10,'<B',model&255);write(0x938830+(id_&65535)*10+6,'<HH',a,b)
    cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,struct.unpack('<I',cpu.mem_read(sp,4))[0]);cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,prepare_leaf,begin=0x438730,end=0x438730)
cases=[];expected=[]
startup_case={}
for trial in range(128):
    people=[]
    for i in range(7):
        u={key:0 for key in fields};model=2 if i<5 else 3 if i==5 else 7
        u.update(id=i+1,model=model,state=17,previousState=10,physics={2:2,3:14,7:18}[model],tribe=0,
            x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(2048),assignment=(i%7)<<12,
            speed=64,cargo=trial%2,commands=[0]*8,motionTimer=123,motionMode=3)
        people.append(u)
    c=dict(person=people[0],people=people,orders=[],randomState=rng.getrandbits(32),facingFlags=trial%4*8,
        tribes=[dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(2048),selectedCount=0,flags=64) for _ in range(4)],requested=1+trial%5)
    fixture(c);write(0x89d17c,'<I',0);write(0x96aa78,'<HH',1,0)
    for i,u in enumerate(people):
        a=p+i*256;cpu.mem_write(a,bytes(256));write(a+0x24,'<H',u['id']);write(a+0x2a,'<B',1)
        for key,(offset,fmt) in fields.items():write(a+offset,'<'+fmt,u[key])
        write(a+0x8b,'<8H',*u['commands']);write(0x890390+u['id']*4,'<I',a);write(a+8,'<I',a+256 if i<6 else 0)
    write(tribes+0x881,'<I',p)
    building=p+1024+100*256;write(building+0x2b,'<BB',7,2)
    task=tribes+0x36;write(task+0x3e,'<I',1);write(task+0x4f,'<B',6);write(task+0x42,'<H',4)
    write(task+0x32,'<I',100);write(task+8,'<i',c['requested']);write(tribes+0x596,'<I',2);write(tribes+0x5b3,'<B',0)
    for _ in range(3):call(0x4c8490,tribes,0)
    out=snapshot(c);out.pop('person');out['people']=[read_person(p+i*256) for i in range(7)]
    out.update(phase=struct.unpack('<H',cpu.mem_read(task+0x42,2))[0],selected=struct.unpack('<i',cpu.mem_read(task+4,4))[0],
        remaining=struct.unpack('<i',cpu.mem_read(task+8,4))[0],flags=struct.unpack('<I',cpu.mem_read(tribes+0x596,4))[0],
        owner=cpu.mem_read(tribes+0x5b3,1)[0],pool=bytes(cpu.mem_read(0x938830,8000)).hex(),
        cursor=struct.unpack('<H',cpu.mem_read(0x96aa78,2))[0],active=struct.unpack('<H',cpu.mem_read(0x96aa7a,2))[0])
    cases.append(c);expected.append(out)
js="""import {initializePersonState,reserveTrainingPerson,releaseSelectedPeople} from './app/person-state.ts';import {startPersonOrders} from './app/person-order-start.ts';
import {createComputerQueue,stepTrainingTask} from './app/computer.ts';import {selectComputerPeople} from './app/computer-selection.ts';
import {emptyPersonOrder,queuePersonOrder,commitPersonOrders} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const people=c.people,actions=[],pool={records:Array.from({length:800},emptyPersonOrder),cursor:1,active:0};
const w={randomState:c.randomState,instantFacing:!!c.facingFlags,levelFlags:0,tribes:c.tribes,orders:pool};
const effects={deselectPassengers:()=>{throw Error('uncovered passengers');},rebuildTrainingQueue:id=>actions.push(['training',id]),rebuildFormation:cell=>actions.push(['formation',cell]),releaseMotion:()=>actions.push(['motion']),startOrders:p=>startPersonOrders(w,p,startEffects),setAnimation:(_,id)=>actions.push(['animation',id&65535])};
const group={records:Array.from({length:8},emptyPersonOrder),count:0,cursor:0},unexpected=()=>{throw Error('uncovered order effect');};
const orderEffects={prepare:(o,model,a,b)=>{actions.push(['prepare',model,a,b]);Object.assign(o,{model,a,b});},stopWork:unexpected,releaseSpell:unexpected,deleteObject:unexpected,releaseFight:unexpected};
const startEffects={setAnimation:effects.setAnimation,setDestination:(_,x,y)=>actions.push(['destination',x,y]),commandPosition:unexpected,allowVehicleOrder:unexpected,initializeCommand:unexpected,
adjacentBuilding:(_,model)=>{actions.push(['adjacent',model]);return 0;},canStayForTarget:unexpected,leaveBuilding:()=>actions.push(['leave']),resetVehicleMovement:unexpected,leaveSelectedVehicle:unexpected,initializeState:unexpected};
for(const p of people)Object.assign(p,{class:1,driver:0,busy:0,inside:0});
const units=new Map(people.map(p=>[p.id,p]));units.set(100,{class:2,model:7,state:2,flags2:0,inside:0});
const selection={people,units,orders:new Map(),tribes:c.tribes.map(()=>({hasBase:false,base:0,shaman:0,radius:0})),buildingAt:()=>0};
const ai=createComputerQueue();ai.flags=2;ai.selectionOwner=0;const t=ai.tasks[0];Object.assign(t,{flags:1,type:6,phase:4,target:100,remaining:c.requested});
const b={id:100,owner:0,state:2,model:7,capacity:5,inside:0,occupants:[]};
for(let i=0;i<3;i++)for(const action of stepTrainingTask(ai,0,b,{tribe:0,preference:0,population:7,trained:1,committed:0,maximum:5,select:(_,n)=>selectComputerPeople(selection,2,2,100,1,0,6,n)})){
 if(action.kind==='select')reserveTrainingPerson(w,units.get(action.id),effects);
 else if(action.kind==='train'){queuePersonOrder(group,8,action.id,0);commitPersonOrders(pool,group,people,[-1,-1,-1],orderEffects);releaseSelectedPeople(w,people,14,effects);}
 else throw Error('unexpected training action');}
for(const p of people){delete p.class;delete p.driver;delete p.busy;delete p.inside;}
const bytes=Buffer.alloc(8000);pool.records.forEach((o,i)=>{const a=i*10;bytes.writeUInt8(o.model,a);bytes.writeUInt8(o.flags,a+1);['references','object','a','b'].forEach((k,j)=>bytes.writeUInt16LE(o[k],a+2+j*2));});
return {people,tribes:w.tribes,randomState:w.randomState,actions,phase:t.phase,selected:t.selected,remaining:t.remaining,flags:ai.flags,owner:ai.selectionOwner,pool:bytes.toString('hex'),cursor:pool.cursor,active:pool.active};})));"""
actual=browser(js,cases);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        path=Path('/private/tmp/populous-training-handoff-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(path),[k for k in a if a[k]!=b[k]]))
print('PASS: 128 native training handoffs through selection, state initialization, shared orders, release and actual order startup; world consumers supplied')
