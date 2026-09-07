"""Compare native training queues and the complete command-8 substate dispatcher.
Usage: python scripts/check-native-training-queue.py /path/to/d3dpoptb.exe
Queue operations execute without intercepted leaves. Controller cases supply
path requests, animation output, cargo, occupant entry and inside work;
geometry, queue mutations, facing math, speed/RNG and stopping execute natively.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,load_native_shapes
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x40000)
configure_native_constants(cpu, Path(sys.argv[1]))
# Load original object/shape data; relocation is independently CPU-checked by
# check-native-building-shapes.py. These buffers survive per-case world resets.
cpu.mem_map(0x2040000,0x10000)
load_native_shapes(cpu, Path(sys.argv[1]), 0x2040000, 0x2043000)
base,stack,stop=0x2000000,0x203d000,0x203e000
rng=random.Random(0x434610);actions=[]
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def addr(id_):return base+id_*256 if id_ else 0
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),
 'tickPhase':(0x2e,'B'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),
 'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),
 'selectionFlags':(0x7a,'B'),'commandCursor':(0xa6,'B'),'immediateCommand':(0x9b,'H'),
 'workTarget':(0x89,'H'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'target':(0x72,'h'),
 'reservationNext':(0x85,'H'),'cargo':(0x78,'H'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'facingAngle':(0x5d,'H'),'commandPhase':(0xaa,'B'),'commandAux':(0xa9,'B')}
bfields={'object':(0x33,'h'),'angle':(0x26,'H'),'anchorX':(0x7a,'H'),'anchorY':(0x7c,'H'),'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),
 'activity':(0x9c,'H'),'queueHead':(0xa2,'H'),'queueFrom':(0xac,'B'),'inside':(0xa6,'B'),
 'entering':(0xad,'B'),'entryDelay':(0xab,'B'),'entryTimer':(0xae,'B')}
def person(id_,**kw):
    p={key:0 for key in fields};p.update(id=id_,model=2,state=10,substate=3,physics=2,flags3=32,
      reservationNext=id_+1 if id_<4 else 0,commands=[id_,0,0,0,0,0,0,0],target=100,workTarget=100,timer=256)
    p['class']=1;p.update(kw);return p
def fixture(c):
    global actions
    actions=[];cpu.mem_write(base,bytes(0x30000));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x938830,bytes(8000))
    for p in c['people']:
        a=addr(p['id']);write(0x890390+p['id']*4,'I',a)
        for key,(off,fmt) in fields.items():write(a+off,fmt,p[key])
        write(a+0x8b,'8H',*p['commands'])
    b=c['building'];a=addr(b['id']);write(0x890390+b['id']*4,'I',a)
    for key,(off,fmt) in bfields.items():write(a+off,fmt,b[key])
    for id_,o in c['orders']:write(0x938830+id_*10,'BB4H',o['model'],o['flags'],1,0,o['a'],0)
    write(0x89d178,'I',c['randomState'])
def snapshot(c,result):
    people=[{**{key:read(addr(p['id'])+off,fmt) for key,(off,fmt) in fields.items()},
      'commands':list(struct.unpack('<8H',cpu.mem_read(addr(p['id'])+0x8b,16)))} for p in c['people']]
    return dict(people=people,building={key:read(addr(c['building']['id'])+off,fmt) for key,(off,fmt) in bfields.items()},
      randomState=read(0x89d178,'I'),actions=copy.deepcopy(actions),result=result)
def case():
    b={key:0 for key in bfields};b.update(id=100,model=5,object=95,activity=8,queueHead=1,inside=5);b['class']=2
    return dict(people=[person(i) for i in range(1,5)],building=b,
      orders=[[i,dict(model=8,flags=0,a=100)] for i in range(1,5)],randomState=rng.getrandbits(32),
      adjacent=0,workResult=0)
js_prefix="""import {trainingQueuePerson,trainingQueuePredecessor,appendTrainingQueue,rebuildTrainingQueue,stepTrainingPerson} from './app/training.ts';
import {emptyPersonOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
const result=JSON.parse(s).map(c=>{const records=Array.from({length:800},emptyPersonOrder);for(const [id,o] of c.orders)Object.assign(records[id],o);
const w={randomState:c.randomState,orders:{records,cursor:1,active:0},people:new Map(c.people.map(p=>[p.id,p])),buildings:new Map([[c.building.id,c.building]])},b=c.building,actions=[];
const snapshot=result=>({people:c.people,building:b,randomState:w.randomState,actions:structuredClone(actions),result});
"""
def compare(cases,expected,js,label):
    r=subprocess.run(['node','--input-type=module','-e',js_prefix+js+'});console.log(JSON.stringify(result));'],
      input=json.dumps(cases),text=True,capture_output=True,cwd=root)
    assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            path=Path('/private/tmp/populous-training-queue-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2))
            raise AssertionError((label,i,str(path)))
    print(f'PASS: {len(cases)} native {label}')

cases=[];expected=[]
for trial in range(1536):
    c=case();c['op']=trial%4;c['index']=rng.choice([-7,-1,0,1,2,3,4,9]);c['person']=rng.randrange(1,5)
    c['building']['queueHead']=rng.choice([0,1,1,1,2,4]);c['building']['activity']=rng.randrange(65536)
    for p in c['people']:
        p['class']=rng.choice([0,1,1,1,2]);p['flags2']=rng.choice([0,0,0,1]);p['substate']=rng.choice([0,3,3,6])
        p['state']=rng.choice([10,14,3]);p['flags3']=rng.getrandbits(32)
        p['immediateCommand']=rng.choice([0,0,0,4])
    for _,o in c['orders']:o.update(model=rng.choice([8,8,6]),flags=rng.choice([0,0,1]),a=rng.choice([100,100,101]))
    if c['op']==2:
        c['person']=5;c['people'].append(person(5,reservationNext=42));c['orders'].append([5,dict(model=8,flags=0,a=100)])
    fixture(c)
    if c['op']==0:result=call(0x409580,addr(100))
    elif c['op']==1:
        result=call(0x409c50,addr(100),c['index']);result=read(result+0x24,'H') if result else 0
    elif c['op']==2:result=call(0x409b10,addr(c['person']),addr(100))
    else:
        result=call(0x409bd0,addr(c['person']),addr(100));result=read(result+0x24,'H') if result else 0
    cases.append(c);expected.append(snapshot(c,result))
# Exercise the byte clamp on the first removed position, using a valid long list.
for length in [255,256,257,300]:
    c=case();c.update(op=0,index=0,person=1)
    c['people']=[person(i,commands=[1,0,0,0,0,0,0,0],reservationNext=i+1 if i<length else 0) for i in range(1,length+1) if i!=100]
    # The building has its own unit id; skip it in the linked list.
    c['people'][98]['reservationNext']=101;c['people'][-1]['substate']=6
    fixture(c);result=call(0x409580,addr(100));cases.append(c);expected.append(snapshot(c,result))
compare(cases,expected,"""let value;if(c.op===0)value=rebuildTrainingQueue(w,b);else if(c.op===1)value=trainingQueuePerson(w,b,c.index)?.id||0;
else if(c.op===2)value=appendTrainingQueue(w,b,w.people.get(c.person));else value=trainingQueuePredecessor(w,b,w.people.get(c.person))?.id||0;
return snapshot(value);""",'queue pruning, lookup, append and predecessor calls (no supplied leaves)')

# Supply world consumers only; native geometry, queue, speed/recovery/stop and angle leaves run.
current=None
def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);a,b,d=struct.unpack('<III',cpu.mem_read(sp+4,12));result=0
    if address in [0x4e9d80,0x4e9dd0]:
        x,y=struct.unpack('<hh',cpu.mem_read(b,4));write(a+0x4f,'HH',x&65535,y&65535)
        actions.append(['direct' if address==0x4e9dd0 else 'destination',read(a+0x24,'H'),x,y])
    elif address==0x4d4040:actions.append(['animation',read(a+0x24,'H'),b&65535])
    elif address==0x4ea460:actions.append(['motion',read(a+0x24,'H')])
    elif address==0x40a3f0:actions.append(['adjacent',read(a+0x24,'H')]);result=addr(current['adjacent'])
    elif address==0x4d58c0:actions.append(['cargo',read(a+0x24,'H')]);write(a+0x78,'H',0)
    elif address==0x407150:actions.append(['enter',read(a+0x24,'H'),read(b+0x24,'H')])
    elif address==0x4da5b0:actions.append(['work',read(a+0x24,'H')]);result=current['workResult']
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4e9d80,0x4e9dd0,0x4d4040,0x4ea460,0x40a3f0,0x4d58c0,0x407150,0x4da5b0]:
    cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
cases=[];expected=[]
for trial in range(2688):
    c=case();p=c['people'][0];b=c['building'];substate=trial%14
    p.update(substate=substate,tickPhase=rng.choice([0,0,1,2,15,16,255]),commandAux=rng.choice([0,0,1,2,255]),
      commandPhase=rng.choice([0,1,127,128,255]),speed=rng.choice([0,0,70]),timer=rng.choice([-32768,0,1,2,256,32767]),
      flags2=rng.choice([0,0,0,4,0x80,0x2000,0x8000,0x80000,0x800000]),flags3=rng.choice([0,32,32,0x80020]),
      flags4=rng.choice([0,0,2,0x400,0x800,0x10007]),assignment=rng.randrange(65536),cargo=rng.choice([0,100,200]),
      selectionFlags=rng.randrange(256),physics=trial%20,model=trial%9,x=rng.choice([1000,32760,32768,65530]),y=1000)
    b.update(model=rng.choice([1,4,5,5,6,7,8,9,13,16,19]),inside=rng.choice([0,1,4,5,6,127,128,255]),
      entering=rng.choice([0,1,4,5,6,127,128,255]),entryDelay=rng.choice([0,0,1,16]),
      activity=rng.choice([8,8,8,0x2008,0]),queueFrom=rng.randrange(5),flags3=rng.choice([0,64]))
    if substate in [0,1,2,4,5,6,7,8,9,10,11,12,13]:b['queueHead']=rng.choice([0,2,2])
    c['adjacent']=rng.choice([0,0,100]);c['workResult']=trial%2
    delta=rng.choice([0,0,11,12,111,112,1335,1336,-12,-112])
    p['goalX']=(p['x']+delta)&65535;p['goalY']=(p['y']+rng.choice([0,11,12,112,1336]))&65535
    b.update(object=rng.choice([79,95,103,131,154]),angle=(trial%4)*512,anchorX=p['x']&0xfe00,anchorY=p['y']&0xfe00)
    for other in c['people'][1:]:other.update(commandPhase=other['id']-1,x=1000,y=1000,goalX=1000,goalY=1000,model=rng.choice([2,3,4]))
    c['ticks']=[1];fixture(c);current=c;result=call(0x434610,addr(1))&255
    cases.append(c);expected.append([snapshot(c,result)])
# Sequential handoff: a specialist yields its queue position, then both followers
# receive the delayed position update; opening capacity releases the new head.
c=case();c['building'].update(model=5,inside=5);c['people'][0].update(model=4,speed=0,x=256,y=64384,goalX=256,goalY=64384)
for p in c['people'][1:]:p.update(commandPhase=p['id']-1,x=256,y=64384,goalX=256,goalY=64384)
c['ticks']=[1,2,1,2,1,2];c['openAt']=3;fixture(c);current=c;out=[]
for i,id_ in enumerate(c['ticks']):
    if i==c['openAt']:write(addr(100)+0xa6,'B',0)
    result=call(0x434610,addr(id_))&255;out.append(snapshot(c,result))
cases.append(c);expected.append(out)
compare(cases,expected,"""const destination=(kind,p,x,y)=>{actions.push([kind,p.id,x,y]);p.goalX=x&65535;p.goalY=y&65535;};
const effects={setAnimation:(p,id)=>actions.push(['animation',p.id,id&65535]),releaseMotion:p=>actions.push(['motion',p.id]),
 adjacentBuilding:p=>{actions.push(['adjacent',p.id]);return c.adjacent;},
 setDestination:(p,x,y)=>destination('destination',p,x,y),directDestination:(p,x,y)=>destination('direct',p,x,y),
 dropCargo:p=>{actions.push(['cargo',p.id]);p.cargo=0;},enterBuilding:(p,b)=>actions.push(['enter',p.id,b.id]),workInside:p=>{actions.push(['work',p.id]);return c.workResult;}};
return c.ticks.map((id,i)=>{if(i===c.openAt)b.inside=0;const value=stepTrainingPerson(w,w.people.get(id),effects);return structuredClone(snapshot(value));});""",
 'command-8 scenarios (all 14 substates, original geometry and sequential queue handoff; remaining world consumers supplied)')
