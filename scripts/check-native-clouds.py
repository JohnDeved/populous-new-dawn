"""Compare original sky lens motion, interpolation and retained D3D triangles.
Usage: python scripts/check-native-clouds.py /path/to/d3dpoptb.exe
All native callees execute, including the triangle allocator. This checks draw
commands, not the legacy device's rasterization or texture blending.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_FPCW
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.reg_write(UC_X86_REG_FPCW,0x27f) # MSVC runtime precision, as in projection checks.
cpu.mem_map(0x2000000,0x300000)
stack,stop,renderer,ui=0x200f000,0x200ff00,0x2010000,0x2020000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
lens=(exe.parent/'data/skylens.dat').read_bytes()
assert hashlib.sha256(lens).hexdigest()=='4004b11ed6ce1d1240a86588b7bc22abc7d6160f5d048d1b97888ea234ea3b3d'
assert list(struct.unpack('<4212i',lens))==json.loads((root/'app/original-skylens.json').read_text())
cpu.mem_write(0xd01140,lens);write(0x5ce0bc,'I',renderer);write(0xafc2f4,'I',ui);write(0xa68f60,'ff',0,0)
fields=['angle','x','y','previousAngle','previousX','previousY'];rng=random.Random(0x523830);cases=[];expected=[]
for n in range(128):
 p=dict(zip(fields,[rng.randrange(2048),rng.randrange(-2**31,2**31),rng.randrange(-2**31,2**31),rng.randrange(2048),rng.randrange(-32768,32768),rng.randrange(-32768,32768)]))
 camera=dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.choice([0,1,1023,1024,2047,rng.randrange(2048)]))
 ticks=rng.choice([0,64,1024,0x1000000,rng.randrange(0x1000001)])
 width,height=rng.choice([(640,480),(800,600),(1024,768),(1440,1000),(1136,1000),(3840,2160)])
 surface=rng.choice([height,height-70,height//2]);size=rng.choice([192,256]);transparent=bool(n&1);alpha=bool(n&2);fade=bool(n&4);top=bool(n&8)
 grid=[(i*7919+n*31) for i in range(26*96*2)];cpu.mem_write(0xcfc340,struct.pack('<4992i',*grid))
 write(0x5ddca8,'6i',*[p[k] for k in fields]);tribe=n%4;write(0x89c6f0,'b',tribe)
 write(0x89d1c8+tribe*0xc65+0x24,'HH',camera['x'],camera['y']);write(0x89d1c8+tribe*0xc65+0x32,'H',camera['angle']);write(0x5ca85c,'I',ticks)
 call(0x523830)
 state=dict(zip(fields,struct.unpack('<6i',cpu.mem_read(0x5ddca8,24))))
 grid_hash=hashlib.sha256(cpu.mem_read(0xcfc340,19968)).hexdigest()
 call(0x517290,width,height);write(0x89c6cf,'hh',width,height);write(0xa69174,'i',surface)
 write(ui+0x6e0,'ii',fade,alpha);write(0x89c661,'I',4 if top else 0)
 write(renderer+0x20002a,'I',renderer+0x2a);write(renderer+0x1c,'H',0)
 call(0x517420,transparent,size,0x9bc718)
 count=read(renderer+0x1c,'H');assert count==(42 if top else 36)
 assert read(renderer+0x20002a,'I')==renderer+0x2a+count*0x80
 triangles=[]
 for i in range(count):
  a=renderer+0x2a+i*0x80;assert read(a+0x18,'I')==0x9bc718
  vertices=[]
  for j in range(3):
   x,y,z,rhw,color,specular,u,v=struct.unpack('<ffffIIff',cpu.mem_read(a+0x20+j*32,32));assert specular==0
   vertices.append(dict(x=x,y=y,u=u,v=v,color=color))
  triangles.append(dict(vertices=vertices,flags=read(a+0xc,'I')))
 cases.append(dict(p=p,camera=camera,ticks=ticks,grid=grid,width=width,height=height,surface=surface,size=size,transparent=transparent,alpha=alpha,fade=fade,top=top))
 expected.append(dict(state=state,grid=grid_hash,triangles=triangles))
js="""import {createHash} from 'node:crypto';import {updateSkyArray,skyCloudLayer} from './app/sky.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const grid=new Int32Array(c.grid);updateSkyArray(c.p,c.camera,c.ticks,grid);
 const layer=skyCloudLayer(grid,c.width,c.height,c.surface,c.size,c.transparent,c.alpha,c.fade,c.top);
 return {state:c.p,grid:createHash('sha256').update(new Uint8Array(grid.buffer)).digest('hex'),triangles:layer.triangles.map(t=>({vertices:t.map(i=>layer.vertices[i]),flags:layer.flags}))};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
 assert a['state']==b['state'],('motion',i,a['state'],b['state'])
 assert a['grid']==b['grid'],('lens',i,a['grid'],b['grid'])
 for j,(x,y) in enumerate(zip(a['triangles'],b['triangles'])):assert x==y,('triangle',i,j,x,y)
 assert len(a['triangles'])==len(b['triangles'])
print('PASS: 128 native sky updates and 4,992 allocated cloud triangles; signed camera wraps, half-angle rotation, lens UVs, viewport sizing, fade colors and device flags match')
