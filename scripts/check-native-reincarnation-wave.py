"""Execute the original reincarnation producer, allocator, wave and panic/damage.

Usage: python scripts/check-native-reincarnation-wave.py EXE
No recording, asset writes, or original game/OS launch. Real 004ed8a0 allocation,
00509c10/0050bcd0/0050c780 initialization, 0050c830 mode, 0050c840 terrain/ring,
004ed640/004d2740 panic and 004da080 damage execute. Rendering, sound, allocation
removal, terrain notifications and motion/formation world consumers are supplied.
The outer traversal runs original 004ec6f0 with unrelated processors supplied.
"""
import sys,struct,hashlib
from pathlib import Path
from decomp import native_cpu,configure_native_constants
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EIP,UC_X86_REG_ESP
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x200000)
stack,stop,body=0x21ed000,0x21ef000,0x2000100
tribe=0x89d1c8
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def ret(result=0):
 sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 try:cpu.emu_start(a,stop,count=2000000)
 except Exception:
  print('ERROR',hex(cpu.reg_read(UC_X86_REG_EIP)),events[-20:]);raise
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 assert bytes(cpu.mem_read(0x8929cd,len(search)))==search,'Native invocation corrupted search input'
events=[];removed=set();wave=0

def hook(c,a,size,user):
 global wave
 sp=c.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I')
 if a==0x4ed8a0:
  cls,model,owner,pos=struct.unpack('<4I',c.mem_read(sp+4,16));events.append(['allocate',cls,model,owner&255,*struct.unpack('<HHh',c.mem_read(pos,6))]);return
 if a in [0x50c780,0x50c830,0x50c840,0x4d2740,0x4da080]:
  events.append([hex(a),read(p+0x24,'H')]);
  if a==0x50c780:wave=p
  return
 if a==0x48a050:events.append(['sound',read(sp+8,'I')]);ret(0x21a0000);return
 if a==0x48a810:events.append(['sound-mode',read(sp+8,'I')])
 if a==0x4edcf0:removed.add(p);write(p+0x2a,'B',0);events.append(['remove',read(p+0x24,'H')])
 if a==0x4ee580:c.mem_write(p+0x3d,bytes(c.mem_read(read(sp+8,'I'),6)))
 if a==0x44ddf0:events.append(['terrain',read(sp+4,'H')])
 if a==0x4da0f0:events.append(['spawn']);ret(0);return
 ret()
