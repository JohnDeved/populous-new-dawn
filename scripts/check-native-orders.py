"""Compare command encoding, shared ownership, routes and group commit with native CPU.
Usage: python scripts/check-native-orders.py /path/to/d3dpoptb.exe
Payload preparation and work/spell/object/fight world effects are supplied leaves;
command encoding, allocation, references, route conversion and queue control execute.
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX, UC_X86_REG_ECX
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1]))
# The supplied D3D build retains staging camera metadata but these consumers
# are RET stubs, not missing implementations of persistent waypoint markers.
for address in [0x438ae0,0x4199b0]:
    assert bytes(cpu.mem_read(address,1))==b'\xc3',hex(address)

cpu.mem_map(0x2000000, 0x20000)
units, stack, stop = 0x2000000, 0x201d000, 0x201e000
tribe, pool = 0x89d1c8, 0x938830
rng = random.Random(0x4359b0)
actions = []
append_case = None

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack(fmt if fmt.startswith('<') else '<' + fmt, *values))

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
        actions.append(['prepare', id_ & 65535, model & 255, a, b] + ([args[3] & 255] if append_case else []))
        if append_case: write(pool + (id_ & 65535) * 10 + 1, '<B', args[3] & 255)
        write(pool + (id_ & 65535) * 10, '<B', model & 255)
        write(pool + (id_ & 65535) * 10 + 6, '<HH', a, b)
    elif address == 0x436330:
        first = struct.unpack('<H', cpu.mem_read(args[0] + 0x24, 2))[0] if args[0] else 0
        actions.append(['acknowledge', first, list(struct.unpack('<9I', cpu.mem_read(args[1], 36)))])
    elif address == 0x435ef0:
        actions.append(['special', args[1] & 255])
    else:
        id_ = struct.unpack('<H', cpu.mem_read(args[0] + 0x24, 2))[0]
        actions.append([ {0x51ff40:'work', 0x4ef180:'delete', 0x4d4f40:'fight'}[address], id_ ])
    cpu.reg_write(UC_X86_REG_EAX, int(append_case.get('special', False)) if address == 0x435ef0 else 0)
    cpu.reg_write(UC_X86_REG_EIP, struct.unpack('<I', cpu.mem_read(sp, 4))[0])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x438730, 0x51ff40, 0x4ef180, 0x4d4f40, 0x436330, 0x435ef0]:
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
    global actions, append_case
    actions = []
    append_case = c if c['kind'] == 'append' else None
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
        elif kind=='append':result=bool(call(0x435cb0,tribe,0) & 255)
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

for trial in range(2048):
    people=[person(i+1) for i in range(trial%9)]
    for u in people:
        u.update(model=rng.randrange(2,9),flags2=rng.getrandbits(32),flags3=rng.getrandbits(32),flags4=rng.getrandbits(32),
            selectionFlags=rng.randrange(256),commands=[rng.randrange(1 if trial%4 == 0 else 0,5) for _ in range(8)],
            commandCursor=rng.randrange(8),immediateCommand=rng.randrange(5))
    orders=[[i,order(rng.choice([3,6,7,8,11,25]),100)] for i in range(1,5)]
    command=order(trial%35);command['flags']=rng.randrange(256)
    run(dict(kind='append',people=people,orders=orders,group=[command],special=bool(trial%2),
        full=trial%16==0,cursor=rng.choice([1,5,798,799]),active=799 if trial%16==0 else 4))

js=r"""import {emptyPersonOrder,writePersonOrder,normalizePersonRoute,attachPersonOrder,removePersonOrder,commitPersonOrders,appendPersonOrders} from './app/person-orders.ts';
let s='';for await(const c of process.stdin)s+=c;
const encode=o=>{const b=Buffer.alloc(10);b.writeUInt8(o.model);b.writeUInt8(o.flags,1);['references','object','a','b'].forEach((k,i)=>b.writeUInt16LE(o[k],2+i*2));return b;};
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 if(c.kind==='write'){writePersonOrder(c.before,...c.args);return encode(c.before).toString('hex');}
 const pool={records:Array.from({length:800},(_,i)=>({...emptyPersonOrder(),references:c.full&&i?1:0})),cursor:c.cursor??1,active:c.active??0};
 for(const [id,o] of c.orders??[])pool.records[id]=o;
 const group={records:Array.from({length:8},(_,i)=>c.group?.[i]??emptyPersonOrder()),count:c.group?.length??0,cursor:c.group?.length??0};
 let spellCount=c.spellCount??3,spellChanged=0,result=null;const actions=[];
 const effects={prepare:(o,model,a,b,flags)=>{actions.push(['prepare',pool.records.indexOf(o),model,a,b,...(c.kind==='append'?[flags]:[])]);Object.assign(o,{model,a,b});if(c.kind==='append')o.flags=flags;},stopWork:p=>{if(p.workTarget===100)actions.push(['work',100]);},
 releaseSpell:()=>{spellChanged=1;spellCount=Math.max(0,spellCount-1);},deleteObject:id=>actions.push(['delete',id]),releaseFight:p=>actions.push(['fight',p.id])};
 effects.acknowledge=(first,counts)=>actions.push(['acknowledge',first,counts]);
 effects.special=model=>{actions.push(['special',model]);return c.special;};
 const p=c.people[0];
 if(c.kind==='route')normalizePersonRoute(pool,p);
 if(c.kind==='attach')attachPersonOrder(pool,p,...c.args,effects);
 if(c.kind==='remove')removePersonOrder(pool,p,...c.args,effects);
 if(c.kind==='append')result=appendPersonOrders(pool,group.records[0],c.people,effects);
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
print(f'PASS: {len(cases)} native command comparisons: 1120 encodings, 576 route/attach/remove calls, 256 group commits, 2048 player appends; world effect leaves supplied')

