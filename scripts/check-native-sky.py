"""Compare the defeat branch of draw_sky through original quad allocation.
Usage: python scripts/check-native-sky.py /path/to/d3dpoptb.exe
Draw mode 3 skips the unrelated background/lens branch. No native callees are
stubbed: 0x517830 and 0x47d980 execute through the retained render command.
This checks command generation, not a Direct3D device or pixel rasterization.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe)
cpu.mem_map(0x2000000,0x300000)
stack,stop,renderer=0x200f000,0x200ff00,0x2010000
palette=(exe.parent/'data/pal0-c.dat').read_bytes()
imported=json.loads((root/'app/original-sky.json').read_text())
assert hashlib.sha256(palette).hexdigest()==imported['paletteSha256']
indices=[cpu.mem_read(0x5a89c8+i*5,1)[0] for i in range(4)]
assert indices==imported['indices']
assert [list(palette[i*4:i*4+3]) for i in indices]==imported['colors']
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
cpu.mem_write(0xd05528,palette);write(0x5ce0bc,'I',renderer)
write(0xa68f60,'ff',0,0)
retained=[struct.unpack('<ffffIIff',cpu.mem_read(0x5dd338+i*32,32)) for i in range(4)]
rng=random.Random(0x524a30);cases=[];expected=[]
for tribe in range(4):
 for counter in range(256):
  view=dict(x=rng.randrange(-500,501),y=rng.randrange(-500,501),width=rng.randrange(1,4097),screenWidth=rng.choice([640,800,1024,1920,3840]),surfaceOffset=rng.randrange(1,2000000))
  flags=rng.randrange(1<<32)
  write(0x88f004+0x22,'hhh',view['x'],view['y'],view['width']);write(0x89c6cf,'h',view['screenWidth']);write(0x89c681,'i',view['surfaceOffset'])
  write(0x89d165,'bB',tribe,counter);write(0x5da074,'I',flags)
  write(renderer+0x20002a,'I',renderer+0x2a);write(renderer+0x1c,'H',0)
  write(stack,'II',stop,3);cpu.reg_write(UC_X86_REG_ESP,stack)
  cpu.emu_start(0x524a30,stop,timeout=1000000,count=1000000)
  assert cpu.reg_read(UC_X86_REG_EIP)==stop
  count=read(renderer+0x1c,'H');assert count==bool(counter)
  assert read(renderer+0x20002a,'I')==renderer+0x2a+count*0xa0
  command=None
  if count:
   p=renderer+0x2a
   vertices=[struct.unpack('<ffffIIff',cpu.mem_read(p+0x20+i*32,32)) for i in range(4)]
   assert all(v[2:4]==old[2:4] and v[5:]==old[5:] for v,old in zip(vertices,retained))
   assert len(set(v[4] for v in vertices))==1
   assert read(p+0x18,'I')==0
   command=dict(vertices=[[v[0],v[1]] for v in vertices],color=vertices[0][4],flags=read(p+0xc,'I'))
  cases.append(dict(counter=counter,tribe=tribe,view=view,flags=flags));expected.append(dict(command=command,flags=read(0x5da074,'I')))
js="""import {defeatSky} from './app/sky.ts';import sky from './app/original-sky.json' with {type:'json'};
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const q=defeatSky(c.counter,c.tribe,sky.colors,c.view);if(!q)return {command:null,flags:c.flags};
 const [x,y,r,b]=q.rect;return {command:{vertices:[[x,y],[r,y],[r,b],[x,b]],color:q.color,flags:q.flags},flags:(c.flags&~24)>>>0};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(i,cases[i],a,b)
print('PASS: 1,024 native defeat-sky calls, all byte counter values and four original tribe colors; full quad allocation, viewport bounds and flags match')
