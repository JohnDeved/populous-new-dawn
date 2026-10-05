"""Bounded issue214 producer/stamp/animation gate proof. No wall-clock supplied."""
import argparse, hashlib, json, struct, subprocess, sys, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
sys.path.insert(0,str(ROOT/'scripts'))
from decomp import native_cpu, configure_native_constants
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
import unicorn

parser=argparse.ArgumentParser();parser.add_argument('exe',type=Path);parser.add_argument('output',type=Path)
args=parser.parse_args();assert not args.output.exists()
started=time.monotonic();cpu,identity=native_cpu(args.exe);configure_native_constants(cpu,args.exe)
cpu.mem_map(0x2000000,0x20000)
p,counts,stack,stop=0x2000000,0x2008000,0x201d000,0x201e000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
rules=json.loads((ROOT/'app/original-rules.json').read_text())
units=json.loads((ROOT/'app/original-units.json').read_text())
write(0x59df44,'I',counts)
for i,n in enumerate(units['frameCounts']):write(counts+i*6+1,'B',n)
write(0x895da4,'I',0x10000) # Real footprint-disable flag, independent of this gate.
write(0x89d17c,'I',0);write(0x89c6f0,'B',0)

raw=args.exe.read_bytes();pe=struct.unpack_from('<I',raw,60)[0];optional=struct.unpack_from('<H',raw,pe+20)[0]
readonly=[]
for i in range(struct.unpack_from('<H',raw,pe+6)[0]):
    entry=pe+24+optional+i*40
    _,virtual,address,size=struct.unpack_from('<8sIII',raw,entry)
    flags=struct.unpack_from('<I',raw,entry+36)[0]
    if flags&0x40000000 and not flags&0x80000000:
        address+=0x400000;readonly.append((address,bytes(cpu.mem_read(address,max(virtual,size)))))
def guard():
    for address,expected in readonly:assert bytes(cpu.mem_read(address,len(expected)))==expected,hex(address)
fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'flags3':(0x14,'I'),'stamp':(0x18,'I'),'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),'morphTimer':(0x72,'h'),'morphFrames':(0x71,'B')}
def snapshot():return {key:read(p+off,fmt) for key,(off,fmt) in fields.items()}
def reset(model=2,kind=1,flags=0):
    cpu.mem_write(p,bytes(256));write(p+0x2a,'BBB',kind,model,19 if kind==1 else 0)
    write(p+0x14,'I',flags);write(p+0x3d,'HHh',256,256,0);write(p+0x2f,'b',0)
def call(address,*values,end=stop):
    guard();write(stack,'I'*(len(values)+1),stop,*values);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,end,timeout=1000000,count=200000)
    assert cpu.reg_read(UC_X86_REG_EIP)==end,(hex(address),hex(cpu.reg_read(UC_X86_REG_EIP)))
    guard()

events=[]
def returned(value=0):
    sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,value)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
def hook(c,address,size,user):
    if address==0x4d32b0:
        events.append({'leaf':'person processor','stampAtEntry':read(p+0x18,'I'),'flags3':read(p+0x14,'I')})
    elif address==0x50a750:
        events.append({'leaf':'effect processor','stampAtEntry':read(p+0x18,'I'),'flags3':read(p+0x14,'I')})
    else:events.append({'leaf':hex(address)})
    returned(0)
# Dispatcher bodies are replaced only to isolate its post-processor stamp write.
# Effect initializer state/audio/height leaves are supplied; setters execute.
for address in [0x4d32b0,0x50a750,0x4ed640,0x48a050,0x44e940]:cpu.hook_add(UC_HOOK_CODE,hook,begin=address,end=address)

producers=[]
for model in range(2,8):
    for initial in [0,0x8000,0x80000]:
        reset(model,flags=initial)
        # Exact unconditional person-initializer prefix, stopping immediately
        # after OR0x40100 and before model dispatch. No callee is intercepted here.
        call(0x4d23d0,p,end=0x4d23f4)
        actual=read(p+0x14,'I');assert actual==initial|0x40100
        producers.append({'kind':'person initializer prefix','model':model,'initial':initial,'flags3':actual,'end':'004d23f4','intercepts':[]})

timelines=[]
for model in range(2,8):
    for row,name in [(0,'idle'),(1,'walk')]:
        reset(model)
        call(0x4d23d0,p,end=0x4d23f4)
        call(0x4d4040,p,rules['personAnimationObjects'][row*9+model])
        initial=snapshot();assert initial['flags3']&0x40000
        samples=[];events.clear()
        for visit in range(12):
            counter=100+visit;write(0x897981,'I',counter)
            logical=visit%2==0
            if logical:
                old=read(p+0x18,'I');call(0x4ed700,p)
                assert events[-1]['stampAtEntry']==old and read(p+0x18,'I')==counter
            before=snapshot();call(0x4ee7b0,p);after=snapshot()
            if not logical:assert after==before
            samples.append({'counter':counter,'logicalVisit':logical,'before':before,'after':after})
        timelines.append({'name':name,'model':model,'initial':initial,'samples':samples,'dispatcherLeaves':list(events)})

