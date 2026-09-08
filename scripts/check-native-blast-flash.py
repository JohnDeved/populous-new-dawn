"""Compare Blast's flash initializer, animation and lifetime with the supplied EXE.
World registration, class callbacks, audio/light consumers and final free are
stubbed; native state selection, terrain interpolation and animation execute.
Usage: python scripts/check-native-blast-flash.py EXE
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT

cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
p,stack,stop=0x2000000,0x201d000,0x201e000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
rng=random.Random(0x509f03)
land=dict(heights=[rng.randrange(1025) for _ in range(16384)],flags=[rng.randrange(2) for _ in range(16384)])
for i,(h,flags) in enumerate(zip(land['heights'],land['flags'])):write(0x8a03e4+i*16,'Ih',flags,h)
fields={'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),
 'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B')}
def hook(c,a,size,user):
 global freed
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x48a050:cues.append(read(sp+8,'I'))
 if a==0x4010b0:lights.append([read(sp+8+i*4,'I') for i in range(3)])
 if a==0x4ef180:freed=True
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x50bcd0,0x4ed6f0,0x4ed640,0x48a050,0x4010b0,0x4ef180]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call(a):
 write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def snapshot():return {k:read(p+off,f) for k,(off,f) in fields.items()}

assert list(cpu.mem_read(0x5a80f8+2*62,5))==[5,3,78,38,0]
cases=[];expected=[]
for i in range(128):
 point=dict(x=rng.randrange(65536),y=rng.randrange(65536))
 cpu.mem_write(p,bytes(256));write(p+0x2a,'BB',7,78);write(p+0x3d,'HHh',point['x'],point['y'],32767)
 cues=[];lights=[];freed=False;call(0x509c10)
 assert cues==[0xa1]
 # Separate freshly allocated object; preserve the observed impact cue order.
 cpu.mem_write(p,bytes(256));write(p+0x2a,'BB',7,38);write(p+0x3d,'HHh',point['x'],point['y'],-32768)
 call(0x509c10);assert read(p+0x2c,'B')==0x24 and cues==[0xa1,0xb2] and lights==[[4,4,0]]
 frames=[snapshot()];height=read(p+0x41,'h');turns=read(p+0x6c,'h')
 for _ in range(20):call(0x4ee7b0);frames.append(snapshot())
 lifetime=0
 while not freed:call(0x50a750);lifetime+=1;assert lifetime<=9
 assert lifetime==turns
 cases.append(point);expected.append(dict(height=height,turns=turns,frames=frames))

js="""import {createWorld,effect,browserPosition} from './app/model.ts';
import {animateLiveObjects} from './app/live-people.ts';
import atlas from './app/original-effects.json' with {type:'json'};
let s='';for await(const b of process.stdin)s+=b;const {land,cases}=JSON.parse(s);
const w=createWorld();w.units=[];Object.assign(w.land,land);w.land.landFlags=0;
console.log(JSON.stringify(cases.map(p=>{w.effects=[];const f=effect(w,'blast',browserPosition(p)),keys=['object','renderFlags','f1','f2','draw','morph','palette'];
const snapshot=()=>Object.fromEntries(keys.map(k=>[k,f.animation[k]])),frames=[snapshot()];
for(let i=0;i<20;i++){animateLiveObjects(w);frames.push(snapshot());}
if(atlas.animations.impact.some((f,i)=>f.source!==1099+i)||atlas.animations.impact.length!==9)throw Error('Wrong imported Blast frames');
return {height:Math.round(f.height*45),turns:f.duration*12,frames};})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(land=land,cases=cases)).encode(),cwd=ROOT))
assert actual==expected,next((i,a,e) for i,(a,e) in enumerate(zip(actual,expected)) if a!=e)
print('PASS: 128 native Blast flash initializations/heights, 2688 animation records, nine-turn deletion, impact cue order and light requests; original HFX1099–1107 imported')
