"""Bounded original-native command30 composition; no runtime/fixture writes.

Uses the retained native_cpu loader. G producer, queue allocation/preparation/
clear/attach/remove, preparation/state initialization, guard processor, selection,
and animation setters run as executable instructions. Destination planning is an
explicit supplied leaf. No physics, world scheduler, OS or browser claim.
Run: timeout 60s taskset -c 4 env PYTHONDONTWRITEBYTECODE=1 PYTHON EXE REPO
"""
import hashlib, json, struct, sys, time
from collections import deque
from pathlib import Path

exe, root = Path(sys.argv[1]), Path(sys.argv[2])
sys.path.insert(0, str(root / 'scripts'))
from decomp import native_cpu, configure_native_constants
from capstone import Cs, CS_ARCH_X86, CS_MODE_32, __version__ as capstone_version
from unicorn import UC_HOOK_CODE, __version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX, UC_X86_REG_ESI, UC_X86_REG_EBX

cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x20000)
p, s, packet, counts, stack, stop = 0x2000000, 0x2000100, 0x2000200, 0x2008000, 0x201d000, 0x201e000
tribe, pool = 0x89d1c8, 0x938830
rules = json.loads((root / 'app/original-rules.json').read_text())
events, recent = [], deque(maxlen=12)
fields = {'id':(0x24,'H'), 'class':(0x2a,'B'), 'model':(0x2b,'B'),
          'state':(0x2c,'B'), 'substate':(0x2d,'B'), 'counter':(0x2e,'B'),
          'flags2':(0xc,'I'), 'flags3':(0x14,'I'), 'flags4':(0x10,'I'),
          'x':(0x3d,'H'), 'y':(0x3f,'H'), 'goalX':(0x4f,'H'), 'goalY':(0x51,'H'),
          'speed':(0x5f,'h'), 'target':(0x72,'H'), 'assignment':(0x76,'H'),
          'selection':(0x7a,'B'), 'cursor':(0xa6,'B'), 'status':(0xa7,'B'),
          'source':(0x33,'H'), 'renderFlags':(0x35,'H'), 'f1':(0x37,'h'),
          'f2':(0x39,'B'), 'draw':(0x3a,'B'), 'stamp':(0x18,'I')}

def write(a, fmt, *v): cpu.mem_write(a, struct.pack('<' + fmt, *v))
def read(a, fmt): return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]
def snap():
    d = {k:read(p+off,fmt) for k,(off,fmt) in fields.items()}
    d.update(commands=list(struct.unpack('<8H', cpu.mem_read(p+0x8b,16))),
             immediate=read(p+0x9b,'H'), guardCount=read(tribe+0x917,'h'),
             poolCursor=read(0x96aa78,'H'), poolActive=read(0x96aa7a,'H'))
    d['orders'] = [dict(zip(('model','flags','references','object','a','b'),
                           struct.unpack('<BB4H',cpu.mem_read(pool+i*10,10)))) for i in range(4)]
    return d
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args])
    cpu.reg_write(UC_X86_REG_ESP,stack)
    try: cpu.emu_start(a,stop,timeout=1000000,count=2000000)
    except Exception:
        print(json.dumps({'failureEntry':hex(a),'eip':hex(cpu.reg_read(UC_X86_REG_EIP)),
                          'recent':list(recent),'events':events,'snapshot':snap()},indent=2),file=sys.stderr)
        raise
    assert cpu.reg_read(UC_X86_REG_EIP)==stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)

observed = {0x443b40:'G-producer',0x436c20:'allocate-order',0x438730:'prepare-order',
            0x436ca0:'clear-orders',0x436d00:'attach-order',0x4364d0:'remove-order',
            0x4d42a0:'prepare-person',0x4ed640:'initialize-class',0x4d2740:'initialize-person',
            0x432260:'start-orders',0x432df0:'configure-order',0x432590:'step-orders',
            0x43daa0:'guard',0x433490:'cancel-anchor',0x4366b0:'advance-order',
            0x4e32a0:'state-after-orders',0x4d4f40:'recover-movement',0x4d4ee0:'stop-movement',
            0x4d6f90:'idle-approach-entry',0x4d7330:'resting-entry',0x518200:'resting-collision',
            0x4d3ea0:'state-animation',0x4d4040:'upper-setter',0x4ee700:'source-setter',
            0x4ee7b0:'animation-visit'}
