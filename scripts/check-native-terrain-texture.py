"""Compare original 32px terrain textures and the native cell-lighting block.
Usage: python scripts/check-native-terrain-texture.py /path/to/d3dpoptb.exe
Native table initialization uses a supplied allocator. Texture generation runs
without stubs, including fog and linked stain accumulation. Lighting stops after
the brightness write, before unrelated texture-cache invalidation.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x400000)
stack,stop,out,heap=0x200f000,0x200ff00,0x2004000,0x2100000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args,end=stop):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,end,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==end
def alloc(cpu,a,size,user):
 global heap
 sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,heap);heap+=(read(sp+4,'I')+15)&~15
 cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
hook=cpu.hook_add(UC_HOOK_CODE,alloc,begin=0x526630,end=0x526630);write(0x5d45ac,'I',0);call(0x4bd700,1);cpu.hook_del(hook)
parts=[(exe.parent/'data'/n).read_bytes() for n in ['pal0-c.dat','bigf0-c.dat','cliff0-c.dat','disp0-c.dat','fade0-c.dat']]
assert b''.join(parts)==(root/'public/original/landscape.bin').read_bytes()
for a,d in zip([0x5d45c8,0x5d45cc,0x5d45d0],parts[1:4]):cpu.mem_write(read(a,'I'),d)
cpu.mem_write(0x96eae0,parts[4]);write(0x9bcfd4,'I',0x2300000);write(0x9bcd90,'I',0x2330000)
call(0x401040);assert struct.unpack('<3h',cpu.mem_read(0x937aa8,6))==(147,147,147)
rng=random.Random(0x4bf860);cases=[];expected=[]
for n in range(256):
 x,y=rng.choice([0,7,127,rng.randrange(128)]),rng.choice([0,7,127,rng.randrange(128)]);cell=y*128+x
 ids=[cell,y*128+((x+1)&127),((y+1)&127)*128+((x+1)&127),((y+1)&127)*128+x]
 heights=[rng.choice([0,1,52,127,128,212,362,512,1023,rng.randrange(1024)]) for _ in ids]
 cliffs=[rng.choice([0,1,3,4,15,127,255,rng.randrange(256)]) for _ in ids];shadows=[rng.randrange(256) for _ in ids];flags=[rng.choice([0,8]) for _ in ids];brightness=[rng.randrange(256) for _ in ids]
 # 0x44df40 only clears cliff_index when the surrounding maximum height is 0.
 heights=[h if c else 0 for h,c in zip(heights,cliffs)]
 for j,h,c,s,f,b in zip(ids,heights,cliffs,shadows,flags,brightness):
  write(0x8a03e4+j*16,'Ih',f,h);write(0x8a03e4+j*16+10,'B',c);write(0x8a03e4+j*16+13,'BB',b,s)
 sun=[rng.randrange(-32768,32768) for _ in range(3)] if n%2 else [147,147,147]
 write(0x937aa8,'hhh',*sun);write(0x5d45a8,'B',3);call(0x4bdd40,(x*2)|((y*2)<<8),0,end=0x4bde97)
 light=read(0x8a03e4+cell*16+13,'B');write(0x8a03e4+cell*16+13,'B',brightness[0])
 fog=bool(n&1);marks=[] if n%4==0 else [[rng.randrange(32),rng.randrange(32)] for _ in range(24)]
 if n%4==3:marks+=[[0,0]]*8
 write(0x895da8,'I',4 if fog else 0);write(0x895da4,'I',0x10000 if n%4==0 else 0)
 write(0x2300000+cell*10+4,'i',0 if marks else -1)
 for j,(mx,my) in enumerate(marks):write(0x2330000+j*8,'HHi',mx*16,my*16,j+1 if j+1<len(marks) else -1)
 call(0x4bee20,(x*2)|((y*2)<<8),out)
 globe=hashlib.sha256(b''.join(bytes(cpu.mem_read(out+y*256,8)) for y in range(8))).hexdigest()
 call(0x4bf860,(x*2)|((y*2)<<8),out)
 cases.append(dict(cell=cell,ids=ids,heights=heights,cliffs=cliffs,shadows=shadows,flags=flags,brightness=brightness,sun=sun,fog=fog,marks=marks,overlay=n%4!=0))
 expected.append(dict(light=light,globe=globe,texture=hashlib.sha256(cpu.mem_read(out,1024)).hexdigest()))
js="""import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {createNativeTerrain} from './app/native-terrain.ts';import {readTerrainTextures,terrainTile,terrainBrightness} from './app/terrain-texture.ts';
const raw=readFileSync('public/original/landscape.bin'),t=readTerrainTextures(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));let s='';for await(const b of process.stdin)s+=b;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const land=createNativeTerrain(new Int16Array(16384)),brightness=new Uint8Array(16384);
 for(let j=0;j<4;j++){const i=c.ids[j];for(const k of ['heights','cliffs','shadows','flags'])land[k][i]=c[k][j];brightness[i]=c.brightness[j];}
 const stains=c.overlay?new Uint8Array(1024):undefined;if(stains)for(const [x,y] of c.marks)stains[y*32+x]=Math.min(12,stains[y*32+x]+3);
 return {light:terrainBrightness(land,c.cell,c.sun),globe:createHash('sha256').update(terrainTile(land,brightness,c.cell,t,false,undefined,8)).digest('hex'),texture:createHash('sha256').update(terrainTile(land,brightness,c.cell,t,c.fog,stains)).digest('hex')};})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(i,cases[i],a,b)
