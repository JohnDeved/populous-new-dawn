"""Compare native bolt shapes, branching draw calls, strip corners and texture.
Usage: python scripts/check-native-lightning.py EXE
Damage/fire/world allocation and final drawing are intercepted; native random,
terrain, trig, geometry, recursion, quad rounding and texture loops execute.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX,UC_X86_REG_FPCW,UC_X86_REG_EDI
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x40000)
p,stack,stop,pool=0x2000000,0x2030000,0x203f000,0x2010000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
cpu.reg_write(UC_X86_REG_FPCW,0x27f);rng=random.Random(0x511ae0)
land=dict(heights=[rng.randrange(513) for _ in range(16384)],flags=[rng.randrange(2) for _ in range(16384)])
for i,(h,flags) in enumerate(zip(land['heights'],land['flags'])):write(0x8a03e4+i*16,'Ih',flags,h)
mode='geometry';allocated=[];lines=[]
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4ed8a0:
  cls,model=read(sp+4,'I')&255,read(sp+8,'I')&255;c.reg_write(UC_X86_REG_EAX,0)
  if (cls,model)==(7,42):
   q=pool+len(allocated)*256;allocated.append(q);c.mem_write(q,bytes(256));write(q+0x2a,'BB',7,42)
   c.mem_write(q+0x3d,bytes(c.mem_read(read(sp+16,'I'),6)));c.reg_write(UC_X86_REG_EAX,q)
 if a==0x516500:
  if mode=='quads':return
  values=[read(sp+4+i*4,'i') for i in range(6)]
  lines.append(dict(zip(['x1','y1','x2','y2','alpha','width'],values)));lines[-1]['alpha']=(values[4]>>24)&255
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4+(24 if a==0x47d980 else 0))
for a in [0x4ed8a0,0x4ed6f0,0x4ed640,0x4edcf0,0x516500,0x47d980]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[x&0xffffffff for x in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def point(a):return dict(x=read(a,'H'),y=read(a+2,'H'),h=read(a+4,'h'))
def compare(js,data,expected):
 result=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(data).encode(),cwd=ROOT))
 if result!=expected:
  i=next(i for i,(a,e) in enumerate(zip(result,expected)) if a!=e)
  Path('/private/tmp/populous-lightning-failure.json').write_text(json.dumps(dict(case=data['cases'][i],native=expected[i],browser=result[i]),indent=2));raise AssertionError(f'Case {i}: /private/tmp/populous-lightning-failure.json')

cases=[];expected=[]
for i in range(128):
 start=dict(x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(1024,2048));target=dict(x=rng.randrange(65536),y=rng.randrange(65536),h=1024)
 seed=rng.randrange(2**32);game=rng.randrange(2**32);cpu.mem_write(p,bytes(256));write(p+0x3d,'HHh',*start.values());write(p+0x57,'HHh',*target.values());write(p+0x72,'I',seed);write(p+0x76,'B',9);write(0x89d178,'I',game)
 timeline=[]
 for turn in range(3):
  allocated=[];call(0x511ae0,p);segments=[]
  for q in allocated:
   call(0x511a60,q);a=point(q+0x3d)
   segments.append(dict(from_=a,to=dict(x=(a['x']+read(q+0x49,'h'))&65535,y=(a['y']+read(q+0x4d,'h'))&65535,h=a['h']+read(q+0x4b,'h'))))
  timeline.append(dict(segments=[{'from':s['from_'],'to':s['to']} for s in segments],randomState=read(0x89d178,'I')))
 cases.append(dict(start=start,target=target,seed=seed,game=game));expected.append(timeline)
compare("""import {stepLightning} from './app/lightning.ts';let s='';for await(const c of process.stdin)s+=c;const {land,cases}=JSON.parse(s);console.log(JSON.stringify(cases.map(c=>{const b={...c,turn:0,segments:[]},game={randomState:c.game},out=[];for(let i=0;i<3;i++){stepLightning(land,b,game);out.push({segments:structuredClone(b.segments),randomState:game.randomState});}return out;})));""",dict(land=land,cases=cases),expected)

cases=[];expected=[]
for i in range(256):
 x=rng.randrange(-32768,32768);y=rng.randrange(-32768,32768);seed=rng.randrange(2**32);write(0x89bc72,'I',seed);lines=[];call(0x475350,x,y,128,100)
 cases.append(dict(x=x,y=y,seed=seed));expected.append(dict(lines=lines,randomState=read(0x89bc72,'I')))
compare("""import {lightningLines} from './app/lightning.ts';let s='';for await(const c of process.stdin)s+=c;const {cases}=JSON.parse(s);console.log(JSON.stringify(cases.map(c=>{const r={randomState:c.seed},lines=lightningLines(c.x,c.y,0,0,r).slice(1);return {lines,randomState:r.randomState};})));""",dict(cases=cases),expected)

mode='quads';cases=[];expected=[]
for i in range(1024):
 line=dict(x1=rng.randrange(-32768,32768),y1=rng.randrange(-32768,32768),x2=rng.randrange(-32768,32768),y2=rng.randrange(-32768,32768),alpha=200,width=rng.choice([2,3]));call(0x516500,line['x1'],line['y1'],line['x2'],line['y2'],0xc8ffffff,line['width'],0,0x42)
 cases.append(line);expected.append([read(a+off,'f') for a in [0x5da0f0,0x5da110,0x5da130,0x5da150] for off in [0,4]])
compare("""import {lightningQuad} from './app/lightning.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).cases.map(lightningQuad)));""",dict(cases=cases),expected)

# Native ARGB4444 palette loop followed by the complete 32x32 texture loop.
cpu.reg_write(UC_X86_REG_ESP,stack);cpu.reg_write(UC_X86_REG_EDI,0)
for off in [0x20,0x24,0x28,0x2c]:write(stack+off,'B',4)
for off,shift in zip([0x30,0x34,0x38,0x3c],[8,4,0,12]):write(stack+off,'B',shift)
cpu.emu_start(0x4b7e5c,0x4b7ec9,count=100000)
write(stack+0x60,'I',64);write(stack+0x74,'I',pool);cpu.emu_start(0x4b7eff,0x4b7f49,count=100000)
pixels=[]
for i in range(1024):
 v=read(pool+i*2,'H');pixels.extend([(v>>8&15)*17,(v>>4&15)*17,(v&15)*17,(v>>12)*17])
compare("""import {lightningTexture} from './app/lightning.ts';console.log(JSON.stringify([Array.from(lightningTexture())]));""",dict(cases=[None]),[pixels])
print('PASS: 384 native bolt shapes/RNG states, 256 recursive branch streams, 1024 strip quads and every ARGB4444 texture pixel')
