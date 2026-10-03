"""Bounded native evidence for Mission 3 marker-Preacher tasks and retargeting.

Run with the hash-verified original executable as the sole argument. The full
script block supplies world reads and intercepts command hosts. Consumer state
hooks, final group commit/restoration/cleanup and retarget order replacement are
intercepted as described in decomp/research/mission3-person-task.md. Allocation
also has a fully unintercepted case. This does not prove live movement or parity.
"""
import sys,json,struct,hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EIP,UC_X86_REG_ESP
if len(sys.argv) != 2:
 raise SystemExit('Usage: python scripts/check-native-mission3-person-task.py /path/to/d3dpoptb.exe')
EXE = Path(sys.argv[1]).resolve()
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
AI=0x89d1c8+2*0xc65;P=0x2000000;STACK=0x201d000;STOP=0x201e000;PERSON=0x2008000
class Probe:
 def __init__(self):
  self.u,self.identity=native_cpu(EXE);self.u.mem_map(P,0x20000);self.u.mem_write(AI,bytes(0xc65));self.w(AI+0xc22,'B',2);self.w(0x89d178,'I',0x12345678);self.events=[]
 def w(self,a,f,*v):self.u.mem_write(a,struct.pack('<'+f,*v))
 def r(self,a,f='I'):return struct.unpack('<'+f,self.u.mem_read(a,struct.calcsize('<'+f)))[0]
 def args(self,n):return list(struct.unpack('<'+'I'*n,self.u.mem_read(self.u.reg_read(UC_X86_REG_ESP)+4,n*4)))
 def ret(self,v=0):
  sp=self.u.reg_read(UC_X86_REG_ESP);self.u.reg_write(UC_X86_REG_EAX,v&0xffffffff);self.u.reg_write(UC_X86_REG_EIP,self.r(sp));self.u.reg_write(UC_X86_REG_ESP,sp+4)
 def hook(self,a,fn):self.u.hook_add(UC_HOOK_CODE,lambda *_:fn(),begin=a,end=a)
 def leaf(self,a,n,v=0):self.hook(a,lambda:(self.events.append([hex(a),self.args(n)]),self.ret(v)))
 def call(self,a,*v):
  self.w(STACK,'I'*(len(v)+1),STOP,*v);self.u.reg_write(UC_X86_REG_ESP,STACK);self.u.emu_start(a,STOP,count=2000000);assert self.u.reg_read(UC_X86_REG_EIP)==STOP
 def person(self):
  self.w(AI+0x881,'I',PERSON);self.w(PERSON+0x24,'H',1);self.w(PERSON+0x2a,'BBBB',1,4,0,0);self.w(PERSON+0x2f,'B',2);self.w(0x890394,'I',PERSON)
results={}
# Execute allocator, native gate and task writer; only duplicate/search controlled.
rows=[]
for occupied,preachers,enabled,duplicate,selected in [(0,1,True,0,True),(5,1,True,0,True),(6,1,True,0,True),(0,0,True,0,True),(0,1,False,0,True),(0,1,True,1,True),(0,1,True,0,False)]:
 p=Probe();p.person();p.w(0x89b7a5+6,'H',0x1234);p.w(AI+0x59a,'I',0x800 if enabled else 0);p.w(AI+0xa2f,'h',preachers)
 for i in range(occupied):p.w(AI+0x74+82*i,'I',1)
 p.leaf(0x4f5680,3,duplicate);p.leaf(0x4f7dc0,7,PERSON if selected else 0);p.call(0x4f4520,AI,3)
 active=[i for i in range(10) if p.r(AI+0x74+82*i)&1 and p.r(AI+0x85+82*i,'B')==11]
 assert bool(active)==(occupied<6 and preachers>0 and enabled and not duplicate and selected)
 if active:
  b=AI+82*active[0];assert [p.r(b+o,f) for o,f in [(0x68,'I'),(0x6c,'I'),(0x70,'I'),(0x78,'H'),(0x36,'I')]]==[1,0x1234,0,4,0]
 assert p.r(0x89d178)==0x12345678
 rows.append(dict(occupied=occupied,preachers=preachers,enabled=enabled,duplicate=duplicate,selected=selected,active=active,calls=p.events))
results['allocator']=rows
# Dispatch consumer phase4->5->6->7->inactive with real lock, queue writer and release.
p=Probe();p.person();p.w(AI+0x74,'I',1);p.w(AI+0x85,'B',11);p.w(AI+0x68,'I',1);p.w(AI+0x6c,'I',0x1234);p.w(AI+0x78,'H',4)
for a,n in [(0x4ed6f0,1),(0x4ed640,1),(0x4359b0,4),(0x418ce0,2),(0x4f6840,2)]:p.leaf(a,n)
phases=[]
for _ in range(4):
 p.call(0x4623e0,AI);phases.append([p.r(AI+0x78,'H'),p.r(AI+0x74),p.r(AI+0x5b1,'B')])
 if len(phases)==3:
  assert p.r(AI+0x8bf,'B')==1 and p.r(AI+0x8c1,'B')==17
  results['issuedOrder']=bytes(p.u.mem_read(AI+0x8c1,10)).hex()
  assert results['issuedOrder']=='11000000000080348012'
