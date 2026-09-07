"""Compare native follower selection including actual eligibility/distance leaves.
Usage: python scripts/check-native-selection.py /path/to/d3dpoptb.exe
The selector comparisons intercept no native calls. Combined training cases
intercept person initialization/restoration only. Fixtures provide original
person, command, transport and terrain-cell records in native tribe-list order.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x50000)
units,output,stack,stop=0x2000000,0x2030000,0x204d000,0x204e000
tribes=0x89d1c8;tribe=tribes+0xc65
rng=random.Random(0x4f8490)
def write(p,fmt,*v):cpu.mem_write(p,struct.pack(fmt,*v))
def call(address,*args):
    write(stack,'<'+'I'*(len(args)+1),stop,*[a&0xffffffff for a in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
def entity(id_,class_=1,model=2):
    return dict(id=id_,**{'class':class_},model=model,state=17,tribe=1,x=0,y=0,flags2=0,flags3=0,flags4=0,
                assignment=0,busy=0,vehicle=0,driver=0,inside=0,immediateCommand=0,commands=[0]*8,commandCursor=0)
def fixture(c):
    cpu.mem_write(tribes,bytes(4*0xc65));cpu.mem_write(0x8a03e4,bytes(0x40000));cpu.mem_write(0x890390,bytes(1024*4))
    for i,t in enumerate(c['tribes']):
        p=tribes+i*0xc65;write(p+0xc22,'<B',i);write(p+0x5b4,'<B',t['hasBase'])
        write(p+0x36a,'<H',t['base']);write(p+0x5a2,'<H',t['shaman']);write(p+0x36c,'<B',t['radius'])
    for i,command in c['orders']:
        cpu.mem_write(0x938830+i*10,bytes(10));write(0x938830+i*10,'<BBH',command['model'],command['flags'],1)
    for u in c['units']:
        p=units+u['id']*256;cpu.mem_write(p,bytes(256));write(0x890390+u['id']*4,'<I',p)
        write(p+0x24,'<H',u['id']);write(p+0x2a,'<BBB',u['class'],u['model'],u['state']);write(p+0x2f,'<B',u['tribe'])
        write(p+0x3d,'<HH',u['x'],u['y']);write(p+0xc,'<III',u['flags2'],u['flags4'],u['flags3'])
        write(p+0x76,'<H',u['assignment']);write(p+0xaf,'<B',u['busy']);write(p+0x9f,'<H',u['vehicle']);write(p+0x7a,'<H',u['driver'])
        if u['class']==1:
            write(p+0x8b,'<8H',*u['commands']);write(p+0x9b,'<H',u['immediateCommand']);write(p+0xa6,'<B',u['commandCursor'])
        else:
            write(p+0xa6,'<B',u['inside']);write(p+0x94,'<B',1) # Native landing leaf returns false; both consumer branches are identical.
    for i,id_ in enumerate(c['people']):write(units+id_*256+8,'<I',units+c['people'][i+1]*256 if i+1<len(c['people']) else 0)
    write(tribe+0x881,'<I',units+c['people'][0]*256 if c['people'] else 0)
    for cell,id_ in c['cells']:
        index=((cell&0xfe00)>>9)*128+((cell&254)>>1);write(0x8a03ec+index*16,'<H',id_)

cases=[];expected=[]
def run_case(c):
    fixture(c);available=call(0x4f67b0,tribe)+call(0x4f6730,tribe)
    cpu.mem_write(output,bytes(4096));count=call(0x4f8490,tribe,*c['args'],output)
    selected=[struct.unpack('<H',cpu.mem_read(output+i*4+2,2))[0] for i in range(count)]
    flags=[struct.unpack('<I',cpu.mem_read(units+i*256+0x14,4))[0] for i in c['people']]
    cases.append(c);expected.append(dict(available=available,selected=selected,flags=flags))

for trial in range(768):
    people=[];entities=[];cells={}
    for i in range(6):
        b=entity(180+i,2,rng.randrange(20));b['inside']=rng.randrange(8);b['flags2']=rng.choice([0,0,1]);entities.append(b)
    for i in range(3):
        v=entity(190+i,4,1);v['driver']=rng.choice([0,*range(1,min(trial%48,3)+1)]);v['flags2']=rng.choice([0,0,1]);entities.append(v)
    orders=[[i+1,dict(model=m,flags=i&1)] for i,m in enumerate([0,6,6,8,11,11,25,25,17,17,31,31,32,32])]
    for i in range(1,1+trial%48):
        p=entity(i,1,rng.randrange(1,9));p.update(state=rng.randrange(46),tribe=rng.randrange(4),x=rng.randrange(65536),y=rng.randrange(65536),
            flags2=rng.choice([0,0x800000]),flags3=rng.randrange(4),flags4=rng.choice([0,0,0x800]),
            assignment=(rng.randrange(8)<<12)|rng.choice([0,0,4,0x800,0x804]),busy=rng.randrange(2),vehicle=rng.choice([0,0,190,191,192]),
            immediateCommand=rng.randrange(15),commands=[rng.randrange(15) for _ in range(8)],commandCursor=rng.randrange(8))
        people.append(i);entities.append(p)
        if p['flags2']&0x800000:cells[((p['x']>>8)&254)|(p['y']&0xfe00)]=rng.choice([0,180,181,182,183,184,185])|rng.choice([0,0x2000])
    rng.shuffle(people)
    c=dict(units=entities,people=people,cells=list(cells.items()),orders=orders,
           tribes=[dict(hasBase=bool(rng.randrange(2)),base=rng.randrange(65536),shaman=rng.randrange(65536),radius=rng.randrange(128)) for _ in range(4)],
           args=[rng.choice([-1,2,3,4]),rng.choice([2,3,4,6]),rng.choice([-1,0,180,183]),trial%3,rng.randrange(65536),trial%128,rng.choice([-2,0,1,4,20,99,100,105])])
    run_case(c)

# Force the individual eligibility paths and immediate-command precedence.
for option in range(128):
    for command in [6,11,17,25,31,32]:
        p=entity(1);p.update(state=10 if option%2 else 33,x=250<<8,y=0,
            flags2=0x800000 if option&4 else 0,assignment=0x804 if option&8 else 0,
            busy=1 if option&16 else 0,immediateCommand=1 if option&32 else 0,
            commands=[2]*8,commandCursor=7)
        b=entity(180,2,4 if option&64 else 7);b['inside']=4 if option&2 else 0
        c=dict(units=[p,b],people=[1],cells=[(250,180)],orders=[[1,dict(model=8,flags=1)],[2,dict(model=command,flags=0)]],
            tribes=[dict(hasBase=bool(option&1),base=0,shaman=4,radius=3) for _ in range(4)],args=[2,2,-1,1,2,option,1])
        run_case(c)
# Building exclusion depends on flag 64, not capacity alone. Cover all original
# models, the signed occupancy byte and invalid/deleted terrain references.
for model in range(20):
    for inside in [0,3,4,5,6,127,128,255]:
        for dead in [0,1]:
            p=entity(1);p['flags2']=0x800000
            b=entity(180,2,model);b.update(inside=inside,flags2=dead)
            run_case(dict(units=[p,b],people=[1],cells=[(0,180)],orders=[],
                tribes=[dict(hasBase=False,base=0,shaman=0,radius=0) for _ in range(4)],args=[2,2,-1,1,0,6,1]))

# Ranking across both seams, equal distances in different priority bands, count
# clamps and native scratch-tail writes beyond the returned selection prefix.
for mode in [0,1]:
    for requested in [-1,0,1,3,99,100,150]:
        entities=[]
        for i in range(1,181):
            p=entity(i);p.update(x=((i*4)&255)<<8,y=((i//7*8)&255)<<8,flags3=3,assignment=(i%7)<<12);entities.append(p)
        run_case(dict(units=entities,people=list(range(180,0,-1)),cells=[],orders=[],
            tribes=[dict(hasBase=False,base=0,shaman=0,radius=0) for _ in range(4)],args=[2,2,-1,mode,0,6,requested]))

js="""import {selectComputerPeople,availableTrainingPeople} from './app/computer-selection.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const units=new Map(c.units.map(p=>[p.id,p])),cells=new Map(c.cells),w={units,people:c.people.map(id=>units.get(id)),orders:new Map(c.orders),tribes:c.tribes,buildingAt:cell=>cells.get(cell)??0};
const available=availableTrainingPeople(w),selected=selectComputerPeople(w,...c.args);return {available,selected,flags:w.people.map(p=>p.flags3)};})));"""
p=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=root)
assert p.returncode==0,p.stderr
actual=json.loads(p.stdout);assert len(actual)==len(expected)
for i,(c,a,b) in enumerate(zip(cases,expected,actual)):
    if a!=b:
        Path('/private/tmp/populous-selection-failure.json').write_text(json.dumps(c,indent=2))
        raise AssertionError((i,c['args'],a,b))
print(f'PASS: {len(cases)} native availability/selection calls, all eligibility leaves, queued command precedence and selected-flag consumption')

# Run the actual phase-4 training controller with the actual selector. Only
# person-state initialization and restoration remain action boundaries.
import copy
from unicorn import UC_HOOK_CODE
actions=[]
def action_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x4ed640:
        p=struct.unpack('<I',cpu.mem_read(sp+4,4))[0]
        actions.append(dict(kind='select',id=struct.unpack('<H',cpu.mem_read(p+0x24,2))[0]))
    elif address==0x4f65e0:actions.append(dict(kind='restore'))
    cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,struct.unpack('<I',cpu.mem_read(sp,4))[0]);cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed6f0,0x4ed640,0x4f65e0]:cpu.hook_add(UC_HOOK_CODE,action_leaf,begin=a,end=a)
combined=[];expected=[]
for trial,c in enumerate(cases[:768:3]):
    c=copy.deepcopy(c);b=next(u for u in c['units'] if u['id']==180);b.update(model=7,flags2=0)
    fixture(c);cpu.mem_write(tribe+0x36,bytes(10*0x52));task=tribe+0x36
    remaining=c['args'][-1];selected=trial%3
    write(task+0x3e,'<I',1);write(task+0x4f,'<B',6);write(task+0x42,'<H',4);write(task+0x32,'<I',180)
    write(task+4,'<ii',selected,remaining);write(tribe+0x596,'<I',2);write(tribe+0x5b3,'<B',0)
    actions=[];call(0x4c8490,tribe,0)
    combined.append(dict(world=c,remaining=remaining,selected=selected))
    expected.append(dict(phase=struct.unpack('<H',cpu.mem_read(task+0x42,2))[0],remaining=struct.unpack('<i',cpu.mem_read(task+8,4))[0],
                         selected=struct.unpack('<i',cpu.mem_read(task+4,4))[0],flags=struct.unpack('<I',cpu.mem_read(tribe+0x596,4))[0],
                         owner=cpu.mem_read(tribe+0x5b3,1)[0],delay=cpu.mem_read(tribe+0x5b1,1)[0],actions=actions))
js="""import {selectComputerPeople} from './app/computer-selection.ts';import {createComputerQueue,stepTrainingTask} from './app/computer.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(test=>{const c=test.world,units=new Map(c.units.map(p=>[p.id,p])),cells=new Map(c.cells),w={units,people:c.people.map(id=>units.get(id)),orders:new Map(c.orders),tribes:c.tribes,buildingAt:cell=>cells.get(cell)??0};
const ai=createComputerQueue();ai.flags=2;ai.selectionOwner=0;const t=ai.tasks[0];Object.assign(t,{flags:1,type:6,phase:4,target:180,remaining:test.remaining,selected:test.selected});
const b={id:180,owner:1,state:2,model:7,capacity:4,inside:0,occupants:[]};
const actions=stepTrainingTask(ai,0,b,{tribe:1,preference:0,population:0,trained:0,committed:0,maximum:0,select:(_,n)=>selectComputerPeople(w,2,2,180,1,0,6,n)});
return {phase:t.phase,remaining:t.remaining,selected:t.selected,flags:ai.flags,owner:ai.selectionOwner,delay:ai.commandDelay,actions};})));"""
p=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(combined),text=True,capture_output=True,cwd=root)
assert p.returncode==0,p.stderr
actual=json.loads(p.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(i,a,b)
print('PASS: 256 combined native training-controller/selector calls; person initialization/restoration remain action boundaries')
