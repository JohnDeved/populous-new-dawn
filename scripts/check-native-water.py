"""Compare indexed water pixels and mesh-row point generation with the original.
Usage: python scripts/check-native-water.py /path/to/d3dpoptb.exe
The only mesh consumer supplied is final point projection; native shore tests
and both contiguous/wrapped row branches execute unchanged.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x100000)
stack,stop,mesh,bounds,output=0x200e000,0x200f000,0x2010000,0x2014000,0x2020000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=4000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
data=exe.parent/'data';disp=(data/'disp0-c.dat').read_bytes();colors=(data/'bigf0-c.dat').read_bytes();waves=(data/'watdisp.dat').read_bytes()
assert waves==(root/'public/original/waves.bin').read_bytes()
cpu.mem_write(0x2030000,disp);cpu.mem_write(0x2040000,colors);cpu.mem_write(0x2090000,waves)
write(0x5d45d0,'I',0x2030000);write(0x5d45c8,'I',0x2040000);write(0x5d45bc,'I',0x2090000);write(0x5d45c4,'I',output);write(0x5d45ac,'I',24)
rng=random.Random(0x4bdcb0);turns=[0,1,127,255,256,65535,0xffffffff]+[rng.getrandbits(32) for _ in range(25)];textures=[]
for turn in turns:
 write(0x89d184,'I',turn);call(0x4bdcb0);textures.append(hashlib.sha256(cpu.mem_read(output,65536)).hexdigest())
write(0x75d4fc,'I',mesh);write(0x761088,'I',bounds);write(bounds,'hhhh',1,2,1,2)
def project(cpu,a,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I');x,h,z,_,_,color,flags,_=struct.unpack('<8i',cpu.mem_read(p,32))
 events.append(dict(height=h,color=color,flags=flags));assert (x,z)==(123+(len(events))*256,456)
 cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,project,begin=0x46de00,end=0x46de00)
cases=[];expected=[]
for n in range(256):
 x=[0,125,126,127][n%4];y=rng.randrange(128);turn=rng.getrandbits(32);points=[]
 for j in range(2):
  i=y*128+((x+j)&127);p=dict(i=i,height=rng.randrange(-32768,32768),category=((n//4+j)%16)|(rng.randrange(16)<<4),building=rng.randrange(65536),flags=rng.choice([0,0x200,0x100200,rng.getrandbits(32)]))
  write(0x8a03e4+i*16,'Ih',p['flags'],p['height']);write(0x8a03e4+i*16+8,'H',p['building']);write(0x8a03e4+i*16+12,'B',p['category']);points.append(p)
 write(0x87ca80,'i',123);write(0x87ca7c,'i',456);write(0x87ca88,'H',(x*2-2)&255);write(0x87ca8a,'H',y*512);write(0x89d188,'I',turn);events=[];call(0x46cb90)
 assert len(events)==2;cases.append(dict(turn=turn,points=points));expected.append(events)
js="""import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {readTerrainTextures} from './app/terrain-texture.ts';import {createNativeTerrain} from './app/native-terrain.ts';import {waterTexture,waterPoint} from './app/water.ts';
const raw=readFileSync('public/original/landscape.bin'),t=readTerrainTextures(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),waves=new Uint8Array(readFileSync('public/original/waves.bin'));
let s='';for await(const b of process.stdin)s+=b;const input=JSON.parse(s);
console.log(JSON.stringify({textures:input.turns.map(turn=>createHash('sha256').update(waterTexture(t,turn)).digest('hex')),points:input.cases.map(c=>{const land=createNativeTerrain(new Int16Array(16384));for(const p of c.points){land.heights[p.i]=p.height;land.categories[p.i]=p.category;land.buildingIds[p.i]=p.building;land.flags[p.i]=p.flags;}return c.points.map(p=>waterPoint(land,p.i,c.turn,waves));})}));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(turns=turns,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert actual['textures']==textures
for i,(a,b) in enumerate(zip(expected,actual['points'])):assert a==b,(i,cases[i],a,b)
assert len(actual['points'])==len(expected)
print('PASS: 32 native water textures / 2,097,152 indexed pixels and 512 mesh points; turn wrapping, both row branches, all shore categories, wave heights, colors and building flags')