assert [x[0] for x in phases]==[5,6,7,7];assert not phases[-1][1]&1;assert p.r(0x89d178)==0x12345678
results['consumer']={'phases':phases,'calls':p.events,'rng':p.r(0x89d178)}
# Retarget filters native, actual order allocator/replace leaf intercepted.
rows=[]
for state,order,flags,secondary,base in [(10,30,0,False,0),(33,30,0,True,1),(9,30,0,False,0),(10,30,1,False,0),(10,17,0,False,0)]:
 p=Probe();p.person();p.w(PERSON+0x2c,'B',state);p.w(PERSON+(0x8b if secondary else 0x9b),'H',1);p.w(0x93883a,'BB',order,flags);p.w(AI+0x5b4,'B',base);p.w(AI+0x5a2,'H',0x1357);p.w(AI+0x36a,'H',0x2468)
 def retarget():
  person,position=p.args(2);p.events.append([person,p.r(position,'H'),p.r(position+2,'H')]);p.ret(1)
 p.hook(0x43b2a0,retarget);p.call(0x4f3280,AI)
 assert bool(p.events)==(state in (10,33) and order==30 and flags==0)
 if p.events: assert p.events==[[PERSON,0x6800 if base else 0x5600,0x2400 if base else 0x1200]]
 assert p.r(0x89d178)==0x12345678
 rows.append(dict(state=state,order=order,flags=flags,secondary=secondary,base=base,calls=p.events))
results['retarget']=rows
# Entire authored block's IF/EVERY control executes; commands logged and world leaves supplied.
s=json.loads((ROOT/'app/original-script-three.json').read_text());assert hashlib.sha256((EXE.parent/'levels'/s['source']).read_bytes()).hexdigest()==s['sha256']
rows=[]
for turn,pop,preachers,near,warriors,blue_warriors,blue_preachers in [(122,9,1,0,0,0,0),(123,8,1,0,0,0,0),(123,9,1,0,3,0,0),(123,7,1,4,0,0,0),(123,9,0,4,0,0,0),(251,9,1,0,0,10,10)]:
 p=Probe();codes=[12,1003,*s['codes'][570:715],1004,1019];blob=bytearray(12552);struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
 for i,f in enumerate(s['fields']):struct.pack_into('<Ii',blob,8192+i*8,*f)
 p.u.mem_write(P,bytes(blob));p.w(0x89d188,'I',turn)
 vals={1:pop,1148:preachers,1147:warriors,1153:blue_warriors,1154:blue_preachers,1088:2,2:20}
 def read():
  field=p.args(3)[2];kind=p.r(field);value=p.r(field+4,'i')
  if kind==2 and value in vals:p.ret(vals[value])
 def command():
  _,program=p.args(2);ptr=p.r(program+0x3104);op=p.r(ptr+2,'H');n=s['commands'][str(op)];args=[p.r(ptr+4+2*i,'H') for i in range(n)];p.events.append([op,args])
  if op==1068:p.w(program+0x3000+9*4,'I',near)
  p.w(program+0x3104,'I',ptr+4+2*n);p.ret(1)
 p.hook(0x48f350,read);p.hook(0x48cc60,command);p.call(0x48c6b0,AI,P)
 ops=[x[0] for x in p.events];due=(turn+2+3)&127==0
 assert (1074 in ops)==(due and preachers>0 and pop>8)
 assert (1102 in ops)==(due and near>3 and pop<8)
 assert (1103 in ops)==(due and not(near>3 and pop<8))
 assert p.r(0x89d178)==0x12345678
 rows.append(dict(turn=turn,population=pop,preachers=preachers,near=near,warriors=warriors,commands=p.events))
results['block']=rows;results['identity']=p.identity;results['scriptSha256']=s['sha256']
# No intercepted leaves: allocated real model-4 person from native list and marker table.
p=Probe();p.person();p.w(PERSON+0x14,'I',1);p.w(AI+0x59a,'I',0x800);p.w(AI+0xa2f,'h',1);p.w(0x89b7ab,'H',0x1234)
p.call(0x4f4520,AI,3)
assert p.r(AI+0x85,'B')==11 and p.r(AI+0x68)==1 and p.r(AI+0x78,'H')==4
assert p.r(PERSON+0x14)&1==0 and p.r(0x89d178)==0x12345678
results['uninterceptedAllocation']={'type':11,'person':p.r(AI+0x68),'phase':p.r(AI+0x78,'H'),'target':p.r(AI+0x6c),'rng':p.r(0x89d178)}
# Existing type11 rejects even with nine free slots.
p.w(PERSON+0x14,'I',1);p.call(0x4f4520,AI,3)
assert sum(bool(p.r(AI+0x74+82*i)&1) for i in range(10))==1
# Duplicate helper executes unchanged: any own preaching person at tile, or model4 matching order payload.
rows=[]
for state,model,order,target,flags in [(10,4,17,0x1234,0),(33,4,31,0x1234,0),(10,4,32,0x1234,0),(10,4,17,0x1235,0),(10,4,17,0x1234,1),(9,4,17,0x1234,0)]:
 p=Probe();p.person();p.w(PERSON+0x2c,'B',state);p.w(PERSON+0x2b,'B',model);p.w(PERSON+0x9b,'H',1);p.w(0x93883a,'BB',order,flags);p.w(0x938840,'H',target)
 p.call(0x4f5680,AI,0x1234,1);value=p.u.reg_read(UC_X86_REG_EAX);assert value==int(state in (10,33) and order in (17,31,32) and target==0x1234 and not flags&1)
 rows.append([state,order,target,flags,value])
results['duplicateNative']=rows
print(json.dumps(results,indent=2));print('PASS: allocator gates, native task phase sequence, retarget predicates, full block control and bounded RNG')
