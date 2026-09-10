"""Compare native percussion selection and ordinary ambient layer/accent decisions.
Music stops after descriptor selection, before driver submission. Ambience supplies
hardware calls and cue dispatch; native weighting, sorting and RNG execute.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX,UC_X86_REG_ECX
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
p,stack,stop=0x2000000,0x201e000,0x201f000
rng=random.Random(0x48c230)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hook(c,a,size,user):
 global sample
 sp=c.reg_read(UC_X86_REG_ESP);value=0
 if a==0x56ce40:sample=read(sp+4,'I')
 elif a==0x56ce50:c.emu_stop();return
 elif a==0x56e030:value=count
 elif a==0x4998b0:value=1
 elif a==0x48a050:events.append([read(sp+8,'I'),read(sp+12,'I')])
 c.reg_write(UC_X86_REG_EAX,value);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+(8 if a in [0x56cdb0,0x56ce40,0x56e030,0x56e0d0,0x56e0f0,0x56d200] else 4))
for a in [0x56ccf0,0x56cdb0,0x56ce40,0x56ce50,0x56e030,0x4998b0,0x56e070,0x56e0d0,0x56e0f0,0x56d200,0x48a050]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
music=[];ambient=[]
for n in range(4096):
 s=dict(activity=n%3,variation=rng.randrange(256),release=bool(n&4),battle=bool(n&8));count=3+(n&1)
 write(p+4,'II',2|int(s['release'])*4|int(s['battle'])*8,s['activity']);write(0x5ae2f8,'B',s['variation'])
 write(stack,'II',stop,0);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.reg_write(UC_X86_REG_ECX,p);sample=0
 cpu.emu_start(0x48c230,stop,count=10000)
 assert cpu.reg_read(UC_X86_REG_EIP)==0x56ce50
 flags=read(p+4,'I');music.append(dict(input=dict(s=s,count=count),expected=dict(sample=sample,s=dict(activity=s['activity'],variation=read(0x5ae2f8,'B'),release=bool(flags&4),battle=bool(flags&8)))))
for n in range(4096):
 total=rng.choice([0,1,81,144,255]);low=rng.randrange(total+1);water=rng.randrange(total-low+1);high=total-low-water
 s=dict(total=total,low=low,water=water,high=high,trees=bool(n&1),overview=bool(n&2),activity=0);seed=rng.getrandbits(32)
 write(0x895dc1,'HHHHHHB',total,low,water,high,int(s['trees']),0,0);write(0x89c6c1,'H',2 if s['overview'] else 0);write(0x89ce36,'B',0);write(0x89bc72,'I',seed);write(0x5ad88d,'B',0)
 for cue in [29,30,31,32,33]:write(0x5acf69+cue*12,'B',0)
 write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack);events=[];cpu.emu_start(0x489770,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 layers=[dict(cue=c,weight=read(0x98ce78+[29,30,31,33,32].index(c)*4,'I')) for c,flags in events if flags==5]
 ambient.append(dict(input=dict(s=s,randomState=seed),expected=dict(layers=layers,accents=[c for c,flags in events if flags==1],randomState=read(0x89bc72,'I'))))
js="""import {nextDrum} from './app/music.ts';import {ambientLayers,ambientAccent} from './app/ambient-sound.ts';let text='';for await(const c of process.stdin)text+=c;const d=JSON.parse(text);console.log(JSON.stringify({music:d.music.map(c=>({sample:nextDrum(c.s,c.count),s:c.s})),ambient:d.ambient.map(c=>{const w={randomState:c.randomState},accents=[];ambientAccent(w,c.s,c=>accents.push(c));return {layers:ambientLayers(c.s),accents,randomState:w.randomState};})}));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(music=[c['input'] for c in music],ambient=[c['input'] for c in ambient])),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for name,cases in [('music',music),('ambient',ambient)]:
 for i,c in enumerate(cases):
  if c['expected']!=actual[name][i]:raise AssertionError((name,i,c,actual[name][i]))
print('PASS: 4096 native percussion descriptor selections and 4096 native ordinary ambience weighting/sorting/accent decisions; hardware and cue consumers supplied')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/background-audio.json').write_text(json.dumps(dict(identity=identity,music=music[::17],ambient=ambient[::17]),separators=(',',':'))+'\n')
