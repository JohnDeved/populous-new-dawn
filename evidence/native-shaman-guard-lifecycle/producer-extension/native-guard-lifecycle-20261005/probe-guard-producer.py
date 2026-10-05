"""Finite producer/roster/resource extension of the frozen guard lifecycle harness.
Run with the same EXE and repository arguments and timeout60s/CPU4 envelope.
The frozen baseline runs unchanged to initialize its independently verified
CPU/table helpers. This script records additional producer cases, not full world
eligibility or physics. Native allocator/preparation/clear/attach/refcounts run.
"""
import contextlib,hashlib,io,json,runpy,struct,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP
baseline=Path(__file__).with_name('probe-guard-lifecycle.py')
assert hashlib.sha256(baseline.read_bytes()).hexdigest()=='7f6ad6a478db9138af4b5ff3d69b612969c5dcc8365ec324309d18771ec77064'
capture=io.StringIO()
with contextlib.redirect_stdout(capture): base=runpy.run_path(str(baseline))
assert hashlib.sha256(capture.getvalue().encode()).hexdigest()=='7c7d6eff380665b6240822b29e38e9eff47de1c1a4c8855b58b4b5c71bde3711'
cpu,write,read,call,fixture=[base[k] for k in ('cpu','write','read','call','fixture')]
p,s,tribe,pool=[base[k] for k in ('p','s','tribe','pool')]
g=fixture.__globals__;people=[];trace=[]
extra=[0x2000300,0x2000400,0x2000500]
def fresh(count=2):
 fixture();people[:]=[p,*extra[:count-1]]
 for i,q in enumerate(people):
  if q!=p:cpu.mem_write(q,bytes(cpu.mem_read(p,256)))
  write(q+0x24,'H',i+1);write(q+8,'I',people[i+1] if i+1<len(people) else s)
  write(0x890390+(i+1)*4,'I',q)
 trace.clear();g['events'].clear()
def person(q):
 return {'pointer':f'{q:08x}','id':read(q+0x24,'H'),'class':read(q+0x2a,'B'),
  'model':read(q+0x2b,'B'),'state':read(q+0x2c,'B'),'status':read(q+0xa7,'B'),
  'selection':read(q+0x7a,'B'),'flags2':read(q+0xc,'I'),'vehicle':read(q+0x9f,'H'),
  'target':read(q+0x72,'H'),'commands':list(struct.unpack('<8H',cpu.mem_read(q+0x8b,16))),
  'immediate':read(q+0x9b,'H'),'source':read(q+0x33,'H'),'f1':read(q+0x37,'h'),'f2':read(q+0x39,'B')}
def snapshot():
 ps=[person(q) for q in people];ids={0,1,2,3,4,5,798,799}
 for u in ps:ids.update(u['commands']);ids.add(u['immediate'])
 raw=bytes(cpu.mem_read(pool,8000))
 return {'people':ps,'shamanPointer':f'{read(tribe+0x89d,"I"):08x}',
         'shamanSelection':read(s+0x7a,'B'),'guardCount':read(tribe+0x917,'h'),
         'poolCursor':read(0x96aa78,'H'),'poolActive':read(0x96aa7a,'H'),
         'poolSha256':hashlib.sha256(raw).hexdigest(),
         'records':{str(i):dict(zip(('model','flags','references','object','a','b'),struct.unpack_from('<BB4H',raw,i*10))) for i in sorted(ids)}}
observed={0x436c20:'allocate',0x438730:'prepare',0x436ca0:'clear',0x436d00:'attach',0x4364d0:'remove',0x433490:'cancel-anchor'}
def observe(c,a,n,u):
 sp=c.reg_read(UC_X86_REG_ESP);args=list(struct.unpack('<3I',c.mem_read(sp+4,12)))
 trace.append({'name':observed[a],'address':f'{a:08x}',
               'args':[] if a==0x436c20 else args[:1] if a==0x436ca0 else args[:2] if a in (0x4364d0,0x433490) else args})
for a in observed:cpu.hook_add(UC_HOOK_CODE,observe,begin=a,end=a)
report={'scope':__doc__,'baselineSha256':hashlib.sha256(baseline.read_bytes()).hexdigest(),
        'baselineResultSha256':hashlib.sha256(capture.getvalue().encode()).hexdigest(),
        'identity':base['identity'],'sourceHashes':{},'suppliedLeaves':base['report']['suppliedLeaves'],'cases':[]}
for path in (Path(__file__),Path(sys.argv[1]),Path(sys.argv[2])/'scripts/decomp.py'):
 report['sourceHashes'][str(path)]=hashlib.sha256(path.read_bytes()).hexdigest()
def case(label,count=2):fresh(count);report['cases'].append({'label':label,'steps':[]})
def stage(label,address=0x443b40,args=(0,1)):
 before=snapshot();raw=bytes(cpu.mem_read(pool,8000));trace.clear();g['events'].clear();value=call(address,*args)
 after=snapshot();new=bytes(cpu.mem_read(pool,8000));changed=[i for i in range(800) if raw[i*10:(i+1)*10]!=new[i*10:(i+1)*10]]
 item={'label':label,'entry':f'{address:08x}','args':list(args),'returnLowByte':value&255,
       'before':before,'after':after,'poolChangedRecords':changed,'trace':list(trace)}
 report['cases'][-1]['steps'].append(item);return item
def prepare_all():
 for q in people:stage(f'prepare person{read(q+0x24,"H")}',0x4d42a0,(q,))
def assert_commands(ids):assert [read(q+0x8b,'H') for q in people]==ids

