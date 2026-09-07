"""Compare command encoding, shared ownership, routes and group commit with native CPU.
Usage: python scripts/check-native-orders.py /path/to/d3dpoptb.exe
Payload preparation and work/spell/object/fight world effects are supplied leaves;
command encoding, allocation, references, route conversion and queue control execute.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
units, stack, stop = 0x2000000, 0x201d000, 0x201e000
tribe, pool = 0x89d1c8, 0x938830
rng = random.Random(0x4359b0)
actions = []

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack(fmt, *values))

def call(address, *args):
    write(stack, '<' + 'I' * (len(args) + 1), stop, *[a & 0xffffffff for a in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1000000, count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)

def leaf(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    args = struct.unpack('<5I', cpu.mem_read(sp + 4, 20))
    if address == 0x438730:
        id_, model, data = args[:3]
        a, b = struct.unpack('<HH', cpu.mem_read(data, 4))
        actions.append(['prepare', id_ & 65535, model & 255, a, b])
        write(pool + (id_ & 65535) * 10, '<B', model & 255)
        write(pool + (id_ & 65535) * 10 + 6, '<HH', a, b)
    else:
        id_ = struct.unpack('<H', cpu.mem_read(args[0] + 0x24, 2))[0]
        actions.append([ {0x51ff40:'work', 0x4ef180:'delete', 0x4d4f40:'fight'}[address], id_ ])
    cpu.reg_write(UC_X86_REG_EAX, 0)
    cpu.reg_write(UC_X86_REG_EIP, struct.unpack('<I', cpu.mem_read(sp, 4))[0])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x438730, 0x51ff40, 0x4ef180, 0x4d4f40]:
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)

def order(model=0, references=0):
    return dict(model=model, flags=0, references=references, object=0, a=rng.randrange(65536), b=rng.randrange(65536))

def record(o):
    return struct.pack('<BB4H', *[o[k] for k in ['model','flags','references','object','a','b']])

fields = {'model':(0x2b,'B'), 'state':(0x2c,'B'), 'substate':(0x2d,'B'), 'x':(0x3d,'H'), 'y':(0x3f,'H'),
    'flags2':(0xc,'I'), 'flags3':(0x14,'I'), 'flags4':(0x10,'I'), 'assignment':(0x76,'H'),
    'selectionFlags':(0x7a,'B'), 'commandCursor':(0xa6,'B'), 'immediateCommand':(0x9b,'H'),
    'orderLocation':(0x83,'H'), 'commandStatus':(0xa7,'B'), 'workTarget':(0x89,'H')}

def person(id_):
    return dict(id=id_, model=2, state=17, substate=0, x=rng.randrange(65536), y=rng.randrange(65536),
        flags2=0, flags3=0, flags4=0, assignment=0, selectionFlags=128, commands=[0]*8,
        commandCursor=0, immediateCommand=0, orderLocation=123, commandStatus=9, workTarget=100)

def fixture(c):
    global actions
    actions = []
    cpu.mem_write(tribe, bytes(0xc65)); cpu.mem_write(pool, bytes(8000))
    cpu.mem_write(0x890390, bytes(4096))
    if c.get('full'):
        for i in range(1,800): write(pool + i*10 + 2, '<H', 1)
    for id_, o in c.get('orders', []): cpu.mem_write(pool + id_*10, record(o))
    write(0x96aa78, '<HH', c.get('cursor',1), c.get('active',0))
    write(tribe+0x917, '<h', c.get('spellCount',3))
    for id_ in [100,101]:
        p=units+id_*256; cpu.mem_write(p,bytes(256)); write(p+0x24,'<H',id_); write(p+0x2a,'<B',2)
        write(0x890390+id_*4,'<I',p)
    for i, u in enumerate(c.get('people',[])):
        p=units+u['id']*256; cpu.mem_write(p,bytes(256)); write(p+0x24,'<H',u['id']); write(p+0x2a,'<B',1)
        write(0x890390+u['id']*4,'<I',p)
        for key,(offset,fmt) in fields.items(): write(p+offset,'<'+fmt,u[key])
        write(p+0x8b,'<8H',*u['commands'])
        write(p+8,'<I',units+c['people'][i+1]['id']*256 if i+1<len(c['people']) else 0)
    if c.get('people'): write(tribe+0x881,'<I',units+c['people'][0]['id']*256)
    group=c.get('group',[])
    write(tribe+0x8bf,'<BB',len(group),len(group))
    for i,o in enumerate(group):cpu.mem_write(tribe+0x8c1+i*10,record(o))

def snapshot(c, result):
    people=[]
    for u in c.get('people',[]):
        p=units+u['id']*256; v={'id':u['id']}
        for key,(offset,fmt) in fields.items(): v[key]=struct.unpack('<'+fmt,cpu.mem_read(p+offset,struct.calcsize(fmt)))[0]
        v['commands']=list(struct.unpack('<8H',cpu.mem_read(p+0x8b,16)));people.append(v)
    return dict(result=result,pool=bytes(cpu.mem_read(pool,8000)).hex(),people=people,
        cursor=struct.unpack('<H',cpu.mem_read(0x96aa78,2))[0],active=struct.unpack('<H',cpu.mem_read(0x96aa7a,2))[0],
        group=bytes(cpu.mem_read(tribe+0x8bf,82)).hex(),actions=actions,
        spellCount=struct.unpack('<h',cpu.mem_read(tribe+0x917,2))[0],spellChanged=cpu.mem_read(tribe+0x91b,1)[0])

cases=[]; expected=[]
def run(c):
    fixture(c); kind=c['kind'];result=None
    if kind=='write':
        cpu.mem_write(tribe+0x8c1,record(c['before']))
        call(0x435780,tribe,0,*c['args'])
        result=bytes(cpu.mem_read(tribe+0x8c1,10)).hex()
        expected.append(result)
    else:
        p=units+c['people'][0]['id']*256 if c['people'] else 0
        if kind=='route':call(0x43b010,p)
        elif kind=='attach':call(0x436d00,p,*c['args'])
        elif kind=='remove':call(0x4364d0,p,*c['args'])
        elif kind=='commit':result=bool(call(0x4359b0,tribe,*c['models']))
        expected.append(snapshot(c,result))
    cases.append(c)

for model in range(35):
    for trial in range(32):
        before=order(rng.randrange(35),rng.randrange(65536));before.update(flags=rng.randrange(256),object=rng.randrange(65536))
        run(dict(kind='write',before=before,args=[model,trial if trial<4 else rng.randrange(65536),rng.randrange(65536),rng.randrange(256)]))

for kind in ['route','attach','remove']:
    for trial in range(192):
        u=person(1);u.update(state=rng.choice([10,17,33]),substate=trial%2,flags2=rng.getrandbits(32),
            flags3=rng.getrandbits(32),flags4=rng.getrandbits(32),assignment=rng.randrange(65536),
            commands=[rng.randrange(9) for _ in range(8)],commandCursor=rng.randrange(8),immediateCommand=rng.randrange(9))
        orders=[]
        for i in range(1,10):
            o=order(rng.choice([3,6,7,8,11,19,21,25,30]),rng.choice([1,2,65535]));o.update(flags=rng.randrange(2),object=rng.choice([0,101]));orders.append([i,o])
        if kind=='route':
            u['immediateCommand']=0 if trial%3 else 1
            orders=[[i,order(rng.choice([8,11,11,25]),1)] for i in range(1,10)]
        run(dict(kind=kind,people=[u],orders=orders,args=[rng.randrange(1,10),rng.choice([-1,*range(8)])] if kind=='attach' else [rng.choice([-1,*range(8)])],active=8))

for trial in range(256):
    people=[person(i+1) for i in range(trial%6)]
    for u in people:
        u.update(model=rng.randrange(2,9),flags2=rng.getrandbits(32),flags3=rng.getrandbits(32),flags4=rng.getrandbits(32),
            selectionFlags=rng.randrange(256),commands=[rng.randrange(5) for _ in range(8)],immediateCommand=rng.randrange(5))
    orders=[[i,order(rng.choice([6,7,8,11,25]),10)] for i in range(1,5)]
    full=trial%4==0
    if full:
        for i in rng.sample(range(5,800),trial%5): orders.append([i,order(8,0)])
    group=[order(rng.randrange(35)) for _ in range(trial%9)]
    for o in group:o['flags']=rng.randrange(2)
    run(dict(kind='commit',people=people,orders=orders,group=group,models=rng.choice([[-1,-1,-1],[2,3,7],[8,8,8]]),
        full=full,cursor=rng.choice([0,1,5,798,799]),active=799 if full else 4))

js=r"""import {emptyPersonOrder,writePersonOrder,normalizePersonRoute,attachPersonOrder,removePersonOrder,commitPersonOrders} from './app/person-orders.ts';
let s='';for await(const c of process.stdin)s+=c;
const encode=o=>{const b=Buffer.alloc(10);b.writeUInt8(o.model);b.writeUInt8(o.flags,1);['references','object','a','b'].forEach((k,i)=>b.writeUInt16LE(o[k],2+i*2));return b;};
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 if(c.kind==='write'){writePersonOrder(c.before,...c.args);return encode(c.before).toString('hex');}
 const pool={records:Array.from({length:800},(_,i)=>({...emptyPersonOrder(),references:c.full&&i?1:0})),cursor:c.cursor??1,active:c.active??0};
 for(const [id,o] of c.orders??[])pool.records[id]=o;
 const group={records:Array.from({length:8},(_,i)=>c.group?.[i]??emptyPersonOrder()),count:c.group?.length??0,cursor:c.group?.length??0};
 let spellCount=c.spellCount??3,spellChanged=0,result=null;const actions=[];
 const effects={prepare:(o,model,a,b)=>{actions.push(['prepare',pool.records.indexOf(o),model,a,b]);Object.assign(o,{model,a,b});},stopWork:p=>{if(p.workTarget===100)actions.push(['work',100]);},
 releaseSpell:()=>{spellChanged=1;spellCount=Math.max(0,spellCount-1);},deleteObject:id=>actions.push(['delete',id]),releaseFight:p=>actions.push(['fight',p.id])};
 const p=c.people[0];
 if(c.kind==='route')normalizePersonRoute(pool,p);
 if(c.kind==='attach')attachPersonOrder(pool,p,...c.args,effects);
 if(c.kind==='remove')removePersonOrder(pool,p,...c.args,effects);
 if(c.kind==='commit')result=commitPersonOrders(pool,group,c.people,c.models,effects);
 return {result,pool:Buffer.concat(pool.records.map(encode)).toString('hex'),people:c.people,cursor:pool.cursor,active:pool.active,
 group:Buffer.concat([Buffer.from([group.count,group.cursor]),...group.records.map(encode)]).toString('hex'),actions,spellCount,spellChanged};
})));"""
p=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=root)
assert p.returncode==0,p.stderr
actual=json.loads(p.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        path=Path('/private/tmp/populous-order-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2))
        raise AssertionError((i,cases[i]['kind'],str(path), [k for k in a if a[k]!=b[k]] if isinstance(a,dict) else (a,b)))
print(f'PASS: {len(cases)} native command comparisons: 1120 encodings, 576 route/attach/remove calls, 256 group commits; world effect leaves supplied')