# Small portable captures retain exact whole-pool identity without embedding 8 KB
# of mostly empty native records in each fixture.
portable=[]
for c,e in zip(cases,expected):
    if c['kind']=='append' and len(portable)<40 and (len(portable)==0 or len(c['people'])>0):
        e=dict(e);e['poolHash']=hashlib.sha256(bytes.fromhex(e.pop('pool'))).hexdigest()
        portable.append(dict(case=c,expected=e))
root.joinpath('tests/fixtures/player-order-append.json').write_text(json.dumps(portable,indent=2)+'\n')

# Complete player packet consumer with the queue/physics/voice leaves supplied.
# Check the native input branch independently of append's ownership comparisons.
# Frontend cursor advance precedes simulation packet application; descriptor
# 0x2000 commands then clear staging even if the frontend emitted a Ctrl packet.
input_actions=[]
def input_leaf(c,address,size,user):
    sp=c.reg_read(UC_X86_REG_ESP)
    if address==0x435780: input_actions.append(struct.unpack('<6I',c.mem_read(sp+4,24))[-1]&255)
    c.reg_write(UC_X86_REG_EIP,struct.unpack('<I',c.mem_read(sp,4))[0]);c.reg_write(UC_X86_REG_ESP,sp+4)
hooks=[cpu.hook_add(UC_HOOK_CODE,input_leaf,begin=a,end=a) for a in [0x435780,0x435c40,0x435cb0,0x47a550]]
inputs=[]
for model in [3,8,10,19,27,33]:
    for slot in range(8):
        for modifiers in range(8):
            ctrl,shift,alt=[bool(modifiers&bit) for bit in [1,2,4]]
            u=person(1);u['state']=25
            fixture(dict(kind='input',people=[u]))
            write(0x89bc7e,'B',0);write(0x89c6f0,'B',0)
            write(tribe+0x8bf,'BB',slot,slot)
            cpu.mem_write(0x895e00,bytes(128))
            packet=units+0x10000
            staged=ctrl and slot<7
            write(packet+4,'IIB',model,0x8080|(0 if alt else 0x20000)|(0x40000 if shift else 0),(0x37 if staged else 0x57)+slot)
            if staged:call(0x4358f0)
            input_actions.clear();call(0x444f60,tribe,packet)
            assert len(input_actions)==1
            inputs.append(dict(model=model,slot=slot,ctrl=ctrl,shift=shift,alt=alt,expected=dict(flags=input_actions[0],
                nextCursor=cpu.mem_read(tribe+0x8c0,1)[0],deselect=not bool(cpu.mem_read(units+256+0x7a,1)[0]&128))))
for hook in hooks:cpu.hook_del(hook)
js="""import {playerOrderInput} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>playerOrderInput(c.model,c.slot,c.ctrl,c.shift,c.alt))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(inputs).encode(),cwd=root))
for a,c in zip(actual,inputs):assert a==c['expected'],(a,c)
root.joinpath('tests/fixtures/ground-order-input.json').write_text(json.dumps(inputs,indent=2)+'\n')
print(f'PASS: {len(inputs)} complete player packet/cursor cases; native flags, Ctrl limit, Shift and Alt deselection')

# Resolve the actual release bindings through native context predicates.
table,entries=units+0x14000,units+0x15000
for i,address in enumerate([0x5d655c,0x5d6568]):
    binding=struct.unpack('<BIBBBI',cpu.mem_read(address,12))
    assert binding==(240,126+i,12,40+i*2,0,0x4ff480),binding
    scan,action,event,modifiers,gates,predicate=binding
    write(entries+i*15,'IBBIBI',action,event,modifiers,predicate,gates,entries+15 if i==0 else 0)
write(table+240*4,'I',entries)
write(0x89d17c,'I',0)
bindings=0
for mode in range(18):
    for blocked in [0,1]:
        write(0x89c6e7,'BB',mode,blocked)
        for event in [1,4]:
            for modifiers in range(8):
                cpu.reg_write(UC_X86_REG_ECX,table)
                expected=(127 if modifiers&2 else 126) if event==4 and (mode==16 or mode==12 and not blocked) else 0
                result=call(0x489470,240,modifiers,event)
                assert result==expected,(mode,blocked,event,modifiers,result,expected)
                bindings+=1
print(f'PASS: {bindings} native left-release binding/context/modifier lookups')
