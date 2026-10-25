"""Execute bounded native vehicle owner writers and Followers owner consumers.

Usage: python scripts/check-native-transport-ownership.py EXE [--output RECEIPT.json]
Non-recording: does not modify source, fixtures, assets or parity ledgers.
"""
from pathlib import Path
import argparse, sys, json, struct, hashlib
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
ROOT=next(parent for parent in Path(__file__).resolve().parents if (parent/'scripts/decomp.py').is_file())
sys.path.insert(0,str(ROOT/'scripts'))
from decomp import native_cpu, configure_native_constants
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('executable',type=Path)
parser.add_argument('--output',type=Path,help='Optional JSON evidence receipt; no fixtures are recorded')
args=parser.parse_args()
exe=args.executable.resolve()
cpu,identity=native_cpu(exe); configure_native_constants(cpu,exe)
assert identity['sha256']=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
cpu.mem_map(0x2000000,0x40000)
V,P,P2=0x2000000,0x2001000,0x2001100
STACK,STOP,TARGET=0x203d000,0x203e000,0x203f000
TRIBE=0x89d1c8
writes=[]; cases=[]; vectors=[]; phase='setup'
def w(a,f,*v): cpu.mem_write(a,struct.pack('<'+f,*v))
def r(a,f='I'): return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ret(value=0):
 sp=cpu.reg_read(UC_X86_REG_ESP); cpu.reg_write(UC_X86_REG_EIP,r(sp));cpu.reg_write(UC_X86_REG_ESP,sp+4);cpu.reg_write(UC_X86_REG_EAX,value)
def leaf(c,a,n,u): ret()
# Unrelated animation/list/terrain consumers supplied. Owner writes remain native.
leaves=[0x4d4040,0x4d8250,0x4ed6f0,0x4ed640,0x464ae0,0x4ee470,0x44e940,0x4ee700,
        0x4d42a0,0x51fed0,0x4e9050,0x4e6d00,0x4e0270,0x48a050,0x47a550]
for a in leaves: cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
def exit_target(c,a,n,u):
 sp=c.reg_read(UC_X86_REG_ESP); v=r(sp+4); out=r(sp+8)
 w(out,'HH',(r(v+0x3d,'H')+512)&65535,r(v+0x3f,'H'));ret(1)
cpu.hook_add(UC_HOOK_CODE,exit_target,begin=0x466190,end=0x466190)
def observe(c,access,a,size,value,u):
 if a<=V+0x2f<a+size or a<=V+0xa1<a+size:
  writes.append({'phase':phase,'pc':f'{c.reg_read(UC_X86_REG_EIP):08x}','offset':f'{a-V:x}','size':size,'value':value})
cpu.hook_add(UC_HOOK_MEM_WRITE,observe)
w(0x59df44,'I',0x2020000)
def call(a,*args,end=STOP):
 w(STACK,'I'*(1+len(args)),STOP,*args);cpu.reg_write(UC_X86_REG_ESP,STACK)
 cpu.emu_start(a,end,count=200000)
 assert cpu.reg_read(UC_X86_REG_EIP)==end,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)
def person(ptr,idx,owner,model=2,target=None,timer=0):
 cpu.mem_write(ptr,bytes(256));w(ptr+0x24,'H',idx);w(ptr+0x2a,'BBB',1,model,19)
 w(ptr+0x2f,'B',owner);w(ptr+0x10,'I',0x20000000);w(ptr+0x3d,'HHh',0x4100,0x4100,128)
 w(ptr+0x6e,'h',1000);w(ptr+0xb2,'B',((owner if target is None else target)<<6)|timer)
 w(0x890390+idx*4,'I',ptr)