leaves = {0x4e9d80:'destination-planning',0x47a550:'selection-ui-refresh',0x48a050:'selection-voice'}
def hook(c,a,size,u):
    recent.append(hex(a))
    if a not in observed and a not in leaves: return
    sp=c.reg_read(UC_X86_REG_ESP)
    args=list(struct.unpack('<4I',cpu.mem_read(sp+4,16)))
    event={'name':observed.get(a,leaves.get(a)),'address':f'{a:08x}','before':snap()}
    if a in (0x4d4040,0x4ee700,0x436d00,0x438730): event['args']=args
    if a in leaves:
        event['supplied']=True
        if a==0x4e9d80:
            q=args[1]; event['point']=[read(q,'H'),read(q+2,'H')]
            cpu.mem_write(args[0]+0x4f,bytes(cpu.mem_read(q,4)))
            cpu.mem_write(args[0]+0x53,bytes(cpu.mem_read(q,4)))
        c.reg_write(UC_X86_REG_EAX,0)
        c.reg_write(UC_X86_REG_EIP,read(sp,'I')); c.reg_write(UC_X86_REG_ESP,sp+4)
    events.append(event)
cpu.hook_add(UC_HOOK_CODE,hook)

starts=list(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()))
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()))
frame_counts=[]
for start,_ in starts:
    frame=start; seen=set()
    while frame and frame not in seen:
        assert frame<len(frames); seen.add(frame); frame=frames[frame][-1]
    assert frame in (0,start)
    frame_counts.append(len(seen)&255)
write(0x59df44,'I',counts)
for i,n in enumerate(frame_counts): write(counts+i*6+1,'B',n)

def fixture(f1=1,f2=3,selected=True,state=19):
    cpu.mem_write(p,bytes(0x300)); cpu.mem_write(tribe,bytes(4*0xc65))
    cpu.mem_write(pool,bytes(8000)); cpu.mem_write(0x890390,bytes(4096))
    cpu.mem_write(0x8a03e4,bytes(16384*16))
    write(0x96aa74,'I',0x96aaba);cpu.mem_write(0x96aaba,b'\xff'*8192)
    write(0x96aa78,'HH',1,0);write(0x89c6f0,'B',0);write(0x89d17c,'I',0)
    write(0x895da4,'I',0x50000) # suppress formation/footprint world effects, not guard/setters
    write(0x895da8,'I',0);write(0x89d178,'I',0x11223344)
    write(0x89c661,'I',0);write(0x897981,'I',0)
    write(tribe+0x881,'I',p);write(tribe+0x89d,'I',s)
    for ptr,id,model in ((p,1,6),(s,73,7)):
        write(ptr+0x24,'H',id);write(ptr+0x2a,'BBB',1,model,state)
        write(ptr+0x30,'B',rules['personModels'][model]['physics'])
        write(ptr+0x3d,'HH',4096 if ptr==p else 4196,4096)
        write(0x890390+id*4,'I',ptr)
    write(p+8,'I',s);write(p+0x7a,'B',128 if selected else 0)
    write(p+0x14,'I',0x40000);write(p+0x33,'HHhBB',48,0x100,f1,f2,18)
    write(p+0x4f,'HH',4096,4096);write(p+0x68,'HH',4096,4096)
    events.clear()

report={'identity':identity,'python':sys.version,'unicorn':unicorn_version,'capstone':capstone_version,
        'inputs':{},'cases':[],'limits':__doc__,'suppliedLeaves':{f'{a:08x}':n for a,n in leaves.items()}}
report['command30Descriptor']={'address':f'{0x5a7dca+30*0x16:08x}',
    'flags':read(0x5a7dca+30*0x16,'I')}
for path in [exe,exe.parent/'levels/constant.dat',exe.parent/'data/vstart-0.ani',
             exe.parent/'data/vfra-0.ani',root/'scripts/decomp.py',Path(__file__),
             root/'app/original-rules.json',root/'app/original-constants.json']:
    report['inputs'][str(path)] = hashlib.sha256(path.read_bytes()).hexdigest()
def step(label,address,*args):
    before=snap();raw_before=bytes(cpu.mem_read(p,256));events.clear();value=call(address,*args)
    raw_after=bytes(cpu.mem_read(p,256))
    d={'label':label,'entry':f'{address:08x}','returnLowByte':value&255,
       'before':before,'after':snap(),'events':list(events),
       'personByteChanges':[i for i,(a,b) in enumerate(zip(raw_before,raw_after)) if a!=b]}
    report['cases'][-1]['steps'].append(d)
    return d
def new_case(label,**kwargs):
    fixture(**kwargs);report['cases'].append({'label':label,'fixture':kwargs,'steps':[]})

