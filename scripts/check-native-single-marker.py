"""Execute original task-24 phase 5, queue commits and person state release.
Supplied mixed-model list, phase-5 task, flat/empty world, zero animation counts
and guard scratch buffer. Only final task cleanup 0x4f6440 is intercepted.
This is producer/selection ownership evidence, not recruitment, movement arrival,
rendering, or whole-mission acceptance. Usage: python SCRIPT EXE
"""
import hashlib,json,struct,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE, __version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_EIP,UC_X86_REG_ESP
from decomp import native_cpu

exe=Path(sys.argv[1]).resolve()
rows=[]
for case in ['ordinary','locked_preacher','already_released_preacher']:
 cpu,identity=native_cpu(exe)
 cpu.mem_map(0x2000000,0x60000)
 ai,units,stack,stop=0x2000000,0x2010000,0x205d000,0x205e000
 def write(p,f,*v):cpu.mem_write(p,struct.pack('<'+f,*v))
 def read(p,f='I'):return struct.unpack('<'+f,cpu.mem_read(p,struct.calcsize('<'+f)))[0]
 def snapshot():
  result=[]
  for i,model in enumerate([2,3,4,6]):
   p=units+i*256
   ids=[read(p+0x8b+j*2,'H') for j in range(8)]
   result.append(dict(model=model,state=read(p+0x2c,'B'),selected=bool(read(p+0x7a,'B')&128),orders=[read(0x938830+v*10,'B') for v in ids if v]))
  return result
 trace=[]
 def hook(c,a,size,user):
  sp=c.reg_read(UC_X86_REG_ESP)
  trace.append(dict(entry=hex(a),people=snapshot()))
  if a==0x4f6440:
   c.reg_write(UC_X86_REG_EIP,read(sp));c.reg_write(UC_X86_REG_ESP,sp+4)
 for a in [0x435730,0x4359b0,0x41b180,0x418ce0,0x4f6440]:
  cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
 write(0x96aa78,'HH',1,0)
 write(0x892443,'I',0x2030000)
 write(0x59df44,'I',0x2020000)
 write(ai+0x36,'I',0x1234)
 write(ai+0x46,'h',-1)
 write(ai+0x78,'H',5)
 write(ai+0x881,'I',units)
 for i,model in enumerate([2,3,4,6]):
  p=units+i*256
  write(p+8,'I',p+256 if i<3 else 0)
  write(p+0x2a,'BBB',1,model,10 if model==4 and case=='already_released_preacher' else 14)
  write(p+0x7a,'B',128)
  if model==4 and case=='locked_preacher':write(p+0xc,'I',0x100000)
 write(stack,'III',stop,ai,0)
 cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x4cedd0,stop,count=500000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 assert read(ai+0x78,'H')==6
 assert [t['entry'] for t in trace]==['0x435730','0x4359b0','0x41b180','0x435730','0x4359b0','0x418ce0','0x4f6440']
 first=trace[2]['people']
 assert [p['orders'] for p in first]==[[],[],[3],[]],first
 before_general_release=trace[5]['people']
 assert [p['orders'] for p in before_general_release if p['model']!=4]==[[11],[11],[11]]
 preacher=before_general_release[2]
 if case=='ordinary':
  assert preacher['state']==33 and not preacher['selected'] and 11 not in preacher['orders'],preacher
 else:
  assert preacher['selected'] and preacher['orders']==[11],preacher
  assert preacher['state']==(14 if case=='locked_preacher' else 10)
 # Original initializer immediately enters move state 33. The browser starts its
 # controller on the next tick; compare order/selection ownership, not that timing.
 rows.append(dict(name=case,trace=trace,final=snapshot()))
print(json.dumps(dict(executable=identity,probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),unicornVersion=unicorn_version,pythonVersion=sys.version,intercepted=['0x4f6440 task cleanup'],cases=rows),indent=2))
