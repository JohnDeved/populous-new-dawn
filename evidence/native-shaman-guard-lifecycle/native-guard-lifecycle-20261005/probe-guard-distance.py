"""Original 0043daa0 signed-coordinate distance boundaries, read-only native probe.
Compare executed native decisions with explicit signed-int subtraction and with
the current port's Math.abs(short(a-b)) expression. Does not execute TypeScript.
Destination/recovery are observed supplied leaves; adjacent empty-land lookup
runs natively. Existing baseline lifecycle probe/results are not modified.
"""
import hashlib,json,struct,sys,time
from pathlib import Path
root,exe=Path(sys.argv[2]),Path(sys.argv[1]);sys.path.insert(0,str(root/'scripts'))
from decomp import native_cpu
from unicorn import UC_HOOK_CODE,__version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x10000)
p,s,order,stack,stop=0x2000000,0x2000100,0x2000200,0x200e000,0x200f000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
events=[]
def leaf(c,a,n,u):
 sp=c.reg_read(UC_X86_REG_ESP);name={0x4e9d80:'destination',0x4d4f40:'recover'}[a]
 events.append(name);c.reg_write(UC_X86_REG_EAX,0)
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x4e9d80,0x4d4f40):cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
def short(v):return ((v+32768)&65535)-32768
def sub32(a,b):return short(a)-short(b)
def wrapped(a,b):return short(a-b)
def predicted(person,target,goal,delta):
 near=abs(delta(target[0],person[0]))<824 and abs(delta(target[1],person[1]))<824
 return {'pursuit':not near,'formation':not near,
         'destination':not near and (abs(delta(target[0],goal[0]))>=440 or abs(delta(target[1],goal[1]))>=440)}
cases=[]
def add(label,person,target,goal=None):cases.append((label,person,target,target if goal is None else goal))
for axis in (0,1):
 for d in (-824,-823,823,824):
  q=[4096,4096];t=q.copy();t[axis]+=d
  add(f'near-axis{axis}-delta{d}',q,t)
for a,b in [(32767,32768),(32768,32767),(0,32768),(32768,0),(65535,0),(0,65535),
            (32768,33591),(32768,33592),(32768,31945),(32768,31944)]:
 add(f'signed-edge-person{a}-target{b}',[a,4096],[b,4096])
for axis in (0,1):
 for d in (-440,-439,439,440):
  target=[10000,10000];goal=target.copy();goal[axis]+=d
  add(f'replan-axis{axis}-delta{d}',[4096,4096],target,goal)
for a,b in [(32767,32768),(32768,32767)]:
 add(f'replan-signed-edge-goal{a}-target{b}',[0,4096],[b,4096],[a,4096])
report={'identity':identity,'python':sys.version,'unicorn':unicorn_version,'cases':[],
        'suppliedLeaves':{'004e9d80':'record destination request, no mutation',
                          '004d4f40':'record recovery, no mutation (not reached)'},
        'limits':__doc__,'sourceHashes':{}}
for path in (Path(__file__),exe,root/'scripts/decomp.py',root/'app/live-movement.ts'):
 report['sourceHashes'][str(path)]=hashlib.sha256(path.read_bytes()).hexdigest()
for label,person,target,goal in cases:
 cpu.mem_write(p,bytes(0x300));cpu.mem_write(0x8a03e4,bytes(16384*16))
 write(0x890390+73*4,'I',s);write(p+0x72,'H',73);write(p+0x2d,'BB',1,0)
 write(p+0x3d,'HH',*[x&65535 for x in person]);write(p+0x4f,'HH',*[x&65535 for x in goal])
 write(p+0x5f,'h',1);write(p+0xc,'I',0x2000000);write(p+0x76,'H',8)
 write(s+0x2a,'BB',1,7);write(s+0x3d,'HH',*[x&65535 for x in target]);write(order,'B',30)
 events.clear();write(stack,'III',stop,p,order);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x43daa0,stop,timeout=1000000,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop and cpu.reg_read(UC_X86_REG_EAX)&255==0
 actual={'pursuit':bool(read(p+0xc,'I')&0x2000000),'formation':bool(read(p+0x76,'H')&8),'destination':'destination' in events}
 expected=predicted(person,target,goal,sub32);port_expression=predicted(person,target,goal,wrapped)
 assert actual==expected,(label,actual,expected)
 assert 'recover' not in events
 report['cases'].append({'label':label,'person':person,'target':target,'goal':goal,
                        'native':actual,'nativeSigned32Prediction':expected,
                        'currentPortExpression':port_expression,'matchesPortExpression':actual==port_expression})
report['differences']=[c['label'] for c in report['cases'] if not c['matchesPortExpression']]
assert report['differences']==['signed-edge-person32767-target32768','signed-edge-person32768-target32767',
                             'signed-edge-person32768-target31945',
                             'replan-signed-edge-goal32767-target32768','replan-signed-edge-goal32768-target32767']
print(json.dumps(report,indent=2))
