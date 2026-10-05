"""One bounded original class5/model9 creation/dispatcher/animation gate comparison."""
import argparse,hashlib,json,struct,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4];sys.path.insert(0,str(ROOT/'scripts'))
from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX,UC_X86_REG_FPCW
import unicorn
p=argparse.ArgumentParser();p.add_argument('exe',type=Path);p.add_argument('output',type=Path);args=p.parse_args();assert not args.output.exists()
start=time.monotonic();cpu,identity=native_cpu(args.exe);cpu.mem_map(0x2000000,0x1000000);cpu.reg_write(UC_X86_REG_FPCW,0x27f)
stone,trigger,gift=0x2000000,0x2000200,0x2000400
objects,faces,vertices=0x2010000,0x2020000,0x2200000
stack,stop=0x2ffd000,0x2ffe000
sha=lambda b:hashlib.sha256(b).hexdigest()
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f='I'):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
raw=args.exe.read_bytes();pe=struct.unpack_from('<I',raw,60)[0];opt=struct.unpack_from('<H',raw,pe+20)[0];readonly=[]
for i in range(struct.unpack_from('<H',raw,pe+6)[0]):
 off=pe+24+opt+i*40;_,vs,va,rs=struct.unpack_from('<8sIII',raw,off);flags=struct.unpack_from('<I',raw,off+36)[0]
 if flags&0x40000000 and not flags&0x80000000:readonly.append((va+0x400000,bytes(cpu.mem_read(va+0x400000,max(vs,rs)))))
def guard():
 for a,b in readonly:assert bytes(cpu.mem_read(a,len(b)))==b,hex(a)