effect_producers=[]
for label,model,entry in [('splash',65,0x513830),('full hut smoke',74,0x50c150),('partial hut smoke',75,0x50c150),('building damage smoke',76,0x5119d0)]:
    reset(model,kind=7);events.clear();call(entry,p);initial=snapshot()
    expected_gate=label=='splash'
    assert bool(initial['flags3']&0x40000)==expected_gate
    initializers=list(events);samples=[]
    for visit in range(6):
        counter=200+visit;write(0x897981,'I',counter);logical=visit%2==0
        if logical:call(0x4ed700,p)
        before=snapshot();call(0x4ee7b0,p);after=snapshot()
        if expected_gate and not logical:assert after==before
        if not expected_gate:assert after['f1']!=before['f1']
        samples.append({'counter':counter,'logicalVisit':logical,'before':before,'after':after})
    effect_producers.append({'name':label,'entry':hex(entry),'initial':initial,'initializerLeaves':initializers,'samples':samples})

js="""import {createWorld} from './app/model.ts';import {createLivePerson,animateLiveObjects} from './app/live-people.ts';import {stepObjectAnimation} from './app/animation.ts';import units from './app/original-units.json' with {type:'json'};
let input='';for await(const chunk of process.stdin)input+=chunk;const {timelines}=JSON.parse(input);const world=createWorld();const template=world.units.find(u=>u.team==='blue'&&u.kind==='brave');
const constructor=['brave','warrior','preacher','spy','firewarrior','shaman'].map(kind=>{const p=createLivePerson(world,{...template,kind});return {kind,model:p.model,flags3:p.flags3,stamp:p.stamp}});
const cases=timelines.map(c=>{const native={...c.initial},adapter={...c.initial,flags3:0,stamp:0},flagOnly={...c.initial,stamp:0};const w={paused:false,land:{landFlags:0},levelFlags2:0x10000,units:[{native:adapter}],shrines:[],effects:[]};const portRows=[],adapterRows=[],flagOnlyRows=[];for(const s of c.samples){if(s.logicalVisit)native.stamp=s.counter;stepObjectAnimation(native,{counter:s.counter,levelFlags:0,levelFlags2:0x10000},{frameCounts:units.frameCounts,modelFrames:[],morphDurations:[]},()=>{});portRows.push({...native});animateLiveObjects(w);adapterRows.push({...adapter});w.units[0].native=flagOnly;animateLiveObjects(w);flagOnlyRows.push({...flagOnly});w.units[0].native=adapter;}return {name:c.name,model:c.model,portRows,adapterRows,flagOnlyRows}});console.log(JSON.stringify({constructor,cases}));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps({'timelines':timelines}),cwd=ROOT,capture_output=True,text=True,timeout=15)
assert r.returncode==0,r.stderr
browser=json.loads(r.stdout)
assert all(not p['flags3']&0x40000 and p['stamp']==0 for p in browser['constructor'])
for native,web in zip(timelines,browser['cases']):
    assert [s['after'] for s in native['samples']]==web['portRows']
    assert any(s['after']['f1']!=p['f1'] or s['after']['f2']!=p['f2'] for s,p in zip(native['samples'],web['adapterRows']))
    assert [(p['f1'],p['f2']) for p in web['adapterRows']]==[(p['f1'],p['f2']) for p in web['flagOnlyRows']]
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
result={'status':'passed','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'executable':identity,'unicorn':unicorn.__version__,'probeSha256':sha(Path(__file__)),'sourceHashes':{name:sha(ROOT/name) for name in ['app/live-people.ts','app/animation.ts','app/world-effects.ts','app/original-rules.json','app/original-units.json']},'personProducers':producers,'personTimelines':timelines,'effectProducers':effect_producers,'browser':browser,'limits':'Person initializer executes only its unconditional prefix; full idle/walk creation and complete person simulation are not claimed. Actual original setter, dispatcher post-body stamp and animation gate execute; dispatcher child bodies supplied. Original effect initializers execute with state/audio/height leaves supplied. Synthetic numbered draw visits and chosen logical visits test ownership, not OS/wall-clock cadence. No browser or gameplay edit. Restoring only the person bit cannot fix a caller whose stamp and counter both remain zero.','seconds':time.monotonic()-started}
args.output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'status':'passed','personProducerCases':len(producers),'personTimelines':len(timelines),'effectProducers':len(effect_producers),'seconds':result['seconds'],'sourceCommit':result['sourceCommit']}))
