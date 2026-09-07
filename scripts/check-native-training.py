"""Compare recovered AI queue/training control with the verified executable.
Usage: python scripts/check-native-training.py /path/to/d3dpoptb.exe
Selection, occupancy mutation and person command leaves are controlled inputs;
the scheduler, task controller, locks, allocation and release execute natively.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x30000)
tribe,building,people,stack,stop=0x2000000,0x2002000,0x2003000,0x202d000,0x202e000
rng=random.Random(4623)
def read(p,fmt='<I'):return struct.unpack(fmt,cpu.mem_read(p,struct.calcsize(fmt)))[0]
def write(p,fmt,*v):cpu.mem_write(p,struct.pack(fmt,*v))
def call(address,*args,end=stop):
    write(stack,'<'+'I'*(len(args)+1),stop,*[a&0xffffffff for a in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,end,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==end,hex(cpu.reg_read(UC_X86_REG_EIP))
def compare(cases,expected,js):
    p=subprocess.run(['node','--input-type=module','-e',"let s='';for await(const c of process.stdin)s+=c;const cases=JSON.parse(s);"+js],input=json.dumps(cases),text=True,capture_output=True,cwd=root)
    assert p.returncode==0,p.stderr
    actual=json.loads(p.stdout);assert len(actual)==len(expected)
    for case,a,b in zip(cases,expected,actual):assert a==b,(case,a,b)
def ret(value=0):
    sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,value&0xffffffff)
    cpu.reg_write(UC_X86_REG_EIP,read(sp));cpu.reg_write(UC_X86_REG_ESP,sp+4)

offsets={'flags':(0x3e,'<I'),'type':(0x4f,'<B'),'phase':(0x42,'<H'),'target':(0x32,'<i'),
         'requested':(0x36,'<i'),'extra':(0x3a,'<i'),'selected':(4,'<i'),'remaining':(8,'<i'),
         'elapsed':(12,'<i'),'mode':(0x26,'<B')}
def fixture(ai,owner=1):
    cpu.mem_write(tribe,bytes(0xc65));write(tribe+0xc22,'<B',owner)
    write(tribe+0x596,'<I',ai['flags']);write(tribe+0x5b3,'<B',ai['selectionOwner'])
    write(tribe+0x5b1,'<B',ai['commandDelay']);write(tribe+0x5b5,'<B',ai['cursor'])
    for i,t in enumerate(ai['tasks']):
        for key,(offset,fmt) in offsets.items():write(tribe+0x36+i*0x52+offset,fmt,t[key])
def snapshot():
    return dict(tasks=[{key:read(tribe+0x36+i*0x52+o,f) for key,(o,f) in offsets.items()} for i in range(10)],
                flags=read(tribe+0x596),selectionOwner=read(tribe+0x5b3,'<B'),commandDelay=read(tribe+0x5b1,'<B'),cursor=read(tribe+0x5b5,'<B'))
def state():
    return dict(tasks=[dict(flags=rng.getrandbits(32),type=6,phase=0,target=1,requested=0,extra=4,
                          selected=5,remaining=7,elapsed=9,mode=0) for _ in range(10)],
                flags=rng.getrandbits(32),selectionOwner=rng.randrange(11),commandDelay=3,cursor=rng.randrange(10))

calls=[]
def dispatch_leaf(cpu,address,size,user):
    calls.append(read(cpu.reg_read(UC_X86_REG_ESP)+8));ret()
hook=cpu.hook_add(UC_HOOK_CODE,dispatch_leaf,begin=0x4c8490,end=0x4c8490)
cases=[];expected=[]
for mask in range(1024):
    ai=state();ai['cursor']=mask%10
    for i,t in enumerate(ai['tasks']):t['flags']=(t['flags']&~1)|((mask>>i)&1)
    fixture(ai);calls=[];call(0x4623e0,tribe)
    cases.append(ai);expected.append(dict(cursor=read(tribe+0x5b5,'<B'),calls=calls))
compare(cases,expected,"""import {dispatchComputerTask} from './app/computer.ts';console.log(JSON.stringify(cases.map(ai=>{const calls=[];dispatchComputerTask(ai,i=>calls.push(i));return {cursor:ai.cursor,calls};})));""")
cpu.hook_del(hook)
print('PASS: all 1,024 task occupancy masks through the native round-robin dispatcher')

# Actual process_tribe_2 prefix: script precedes its maintenance/dispatch branch.
# Stop before the unrelated spell/combat work. Radius update is disabled in fixture.
events=[]
def scheduling_leaf(cpu,address,size,user):
    if address in (0x48c6b0,0x4625e0,0x4623e0):events.append({0x48c6b0:'script',0x4625e0:'produce',0x4623e0:'dispatch'}[address])
    ret()
hooks=[cpu.hook_add(UC_HOOK_CODE,scheduling_leaf,begin=a,end=a) for a in [0x4f20d0,0x461f90,0x48c6b0,0x4625e0,0x4623e0]]
cases=[];expected=[]
for owner in range(4):
    for turn in range(256):
        fixture(state(),owner);write(0x89d188,'<I',turn);events=[]
        call(0x4615f0,tribe,end=0x46178b)
        cases.append([turn,owner]);expected.append(events)
compare(cases,expected,"""import {computerPhase} from './app/computer.ts';console.log(JSON.stringify(cases.map(([turn,tribe])=>{const phase=computerPhase(turn,tribe);return phase==='radius'?['script']:['script',phase];})));""")
for h in hooks:cpu.hook_del(h)
print('PASS: 1,024 native tribe scheduler phases and script-before-task ordering')

current={};actions=[]
def training_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);result=0
    if address==0x4f68c8:actions.append(dict(kind='restore'));return # Observe the actual cleanup branch.
    if address==0x4f65e0:actions.append(dict(kind='restore'))
    if address==0x4f2ac0:result=current['input']['committed']
    if address==0x4f8490:
        wanted=read(sp+32,'<i');result=min(len(current['selected']),wanted)
        output=read(sp+36)
        for j,id_ in enumerate(current['selected'][:result]):write(output+j*4,'<HH',0,id_)
    if address==0x407490:
        p=read(sp+8);actions.append(dict(kind='eject',id=read(p+0x24,'<H') if p else 0))
        write(building+0xa6,'<B',read(building+0xa6,'<B')-1)
    if address==0x4ed640:actions.append(dict(kind='select',id=read(read(sp+4)+0x24,'<H')))
    if address==0x435730:actions.append(dict(kind='train',id=read(sp+12)))
    ret(result)
leaves=[0x4f65e0,0x4f2ac0,0x4f8490,0x407490,0x4ed6f0,0x4ed640,0x435730,0x4359b0,0x418ce0,0x4f68c8]
hooks=[cpu.hook_add(UC_HOOK_CODE,training_leaf,begin=a,end=a) for a in leaves]
cases=[];expected=[]
for trial in range(1200):
    ai=state();index=trial%10;t=ai['tasks'][index]
    t.update(phase=trial%10,requested=rng.choice([0,1,4,101,-1]),selected=rng.choice([0,1,100]),
             remaining=rng.choice([-1,0,1,3,101]),elapsed=rng.choice([0,290,299,300,301,2147483647]),mode=rng.randrange(2))
    t['flags']|=1
    if trial%5:t['flags']&=~2
    for i,other in enumerate(ai['tasks']):
        if i!=index:other.update(type=rng.choice([6,20]),phase=rng.randrange(16))
    fixture(ai)
    occupants=[dict(id=j+2,model=rng.choice([2,3])) for j in range(rng.randrange(5))]
    b=dict(id=1,owner=rng.randrange(2),state=rng.randrange(4),model=rng.choice([5,6,7,8]),capacity=4,inside=len(occupants),occupants=occupants+[None]*(4-len(occupants)))
    valid=trial%13!=0
    cpu.mem_write(building,bytes(256));write(0x890394,'<I',building)
    write(building+0x24,'<H',1);write(building+0x2a,'<BBBBBB',2 if valid else 0,b['model'],b['state'],0,0,b['owner'])
    write(building+0xa6,'<B',b['inside']);write(0x5a7248+b['model']*76,'<B',4)
    selected=list(range(10,10+trial%4))
    for id_ in [*range(2,6),*selected]:
        p=people+id_*256;cpu.mem_write(p,bytes(256));write(0x890390+id_*4,'<I',p)
        write(p+0x24,'<H',id_);write(p+0x2a,'<BBB',1,2,17)
    for j,o in enumerate(occupants):
        write(building+0x86+j*2,'<H',o['id']);write(people+o['id']*256+0x2b,'<B',o['model'])
    inp=dict(tribe=1,preference=rng.randrange(256),population=rng.choice([0,7,200,2147483647]),trained=rng.randrange(65536),committed=rng.randrange(40),maximum=rng.randrange(256))
    attr={5:6,6:5,7:7,8:8}[b['model']];person={5:4,6:5,7:3,8:6}[b['model']]
    write(0x9607ea+48+attr,'<B',inp['preference']);write(0x96080b+48,'<B',inp['maximum'])
    write(tribe+0x91d,'<i',inp['population']);write(tribe+0xa27+person*2,'<H',inp['trained'])
    current=dict(ai=ai,index=index,building=b if valid else None,input=inp,selected=selected)
    actions=[];call(0x4c8490,tribe,index)
    cases.append(current);expected.append(dict(ai=snapshot(),actions=actions))
compare(cases,expected,"""import {stepTrainingTask} from './app/computer.ts';console.log(JSON.stringify(cases.map(c=>({ai:c.ai,actions:stepTrainingTask(c.ai,c.index,c.building,{...c.input,select:(_,n)=>c.selected.slice(0,n)})}))));""")
for h in hooks:cpu.hook_del(h)
print('PASS: 1,200 native training phase/lock/cancellation/timeout cases; selection and person commands supplied as leaves')

# TRAIN_PEOPLE_NOW supplies availability and the first completed hut through
# lookup leaves, then executes the actual ten-slot search and task initializer.
lookup=[]
def request_leaf(cpu,address,size,user):
    if address==0x4f67b0:ret(current['available'])
    elif address==0x4f6730:ret(0)
    else:
        lookup.append(read(cpu.reg_read(UC_X86_REG_ESP)+8));ret(current['target'])
hooks=[cpu.hook_add(UC_HOOK_CODE,request_leaf,begin=a,end=a) for a in [0x4f67b0,0x4f6730,0x4f36d0]]
cases=[];expected=[]
for trial in range(300):
    ai=state();fixture(ai);lookup=[]
    current=dict(ai=ai,count=rng.choice([-2147483648,-1,0,1,100,2147483647]),model=trial%10,available=trial%3,target=trial%2*42)
    call(0x4e6640,tribe,current['count'],current['model'])
    cases.append(current);expected.append(dict(ai=snapshot(),lookup=lookup))
compare(cases,expected,"""import {requestTraining} from './app/computer.ts';console.log(JSON.stringify(cases.map(c=>{const lookup=[];requestTraining(c.ai,c.count,c.model,c.available,m=>{lookup.push(m);return c.target;});return {ai:c.ai,lookup};})));""")
print('PASS: 300 native training request/allocation calls, including retained slot scratch fields')
