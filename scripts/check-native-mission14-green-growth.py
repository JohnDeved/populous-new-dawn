"""Bounded original M14 Green construction producer stored origin.
Only available-worker count is intercepted. Tower owner and housing target are supplied
controlled fixtures; native header setup, startup script, building availability,
capacity traversal, producer and allocation execute. School admission and whole native settlement are not proved.
"""
import hashlib,json,struct,sys
from pathlib import Path
from decomp import native_cpu
from unicorn import UC_HOOK_CODE, __version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EIP,UC_X86_REG_ESP
exe=Path(sys.argv[1]).resolve()
header_path=exe.parent/'levels/levl2014.hdr'
script_path=exe.parent/'levels/cpscr037.dat'
root=Path(__file__).resolve().parents[1]
# Pin the native inputs, independently of fixture contents.
header=header_path.read_bytes()
level=json.loads((root/'app/level-fourteen.ts').read_text().split('export default ',1)[1].rstrip().rstrip(';'))
assert hashlib.sha256(header).hexdigest()==level['headerSha256']
assert hashlib.sha256(script_path.read_bytes()).hexdigest()=='429888ab958bfae4c7a1a41cf81d1b43471e9e583212591a782acf533d654ff9'
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
def initialize(count=0,state=2,target=9):
 cpu.mem_write(0x89b741,header);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x4855dc,0x48564d,count=10000);assert cpu.reg_read(UC_X86_REG_EIP)==0x48564d
 call(0x485e60,13)
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
# Imported immutable Shaman origin is distinct from the authored Tower latch.
shaman=next(o for o in level['objects'] if o['type']==1 and o['model']==7 and o['owner']==3)
loaded_origin=(((int((shaman['x']+8)*256)>>8)&254)|(int((-shaman['z']-8)*256)&0xfe00))
assert loaded_origin==0x3298
rows=[]
available=6
for name,established,origin in [('loaded',False,0x3298),('established',True,0x52de),('zero_established',True,0)]:
 initialize()
 write(ai+0x5a2,'H',0x3298)
 write(ai+0x36a,'H',origin if established else 0xbeef)
 write(ai+0x5b4,'B',int(established))
 if not established:write(ai+0x885,'I',0)
 assert call(0x4e5580,ai,0)==1
 assert read(ai+0x6c,'H')==origin,(name,hex(read(ai+0x6c,'H')))
 model=read(ai+0x68)
 assert model==(1 if established else 4),(name,model)
 assert read(0x89d178)==0x12345678
 rows.append(dict(name=name,origin=origin,requested=model))
for available in [0,1,2]:
 initialize()
 assert bool(call(0x4e5580,ai,0))==(available>=2)
 rows.append(dict(name='worker_boundary',available=available,allocated=available>=2))
available=6
for count,state,target,allowed in [(2,2,9,True),(3,2,9,False),(1,1,3,True)]:
 initialize(count,state,target)
 actual=call(0x4e5580,ai,0)
 assert bool(actual)==allowed,(count,state,target,actual)
 if allowed:assert read(ai+0x68)==1
 rows.append(dict(name='housing_capacity',count=count,state=state,target=target,allocated=bool(actual)))
print(json.dumps(dict(executable=identity,probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),unicornVersion=unicorn_version,pythonVersion=sys.version,headerSha256=hashlib.sha256(header).hexdigest(),scriptSha256=hashlib.sha256(script_path.read_bytes()).hexdigest(),cases=rows,intercepted=['004f67b0 available-worker count'],limits='Supplied Tower owner, not whole-game actor loading or construction timing.'),indent=2))