def call(address,*values):
 guard();write(stack,'I'*(len(values)+1),stop,*values);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(address,stop,timeout=1000000,count=2000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,(hex(address),hex(cpu.reg_read(UC_X86_REG_EIP)))
 guard()
inputs={};provenance=json.loads((ROOT/'public/original/provenance.json').read_text())['sha256']
for name,address in [('objs',objects),('facs',faces),('pnts',vertices)]:
 path=f'objects/{name}0-2.dat';b=(args.exe.parent/path).read_bytes();assert sha(b)==provenance[path];inputs[path]={'sha256':sha(b),'bytes':len(b)};cpu.mem_write(address,b)
 if name=='objs':
  for i in range(len(b)//54):
   for offset,stride,base in [(16,60,faces),(20,60,faces),(24,6,vertices),(28,6,vertices)]:
    n=read(objects+i*54+offset);write(objects+i*54+offset,'I',base+(n-1)*stride if n else 0)
write(0x895ec1,'I',objects);write(0x895ec5,'I',faces)
b=(args.exe.parent/'objects/morph0-2.dat').read_bytes();assert sha(b)=='1939b4d30839f2ab49ea110abb29d40eb001d6cc6fa4932be72ce44c3aebf066';inputs['objects/morph0-2.dat']={'sha256':sha(b),'bytes':len(b)};cpu.mem_write(0x87cc08,b);call(0x40ce30)
leaves={0x4ee470:'land object insertion',0x44fad0:'land tile invalidation',0x403c10:'land shadow update',0x44e940:'terrain height=128',0x4a9030:'neighbor object/terrain notifications',0x44ddf0:'terrain propagation',0x48a050:'audio submission'}
events=[];executed=set()
def hook(c,a,size,user):
 if a in leaves:
  sp=c.reg_read(UC_X86_REG_ESP);events.append({'entry':f'{a:08x}','leaf':leaves[a],'stamp':read(stone+0x18),'flags3':read(stone+0x14)})
  c.reg_write(UC_X86_REG_EAX,128 if a==0x44e940 else 0);c.reg_write(UC_X86_REG_EIP,read(sp));c.reg_write(UC_X86_REG_ESP,sp+4)
 else:executed.add(f'{a:08x}')
for a in leaves:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
for a in [0x4ed580,0x4a5ef0,0x4a67d0,0x4a6210,0x4ed640,0x4a66c0,0x4851e0,0x4fbd20,0x4ed700,0x4a6480,0x4a8b00,0x4a8ed0,0x4ee770,0x4ee7b0,0x40cc10,0x40cb90,0x40cbf0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'stamp':(0x18,'I'),'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'morphTimer':(0x72,'h'),'morphFrames':(0x71,'B'),'presentationMode':(0x97,'B')}
def snapshot():
 r={k:read(stone+o,f)for k,(o,f)in fields.items()};r['frame']=read(stone+0x70,'B')if r['renderFlags']&0x400 and not r['renderFlags']&0x800 else (r['f1']&65535)>>2;return r

def create(initial=0):
 cpu.mem_write(stone,bytes(256));cpu.mem_write(trigger,bytes(256));cpu.mem_write(gift,bytes(256))
 write(stone+0x2a,'BB',5,9);write(stone+0x3d,'HHh',256,256,128);write(stone+0x14,'I',initial)
 write(0x89d188,'I',1);write(0x897981,'I',90);write(0x895da8,'I',0);write(0x89c661,'B',0)
 call(0x4ed580,stone);created=snapshot();assert created['state']==10 and created['flags3']&0x40000 and created['stamp']==90
 # Actual three-object post-load linker produces the automatic-reward45 selector.
 write(trigger+0x2a,'BB',6,6);write(trigger+0x3d,'HHh',256,256,128);write(trigger+0x6d,'B',1);write(trigger+0x72,'H',30)
 write(gift+8,'I',30);write(gift+0x24,'H',30);write(gift+0x2a,'BB',6,2);write(gift+0x80,'B',3)
 write(trigger+4,'I',gift);write(gift+4,'I',stone);write(0x890324,'I',trigger);write(0x890330,'I',0)
 call(0x4851e0);linked=snapshot();assert read(trigger+0x6d,'B')&0x20;assert linked['object']==45 and linked['draw']==4 and linked['morph']==1 and linked['presentationMode']==2 and linked['flags3']&0x40000 and not linked['renderFlags']&0x1000
 return created,linked

producers=[]
for seed in [0,0x100]:
 before,after=create(seed);assert before['flags3']==seed|0x40004;producers.append({'initialFlags3':seed,'created':before,'linked':after})

cases=[]
for allocation_list in ['primary','secondary']:
 for gate in ['native','clear-bit-control']:
  created,initial=create();write(0x890324,'I',stone if allocation_list=='primary' else 0);write(0x890330,'I',stone if allocation_list=='secondary' else 0)
  if gate=='clear-bit-control':write(stone+0x14,'I',read(stone+0x14)&~0x40000)
  rows=[];enabled=True;counter=100
  for phase,visits in [('enabled',40),('disabled',6),('refill',8),('land-pause',4),('resume',6)]:
   if phase in ['disabled','refill']:
    enabled=phase=='refill';write(trigger+0x6d,'B',0x20|int(enabled));call(0x4fbd20,trigger,stone,0,int(enabled))
    rows.append({'phase':phase,'action':'sync','enabled':enabled,'after':snapshot()})
   write(0x89c661,'B',2 if phase=='land-pause' else 0)
   for visit in range(visits):
    write(0x897981,'I',counter);logical=visit%2==0 and phase!='land-pause';before=snapshot()
    if logical:
     write(stone+0x2e,'B',(read(stone+0x2e,'B')+1)&255);call(0x4ed700,stone)
     assert read(stone+0x18)==counter and read(stone+0x2c,'B')==10
    dispatched=snapshot();call(0x4ee770);after=snapshot()
    if gate=='native' and not logical:assert after['f1']==before['f1'],(phase,counter,before,after)
    if phase in ['disabled','land-pause']:assert after['f1']==before['f1']
    assert not after['renderFlags']&0x1000 and bool(after['flags3']&0x40000)==(gate=='native')
    rows.append({'phase':phase,'action':'visit','counter':counter,'logicalVisit':logical,'enabled':enabled,'before':before,'dispatched':dispatched,'after':after});counter+=1
  cases.append({'list':allocation_list,'gate':gate,'initial':initial,'rows':rows})
# Branch control only: no claim the45 selector actually creates a morph transition.
create();write(0x890324,'I',stone);write(0x890330,'I',0);write(0x897981,'I',400);write(stone+0x18,'I',399);write(stone+0x35,'H',read(stone+0x35,'H')|0x1000);write(stone+0x71,'B',5);write(stone+0x72,'h',0);before=snapshot();call(0x4ee770);after=snapshot();assert after['morphTimer']==4 and after['f1']==before['f1']
node="""import {createStoneHeadAnimation,stepStoneHeadAnimation,stoneHeadFrame,syncStoneHeadEnabled} from './app/stone-head-animation.ts';let s='';for await(const c of process.stdin)s+=c;const cases=JSON.parse(s);console.log(JSON.stringify(cases.map(c=>{const p=createStoneHeadAnimation(true,{triggerIndex:28,sceneryIndex:33});return {list:c.list,gate:c.gate,rows:c.rows.map(r=>{if(r.action==='sync')syncStoneHeadEnabled(p,r.enabled);else if(r.phase!=='land-pause')stepStoneHeadAnimation(p,r.enabled);return {f1:p.f1,frame:stoneHeadFrame(p),renderMode:p.renderFlags&0xc00,flags3:p.flags3,stamp:p.stamp}})}})));"""
r=subprocess.run(['node','--input-type=module','-e',node],cwd=ROOT,input=json.dumps(cases),capture_output=True,text=True,timeout=15);assert r.returncode==0,r.stderr;adapter=json.loads(r.stdout);mismatches=[]
for c,a in zip(cases,adapter):
 for i,(n,b)in enumerate(zip(c['rows'],a['rows'])):
  different=n['after']['f1']!=b['f1'] or n['after']['frame']!=b['frame']
  if c['gate']=='clear-bit-control':assert not different,(i,n,b)
  elif different:mismatches.append({'list':c['list'],'row':i,'phase':n['phase'],'counter':n.get('counter'),'nativeF1':n['after']['f1'],'adapterF1':b['f1']})
assert mismatches
result={'status':'passed-confirmed-model45-gate-mismatch','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'executable':identity,'unicorn':unicorn.__version__,'probeSha256':sha(Path(__file__).read_bytes()),'inputs':inputs,'producers':producers,'cases':cases,'adapter':adapter,'mismatches':mismatches,'syntheticTransitionControl':{'before':before,'after':after},'executed':sorted(executed),'interceptedEnvironmentLeaves':events,'sourceHashes':{p:sha((ROOT/p).read_bytes())for p in ['app/stone-head-animation.ts','app/game-clock.ts','app/animation.ts','app/original-stone-heads.json','scripts/check-native-stone-head-animation.py']},'limits':'Authored class5/model9 creation and actual class5 state10 processor execute; terrain height/insertion/shadow/propagation/neighbor notifications and audio submission supplied. Actual post-load gift flag/45 selector, dispatcher stamp, both animation lists and updater execute. Logical/draw visitation schedule is controlled and does not measure original wall time. No full renderer, rewards, original OS, Vault/HFX or other scenery families. Mode4 transition is an explicitly synthetic branch control.','seconds':time.monotonic()-start}
args.output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'producerCases':len(producers),'timelines':len(cases),'mismatchRows':len(mismatches),'executed':result['executed'],'seconds':result['seconds']}))
