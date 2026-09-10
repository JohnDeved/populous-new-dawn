"""Execute Blast arrival through the native active-list dispatcher.
Usage: python scripts/check-native-blast-impact.py EXE [--record]
Real projectile/spell/effect controllers, wave search/damage and list traversal.
Allocation prepends supplied records; deletion unlinks them. Person bodies report
impulse eligibility instead of moving; unrelated world systems are supplied.
Only wave/flash/tail allocation succeeds. This is one bounded object ordering,
not a complete allocator, person-physics or whole-game scheduling oracle.
"""
import hashlib,sys,struct,json
from pathlib import Path
from decomp import native_cpu,configure_native_constants
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
exe=Path(sys.argv[1]);c,_=native_cpu(exe);configure_native_constants(c,exe);c.mem_map(0x2000000,0x40000)
base,stack,stop,thunk=0x2000000,0x203d000,0x203e000,0x2030000
write=lambda a,f,*v:c.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,c.mem_read(a,struct.calcsize('<'+f)))[0]
addr=lambda i:base+i*256
turn=0;next_id=10;events=[]
def ret(value=0):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EAX,value);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
def unlink(p):
 prev,nxt=read(p,'I'),read(p+4,'I')
 if prev:write(prev+4,'I',nxt)
 else:write(0x890324,'I',nxt)
 if nxt:write(nxt,'I',prev)
 write(p+0x2a,'B',0);write(p+12,'I',read(p+12,'I')|1)
def alloc(cls,model,tribe,point):
 global next_id
 p=addr(next_id);c.mem_write(p,bytes(256));write(0x890390+next_id*4,'I',p);write(p+0x24,'H',next_id);next_id+=1
 write(p+0x2a,'BBB',cls,model,1);write(p+0x2f,'B',tribe);c.mem_write(p+0x3d,bytes(c.mem_read(point,6)))
 old=read(0x890324,'I');write(p+4,'I',old)
 if old:write(old,'I',p)
 write(0x890324,'I',p)
 return p
outer=[0x418e30,0x4e4f40,0x41b230,0x436db0,0x493af0,0x4ec3b0,0x501000,0x518630,0x489e50,0x404c50,0x518fb0,0x403280,0x478ee0,0x4bbf30,0x5028b0,0x4ef7f0,0x4f0460,0x4ecac0,0x401350,0x401b40,0x504660,0x502090,0x4fc020,0x41cb40,0x44df40,0x4f0bd0,0x4f0e00,0x4ec390,0x450a70,0x41a550,0x41c6d0,0x4f42c0]
leaves=[0x4ed6f0,0x4ed640,0x48a050,0x4010b0,0x4d3ea0,0x4d4040,0x4ed8a0,0x4edcf0,0x4ef180,0x4d32b0]
def hook(c,a,size,u):
 global thunk
 sp=c.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I')
 if a==0x4ed8a0:
  cls,model,tribe=[read(sp+i*4,'I')&255 for i in [1,2,3]];events.append([turn,'allocate',cls,model])
  if cls!=7 or model not in (78,38,10):ret();return
  q=alloc(cls,model,tribe,read(sp+16,'I'))
  code=b'\x68'+struct.pack('<I',q)+b'\xb8'+struct.pack('<I',0x509c10)+b'\xff\xd0\x83\xc4\x04\xb8'+struct.pack('<I',q)+b'\xc3'
  c.mem_write(thunk,code);c.reg_write(UC_X86_REG_EIP,thunk);thunk+=32;return
 if a in (0x4edcf0,0x4ef180):
  events.append([turn,'remove',read(p+0x24,'H'),read(p+0x2a,'B'),read(p+0x2b,'B')]);unlink(p)
 if a==0x4d32b0:
  events.append([turn,'person',read(p+0x24,'H'),bool(read(p+12,'I')&0x80000)])
  ret();return
 if a==0x48a050:events.append([turn,'sound',read(sp+8,'I')])
 ret()
for a in outer+leaves:c.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
# Flat first-mission-like land, a waiting spell, its newer projectile, older people.
land=bytearray(16384*16)
for i in range(16384):struct.pack_into('<Ih',land,i*16,8,128)
c.mem_write(0x8a03e4,bytes(land));c.mem_write(0x8929cd,(exe.parent/'data/mwsearch.dat').read_bytes())
for i,cls,model,state,tribe,x in [(1,8,4,4,0,2304),(2,11,2,1,0,2304),(3,1,2,10,1,3072),(4,1,2,10,0,3072)]:
 p=addr(i);write(0x890390+i*4,'I',p);write(p,'II',addr(i-1) if i>1 else 0,addr(i+1) if i<4 else 0);write(p+0x24,'H',i);write(p+0x2a,'BBB',cls,model,state);write(p+0x2f,'B',tribe);write(p+0x3d,'HHh',x,2304,128)
 if cls==1:write(p+16,'I',256);write(p+0x6e,'h',1000)
write(0x890324,'I',addr(1));write(0x89d1c8+0x89d,'I',addr(4))
shot=addr(1);spell=addr(2);write(shot+0x2d,'B',1);write(shot+0x5f,'h',1000);write(shot+0x76,'HHh',3072,2304,128);write(shot+0x70,'HHh',2304,2304,128);write(shot+0x6a,'h',0)
write(spell+0x2d,'B',2);write(spell+0x68,'H',1);write(spell+0x6c,'HHh',3072,2304,128)
cell=(2304>>9)*128+(3072>>9);write(0x8a03e4+cell*16+6,'H',3);write(addr(3)+0x20,'H',4)
timeline=[]
for turn in range(1,7):
 write(stack,'I',stop);c.reg_write(UC_X86_REG_ESP,stack)
 try:c.emu_start(0x4ec6f0,stop,count=1000000)
 except Exception:
  print('FAILED',turn,hex(c.reg_read(UC_X86_REG_EIP)));raise
 assert c.reg_read(UC_X86_REG_EIP)==stop
 if turn==2:assert read(addr(10)+0x7d,'B')==1, 'Blast effect 78 enables scatter'
 timeline.append(dict(head=read(shot+0x2a,'B')==8,enemy=bool(read(addr(3)+12,'I')&0x80000),ally=bool(read(addr(4)+12,'I')&0x80000)))
assert timeline==[
 dict(head=True,enemy=False,ally=False),dict(head=False,enemy=False,ally=False),
 dict(head=False,enemy=True,ally=False),dict(head=False,enemy=True,ally=False),
 dict(head=False,enemy=True,ally=True),dict(head=False,enemy=True,ally=True)]
assert [e for e in events if e[1]=='allocate']==[[2,'allocate',7,m] for m in [5,3,78,38]]
assert [e for e in events if e[1]=='sound']==[[2,'sound',0xa1],[2,'sound',0xb2]]
fixture=dict(executableSha256=hashlib.sha256(exe.read_bytes()).hexdigest(),timeline=timeline,events=events)
path=Path(__file__).resolve().parents[1]/'tests/fixtures/blast-impact.json'
if '--record' in sys.argv:path.write_text(json.dumps(fixture,indent=2)+'\n')
else:assert fixture==json.loads(path.read_text())
print('PASS: native Blast arrival retains head; next visit deletes shot/creates impact; enemies on first wave pass, allies on last, before their person visits')
