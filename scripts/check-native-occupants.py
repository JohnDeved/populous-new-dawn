"""Compare building admission, occupancy flags, order cleanup and training costs.
Usage: python scripts/check-native-occupants.py /path/to/d3dpoptb.exe
Admission, slot scans, conversion weights, cost arithmetic, visibility flags and
command reference release run natively. Transport/cell/tower/indicator consumers
and construction-plan exit geometry are supplied; this does not prove native pathfinding.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,load_native_shapes
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));cpu.mem_map(0x2000000,0x40000)
cpu.mem_map(0x2040000,0x10000);load_native_shapes(cpu,Path(sys.argv[1]),0x2040000,0x2043000)
base,stack,stop=0x2000000,0x203d000,0x203e000
rng=random.Random(0x407150);actions=[];current=None

def addr(id_):return base+id_*256 if id_ else 0
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
fields={'homeX':(0x68,'H'),'homeY':(0x6a,'H'),'formationSlot':(0x82,'B'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),'facingAngle':(0x5d,'H'),
 'physics':(0x30,'B'),'speed':(0x5f,'h'),'cargo':(0x78,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'tickPhase':(0x2e,'B'),
 'commandAux':(0xa9,'B'),'commandPhase':(0xaa,'B'),'animationMode':(0xa8,'B'),'selectionFlags':(0x7a,'B'),'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),
 'tribe':(0x2f,'b'),'x':(0x3d,'H'),'y':(0x3f,'H'),'height':(0x41,'H'),'velocityX':(0x43,'h'),'velocityY':(0x45,'h'),'velocityZ':(0x47,'h'),
 'clip':(0x1c,'H'),'renderFlags':(0x35,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),
 'assignment':(0x76,'H'),'commandCursor':(0xa6,'B'),'immediateCommand':(0x9b,'H'),
 'orderLocation':(0x83,'H'),'commandStatus':(0xa7,'B'),'workTarget':(0x89,'H'),'vehicle':(0x9f,'H')}
bfields={'lastActivity':(0x7e,'I'),'queueHead':(0xa2,'H'),'queueFrom':(0xac,'B'),'entryDelay':(0xab,'B'),'entryTimer':(0xae,'B'),'entering':(0xad,'B'),
 'object':(0x33,'h'),'angle':(0x26,'H'),'anchorX':(0x7a,'H'),'anchorY':(0x7c,'H'),'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'tribe':(0x2f,'b'),
 'flags2':(0xc,'I'),'flags3':(0x14,'I'),'activity':(0x9c,'H'),'inside':(0xa6,'B'),
 'trainingTimer':(0x9a,'H'),'trainingCost':(0x96,'H')}
def fixture(c):
    global actions,current
    current=c;actions=[];cpu.mem_write(base,bytes(0x30000));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x938830,bytes(8000));cpu.mem_write(0x89d1c8,bytes(4*0xc65))
    for p in c['people']:
        a=addr(p['id']);write(0x890390+p['id']*4,'I',a)
        for key,(off,fmt) in fields.items():write(a+off,fmt,p[key])
        write(a+0x8b,'8H',*p['commands'])
    b=c['building'];a=addr(b['id']);write(0x890390+b['id']*4,'I',a)
    for key,(off,fmt) in bfields.items():write(a+off,fmt,b[key])
    write(a+0x86,'6H',*b['occupants'])
    for i,o in enumerate(c['orders']):write(0x938830+i*10,'BB4H',o['model'],o['flags'],o['references'],o['object'],o['a'],o['b'])
    write(0x96aa7a,'H',c['active']);write(0x96eace,'B',c['towerTribes'])
    write(0x89d188,'I',c['turn']);cpu.mem_write(0x8a03e4,bytes(128*128*16))
    write(addr(101)+0x24,'H',101);write(addr(101)+0x2a,'B',c['otherClass']);write(0x890390+101*4,'I',addr(101))
    for p in c['people']:write(0x8a03ec+((p['y']>>9)*128+(p['x']>>9))*16,'H',c['terrainBuilding'])
    for i,t in enumerate(c['tribes']):
        a=0x89d1c8+i*0xc65;write(a+0xa27,'9h',*t['personCounts']);write(a+0xc1f,'B',t['playerType'])
        write(a+0x885,'I',addr(t['buildingIds'][0]) if t['buildingIds'] else 0)
def snapshot(c,result):
    people=[{**{key:read(addr(p['id'])+off,fmt) for key,(off,fmt) in fields.items()},'commands':list(struct.unpack('<8H',cpu.mem_read(addr(p['id'])+0x8b,16)))} for p in c['people']]
    b={key:read(addr(100)+off,fmt) for key,(off,fmt) in bfields.items()};b['occupants']=list(struct.unpack('<6H',cpu.mem_read(addr(100)+0x86,12)))
    orders=[dict(zip(['model','flags','references','object','a','b'],struct.unpack('<BB4H',cpu.mem_read(0x938830+i*10,10)))) for i in range(len(c['orders']))]
    return dict(people=people,building=b,orders=orders,active=read(0x96aa7a,'H'),towerTribes=read(0x96eace,'B'),actions=copy.deepcopy(actions),result=result)
def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);a,b,d=struct.unpack('<III',cpu.mem_read(sp+4,12));result=0
    id_=read(a+0x24,'H') if address!=HEIGHT else 0
    if address==0x466c80:actions.append(['vehicle',id_])
    elif address==0x40a3f0:
        actions.append(['adjacent',id_,b]);result=addr(current['tower' if b==4 else 'special'])
    elif address==0x404540:
        actions.append(['tower',id_]);write(d,'3H',1234,4321,0);result=321
    elif address==HEIGHT:
        actions.append(['height',a&65535,b&65535]);result=65400
    elif address==MOVE:
        x,y,h=struct.unpack('<3H',cpu.mem_read(b,6));actions.append(['move',id_,x,y,h]);write(a+0x3d,'3H',x,y,h)
    elif address==INSERT:actions.append(['insert',id_])
    elif address==0x4ee4f0:actions.append(['remove',id_])
    elif address==0x4b9fc0:actions.append(['plan',id_]);write(b,'HH',3072,4096)
    elif address==0x40c4e0:actions.append(['indicator',id_])
    elif address==0x4d4040:actions.append(['animation',id_,b&65535])
    elif address in ORDER_LEAVES:actions.append([ORDER_LEAVES[address],id_])
    else:raise AssertionError(hex(address))
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
# Use the same reviewed order cleanup leaves as check-native-orders.py.
HEIGHT,MOVE,INSERT=0x44e940,0x4ee580,0x4ee470
ORDER_LEAVES={0x51ff40:'work',0x4ef180:'delete',0x4d4f40:'fight'}
for a in [0x466c80,0x40a3f0,0x404540,HEIGHT,MOVE,INSERT,0x4ee4f0,0x4b9fc0,0x40c4e0,0x4d4040,*ORDER_LEAVES]:
    cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)

def case():
    people=[]
    for id_ in range(1,8):
        p={key:0 for key in fields};p.update(id=id_,model=2,state=10,tribe=0,commands=[id_,0,0,0,0,0,0,0],workTarget=100,x=1000,y=2000);p['class']=1;people.append(p)
    b={key:0 for key in bfields};b.update(id=100,model=7,activity=8,occupants=[0]*6);b['class']=2
    orders=[dict(model=8,flags=0,references=1,object=100,a=100,b=0) for _ in range(8)];orders[0]=dict(model=0,flags=0,references=0,object=0,a=0,b=0)
    return dict(people=people,building=b,orders=orders,active=7,towerTribes=rng.randrange(256),turn=12345,terrainBuilding=0,otherClass=1,
        tribes=[dict(personCounts=[0]*9,playerType=2,buildingIds=[100]) for _ in range(4)],tower=0,special=0)
js_prefix="""import {stepTrainingPerson} from './app/training.ts';import {enterBuilding,removeBuildingOccupant,leaveBuilding,repriceTraining,setPersonOccupancy,trainingOccupantWeight,nativeTrainingCost} from './app/building-occupants.ts';
let s='';for await(const c of process.stdin)s+=c;const result=JSON.parse(s).map(c=>{
const actions=[],b=c.building,w={people:new Map(c.people.map(p=>[p.id,p])),orders:{records:c.orders,cursor:1,active:c.active},towerTribes:c.towerTribes,tribes:c.tribes,
 turn:c.turn,buildingAt:()=>c.terrainBuilding,buildings:new Map([[b.id,b],[101,{...b,id:101,class:c.otherClass,inside:0,occupants:[0,0,0,0,0,0]}]])};
const effects={orders:{prepare:()=>{throw Error('unexpected prepare')},stopWork:p=>{if(p.workTarget===100)actions.push(['work',100]);},releaseSpell:()=>{throw Error('uncovered spell cancellation')},
 deleteObject:id=>actions.push(['delete',id]),releaseFight:p=>actions.push(['fight',p.id])},leaveVehicle:p=>actions.push(['vehicle',p.id]),
 adjacentBuilding:(p,model)=>{actions.push(['adjacent',p.id,model]);return model===4?c.tower:c.special;},towerPosition:id=>{actions.push(['tower',id]);return {x:1234,y:4321,clip:321};},
 terrainHeight:(x,y)=>{actions.push(['height',x&65535,y&65535]);return 65400;},moveToCell:(p,x,y,h)=>{actions.push(['move',p.id,x,y,h]);p.x=x;p.y=y;p.height=h;},
 insertCell:p=>actions.push(['insert',p.id]),removeCell:p=>actions.push(['remove',p.id]),updateIndicator:b=>actions.push(['indicator',b.id]),
 planExitPoint:b=>{actions.push(['plan',b.id]);return {x:3072,y:4096};}};
const snapshot=result=>({people:c.people,building:b,orders:w.orders.records,active:w.orders.active,towerTribes:w.towerTribes,actions:structuredClone(actions),result});
"""
def compare(cases,expected,js,label):
    r=subprocess.run(['node','--input-type=module','-e',js_prefix+js+'});console.log(JSON.stringify(result));'],input=json.dumps(cases),text=True,capture_output=True,cwd=root)
    assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            path=Path('/private/tmp/populous-occupant-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((label,i,str(path)))
    print(f'PASS: {len(cases)} native {label}')

cases=[];expected=[]
for trial in range(1728):
    c=case();model=trial%9;count=rng.choice([-32768,-1,0,3,4,7,8,11,12,15,16,20,21,32767]);amount=rng.choice([0,1,2,3,7,127,65535,2147483647,-1,-2147483648]);kind=trial%4
    c.update(model=model,count=count,amount=amount,kind=kind);c['tribes'][0]['personCounts'][model]=count;c['tribes'][0]['playerType']=kind
    fixture(c);call(0x41b0c0,addr(100),base,model,amount);value=read(base,'i');cases.append(c);expected.append(value)
compare(cases,expected,'return nativeTrainingCost(c.count,c.model,c.kind,c.amount);','training-cost calculations across every person model, tribe type, population band and signed overflow')

cases=[];expected=[]
for trial in range(1024):
    c=case();b=c['building'];b.update(model=trial%20,inside=rng.choice([0,1,5,128,255]),occupants=[rng.choice([0,2,3,4,5,6,7]) for _ in range(6)])
    for p in c['people']:p.update(model=rng.randrange(9),flags2=rng.choice([0,0,1]),tribe=rng.randrange(4));p['class']=rng.choice([0,1,1,2])
    fixture(c);value=call(0x408d20,addr(100));cases.append(c);expected.append(value if value<2**31 else value-2**32)
compare(cases,expected,'return trainingOccupantWeight(w,b);','occupant conversion-weight scans (no supplied leaves)')

cases=[];expected=[]
for trial in range(2048):
    c=case();p=c['people'][0];c['mode']=[0,1,2,3,4,255,256][trial%7]
    p.update(model=trial%9,flags2=rng.getrandbits(32),flags3=rng.getrandbits(32),flags4=rng.getrandbits(32),
      assignment=rng.randrange(65536),renderFlags=rng.randrange(65536),height=rng.randrange(65536),clip=rng.randrange(65536),
      velocityX=rng.randrange(-32768,32768),velocityY=rng.randrange(-32768,32768),velocityZ=rng.randrange(-32768,32768),
      commandCursor=rng.randrange(8),immediateCommand=rng.choice([0,0,2]),orderLocation=rng.randrange(65536),commandStatus=8,
      commands=[rng.choice([0,1,1,2]) for _ in range(8)],state=rng.choice([10,33,14]),substate=rng.choice([0,1,3]))
    c['tower']=rng.choice([0,0,100]);c['special']=rng.choice([0,100]);c['orders'][1]['model']=rng.choice([7,8,19,21]);c['orders'][2]['flags']=trial%2
    for i,o in enumerate(c['orders']):o['references']=sum(p['commands'].count(i)+(p['immediateCommand']==i) for p in c['people']) if i else 0
    c['active']=sum(o['references']>0 for o in c['orders'])
    fixture(c);call(0x4d80e0,addr(1),c['mode']);cases.append(c);expected.append(snapshot(c,0))
compare(cases,expected,'setPersonOccupancy(w,c.people[0],c.mode,effects);return snapshot(0);','occupancy-mode transitions, visibility, tower placement and actual command reference cleanup; spatial/transport leaves supplied')

cases=[];expected=[]
for trial in range(3072):
    c=case();b=c['building'];p=c['people'][0]
    b.update(model=trial%20,tribe=trial%4,inside=rng.choice([0,1,3,4,5,6,127,128,255]),activity=rng.choice([8,8,8,0x1488,0]),
      flags3=rng.getrandbits(32),trainingTimer=rng.randrange(65536),trainingCost=rng.randrange(65536),occupants=[rng.choice([0,0,2,3,4,5,6,7]) for _ in range(6)])
    c['tower']=100 if b['model']==4 else 0;c['special']=100 if b['model']==19 else 0
    for person in c['people']:
        person.update(model=rng.randrange(9),tribe=rng.choice([b['tribe'],b['tribe'],(b['tribe']+1)%4]),flags2=rng.choice([0,0,1,0x20000]),
          flags4=rng.getrandbits(32),assignment=rng.randrange(65536),renderFlags=rng.randrange(65536),orderLocation=rng.randrange(65536))
        person['class']=rng.choice([0,1,1,2])
    p.update(model=trial%9,tribe=b['tribe'] if trial%3 else (b['tribe']+1)%4)
    for t in c['tribes']:t.update(playerType=rng.randrange(4),personCounts=[rng.choice([0,3,4,7,8,11,12,15,16,20,21,32767]) for _ in range(9)])
    fixture(c);value=call(0x407150,addr(1),addr(100))&255;cases.append(c);expected.append(snapshot(c,value))
compare(cases,expected,'return snapshot(enterBuilding(w,c.people[0],b,effects));','building admissions with actual occupancy modes, weights and cost calculation; world consumers supplied')

# Compose the real command dispatcher with the real entry/occupancy/weight/cost
# routines. Ordinary training ends in the stopped interior state; do not invoke
# the next command tick after a completed ordinary-hut order.
cases=[];expected=[]
for trial in range(256):
    c=case();b=c['building'];p=c['people'][0]
    b.update(model=[1,4,5,6,7,8,9,19][trial%8],tribe=trial%4,inside=0,occupants=[0]*6,activity=8)
    p.update(substate=5,tribe=b['tribe'],model=trial%9,goalX=p['x'],goalY=p['y'],physics=2,speed=70,selectionFlags=1)
    c['tower']=100 if b['model']==4 else 0;c['special']=100 if b['model']==19 else 0
    fixture(c);out=[]
    for _ in range(2):
        value=call(0x434610,addr(1))&255;out.append(snapshot(c,value))
        if value:break
    cases.append(c);expected.append(out)
compare(cases,expected,"""const unexpected=()=>{throw Error('unexpected world consumer')};
const training={setAnimation:(p,id)=>actions.push(['animation',p.id,id&65535]),releaseMotion:unexpected,adjacentBuilding:unexpected,
 setDestination:unexpected,directDestination:unexpected,dropCargo:unexpected,workInside:unexpected,enterBuilding:(p,b)=>enterBuilding(w,p,b,effects)};
w.buildings=new Map([[b.id,b]]);w.randomState=1;const out=[];
for(let i=0;i<2;i++){const value=stepTrainingPerson(w,c.people[0],training);out.push(structuredClone(snapshot(value)));if(value)break;}return out;""",
 'combined training-command admission and interior-stop scenarios; no entry, occupancy, weight, cost or order-cleanup leaves supplied')

cases=[];expected=[]
for trial in range(3072):
    c=case();b=c['building'];c['op']=trial%3;c['person']=rng.choice([0,1,2,3,7]);c['nullBuilding']=trial%11==0
    c['terrainBuilding']=rng.choice([0,0,100,101,1024,1124,1125]);c['otherClass']=rng.choice([0,1,2]);c['turn']=rng.getrandbits(32)
    b.update(model=trial%20,tribe=trial%4,inside=rng.choice([0,1,3,5,6,127,128,255]),flags2=rng.choice([0,1]),
      flags3=rng.getrandbits(32),activity=rng.randrange(65536),trainingTimer=rng.randrange(65536),trainingCost=rng.randrange(65536),
      object=rng.choice([79,95,103,131,154]),angle=(trial%4)*512,anchorX=rng.randrange(128)*512,anchorY=rng.randrange(128)*512,
      occupants=[rng.choice([0,1,2,3,4,5,6,7]) for _ in range(6)],entryDelay=rng.randrange(256),lastActivity=rng.getrandbits(32))
    b['class']=rng.choice([2,2,2,9])
    for p in c['people']:
        p.update(model=rng.randrange(9),tribe=b['tribe'],flags2=rng.getrandbits(32),flags4=rng.getrandbits(32),
          assignment=rng.randrange(65536),renderFlags=rng.randrange(65536),x=rng.choice([0,32767,32768,65535]),y=rng.randrange(65536),
          homeX=rng.randrange(65536),homeY=rng.randrange(65536),formationSlot=rng.randrange(256),angle=rng.randrange(2048),
          turnAngle=rng.randrange(2048),facingAngle=rng.randrange(2048))
        p['class']=rng.choice([0,1,1,2])
    for t in c['tribes']:t['buildingIds']=rng.choice([[],[100]])
    if c['op']==2:b['model']=rng.choice([5,6,7,8,9])
    fixture(c)
    if c['op']==0:
        value=call(0x407490,0 if c['nullBuilding'] else addr(100),addr(c['person']));value=read(value+0x24,'H') if value else 0
    elif c['op']==1:call(0x409ed0,addr(c['person'] or 1));value=0
    else:call(0x40bbe0,addr(100));value=0
    cases.append(c);expected.append(snapshot(c,value))
compare(cases,expected,"""let value=0;if(c.op===0)value=removeBuildingOccupant(w,c.nullBuilding?undefined:b,w.people.get(c.person),effects)?.id||0;
else if(c.op===1)leaveBuilding(w,w.people.get(c.person||1),effects);else repriceTraining(w,b);return snapshot(value);""",
 'occupant removals, containing-building lookup and repricing, including signed counts, map seams and construction-plan exits; only plan geometry and existing spatial/transport/indicator leaves supplied')