def vehicle(model=1,apparent=3,real=3):
 global phase
 phase='setup'
 cpu.mem_write(V,bytes(256));w(V+0x24,'H',1);w(V+0x2a,'BBB',4,model,1)
 w(V+0x2f,'B',apparent);w(V+0xa1,'B',real);w(V+0x10,'I',0x20000000)
 w(V+0x3d,'HHh',0x4100,0x4100,128);w(0x890390+4,'I',V);w(V+0x92,'I',0x20000);w(TARGET,'HH',0x4300,0x4100)
def snap(): return {'vehicleModel':r(V+0x2b,'B'),'vehicleId':r(V+0x24,'H'),'real':r(V+0xa1,'B'),'apparent':r(V+0x2f,'B'),'count':r(V+0x9e,'B'),'slots':list(struct.unpack('<5H',cpu.mem_read(V+0x7a,10)))}
def owner_input(p): return {'id':r(p+0x24,'H'),'tribe':r(p+0x2f,'B'),'model':r(p+0x2b,'B'),'disguise':r(p+0xb2,'B')}
def vector(action,before,p=None,**extra):
 vectors.append({'action':action,'before':before,'person':owner_input(p) if p else None,'expected':snap(),**extra})
def check(name,real,apparent,count):
 s=snap();assert (s['real'],s['apparent'],s['count'])==(real,apparent,count),(name,s)
 cases.append({'case':name,**s})
# Init clones the supplied +2f owner into +a1.
for model in (1,3):
 for owner in range(4):
  vehicle(model,owner,99); before=snap();phase=f'init-{model}-{owner}';call(0x463ba0,V);check(phase,owner,owner,0);vector('initialize',before)
# Every successful boarding, first and later, overwrites both owners.
for model in (1,3):
 for spy,timer in [(False,0),(True,0),(True,63),(True,1)]:
  vehicle(model);person(P,2,0,5 if spy else 2,2,timer)
  before=snap();phase=f'first-model{model}-spy{spy}-timer{timer}';assert call(0x4657d0,P,V)&255;check(phase,0,2 if spy else 0,1);vector('board',before,P)
  person(P2,3,1,5 if spy else 2,3,timer)
  before=snap();phase=f'later-model{model}-spy{spy}-timer{timer}';assert call(0x4657d0,P2,V)&255;check(phase,1,3 if spy else 1,2);vector('board',before,P2)
# Removal changes only real owner, even removing driver with different-tribe successor.
for remove_driver in (False,True):
 vehicle();person(P,2,0,5,2,63);person(P2,3,1,5,3,63)
 call(0x4657d0,P,V);call(0x4657d0,P2,V)
 out=P if remove_driver else P2;other=P2 if remove_driver else P
 before=snap();phase=f'unboard-driver{remove_driver}';assert call(0x4659d0,V,out,TARGET)==out;check(phase,0 if remove_driver else 1,3,1);vector('unboard',before,out)
 assert r(out+0x9f,'H')==0
 before=snap();phase=f'unboard-last-driver{remove_driver}';call(0x4659d0,V,other,TARGET);check(phase,1 if remove_driver else 0,3,0);vector('unboard',before,other)
 person(P,2,2,2);before=snap();phase=f'reuse-after-driver{remove_driver}';call(0x4657d0,P,V);check(phase,2,2,1);vector('board',before,P)
# Native command-16 dispatch from real 00432590 entry, stopping before queue completion.
vehicle();person(P,2,0,5,1,0);call(0x4657d0,P,V)
w(P+0x2e,'B',1);w(P+0x9b,'H',1);w(P+0xa7,'B',16);w(0x938830+10,'BBHHHH',16,0,0,0,2,0)
before=snap();phase='command16-aboard';call(0x432590,P,end=0x432a3e);check(phase,0,2,1);vector('command16',before,P,target=2,disguiseBefore=64)
assert r(P+0xb2,'B')==191 and call(0x4de720,P)==0 and call(0x4de740,P)==2
before=snap();before_writes=len(writes)
for tick in range(63):
 phase=f'timer-{tick+1}';call(0x4d32b0,P,end=0x4d336e)
