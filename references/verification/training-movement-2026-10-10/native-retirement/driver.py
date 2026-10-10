"""Bounded original CPU-only training composition. No executable launch or leaf substitution."""
import sys,json,struct,hashlib,traceback,collections,platform,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4];sys.path.insert(0,str(ROOT/'scripts'))
from decomp import native_cpu,configure_native_constants,load_native_shapes
import unicorn,capstone
from unicorn import UC_HOOK_CODE,UC_HOOK_BLOCK,UC_HOOK_MEM_INVALID,UC_HOOK_INTR
from unicorn.x86_const import *
EXE=Path('/workspace/scratch/69fd8163d94e/original-game-restoration-20261010/game/d3dpoptb.exe')
OUT=Path(__file__).parent;TAG=sys.argv[1] if len(sys.argv)>1 else 'attempt01'; RUN=OUT/TAG;RUN.mkdir(exist_ok=False)
cpu,identity=native_cpu(EXE);configure_native_constants(cpu,EXE)
cpu.mem_map(0x2000000,0x100000)
POINT,STACK,STOP=0x2000000,0x20ed000,0x20ee000
COUNTS,OBJECTS,SHAPES=0x2010000,0x2020000,0x2030000
guard_snapshots=[];terrain_trace=[]
phase='setup';turn=0;person_id=0;building=0;people=[];admissions=[];events=[];visits=[];timeline=[];calls=collections.Counter();blocks=collections.deque(maxlen=30);returns={};stopped=None

def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def raw(a,n):return bytes(cpu.mem_read(a,n)).hex()
def ident(p):return read(p+0x24,'H') if 0x8e0428<=p<0x937a98 else None
PF={
 'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'counter':(0x2e,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),
 'flags2':(0xc,'I'),'flags4':(0x10,'I'),'flags3':(0x14,'I'),'stamp':(0x18,'I'),'supportHeight':(0x1c,'h'),'cellNext':(0x20,'H'),'cellPrev':(0x22,'H'),
 'angle':(0x26,'H'),'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'heading':(0x5d,'H'),'speed':(0x5f,'h'),
 'motionTimer':(0x61,'h'),'motionGroup':(0x63,'h'),'recoveryCounter':(0x65,'B'),'motionMode':(0x66,'B'),'motionIndex':(0x67,'B'),'anchorX':(0x68,'H'),'anchorY':(0x6a,'H'),'maxLife':(0x6c,'h'),'life':(0x6e,'h'),'timer':(0x70,'h'),'target':(0x72,'h'),'assignment':(0x76,'H'),'cargo':(0x78,'H'),'selectionFlags':(0x7a,'B'),'previousState':(0x7d,'B'),'slowTurn':(0x7e,'B'),'anchorFlags':(0x82,'B'),'orderLocation':(0x83,'H'),'reservationNext':(0x85,'H'),'workTarget':(0x89,'H'),
 'immediateCommand':(0x9b,'H'),'vehicle':(0x9f,'H'),'commandCursor':(0xa6,'B'),'commandStatus':(0xa7,'B'),'animationMode':(0xa8,'B'),'commandAux':(0xa9,'B'),'commandPhase':(0xaa,'B'),'formationDelay':(0xab,'B'),'statusFlags':(0xb2,'B')}
BF={k:PF[k] for k in ['id','class','model','state','substate','counter','tribe','x','y','h','angle','object','flags2','flags3','flags4'] }|{'anchorX':(0x7a,'H'),'anchorY':(0x7c,'H'),'lastActivity':(0x7e,'I'),'activity':(0x9c,'H'),'queueHead':(0xa2,'H'),'queueFrom':(0xac,'B'),'inside':(0xa6,'B'),'entering':(0xad,'B'),'entryDelay':(0xab,'B'),'entryTimer':(0xae,'B'),'trainingTimer':(0x9a,'H'),'trainingCost':(0x96,'H')}
def ps(p,full=False):
 d={k:read(p+o,f) for k,(o,f) in PF.items()};d['displacement']=dict(zip(['x','y','h'],struct.unpack('<3h',cpu.mem_read(p+0x43,6))));d['commands']=list(struct.unpack('<8H',cpu.mem_read(p+0x8b,16)))
 if full:d.update(pointer=p,bytes=raw(p,179),next=ident(read(p+4,'I')),tribeNext=ident(read(p+8,'I')))
 return d
