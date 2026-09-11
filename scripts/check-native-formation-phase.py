"""Execute the complete native inner-loop traversal with recorded processors.
Usage: python scripts/check-native-formation-phase.py EXE [--record]
World processors are supplied; the real pause gate, tribe-list traversal, cached
next pointers, phase order and object counters execute. Existing marching checks
separately execute the complete formation controller.
"""
import json,random,struct,sys
from pathlib import Path
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
stack,stop=0x201d000,0x201e000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
ptr=lambda id:0x2000000+id*256
rng=random.Random(0x4ec6f0);events=[];mutate=False

def processor(c,a,size,user):
 global mutate
 sp=c.reg_read(UC_X86_REG_ESP)
 if a in [0x501000,0x4ed700,0x518630,0x518fb0]:
  p=read(sp+4,'I');id=read(p+0x24,'H')
  kind={0x501000:'formation',0x4ed700:'object',0x518630:'encounter',0x518fb0:'fight'}[a]
  events.append([kind,id,read(p+0x2e,'B')])
  if mutate and kind=='object':
   # A person recruits a new group during its own visit. Its first phase is next turn.
   write(ptr(30)+8,'I',read(0x89d1c8+0x88d,'I'));write(0x89d1c8+0x88d,'I',ptr(30));mutate=False
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
addresses={int(i.op_str,16) for i in Cs(CS_ARCH_X86,CS_MODE_32).disasm(bytes(cpu.mem_read(0x4ec6f0,0x390)),0x4ec6f0) if i.mnemonic=='call'}
for a in addresses:cpu.hook_add(UC_HOOK_CODE,processor,begin=a,end=a)
def call():
 write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x4ec6f0,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
cases=[]
for trial in range(256):
 cpu.mem_write(0x2000000,bytes(40*256));cpu.mem_write(0x89d1c8,bytes(4*0xc65))
 for a in [0x890324,0x890328,0x890330,0x890358,0x89035c,0x890360,0x895dbb]:write(a,'I',0)
 write(0x969e8a,'H',0);write(0x96eace,'B',0);write(0x96eabf,'B',0)
 paused=trial%17==0;write(0x89c661,'I',2 if paused else 0);write(0x89d17c,'I',32)
 groups=list(range(1,13));rng.shuffle(groups);tribes=[groups[i:i+3] for i in range(0,12,3)]
 dead=set(rng.sample(groups,trial%4));objects=[20,21,22];initial=rng.randrange(256)
 for id in range(1,31):
  write(ptr(id)+0x24,'H',id);write(ptr(id)+0x2a,'BBB',0 if id in dead else 10 if id in groups+[30] else 1,2,19);write(ptr(id)+0x2e,'B',initial)
 for tribe,row in enumerate(tribes):
  write(0x89d1c8+tribe*0xc65+0x88d,'I',ptr(row[0]))
  for i,id in enumerate(row):write(ptr(id)+8,'I',ptr(row[i+1]) if i+1<len(row) else 0)
 write(0x890324,'I',ptr(objects[0]))
 for i,id in enumerate(objects):write(ptr(id)+4,'I',ptr(objects[i+1]) if i+1<len(objects) else 0)
 write(0x89035c,'I',ptr(23));write(0x890358,'I',ptr(24));write(0x890330,'I',ptr(25))
 events=[];mutate=True;call();first=events.copy();events=[];call();second=events.copy()
 def expected(turn):
  formation=[id for row in tribes for id in row if id not in dead]
  if turn==2:formation=[30]+formation
  return [] if paused else [['formation',id,initial] for id in formation]+[['encounter',23,initial],['fight',24,initial]]+[['object',id,(initial+turn)&255] for id in objects+[25]]
 assert first==expected(1),(trial,first,expected(1));assert second==expected(2),(trial,second,expected(2))
 cases.append(dict(tribes=tribes,dead=list(sorted(dead)),objects=objects,initial=initial,paused=paused,first=first,second=second))
print('PASS: 256 two-turn native inner-loop traces: tribe-ordered formations before encounters/objects, inactive skipping, next-turn recruitment, pause and byte counters')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/formation-phase.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[:32]),separators=(',',':'))+'\n')