check('timer-expired-aboard',0,2,1);assert call(0x4de720,P)==2;assert len(writes)==before_writes;vector('timer63',before,P,disguiseBefore=191,ticks=63)
before=snap();phase='reveal-leaf-aboard';call(0x4de7f0,P);check(phase,0,2,1);assert r(P+0xb2,'B')==0;vector('revealLeaf',before,P,disguiseBefore=128)
# Native destruction-state initializer empties all slots through native unboard.
for model,state in [(1,5),(3,6)]:
 vehicle(model);cap=r(0x5a7938+model*23+8,'B')
 for i in range(cap):
  p=P+i*256;person(p,i+2,i%4,5,(i+1)%4,63);call(0x4657d0,p,V)
 before=snap();occupants=[owner_input(P+i*256) for i in range(cap)];apparent=snap()['apparent'];phase=f'destroy-model{model}';w(V+0x2c,'B',state);call(0x463370,V)
 check(phase,(cap-1)%4,apparent,0);vector('destruction',before,occupants=occupants)
 assert all(r(P+i*256+0x9f,'H')==0 for i in range(cap))
 # A still-allocated wreck remains a vehicle-presence entry, with zero occupancy.
 w(V+4,'I',0);w(0x890324,'I',V);w(0x890330,'I',0)
 cpu.mem_write(TRIBE,bytes(4*0xc65));w(0x89c6f0,'B',(cap-1)%4);w(0x89d17c,'I',32);w(0x89d188,'I',1)
 call(0x4ecac0);w(0x89d17c,'I',0)
 t=(cap-1)%4;flag=256 if model==1 else 512
 assert r(TRIBE+t*0xc65+0x941)&flag
 base=0x89dd9f if model==1 else 0x89ddc3
 assert r(base+t*0xc65,'h')==0
 cases.append({'case':f'destroyed-allocated-row-model{model}','presenceFlag':flag,'owner':t,'occupiedCount':0})
# Count rebuild uses real +a1; search uses apparent +2f.
for model in (1,3):
 vehicle(model);person(P,2,0,5,2,63);call(0x4657d0,P,V)
 w(P+4,'I',V);w(V+4,'I',0);w(0x890324,'I',P);w(0x890330,'I',0)
 cpu.mem_write(TRIBE,bytes(4*0xc65));w(0x89c6f0,'B',0);w(0x89d17c,'I',32);w(0x89d188,'I',1)
 phase=f'rebuild-model{model}';call(0x4ecac0);w(0x89d17c,'I',0)
 base=0x89dd9f if model==1 else 0x89ddc3
 counts=[r(base+t*0xc65,'h') for t in range(4)]
 assert counts==[1,0,0,0],counts
 found=[call(0x4514f0,t,model,5,TRIBE+0x24,0) for t in range(4)]
 assert found==[0,0,V,0],found
 cases.append({'case':phase,'countsByTribe':counts,'searchTribes':[i for i,v in enumerate(found) if v==V]})
receipt={'executable':identity,'constantSha256':hashlib.sha256((exe.parent/'levels/constant.dat').read_bytes()).hexdigest(),
 'probeSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'cases':cases,'ownerWrites':writes,'ownerContractVectors':vectors,
 'intercepts':[f'{a:08x}' for a in leaves]+['00466190 exit target supplied'],
 'boundaries':['Synthetic allocated-object storage and animation table supplied.','Command16 enters native dispatcher but stops at shared completion 00432a3e.','Spy timer executes native updater prefix through 004d336e, with unrelated prefix calls supplied.','Destruction initializes states 5/6, does not execute terrain-dependent final disposal or allocator free-list reuse.']}
if args.output:
 args.output.parent.mkdir(parents=True,exist_ok=True)
 args.output.write_text(json.dumps(receipt,indent=2)+'\n')
else:
 print(json.dumps(receipt,indent=2))
print('PASS:',len(cases),'native vehicle owner cases')