for f1,f2 in [(1,3),(7,5),(0,2)]:
    new_case(f'G-retain-deselect-{f1}-{f2}',f1=f1,f2=f2)
    g=step('G selected, retain selection',0x443b40,0,1)
    assert g['after']['commands'][0]==1 and g['after']['orders'][1]['model']==30
    assert g['after']['orders'][1]['a']==73 and g['after']['orders'][1]['references']==1
    assert (g['after']['f1'],g['after']['f2'])==(f1,f2)
    started=step('native person preparation adopts queued G',0x4d42a0,p)
    assert started['after']['state']==10 and started['after']['status']==30
    assert started['after']['target']==73 and started['after']['guardCount']==1
    first=step('first guard dispatch',0x432590,p)
    assert first['after']['source']==40 and first['after']['f1']==0
    assert first['after']['f2']==(f2 if f2<4 else 0)
    write(packet+4,'IIB',1,1,0x7b)
    deselected=step('native Ctrl-click deselect',0x43e8e0,tribe,packet)
    assert deselected['after']['selection']==0
    assert all(i in (*range(0x14,0x18),0x7a) for i in deselected['personByteChanges'])
    assert {k:v for k,v in deselected['after'].items() if k not in ('selection','flags3')}=={k:v for k,v in deselected['before'].items() if k not in ('selection','flags3')}
    near=step('near-target guard visit at counter0',0x432590,p)
    assert near['after']['status']==30 and near['after']['commands'][0]==1
    assert not near['after']['flags2']&0x2000000
    assert (near['after']['f1'],near['after']['f2'])==(near['before']['f1'],near['before']['f2'])
    # Supplied eligible stamp: this tests the animation consumer, not the complete dispatcher.
    for tick in range(1,5):
        write(0x897981,'I',tick);write(p+0x18,'I',tick)
        step(f'eligible animation visit {tick}',0x4ee7b0,p)
    cancel=step('G with no selected follower cancels guard',0x443b40,0,1)
    assert cancel['after']['commands']==[0]*8 and cancel['after']['status']==0
    assert cancel['after']['poolActive']==0 and cancel['after']['guardCount']==0

for retain in (0,1):
    new_case(f'G-selection-mode-{retain}')
    step('G',0x443b40,0,retain)
    assert snap()['selection']==(128 if retain else 0)
    step('prepare',0x4d42a0,p);step('first dispatch',0x432590,p)
    if retain:
        old=snap()['commands'][0]
        repeat=step('G again while selected replaces guard, does not cancel',0x443b40,0,1)
        assert repeat['after']['commands'][0]!=old
        assert repeat['after']['orders'][repeat['after']['commands'][0]]['model']==30
        assert repeat['after']['poolActive']==1

new_case('no-follower-selection-before-adoption')
step('G selected',0x443b40,0,1)
write(packet+4,'IIB',1,1,0x7b)
step('deselect before preparation',0x43e8e0,tribe,packet)
pending=step('G does not cancel a still-state19 queued order',0x443b40,0,1)
assert pending['after']['commands'][0]==1 and pending['after']['state']==19
step('prepare adopts it',0x4d42a0,p)
write(s+0x7a,'B',128)
cancel=step('Shaman-only selection cancels adopted guard',0x443b40,0,1)
assert cancel['after']['commands']==[0]*8 and cancel['after']['status']==0

for loss in ('flags1','class0','vehicle'):
    new_case(f'target-loss-{loss}')
    step('G',0x443b40,0,1);step('prepare',0x4d42a0,p);step('first dispatch',0x432590,p)
    if loss=='flags1':write(s+0xc,'I',1)
    elif loss=='class0':write(s+0x2a,'B',0)
    else:write(s+0x9f,'H',99)
    lost=step('guard target invalid',0x432590,p)
    assert lost['after']['status']==0 and lost['after']['commands']==[0]*8
    assert lost['after']['poolActive']==0 and lost['after']['guardCount']==0
    assert lost['returnLowByte']==rules['personModels'][6]['idleState']

# Execute the original state10 switch body through the actual common state
# transition, stopping before health/combat/world consumers. No manually applied
# next state or supplied resting/animation consumer. ESI is the documented person
# register, and case9 is state10 in the native state-minus-one switch.
state10_entry=read(0x4d3d18+9*4,'I')
report['state10Segment']={'entry':f'{state10_entry:08x}','stop':'004d3b1c',
    'entryContract':'ESI=person; real jump-table case9 of person state-minus-one switch',
    'excluded':'person preamble including physics and common tail after initializer'}
for loss in ('target-dead','G-cancel'):
    new_case(f'composed-reentry-{loss}',f1=1,f2=3)
    step('G',0x443b40,0,1);step('prepare',0x4d42a0,p);step('first dispatch',0x432590,p)
    if loss=='target-dead':write(s+0xc,'I',1)
    else:
        write(packet+4,'IIB',1,1,0x7b)
        step('native deselect',0x43e8e0,tribe,packet)
        step('G cancel',0x443b40,0,1)
    write(p+0x37,'h',1) # explicit arbitrary phase immediately before re-entry
    before=snap();events.clear();cpu.reg_write(UC_X86_REG_ESI,p)
    cpu.reg_write(UC_X86_REG_EBX,0x12345678);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(state10_entry,0x4d3b1c,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==0x4d3b1c
    after=snap()
    report['cases'][-1]['steps'].append({'label':'native state10 body and common owner transition',
        'entry':f'{state10_entry:08x}','stop':'004d3b1c','before':before,'after':after,'events':list(events)})
    assert after['state'] in (17,19) and after['status']==0
    assert after['source']==48 and after['f1']==0 and after['f2']==3

print(json.dumps(report,indent=2))
