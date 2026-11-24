"""Bounded original M11 Matak repeated housing producer and capacity gates.
Only available-worker count is intercepted. Tower/house owners are supplied
controlled fixtures; native header setup, startup script, building availability,
capacity traversal, producer and allocation execute. Not a whole native settlement.
"""
import hashlib,json,struct,sys
from pathlib import Path
from decomp import native_cpu
from unicorn import UC_HOOK_CODE, __version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EIP,UC_X86_REG_ESP
exe=Path(sys.argv[1]).resolve()
header_path=exe.parent/'levels/levl2011.hdr'
script_path=exe.parent/'levels/cpscr022.dat'
root=Path(__file__).resolve().parents[1]
# Pin the native inputs, independently of fixture contents.
header=header_path.read_bytes()
level=json.loads((root/'app/level-eleven.ts').read_text().split('export default ',1)[1].rstrip().rstrip(';'))
assert hashlib.sha256(header).hexdigest()==level['headerSha256']
assert hashlib.sha256(script_path.read_bytes()).hexdigest()=='ba0b39d07de48ac2493d75b8ae01225707a7443dd828f276b4a4dbdef2d43bc5'
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x60000)
ai,program,building,stack,stop=0x2000000,0x2010000,0x2020000,0x205d000,0x205e000
def write(p,fmt,*v):cpu.mem_write(p,struct.pack('<'+fmt,*v))
def read(p,fmt='I'):return struct.unpack('<'+fmt,cpu.mem_read(p,struct.calcsize('<'+fmt)))[0]
def call(p,*v):
 write(stack,'I'*(len(v)+1),stop,*v);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(p,stop,count=500000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
 return cpu.reg_read(UC_X86_REG_EAX)
def available_leaf(*_):
 sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,available)
 cpu.reg_write(UC_X86_REG_EIP,read(sp));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,available_leaf,begin=0x4f67b0,end=0x4f67b0)
def initialize(count=0,state=2,target=20):
 cpu.mem_write(0x89b741,header);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x4855dc,0x48564d,count=10000);assert cpu.reg_read(UC_X86_REG_EIP)==0x48564d
 call(0x485e60,10)
 cpu.mem_write(ai,bytes(0xc65));cpu.mem_write(program,script_path.read_bytes())
 write(ai+0xc22,'B',3);write(0x89d188,'I',0);call(0x48c6b0,ai,program)
 assert call(0x408dd0,1,3)!=0
 write(ai+0x885,'I',building);write(ai+0x36a,'H',0xda7a);write(ai+0x5b4,'B',1)
 write(0x9607ea+3*48+10,'B',target)
 for i in range(count+1):
  p=building+i*0x100;cpu.mem_write(p,bytes(0x100))
  write(p+8,'I',p+0x100 if i<count else 0)
  write(p+0x2a,'BBB',2,4 if i==0 else 1,2 if i==0 else state)
  write(p+0x2d,'B',3)
 write(0x89d178,'I',0x12345678)
rows=[]
available=6
for name,count,state,target,allowed in [('first',0,2,20,True),('one_complete',1,2,20,True),('six_complete',6,2,20,True),('seven_complete',7,2,20,False),('exact_capacity',1,2,3,False),('unfinished_excluded',1,1,3,True)]:
 initialize(count,state,target)
 actual=call(0x4e5580,ai,0)
 assert bool(actual)==allowed,(name,actual,read(0x9607ea+3*48+10,'B'))
 if allowed:assert read(ai+0x68)==1
 assert read(0x89d178)==0x12345678
 rows.append(dict(name=name,allocated=bool(actual)))
initialize()
for slot in range(4):
 assert call(0x4e5580,ai,slot)==1,slot
 assert read(ai+slot*0x52+0x68)==1
assert call(0x4e5580,ai,4)==0
rows.append(dict(name='four_requests_then_concurrency_limit',requests=4))
for available in [0,1,2]:
 initialize(1)
 assert bool(call(0x4e5580,ai,0))==(available>=2)
 rows.append(dict(name='worker_boundary',available=available,allocated=available>=2))
print(json.dumps(dict(executable=identity,probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),unicornVersion=unicorn_version,pythonVersion=sys.version,headerSha256=hashlib.sha256(header).hexdigest(),scriptSha256=hashlib.sha256(script_path.read_bytes()).hexdigest(),cases=rows,intercepted=['004f67b0 available-worker count'],limits='Supplied linked building fixtures, not whole-game/actor loading or construction timing.'),indent=2))