# Supplied rendering/audio/world leaves; allocation, mode initializer, panic,
# damage, search, height quantization and terrain writes execute in original code.
leaves=[0x4ee470,0x4ee700,0x4010b0,0x48a050,0x48a810,0x4edcf0,0x44ddf0,0x44df40,0x44f2f0,0x4ee580,0x4d4040,0x4ea460,0x4d56f0,0x409580,0x4da0f0]
leaf_hooks={a:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a) for a in leaves+[0x4ed8a0,0x50c780,0x50c830,0x50c840,0x4d2740,0x4da080]}
search=(exe.parent/'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(search).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd,search)
def setup(busy=False,fail=False,height=240,ground=128):
 global events,removed,wave
 events=[];removed=set();wave=0
 cpu.mem_write(0x2000000,bytes(0x1c0000));cpu.mem_write(tribe,bytes(4*0xc65));cpu.mem_write(0x890390,bytes(0x2000))
 cpu.mem_write(0x89290d,bytes(16*12))
 assert bytes(cpu.mem_read(0x8929cd,len(search)))==search,'Fixture reset corrupted native search input'
 cpu.mem_write(0x8a03e4,b''.join(struct.pack('<IhH8x',0,ground,0) for _ in range(16384)))
 for a in [0x890324,0x890328,0x890330,0x890358,0x89035c,0x890360,0x895dbb,0x89c651,0x89c659]:write(a,'I',0)
 cpu.mem_write(0x96eac1,bytes(16));write(0x89d178,'I',0x12345678);write(0x89d17c,'I',32);write(0x89c661,'I',0);write(0x895da4,'I',0)
 write(tribe+0x911,'HHh',4096,4096,height);write(tribe+0x91d,'I',1);write(tribe+0x93d,'I',int(busy))
 write(body+0x24,'H',1);write(body+0x2a,'BBBBBB',10,12,12,4,0,0);write(body+0x3d,'HHh',8192,8192,1500);write(body+0x6e,'h',5);write(body+0x74,'BB',7,7)
 write(0x890394,'I',body);write(0x890324,'I',body)
 # Original allocator picks class7 records from the >640 free list.
 for i in range(800):
  p=0x2010000+i*256;write(p,'II',p-256 if i else 0,p+256 if i<799 else 0);write(p+0x24,'H',640+i);write(0x890390+(640+i)*4,'I',p)
 write(0x89031c,'I',0 if fail else 0x2010000);write(0x890320,'I',0)
for busy,fail in [(False,False),(True,False),(False,True)]:
 setup(busy,fail);call(0x5029d0,body)
 assert read(body+0x6e,'h')==4
 assert events[0]==['allocate',7,8,0,4096,4096,240]
 if fail:assert not wave and len(events)==1 and read(tribe+0x915,'h')==240
 elif busy:
  assert wave in removed and read(wave+0x2a,'B')==0 and read(wave+0x76,'I')==2
  assert read(tribe+0x93d,'I')==1 and read(tribe+0x915,'h')==240
  assert not any(e[0]=='sound' for e in events)
 else:
  assert read(wave+0x2a,'B')==7 and read(wave+0x2b,'B')==8 and read(wave+0x76,'I')==2
  assert read(wave+0x41,'h')==read(tribe+0x915,'h')==256 and read(tribe+0x93d,'I')==1
  assert [e for e in events if e[0].startswith('sound')]==[['sound',158],['sound-mode',0]]
 if wave and wave not in removed:
  for i in range(21):call(0x50c840,wave)
  assert len(removed)==33 and read(wave+0x2d,'B')==21 and read(tribe+0x93d,'I')==0
  assert read(0x89d178,'I')==0x12345678
  assert len([e for e in events if e[:3]==['allocate',7,60]])==32
  assert len([e for e in events if e[:3]==['allocate',7,61]])==672
  assert read(0x8a03e4+(8*128+8)*16+4,'h')==256
print('PASS: composed class10/model12 producer, real class7/model8 allocation, mode2, busy duplicate, allocation failure, 21 visits, terrain, 32 orbits/672 sparkles, sound and cleanup')

fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'previousState':(0x7d,'B'),'life':(0x6e,'h'),'timer':(0x70,'h'),'speed':(0x5f,'h'),'turnAngle':(0x57,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'damageAttacker':(0xb0,'B')}
people=[]
def person(model=2,owner=1,state=17,flags2=0,flags3=0,flags4=0):
 p=0x2001000+len(people)*256;id=10+len(people);people.append(p)
 write(p+0x24,'H',id);write(p+0x2a,'BBB',1,model,state);write(p+0x2f,'B',owner);write(p+0x30,'B',[0,0,2,14,15,16,17,18,19][model]);write(p+0x6e,'h',3000)
 write(p+0xc,'III',flags2,flags4,flags3);write(p+0x3d,'HHh',4096,4096,128);write(p+0xb0,'B',255)
 cell=8*128+8;write(p+0x20,'H',read(0x8a03e4+cell*16+6,'H'));write(0x8a03e4+cell*16+6,'H',id);write(0x890390+id*4,'I',p)
 return p
def state(p):return {k:read(p+o,f) for k,(o,f) in fields.items()}
scenarios=[dict(name='enemy'+str(m),model=m) for m in range(2,7)]+[
 dict(name='friendly',owner=0),dict(name='wildman',model=1,owner=255),dict(name='enemy-wild-model',model=1),dict(name='shaman',model=7),
 dict(name='already-panic',state=26),dict(name='protected-transition',flags2=0x100000),dict(name='shield',flags3=0x8000),dict(name='bloodlust',flags3=0x80000),
 dict(name='swarm-removed-flag',flags4=0x800),dict(name='swarm-immune-flag',flags2=0x800000),dict(name='state23',state=23),dict(name='global-damage-suppression',levelFlags2=0x04000000)]
rows=[]
for case in scenarios:
 setup();people=[];p=person(**{k:v for k,v in case.items() if k not in ['name','levelFlags2']});write(0x895da4,'I',case.get('levelFlags2',0));before=state(p);call(0x5029d0,body);allocation_rng=read(0x89d178,'I');events=[]
 call(0x50c840,wave);after=state(p);first_events=[e for e in events if e[0].startswith('0x4')];first_rng=read(0x89d178,'I');events=[]
 call(0x50c840,wave)
 rows.append(dict(case=case,before=before,first=after,second=state(p),rng=[allocation_rng,first_rng,read(0x89d178,'I')],events=first_events,secondEvents=[e for e in events if e[0].startswith('0x4')],descriptor=read(0x5a7070+case.get('model',2)*50,'I')))
for row in rows:
 case,before,first,second=row['case'],row['before'],row['first'],row['second']
 excluded=case.get('owner') in [0,255] or case.get('model') in [1,7] or case.get('state')==26
 if excluded:
  assert before==first==second and not row['events'] and len(set(row['rng']))==1,row
 elif case.get('flags2',0)&0x100000:
  assert first['state']==17 and first['life']==1500 and second['life']==0,row
  assert row['events']==row['secondEvents']==[['0x4da080',10]]*3,row
  assert len(set(row['rng']))==1,row
 else:
  damage=row['descriptor']//2
  if case.get('flags3',0)&0x8000 or case.get('levelFlags2',0)&0x04000000:damage=0
  if case.get('flags3',0)&0x80000:damage>>=3
  assert first['state']==26 and first['previousState']==before['state'],row
  assert (first['life'],first['timer'],first['speed'],first['turnAngle'])==(3000-damage,64,110,1534),row
  assert first==second and not row['secondEvents'],row
  assert row['events']==[['0x4d2740',10],['0x4da080',10]],row
  assert row['rng']==[0x12345678,1389729278,1389729278],row
print('PASS: 17 composed wave→real panic initializer→real damage cases; exclusions, repeated protected hits, Shield/Bloodlust, state/RNG and non-Swarm flags')

# Full original outer traversal; supplied unrelated processors. Real allocation
# prepends the site wave, while the original loop retains its cached next pointer.
outer_calls={int(i.op_str,16) for i in Cs(CS_ARCH_X86,CS_MODE_32).disasm(bytes(cpu.mem_read(0x4ec6f0,0x390)),0x4ec6f0) if i.mnemonic=='call'}
outer_trace=[]
def outer(c,a,size,user):
 if a==0x4ed700:
  sp=c.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I');outer_trace.append([read(p+0x24,'H'),read(p+0x2a,'B'),read(p+0x2b,'B'),read(p+0x2e,'B')])
  if p==body:c.reg_write(UC_X86_REG_EIP,0x5029d0);return
  if p==wave and p not in removed:c.reg_write(UC_X86_REG_EIP,0x50c840);return
 ret()
for a in outer_calls & set(leaf_hooks):cpu.hook_del(leaf_hooks.pop(a))
outer_hooks=[cpu.hook_add(UC_HOOK_CODE,outer,begin=a,end=a) for a in outer_calls]
setup();write(0x969e8a,'H',0);write(0x96eace,'B',0);write(0x96eabf,'B',0)
call(0x4ec6f0);first=outer_trace[:];outer_trace=[];call(0x4ec6f0);second=outer_trace[:]
assert read(wave+0x2d,'B')==1
for turn in range(3,7):
 outer_trace=[];events=[];call(0x4ec6f0)
 assert [x for x in outer_trace if x[1] in [1,10] or x[2]==8]==[[640,7,8,turn-1],[1,10,12,turn]]
 assert [e for e in events if e[0]=='spawn']==([['spawn']] if turn==6 else [])
assert first==[[1,10,12,1]],first
assert second[:2]==[[640,7,8,1],[1,10,12,2]],second
for h in outer_hooks:cpu.hook_del(h)
print('PASS: actual outer list traversal defers wave until next turn; wave visit5 precedes the first Shaman spawn request five turns after allocation')
# Failed producer does not retry after its timer drops below5; restore free list
# immediately, then execute the four subsequent pre-spawn body visits.
setup(fail=True);call(0x5029d0,body);write(0x89031c,'I',0x2010000)
for i in range(4):call(0x5029d0,body)
assert read(body+0x6e,'h')==0 and read(body+0x2d,'B')==5
assert len([e for e in events if e[:3]==['allocate',7,8]])==1
for saved,ground,expected in [(240,128,256),(128,641,640),(-20,128,128),(1024,1100,1024)]:
 setup(height=saved,ground=ground);call(0x5029d0,body)
 assert read(wave+0x41,'h')==read(tribe+0x915,'h')==expected
print('PASS: allocation failure cannot retry below timer5; actual initializer raises to ground then quantizes saved height')
print('EXE SHA256',identity['sha256'])

# Producer gates execute in the original model12 body, before allocation.
for timer,model,existing,population in [(6,7,False,1),(5,2,False,1),(5,7,True,1),(5,7,False,0)]:
 setup();write(body+0x6e,'h',timer);write(body+0x74,'BB',model,7 if model==7 else 1)
 write(tribe+0x89d,'I',0x200a000 if existing else 0);write(tribe+0x91d,'I',population)
 call(0x5029d0,body)
 assert not any(e[:3]==['allocate',7,8] for e in events),(timer,model,existing,population,events)
print('PASS: timer, source model, surviving population and existing Shaman producer gates')

# Native wave removal is unconditional for class7/model18 in a visited cell.
# Execute the real 004ef180 branch, cell unlink and global-list removal; only
# the final lighting cleanup is supplied. This proof does not broaden startup.
def removal_trace(c,a,size,user):
 p=read(c.reg_read(UC_X86_REG_ESP)+4,'I')
 events.append(['swamp-remove' if a==0x4ef180 else 'swamp-light',read(p+0x24,'H')])
 if a==0x4ee190:ret()
removal_hooks=[cpu.hook_add(UC_HOOK_CODE,removal_trace,begin=a,end=a) for a in [0x4ef180,0x4ee190]]
for mode in [0,1,2]:
 for owner in [0,1,255]:
  for outside in [False,True]:
   setup();trap,other,neighbor=0x2009000,0x2009100,0x2009200;cell=8*128+(9 if outside else 8)
   for p,id,model in [(trap,100,18),(other,101,17)]:
    write(p+0x24,'H',id);write(p+0x2a,'BB',7,model);write(p+0x2f,'B',owner)
    write(p+0x3d,'HHh',4608 if outside else 4096,4096,128);write(p+0xc,'I',0x20000)
    write(0x890390+id*4,'I',p)
   write(neighbor+0x24,'H',102);write(neighbor+0x2a,'BBB',1,2,17);write(neighbor+0x2f,'BB',1,2)
   write(neighbor+0x6e,'h',3000);write(neighbor+0x3d,'HHh',4608 if outside else 4096,4096,128)
   write(0x890390+102*4,'I',neighbor)
   write(trap+0x20,'HH',101,0);write(other+0x20,'HH',102,100);write(neighbor+0x20,'HH',0,101)
   write(0x8a03e4+cell*16+6,'H',100)
   write(trap,'II',0,other);write(other,'II',trap,neighbor);write(neighbor,'II',other,body);write(body,'I',neighbor);write(0x890324,'I',trap)
   call(0x5029d0,body);write(wave+0x76,'I',mode);events=[];call(0x50c840,wave)
   removals=[e for e in events if e[0].startswith('swamp-')]
   assert read(other+0x2a,'B')==7 and read(other+0xc,'I')==0x20000
   if outside:
    assert read(trap+0x2a,'B')==7 and not removals and read(0x8a03e4+cell*16+6,'H')==100
    assert read(neighbor+0x2c,'B')==17 and read(neighbor+0x6e,'h')==3000
   else:
    assert removals==[['swamp-remove',100],['swamp-light',100]],removals
    assert read(trap+0x2a,'B')==0 and read(trap+0xc,'I')==1 and read(trap+0x2e,'B')==3
    assert read(0x8a03e4+cell*16+6,'H')==101 and read(other+0x22,'H')==0
    assert read(wave+4,'I')==other and read(other,'I')==wave
    assert read(trap+0x20,'H')==101
    assert read(neighbor+0x2c,'B')==(26 if mode==2 else 17)
    assert read(neighbor+0x6e,'h')==(2500 if mode==2 else 3000)
    assert next(i for i,e in enumerate(events) if e[0]=='terrain') < next(i for i,e in enumerate(events) if e[0]=='swamp-remove') < next(i for i,e in enumerate(events) if e[:3]==['allocate',7,61])
for h in removal_hooks:cpu.hook_del(h)
print('PASS: 18 original visited-cell Swamp cleanup cases; all modes/owners, radius exclusion, retained neighboring effect, real cell/global unlink before orbit sparkles')