def bs(full=False):
 if not building:return None
 d={k:read(building+o,f) for k,(o,f) in BF.items()};d['occupants']=list(struct.unpack('<6H',cpu.mem_read(building+0x86,12)))
 if full:d.update(pointer=building,bytes=raw(building,179))
 return d
def chain(head,offset=4):
 row=[]
 while head:
  assert head not in row,'cycle';row.append(head);head=read(head+offset,'I');assert len(row)<2001
 return row

def snapshot(full=False):
 forms=chain(read(0x89da55,'I'),8)
 gs=[]
 for p in forms:
  d={k:read(p+o,f) for k,(o,f) in {'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2d,'B'),'counter':(0x2e,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'heading':(0x5d,'H'),'destinationX':(0x57,'H'),'destinationY':(0x59,'H'),'shape':(0x3b,'B'),'speed':(0x5f,'h'),'timer':(0x61,'h'),'shapeTimer':(0x66,'B'),'count':(0x68,'B'),'freeSlot':(0x69,'B')}.items()}
  d['members']=list(struct.unpack('<12H',cpu.mem_read(p+0x6a,24)));d['offsets']=[dict(x=read(p+0x82+i*2,'b'),y=read(p+0x83+i*2,'b')) for i in range(12)];d['bytes']=raw(p,179);gs.append(d)
 routes=dict(active=read(0x9557b0,'h'),last=read(0x9557ae,'h'),cursor=read(0x9557ac,'h'),recordsHex=raw(0x955c29,401*109),failedSearchesHex=raw(0x955bd9,80),pathResultHex=raw(0x9557d0,1033),skip=read(0x9557c0,'B'),computerRequests=read(0x89ce5d,'B'),humanRequests=read(0x89ce5f,'B'),computerLimit=read(0x89ce5c,'B'),humanLimit=read(0x89ce5e,'B'),checkingPerson=ident(read(0x9557c8,'I')),requests=[read(0x9557b6+i*2,'h') for i in range(4)])
 d=dict(turn=turn,people=[ps(p,full) for p in people],building=bs(full),formations=gs,randomState=read(0x89d178,'I'),poseRandom=read(0x89bc72,'I'),routes=routes,allocationOrder=[ident(p) for p in chain(read(0x890324,'I'))],secondaryOrder=[ident(p) for p in chain(read(0x890330,'I'))],classCountersHex=raw(0x96eac1,12),orderPoolHex=raw(0x938830,8000),orderCursor=read(0x96aa78,'H'),orderActive=read(0x96aa7a,'H'),formationSearchHex=raw(0x89290d,192))
 if full:
  d['terrainHex']=raw(0x8a03e4,16384*16);d['walkMasksHex']=[raw(0x96aaba+i*8192,8192) for i in range(2)];d['walkMaskPointer']=read(0x96aa74,'I');d['tribesHex']=raw(0x89d1c8,4*0xc65);d['poolHex']=raw(0x8e0428,2000*179);d['gameFlags']=read(0x89d17c,'I');d['levelFlags2']=read(0x895da4,'I');d['landFlags']=read(0x89c661,'I');d['playerTribe']=read(0x89c6f0,'b');d['humanLimit']=read(0x89ce5f,'B');d['computerLimit']=read(0x89ce5d,'B')
 return d

def terrain_snapshot(full=False):
 n=read(0x6906d8,'i');d=dict(count=n,queued=list(struct.unpack('<'+'H'*n,cpu.mem_read(0x690ae8,n*2))),textureUpdates=list(cpu.mem_read(0x6906e0,n)),dirtyHex=raw(0x68c6d8,16384),attempts=read(0x68c6d0,'i'),duplicates=read(0x6906dc,'i'),recursing=read(0x690ae0,'B'),landFlags=read(0x89c661,'I'),rendererState=read(0x5d45a8,'B'))
 d['terrainSha256']=hashlib.sha256(cpu.mem_read(0x8a03e4,16384*16)).hexdigest()
 if full:d['terrainHex']=raw(0x8a03e4,16384*16)
 return d

def guard_snapshot(boundary):
 orderbytes=bytes(cpu.mem_read(0x938830,8000))
 return dict(turn=turn,boundary=boundary,activeOrderModels=sorted(set(orderbytes[n] for n in range(0,8000,10) if struct.unpack_from('<H',orderbytes,n+2)[0])),tribes=[dict(tribe=t,enabled=read(0x89d1c8+t*0xc65+0xc20,'B'),shaman=read(0x89d1c8+t*0xc65+0x89d,'I'),field949=read(0x89d1c8+t*0xc65+0x949,'I')) for t in range(4)],globals={hex(a):read(a,f) for a,f in [(0x895da4,'I'),(0x89c661,'I'),(0x96aa7c,'H'),(0x895fad,'B'),(0x89036c,'I'),(0x969e9d,'H'),(0x8922dc,'I'),(0x8922e0,'I'),(0x89c6a5,'I'),(0x96aa92,'I'),(0x96eabf,'B'),(0x96eace,'B'),(0x6906d8,'I'),(0x89035c,'I'),(0x890358,'I'),(0x890360,'I')]})

def call(address,*args):
 write(STACK,'I'*(len(args)+1),STOP,*[a&0xffffffff for a in args]);cpu.reg_write(UC_X86_REG_ESP,STACK)
 cpu.emu_start(address,STOP,count=20000000,timeout=20000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==STOP,f'call cap {hex(address)} at {hex(cpu.reg_read(UC_X86_REG_EIP))}'
 return cpu.reg_read(UC_X86_REG_EAX)
def block(c,a,n,u):
 blocks.append(hex(a))
 if not 0x401000<=a<0x58a000:raise RuntimeError(f'unsupported execution {hex(a)}')
cpu.hook_add(UC_HOOK_BLOCK,block)
def invalid(c,access,address,size,value,u):
 global stopped
 stopped=dict(kind='invalidMemory',access=access,address=hex(address),size=size,eip=hex(c.reg_read(UC_X86_REG_EIP)));return False
cpu.hook_add(UC_HOOK_MEM_INVALID,invalid)
def interrupt(c,n,u):raise RuntimeError(f'unsupported interrupt {n}')
cpu.hook_add(UC_HOOK_INTR,interrupt)
WATCH={0x44df40:'terrainProcessing',0x4be230:'terrainLighting',0x4bdff0:'terrainGlobe',0x4ed820:'poolBounds',0x4ecac0:'tribeLists',0x4ed880:'poolIds',0x4ee300:'poolLists',0x4ed8a0:'allocate',0x4ed580:'initClassModel',0x4ed640:'initState',0x4ed700:'processObject',0x4d32b0:'person',0x432590:'dispatcher',0x4d42a0:'prepare',0x4e6d00:'motion',0x4eadc0:'route',0x434610:'command8',0x407150:'admit',0x4d80e0:'occupancy',0x501000:'formation',0x5018c0:'recruit',0x4d4f40:'speed',0x4d4040:'animation',0x4e9d80:'destination',0x4359b0:'sharedCommit',0x438730:'prepareOrder',0x403280:'building',0x4d4690:'encounter',0x4d9bd0:'personAmbient2',0x4def50:'personAmbient3',0x4da2a0:'personAmbient4',0x40c4e0:'indicator',0x5178d0:'collision',0x4ee470:'insertCell',0x4ee580:'moveCell'}
def watch(c,a,n,u):
 sp=c.reg_read(UC_X86_REG_ESP);args=list(struct.unpack('<4I',cpu.mem_read(sp+4,16)));name=WATCH[a];calls[name]+=1
 event=dict(turn=turn,phase=phase,name=name,address=hex(a),caller=hex(read(sp,'I')),person=ident(args[0]),args=args)
 if name in ['admit','recruit','allocate','sharedCommit','destination','formation']:
  if name=='admit':event['before']=bs();admissions.append(event)
  events.append(event)
 if name=='dispatcher' and visits and visits[-1]['id']==ident(args[0]):visits[-1]['preCommand']=ps(args[0])
 if name=='person':visits.append(dict(turn=turn,id=ident(args[0]),before=ps(args[0]),eventStart=len(events)))
 if name in ['person','admit','allocate']:
  ret=read(sp,'I');key=(ret,sp+4);returns[key]=(name,args[0],event if name in ['admit','allocate'] else len(visits)-1)
  if ret not in return_hooks:return_hooks[ret]=cpu.hook_add(UC_HOOK_CODE,on_return,begin=ret,end=ret)
return_hooks={}
def on_return(c,a,n,u):
 key=(a,c.reg_read(UC_X86_REG_ESP));item=returns.pop(key,None)
 if item:
  name,p,index=item
  if name=='person':visits[index]['after']=ps(p)
  if name=='allocate':index.update(resultPointer=c.reg_read(UC_X86_REG_EAX),resultId=ident(c.reg_read(UC_X86_REG_EAX)))
  if name=='admit':index.update(result=c.reg_read(UC_X86_REG_EAX)&255,after=bs())
for a in WATCH:cpu.hook_add(UC_HOOK_CODE,watch,begin=a,end=a)


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

def run():
 global phase,turn,building,people,person_id
 # Defined isolated fixture inputs, retaining authentic original producers for all unit records.
 write(0x89d178,'I',0x12345678);write(0x89bc72,'I',0x87654321);write(0x89d17c,'I',32)
 cpu.mem_write(0x8e0428,bytes(2000*179));cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(0x8a03e4,bytes(16384*16))
 for i in range(16384):write(0x8a03e4+i*16+4,'h',400)
 for a in [0x890324,0x890328,0x890330,0x890358,0x89035c,0x890360]:write(a,'I',0)
 cpu.mem_write(0x96eac1,bytes(12));write(0x89c6f0,'b',0)
 for i in range(4):write(0x89d1c8+i*0xc65+0xc1f,'B',0 if i==0 else 2)
 cpu.mem_write(0x8929cd,(EXE.parent/'data/mwsearch.dat').read_bytes())
 load_native_shapes(cpu,EXE,OBJECTS,SHAPES)
 rules=json.loads((ROOT/'app/original-rules.json').read_text())
 assert list(cpu.mem_read(0x5aa318,16))==rules['terrainCategories']
 assert [read(0x5aa328+14*i,'B') for i in range(16)]==rules['terrainCategoryFlags']
 starts=list(struct.iter_unpack('<HH',(EXE.parent/'data/vstart-0.ani').read_bytes()));frames=list(struct.iter_unpack('<HBBBBH',(EXE.parent/'data/vfra-0.ani').read_bytes()))
 counts=[]
 for start,_ in starts:
  frame=start;seen=set()
  while frame and frame not in seen:seen.add(frame);frame=frames[frame][-1]
  assert frame in [0,start];counts.append(len(seen)&255)
 write(0x59df44,'I',COUNTS)
 for i,n in enumerate(counts):write(COUNTS+i*6+1,'B',n)
 cpu.mem_write(0x5aa118,(EXE.parent/'data/aniob0-0.dat').read_bytes())
 call(0x4ed820);call(0x4ed880);call(0x4ee300)
 phase='walk-mask';call(0x422a60,0,64)
 phase='allocate-temple';write(POINT,'HHh',16384,16384,400);building=call(0x4ed8a0,2,5,0,POINT);assert building
 phase='allocate-braves'
 for i in range(8):
  write(POINT,'HHh',13312+i*256,14848,400);p=call(0x4ed8a0,1,2,0,POINT);assert p;people.append(p)
 (RUN/'allocated.json').write_text(json.dumps(snapshot(True)))
 phase='initialize-temple';call(0x403280,building)
 phase='tribe-lists';call(0x4ecac0)
 assert read(building+0x33,'H')==95,(bs(), 'wrong Temple object')
 # Native order producer, selected tribe members; selection is the explicit group fixture.
 for p in people:write(p+0x7a,'B',read(p+0x7a,'B')|128)
 write(0x96aa78,'HH',1,0);write(0x89d1c8+0x8bf,'BB',1,1)
 phase='shared-command';call(0x435780,0x89d1c8,0,8,ident(building),0,0);assert call(0x4359b0,0x89d1c8,0xffffffff,0xffffffff,0xffffffff)
 assert all(read(p+0x8b,'H')==1 for p in people),'shared order absent'
 assert read(0x938830+10+2,'H')==8,'wrong shared references'
 phase='source-human-restart-block'
 cpu.reg_write(UC_X86_REG_ESP,STACK);cpu.reg_write(UC_X86_REG_EDI,read(0x89da49,'I'));cpu.reg_write(UC_X86_REG_ESI,0x100000);cpu.reg_write(UC_X86_REG_EBP,2)
 cpu.emu_start(0x44512b,0x44519b,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==0x44519b
 assert all(read(p+0xa7,'B')==8 and read(p+0x72,'H')==ident(building) for p in people),'unconfigured command8'
 initial=snapshot(True);initial['terrainQueue']=terrain_snapshot();(RUN/'initial-runtime-globals.bin').write_bytes(bytes(cpu.mem_read(0x890000,0x100000)));(RUN/'initial.json').write_text(json.dumps(initial));print(json.dumps({'event':'initialized','building':bs(),'ids':[ident(p) for p in people],'rng':initial['randomState'],'people':[{k:ps(p)[k] for k in ['id','state','substate','counter','life','physics','x','y','commands']} for p in people]}),flush=True)
 for turn in range(1,161):
  write(0x897981,'I',turn)
  phase='native-header-and-formations';cpu.reg_write(UC_X86_REG_ESP,STACK);cpu.emu_start(0x4ec701,0x4ec7f1,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==0x4ec7f1
  assert read(0x89d188,'I')==turn
  assert read(0x89035c,'I')==0 and read(0x890358,'I')==0,'unsupported fight world'
  assert read(0x890360,'I')==0,'unsupported guard-control world'
  life_snapshot('afterHeader')
  phase='objects';cpu.reg_write(UC_X86_REG_ESP,STACK);cpu.emu_start(0x4ec898,0x4ec8cb,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==0x4ec8cb
  life_snapshot('afterObjects')
  guard_snapshots.append(guard_snapshot('before-4ef7f0-4f0460'))
  phase='secondary-and-tribe-rebuild';cpu.reg_write(UC_X86_REG_ESP,STACK);cpu.emu_start(0x4ec924,0x4ec947,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==0x4ec947
  guard_snapshots.append(guard_snapshot('before-sunlight'))
  phase='deferred-free';cpu.reg_write(UC_X86_REG_ESP,STACK);cpu.emu_start(0x4ec94c,0x4ec98d,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==0x4ec98d
  life_snapshot('afterDeferredFree')
  guard_snapshots.append(guard_snapshot('late-world-tail'))
  phase='terrain-processing';before_terrain=terrain_snapshot(True);call(0x44df40);terrain_trace.append(dict(turn=turn,before=before_terrain,after=terrain_snapshot(True)))
  phase='failed-route-aging';call(0x4ec390)
  timeline.append(snapshot())
  if admissions and admissions[-1]['turn']==turn:print(json.dumps({'event':'admission','turn':turn,'building':bs(),'calls':[a for a in admissions if a['turn']==turn]}),flush=True)
  if read(building+0xa6,'B')==5:break
 return 'completed' if read(building+0xa6,'B')==5 else 'bounded-no-five'
status='blocked'
try:status=run()
except Exception as e:
 error=dict(type=type(e).__name__,message=str(e),traceback=traceback.format_exc(),phase=phase,turn=turn,eip=hex(cpu.reg_read(UC_X86_REG_EIP)),blocks=list(blocks),memory=stopped,registers={r:hex(cpu.reg_read(v)) for r,v in {'eax':UC_X86_REG_EAX,'ebx':UC_X86_REG_EBX,'ecx':UC_X86_REG_ECX,'edx':UC_X86_REG_EDX,'esi':UC_X86_REG_ESI,'edi':UC_X86_REG_EDI,'ebp':UC_X86_REG_EBP,'esp':UC_X86_REG_ESP}.items()})
 print(json.dumps({'event':'blocked','error':error}),flush=True)
else:error=None
sources=[Path(__file__),ROOT/'scripts/decomp.py',ROOT/'decomp/tools.json',ROOT/'decomp/research/training-entry-serialization.md',EXE,*[EXE.parent/p for p in ['levels/constant.dat','data/mwsearch.dat','data/vstart-0.ani','data/vfra-0.ani','data/aniob0-0.dat','objects/objs0-2.dat','objects/shapes.dat']]]
result=dict(status=status,identity=identity,sourceHead='96a465d1b3dfb7ff7aae34865088308dc26d4783',tools=dict(python=sys.version,unicorn=unicorn.__version__,capstone=capstone.__version__,platform=platform.platform()),sources=[dict(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sources],hooks={'replaced':[],'observed':{hex(a):name for a,name in WATCH.items()},'counts':dict(calls),'abort':['invalid memory','interrupt','execution outside original text','bounded instructions']},error=error,terrainTrace=terrain_trace,excludedGuardSnapshots=guard_snapshots,final=snapshot(True),admissions=admissions,events=events,turnVisits=visits,timeline=timeline,limits=['isolated flat-terrain synthetic fixture','no PE startup, OS, imports or network bridge','animation VSTART frame counts projected from original verified data','native header, command maintenance, formation, primary/secondary object, tribe rebuild, deferred-free, terrain processing and failed-route-aging phases; unrelated globals/effects/phases excluded','gameFlags32 disables training completion and exit'])
(RUN/'lifecycle.json').write_text(json.dumps(lifecycle));(RUN/'result.json').write_text(json.dumps(result));print(json.dumps({'status':status,'turn':turn,'inside':bs(),'admissions':len(admissions),'result':str(RUN/'result.json')}),flush=True)
raise SystemExit(0 if status=='completed' else 2)