case('shared-two-followers-repeat-and-partial-replacement')
first=stage('G allocates one shared command30');assert_commands([1,1])
assert read(pool+12,'H')==2 and read(0x96aa7a,'H')==1
assert [e['name'] for e in first['trace']].count('allocate')==1
prepare_all();assert read(tribe+0x917,'h')==2
repeat=stage('G repeats while both selected');assert_commands([2,2])
assert read(pool+12,'H')==0 and read(pool+22,'H')==2 and read(tribe+0x917,'h')==0
prepare_all();assert read(tribe+0x917,'h')==2
write(people[1]+0x7a,'B',0)
stage('G replaces only selected first follower');assert_commands([3,2])
assert read(pool+22,'H')==1 and read(pool+32,'H')==1 and read(tribe+0x917,'h')==1

case('shared-order-no-follower-selection-cancellation')
stage('G creates');prepare_all()
for q in people:write(q+0x7a,'B',0)
write(s+0x7a,'B',128)
cancel=stage('Shaman-only G cancels both adopted guards');assert_commands([0,0])
assert read(pool+12,'H')==0 and read(0x96aa7a,'H')==0 and read(tribe+0x917,'h')==0
assert [e['name'] for e in cancel['trace']].count('cancel-anchor')==2

case('queued-not-adopted-no-selection')
stage('G queues');
for q in people:write(q+0x7a,'B',0)
stage('G without non-Shaman selection before adoption');assert_commands([1,1])
assert read(pool+12,'H')==2

def fill_pool():
 for i in range(1,800):write(pool+i*10,'BB4H',3,0,1,0,4096,4096)
 write(0x96aa78,'HH',1,799)
case('exhausted-pool-no-old-order')
fill_pool();failed=stage('G allocation fails separately for both followers');assert_commands([0,0])
assert read(pool+2,'H')==2 and read(0x96aa7a,'H')==800
assert [e['name'] for e in failed['trace']].count('allocate')==2
assert [e['args'][1] for e in failed['trace'] if e['name']=='attach']==[0,0]

case('exhausted-pool-clear-frees-slot-for-later-person',3)
fill_pool()
for i,q in enumerate(people):write(q+0x8b,'H',i+1)
result=stage('first failure clears old1, later retry succeeds and third shares');assert_commands([0,1,1])
assert read(pool+2,'H')==1 and read(pool+12,'H')==2 and read(pool+10,'B')==30
assert read(pool+22,'H')==0 and read(pool+32,'H')==0 and read(0x96aa7a,'H')==798
assert [e['name'] for e in result['trace']].count('allocate')==2
assert [e['args'][1] for e in result['trace'] if e['name']=='attach']==[0,1,1]

case('last-free-slot-wrap-is-shared',3)
fill_pool();write(pool+799*10+2,'H',0);write(0x96aa78,'HH',799,798)
stage('G uses last free slot once');assert_commands([799]*3)
assert read(pool+799*10+2,'H')==3 and read(0x96aa78,'H')==1 and read(0x96aa7a,'H')==799

for label,off,fmt,value in [('dead-flag',0xc,'I',1),('protected',0xc,'I',0x100000),
 ('airborne',0xc,'I',0x80000),('ghost',0x10,'I',0x800),('removed-class',0x2a,'B',0),
 ('other-model7',0x2b,'B',7),('training-state21',0x2c,'B',21)]:
 case('producer-selected-'+label,1);write(p+off,fmt,value)
 item=stage('raw selected non-Shaman-pointer still receives command30');assert_commands([1])
 assert read(pool+10,'B')==30 and read(p+off,fmt)==(value|16 if off==0xc else value)

for retain in (0,1):
 case(f'vehicle-passenger-selection-retain{retain}')
 v=0x2000700;cpu.mem_write(v,bytes(256));write(0x890390+99*4,'I',v)
 write(v+0x2a,'BB',4,1);write(v+0x9e,'B',2);write(v+0x7a,'HH',1,2)
 for q in people:write(q+0x9f,'H',99)
 stage('G selected passengers',args=(0,retain))
 assert_commands([1,1] if retain else [1,0])
 assert [read(q+0x7a,'B') for q in people]==([128,128] if retain else [0,0])

case('absent-current-shaman-does-not-issue-or-cancel')
write(tribe+0x89d,'I',0);stage('no Shaman pointer with selected followers');assert_commands([0,0])
write(tribe+0x89d,'I',s);stage('restore Shaman and issue');prepare_all()
write(tribe+0x89d,'I',0)
for q in people:write(q+0x7a,'B',0)
stage('no Shaman pointer with existing guards');assert_commands([1,1])

for label,off,fmt,value in [('dead',0xc,'I',1),('class0',0x2a,'B',0),('vehicle',0x9f,'H',99)]:
 case('stale-shaman-pointer-'+label,1);write(s+off,fmt,value)
 stage('producer still emits target73');assert_commands([1]);prepare_all()
 ended=stage('guard consumer rejects stale/contained target',0x432590,(p,))
 assert ended['returnLowByte']==17 and read(p+0x8b,'H')==0

case('saved-target-is-not-rebound-by-tribe-shaman-replacement',1)
stage('G targets original73');prepare_all()
replacement=0x2000800;cpu.mem_write(replacement,bytes(cpu.mem_read(s,256)))
write(replacement+0x24,'H',74);write(0x890390+74*4,'I',replacement);write(tribe+0x89d,'I',replacement)
write(s+0xc,'I',1)
ended=stage('old target dies after tribe pointer changes',0x432590,(p,))
assert ended['returnLowByte']==17 and read(p+0x8b,'H')==0 and read(p+0x72,'H')==73
stage('new explicit G targets replacement74');assert read(pool+read(p+0x8b,'H')*10+6,'H')==74

print(json.dumps(report,indent=2))
