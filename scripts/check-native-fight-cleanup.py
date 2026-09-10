"""Run complete native 0x519a70 cleanup without replacing any callee.
Usage: python check-native-fight-cleanup.py EXE [--record]
"""
import copy,json,random,struct,subprocess,sys
from unicorn import UC_HOOK_CODE
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x100000)
base,group,output,stack,stop=0x2000000,0x2010000,0x2020000,0x20fd000,0x20fe000
rng=random.Random(0x519a70)
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'tribe':(0x2f,'B'),'state':(0x2c,'B'),'flags2':(0xc,'I'),
        'life':(0x6e,'h'),'workFlags':(0x9d,'H'),'x':(0x3d,'H'),'y':(0x3f,'H')}
def snapshot():
    return dict(id=read(group+0x24,'H'),members=list(struct.unpack('<6H',cpu.mem_read(group+0x70,12))),
                tribes=list(cpu.mem_read(group+0x69,2)),count=read(group+0x68,'B'),winner=read(group+0x6b,'B'),
                flags4=read(group+0x10,'I'),reactionTimer=read(group+0x31,'B'),x=read(group+0x3d,'H'),y=read(group+0x3f,'H'))
def call(address, *args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return cpu.reg_read(UC_X86_REG_EAX)&255
released=[]
def deleted(c,address,size,user):
    sp=c.reg_read(UC_X86_REG_ESP);a=read(sp+4,'I');released.append(read(a+0x24,'H'))
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,deleted,begin=0x4edcf0,end=0x4edcf0)
cases=[];expected=[];centers=[];terminals=[]
for n in range(4096):
    g=dict(id=rng.choice([100,32767,32768]),members=rng.sample([1,2,3,4,5,6,0,0,0],6),
           tribes=rng.sample(range(4),2),count=rng.randrange(7),winner=rng.choice([0,1,2,3,255]),
           flags4=rng.getrandbits(32),reactionTimer=rng.randrange(256),x=rng.randrange(65536),y=rng.randrange(65536))
    people=[]
    for id_ in range(1,7):
        p=dict(id=id_,**{'class':rng.choice([0,1,1,1])},tribe=rng.randrange(4),state=rng.choice([10,11,12,14,25,25,29]),
               flags2=rng.choice([0,0x40000000,1,16]),life=rng.choice([-1,0,1,100,2000]),
               workFlags=rng.choice([g['id'],g['id'],0,101]),
               x=(g['x']+rng.choice([0,10,2048,2049,32768,-1,-2048]))&65535,
               y=(g['y']+rng.choice([0,1,2048,32768]))&65535)
        if n%3:
            p.update({'class':1,'flags2':0,'state':25,'life':100,'workFlags':g['id']})
        people.append(p);a=base+id_*256;cpu.mem_write(a,bytes(256));write(0x890390+id_*4,'I',a)
        for k,(off,f) in fields.items():write(a+off,f,p[k])
    cpu.mem_write(group,bytes(256));write(group+0x24,'H',g['id']);write(group+0x70,'6H',*g['members'])
    write(group+0x69,'2B',*g['tribes']);write(group+0x68,'B',g['count']);write(group+0x6b,'B',g['winner'])
    write(group+0x10,'I',g['flags4']);write(group+0x31,'B',g['reactionTimer']);write(group+0x3d,'HH',g['x'],g['y'])
    # Supply a zero trailing stack word; the native compactor copies one extra
    # word beyond its six outputs. That ABI artifact is not a live object ID.
    cpu.mem_write(output,bytes(28));write(stack,'III',stop,group,output);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x519a70,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
    rows=[dict((k,read(base+p['id']*256+off,f)) for k,(off,f) in fields.items()) for p in people]
    ids=[(a-base)//256 if a else 0 for a in struct.unpack('<6I',cpu.mem_read(output,24))]
    cases.append(dict(group=g,people=people));expected.append(dict(result=dict(active=bool(cpu.reg_read(UC_X86_REG_EAX)&255),people=ids),group=snapshot(),people=rows))
    if expected[-1]['result']['active'] and all(ids[:snapshot()['count']]):
        inp=dict(group=snapshot(),people=ids,objects=copy.deepcopy(rows))
        call(0x5199f0,group,output,output+128,output+132)
        centers.append(dict(input=inp,expected=dict(id=read(output+128,'I'),index=read(output+132,'B'))))
    elif not expected[-1]['result']['active'] and len(terminals)<512:
        wins=[rng.randrange(-2147483648,2147483648) for _ in range(4)]
        inp=dict(group=snapshot(),people=copy.deepcopy(rows),wins=wins)
        for tribe,total in enumerate(wins):write(0x969dc6+tribe*48,'i',total)
        write(group+0x2a,'B',10);released.clear();call(0x518fb0,group)
        terminals.append(dict(input=inp,expected=dict(group=snapshot(),people=[dict((k,read(base+p['id']*256+off,f)) for k,(off,f) in fields.items()) for p in people],
            wins=[read(0x969dc6+tribe*48,'i') for tribe in range(4)],released=list(released))))
recoveries=[]
for model in range(9):
    for flags in (0,2,0xffffffff):
        for id_ in (0,100):
            for unit_class,flags2 in [(0,0),(10,0),(1,0),(10,1),(10,16),(7,0x100000)]:
                a=base+256;write(a+0x2b,'B',model);write(a+0x9d,'H',id_);write(0x890390+100*4,'I',group)
                write(group+0x2a,'B',unit_class);write(group+0xc,'I',flags2);write(0x89d17c,'I',flags)
                recoveries.append(dict(input=[dict(model=model),flags,dict(**{'class':unit_class},flags2=flags2) if id_ else None],expected=call(0x518560,a)))
js="""import {cleanFightRoster,fightCenter,releaseFightRoster} from './app/melee-groups.ts';
import {stateAfterFight} from './app/person-state.ts';let s='';for await(const c of process.stdin)s+=c;
const c=JSON.parse(s);
console.log(JSON.stringify({
 cleanup:c.cases.map(c=>({result:cleanFightRoster(c.group,new Map(c.people.map(p=>[p.id,p]))),...c})),
 centers:c.centers.map(({input:c})=>fightCenter(c.group,c.people,new Map(c.objects.map(p=>[p.id,p])))),
 terminals:c.terminals.map(({input:c})=>{const objects=new Map(c.people.map(p=>[p.id,p]));
 const result=cleanFightRoster(c.group,objects);if(result.active)throw Error('Unexpected active fight');
 releaseFightRoster(c.group,objects);if(c.group.winner!==255)c.wins[c.group.winner]=(c.wins[c.group.winner]+1)|0;
 return {...c,released:[c.group.id]};}),
 recoveries:c.recoveries.map(({input:c})=>stateAfterFight(...c)),
}));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,centers=centers,terminals=terminals,recoveries=recoveries)),text=True,capture_output=True,cwd=ROOT)
assert r.returncode==0,r.stderr
batch=json.loads(r.stdout);actual=batch['cleanup']
for i,(a,e) in enumerate(zip(actual,expected)):
    if a!=e:
        p=Path('/private/tmp/populous-cleanup-failure.json');p.write_text(json.dumps(dict(input=cases[i],native=e,browser=a),indent=2));raise AssertionError((i,str(p)))
for name,rows in [('centers',centers),('terminals',terminals),('recoveries',recoveries)]:
    assert batch[name]==[r['expected'] for r in rows],next((name,i,a,e) for i,(a,e) in enumerate(zip(batch[name],[r['expected'] for r in rows])) if a!=e)
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/fight-cleanup.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[dict(input=cases[i],expected=expected[i]) for i in range(0,len(cases),31)],centers=centers[::11],terminals=terminals[::11],recoveries=recoveries[::7]),separators=(',',':'))+'\n')
print('PASS: 4096 complete native fight cleanup calls; gates, persistent slots, compact output, separation boundary/wrap/overflow, reservations and winning tribe')
print(f'PASS: {len(centers)} native center choices; {len(terminals)} complete terminal group dispatches with real winner counters; {len(recoveries)} native state recovery decisions')