print('PASS: 256 native ground and globe textures (278,528 indexed pixels), native amplitude initialization, cliff remap, fog and linked stains; 256 cell-lighting comparisons')

# Compare reflected atlas tiles from the actual opening map, after an edit.
js="""import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {createWorld} from './app/model.ts';import {readTerrainTextures,terrainAtlas,terrainBrightness} from './app/terrain-texture.ts';
const hash=a=>createHash('sha256').update(a).digest('hex'),raw=readFileSync('public/original/landscape.bin'),t=readTerrainTextures(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),w=createWorld();
let atlas=terrainAtlas(w.land,t);if(atlas.updated!==16384)throw Error('Missing opening tiles');atlas=terrainAtlas(w.land,t,atlas);if(atlas.updated)throw Error('Unchanged atlas rebuilt');
const i=w.land.heights.findIndex(h=>h>20);w.land.heights[i]+=5;w.land.shadows[i]^=7;
atlas=terrainAtlas(w.land,t,atlas);if(!atlas.updated||atlas.updated>=16384)throw Error('Edit did not invalidate neighboring tiles');
if(hash(atlas.pixels)!==hash(terrainAtlas(w.land,t).pixels))throw Error('Incremental atlas differs from fresh rebuild');
const tiles=[];for(const [x,z] of [[0,0],[127,0],[0,127],[127,127],[59,59],[60,59],[59,60],[60,60],[64,80],[65,80],[68,80],[68,78]]){
 const p=new Uint8Array(4096);for(let y=0;y<32;y++)p.set(atlas.pixels.subarray(((z*32+31-y)*4096+x*32)*4,((z*32+31-y)*4096+x*32+32)*4),y*128);
 tiles.push({cell:((68+x)&127)|(((59-z)&127)<<7),hash:hash(p)});
}console.log(JSON.stringify({heights:[...w.land.heights],cliffs:[...w.land.cliffs],brightness:Array.from({length:16384},(_,i)=>terrainBrightness(w.land,i,[147,147,147])),tiles}));"""
r=subprocess.run(['node','--input-type=module','-e',js],capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
d=json.loads(r.stdout)
for i,(h,c,b) in enumerate(zip(d['heights'],d['cliffs'],d['brightness'])):
 write(0x8a03e4+i*16+4,'h',h);write(0x8a03e4+i*16+10,'B',c);write(0x8a03e4+i*16+13,'B',b)
write(0x895da8,'I',0);write(0x895da4,'I',0x10000)
for tile in d['tiles']:
 i=tile['cell'];call(0x4bf860,((i&127)*2)|((i>>7)*512),out)
 rgba=b''.join(parts[0][c*4:c*4+3]+b'\xff' for c in cpu.mem_read(out,1024))
 assert hashlib.sha256(rgba).hexdigest()==tile['hash'],('atlas orientation',i)
print('PASS: 12 opening-map atlas tiles match native RGBA pixels; wrapped coordinates, reflected rows and incremental edit invalidation match fresh rebuilding')
