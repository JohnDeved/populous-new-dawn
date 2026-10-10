from pathlib import Path
import hashlib,json,difflib
base=Path('work/orchestration/training-native-20261010')
src=(base/'native/attempt08/driver.py').read_text()
out=base/'retirement'
insert='''
# Observation only: native guest state is never changed by these hooks.
lifecycle=[];life_returns={};life_hooks={};formation_records=set()
def record_state(p):
 return dict(pointer=p,id=ident(p),class_=read(p+0x2a,'B'),nativeModel=read(p+0x2b,'B'),personModel=read(p+0x2d,'B'),counter=read(p+0x2e,'B'),flags2=read(p+0xc,'I'),previous=ident(read(p,'I')),primaryNext=ident(read(p+4,'I')),tribeNext=ident(read(p+8,'I')),count=read(p+0x68,'B'),members=list(struct.unpack('<12H',cpu.mem_read(p+0x6a,24))))
def life_snapshot(boundary,p=0):
 d=dict(turn=turn,phase=phase,boundary=boundary,primary=[ident(q) for q in chain(read(0x890324,'I'))],tribe=[record_state(q) for q in chain(read(0x89da55,'I'),8)],deferred=[record_state(q) for q in chain(read(0x890328,'I'))],freeHighHead=ident(read(0x89031c,'I')),freeLowHead=ident(read(0x890320,'I')),primaryAllocated=read(0x89c651,'I'),lowAllocated=read(0x89c659,'I'),formationRecords=[record_state(q) for q in sorted(formation_records)])
 if p:d['record']=record_state(p)
 lifecycle.append(d)
 return d
LIFE_WATCH={0x4edcf0:'retire',0x401b40:'releaseDeferred',0x4ed8a0:'allocate',0x4ecac0:'rebuildTribes',0x501000:'formationController',0x5018c0:'recruit'}
def life_watch(c,a,n,u):
 sp=c.reg_read(UC_X86_REG_ESP);name=LIFE_WATCH[a]
 args=list(struct.unpack('<4I',cpu.mem_read(sp+4,16)))
 if name=='allocate' and args[0]!=10:return
 if name=='rebuildTribes':p=0
 elif name=='allocate':p=0
 else:p=args[0]
 d=life_snapshot(name+'Entry',p);d.update(address=hex(a),caller=hex(read(sp,'I')),args=args)
 ret=read(sp,'I');life_returns[(ret,sp+4)]=(name,p,args)
 if ret not in life_hooks:life_hooks[ret]=cpu.hook_add(UC_HOOK_CODE,life_return,begin=ret,end=ret)
def life_return(c,a,n,u):
 item=life_returns.pop((a,c.reg_read(UC_X86_REG_ESP)),None)
 if item:
  name,p,args=item
  if name=='allocate':
   p=c.reg_read(UC_X86_REG_EAX)
   if p:formation_records.add(p)
  life_snapshot(name+'Return',p)
for address in LIFE_WATCH:cpu.hook_add(UC_HOOK_CODE,life_watch,begin=address,end=address)
'''
assert src.count('def run():')==1
s=src.replace('def run():',insert+'\ndef run():')
s=s.replace("  phase='objects';", "  life_snapshot('afterHeader')\n  phase='objects';")
s=s.replace("  guard_snapshots.append(guard_snapshot('before-4ef7f0-4f0460'))", "  life_snapshot('afterObjects')\n  guard_snapshots.append(guard_snapshot('before-4ef7f0-4f0460'))")
s=s.replace("  guard_snapshots.append(guard_snapshot('late-world-tail'))", "  life_snapshot('afterDeferredFree')\n  guard_snapshots.append(guard_snapshot('late-world-tail'))")
s=s.replace("sourceHead='50aefe1d49f70057380bf9a5fa8f0b319c8ad441'", "sourceHead='96a465d1b3dfb7ff7aae34865088308dc26d4783'")
s=s.replace("(RUN/'result.json').write_text(json.dumps(result));", "(RUN/'lifecycle.json').write_text(json.dumps(lifecycle));(RUN/'result.json').write_text(json.dumps(result));")
(out/'driver.py').write_text(s)
(out/'driver-observation.diff').write_text(''.join(difflib.unified_diff(src.splitlines(True),s.splitlines(True),fromfile='native/attempt08/driver.py',tofile='retirement/driver.py')))
(out/'input.json').write_text(json.dumps(dict(baseSha256=hashlib.sha256(src.encode()).hexdigest(),driverSha256=hashlib.sha256(s.encode()).hexdigest(),head='96a465d1b3dfb7ff7aae34865088308dc26d4783',nativeRun='attempt08',observationOnly=True),indent=2)+'\n')
