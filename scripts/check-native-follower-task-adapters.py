"""Bounded read-only native G/task-category proof; no fixture/runtime writes.
Run with verified local Python: PYTHONDONTWRITEBYTECODE=1 python scripts/check-native-follower-task-adapters.py EXE
Allocator/queue consumers and outgoing input command emission are intercepted.
Key table, input case C1, guard producer 443b40 and classifier 4513e0 execute.
"""
import hashlib, json, struct, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]; executable=Path(sys.argv[1])
sys.path.insert(0,str(root/'scripts'))
from decomp import native_cpu
from capstone import Cs, CS_ARCH_X86, CS_MODE_32
from unicorn import UC_HOOK_CODE, __version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
cpu,identity=native_cpu(executable); cpu.mem_map(0x2000000,0x10000)
p,s,stack,stop,tribe=0x2000000,0x2000100,0x200f000,0x200ff00,0x89d1c8
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*v):
    write(stack,'I'*(len(v)+1),stop,*v);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return cpu.reg_read(UC_X86_REG_EAX)
report={'executable':str(executable),'sha256':hashlib.sha256(executable.read_bytes()).hexdigest(),'python':sys.version,'unicorn':unicorn_version,'keyRecord':{'address':'005d6220','bytes':bytes(cpu.mem_read(0x5d6220,12)).hex()},'classifier':[], 'context':[], 'input':[], 'guardProducer':[]}
assert report['sha256']=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert report['keyRecord']['bytes']=='67c100000011000000000000'
report['guardProducerBytes']=bytes(cpu.mem_read(0x443b40,0x1e7)).hex()
report['guardProducerDisassembly']=[f'{i.address:08x} {i.mnemonic} {i.op_str}' for i in Cs(CS_ARCH_X86,CS_MODE_32).disasm(bytes(cpu.mem_read(0x443b40,0x1e7)),0x443b40)]
write(p+0x2b,'B',2);write(p+0x2c,'B',10)
for status in (0,3,6,7,8,10,30):
    write(p+0xa7,'B',status);category=call(0x4513e0,p)
    assert category==(0 if status==0 else 4)
    report['classifier'].append({'state':10,'commandStatus':status,'category':category})
for state in (17,19):
    write(p+0x2c,'B',state);category=call(0x4513e0,p);assert category==2
    report['classifier'].append({'state':state,'category':category})
for people in (4,8,16,32,64,128,252):
    write(0x89c6f0,'B',0);write(0x89c665,'I',0x20000);write(tribe+0x93d,'I',0);write(tribe+0xc23,'B',people)
    write(0x895e7a,'I',0x140000);write(0x895e9d,'B',0);write(0x895ea0,'B',3);call(0x437750)
    model=read(0x895ea0,'B');assert model==(3 if people==128 else 30)
    report['context'].append({'flags':0x140000,'people':people,'commandModel':model})
events=[]
counts={0x436c20:0,0x438730:4,0x436ca0:1,0x436d00:3,0x433490:2,0x479cf0:3}
def leaf(c,a,size,u):
    sp=c.reg_read(UC_X86_REG_ESP);args=[read(sp+4+i*4,'I') for i in range(counts[a])]
    if a==0x438730:args[2]={'target':read(args[2],'H')}
    events.append([f'{a:08x}',args]);c.reg_write(UC_X86_REG_EAX,1 if a==0x436c20 else 0)
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in counts:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
write(0x89c6f0,'B',0)
for settings in (0,0x100000):
    write(0x895da8,'I',settings);events.clear();call(0x4aab80,0xc1,0,0)
    assert events==[['00479cf0',[0,0x82,int(not settings)]]]
    report['input'].append({'action':0xc1,'settings':settings,'events':list(events)})
for selected in (False,True):
    for retain in (False,True):
        cpu.mem_write(p,bytes(512));cpu.mem_write(tribe,bytes(0xc65))
        write(tribe+0x881,'I',p);write(tribe+0x89d,'I',s);write(p+8,'I',s)
        write(p+0x2a,'BB',1,2);write(s+0x2a,'BB',1,7);write(s+0x24,'H',73)
        write(p+0x2c,'B',10);write(p+0xa7,'B',30);write(p+0x8b,'H',1)
        write(p+0x7a,'B',128 if selected else 0);write(s+0x7a,'B',128)
        events.clear();call(0x443b40,0,int(retain))
        assert [e[0] for e in events]==(['00436c20','00438730','00436ca0','00436d00'] if selected else ['00433490','00436ca0'])
        if selected:assert events[1][1]==[1,30,{'target':73},0]
        assert read(p+0x7a,'B')==(128 if selected and retain else 0)
        report['guardProducer'].append({'selectedNonShaman':selected,'retainSelection':retain,'selectionAfter':read(p+0x7a,'B'),'events':list(events)})
report['limits']='Producer allocator, order preparation, order clear/attach, cancellation recovery, and outgoing tribe emission are intercepted. No Windows event loop, complete queue mutation, or browser gameplay equivalence is claimed. Existing exported 0043e8e0 case82 supplies the dispatch-to443b40 link.'
print(json.dumps(report,indent=2))
