"""Native 0051ddc0 admission and 0051df90 splitting, with real slot selection,
replacement release and RNG. Allocation and person entry are observed consumers.
Usage: python scripts/check-native-melee-groups.py EXE [--record]
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

exe = Path(sys.argv[1]); cpu, _ = native_cpu(exe); configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x20000)
base, group, new_group, stack, stop = 0x2000000, 0x2002000, 0x2002200, 0x201d000, 0x201e000
rng = random.Random(0x51ddc0)
def write(a, fmt, *values): cpu.mem_write(a, struct.pack('<' + fmt, *values))
def read(a, fmt): return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]
def person_address(id_): return base + id_ * 256
fields = {'id': (0x24,'H'), 'model': (0x2b,'B'), 'tribe': (0x2f,'B'), 'state': (0x2c,'B'),
          'previousState': (0x7d,'B'), 'substate': (0x2d,'B'), 'flags2': (0xc,'I'),
          'workFlags': (0x9d,'H'), 'workTarget': (0x89,'H')}
def person_snapshot(id_): return {k: read(person_address(id_)+off, f) for k,(off,f) in fields.items()}
def group_snapshot(a):
    return dict(id=read(a+0x24,'H'), members=list(struct.unpack('<6H',cpu.mem_read(a+0x70,12))),
                tribes=list(cpu.mem_read(a+0x69,2)), count=read(a+0x68,'B'),
                center=read(a+0x6c,'H'), angle=read(a+0x26,'H'))
def consumer(c, address, size, user):
    sp=c.reg_read(UC_X86_REG_ESP); p=read(sp+4,'I')
    if address == 0x4ed8a0:
        events.append(['allocate', read(sp+4,'I'), read(sp+8,'I'), read(sp+12,'I'),
                       list(struct.unpack('<HHh', c.mem_read(read(sp+16,'I'),6)))])
        c.reg_write(UC_X86_REG_EAX, 0 if case['allocationFails'] else new_group)
    else: events.append(['empty' if address==0x4ed6f0 else 'initialize',read(p+0x24,'H')])
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for address in [0x4ed8a0,0x4ed6f0,0x4ed640]:
    cpu.hook_add(UC_HOOK_CODE,consumer,begin=address,end=address)

cases, expected = [], []
for mode in ['join','split']:
    for n in range(2048):
        tribes = rng.sample(range(4),2)
        members = list(range(1,rng.randrange(1,8)))
        slots = members + [0]*(6-len(members));rng.shuffle(slots)
        people=[]
        for id_ in range(1,8):
            p=dict(id=id_,model=rng.randrange(1,9),tribe=rng.choice(tribes),state=25 if id_ in members else 10,
                   previousState=17,substate=rng.randrange(8),flags2=rng.choice([0,0x40000000,0x100000,0x40001080]),
                   workFlags=100 if id_ in members else 0,workTarget=rng.randrange(65536))
            if id_==7 and n%7==0:p['tribe']=next(t for t in range(4) if t not in tribes)
            a=person_address(id_);cpu.mem_write(a,bytes(256));write(0x890390+id_*4,'I',a)
            for key,(off,f) in fields.items():write(a+off,f,p[key])
            people.append(p)
        original=dict(id=100,members=slots,tribes=tribes,count=len(members),center=rng.choice(members+[0]),angle=rng.randrange(2048))
        for a,id_ in [(group,100),(new_group,101)]:cpu.mem_write(a,bytes(256));write(a+0x24,'H',id_)
        write(group+0x70,'6H',*slots);write(group+0x69,'2B',*tribes);write(group+0x68,'B',len(members))
        write(group+0x6c,'H',original['center']);write(group+0x26,'H',original['angle']);write(group+0x3d,'HHh',1000,2000,300)
        seed=rng.getrandbits(32);write(0x89d178,'I',seed)
        case=dict(mode=mode,people=people,group=original,randomState=seed,allocationFails=n%5==0)
        args=[person_address(7),group] if mode=='join' else [group]
        write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);events=[]
        cpu.emu_start(0x51ddc0 if mode=='join' else 0x51df90,stop,count=100000)
        assert cpu.reg_read(UC_X86_REG_EIP)==stop
        result=(cpu.reg_read(UC_X86_REG_EAX)&255)!=0 if mode=='join' else cpu.reg_read(UC_X86_REG_EAX)==new_group
        created=any(e[0]=='allocate' for e in events) and not case['allocationFails']
        cases.append(case)
        expected.append(dict(result=result,group=group_snapshot(group),created=group_snapshot(new_group) if created else None,
                             people=[person_snapshot(i) for i in range(1,8)],events=events,randomState=read(0x89d178,'I')))
js="""
import {joinMeleeGroup,splitMeleeGroup} from './app/melee-groups.ts';
let text='';for await(const c of process.stdin)text+=c;const cases=JSON.parse(text);
console.log(JSON.stringify(cases.map(c=>{
 const w={randomState:c.randomState,objects:new Map(c.people.map(p=>[p.id,p]))},events=[];let created=null;
 const effects={enter:p=>{p.previousState=p.state;events.push(['empty',p.id]);p.state=25;events.push(['initialize',p.id]);},
 allocate:()=>{events.push(['allocate',10,8,255,[1000,2000,300]]);if(!c.allocationFails)return created={id:101,members:[0,0,0,0,0,0],tribes:[0,0],count:0,center:0,angle:0};}};
 const result=c.mode==='join'?joinMeleeGroup(w,c.group,c.people[6],effects):!!splitMeleeGroup(w,c.group,effects);
 return {result,group:c.group,created,people:c.people,events,randomState:w.randomState};
})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
    if a!=e:
        path=Path('/private/tmp/populous-groups-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=e,browser=a),indent=2));raise AssertionError((i,str(path)))
print('PASS: 4096 native admission/split calls, persistent slots, replacements, protected/specialist members, release flags, last-slot selection, allocation failure, ordered entry/allocation and RNG.')
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/melee-groups.json').write_text(json.dumps([dict(input=cases[i],expected=expected[i]) for i in range(0,len(cases),31)],separators=(',',':'))+'\n')
