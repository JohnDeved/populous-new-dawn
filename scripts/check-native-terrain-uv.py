"""Capture original ground-triangle UVs at the Direct3D submission boundary.
Usage: python SCRIPT EXE [--record]
Complete 004673b0 ground dispatch executes; texture cache records are supplied,
and final GPU submission is captured. This does not emulate hardware sampling.
"""
import json,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x100000)
p,ui,cache,records,stack,stop=0x2000000,0x2020000,0x2040000,0x2050000,0x20fd000,0x20fe000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
write(0xafc2f4,'I',ui)
write(0x9bcfc8,'I',cache);write(0x9bcfd8,'I',records)
write(0xa30720,'I',records+0x100);write(records+2,'B',4)
# Native dry-land class; existing cache record chooses the close texture.
write(0x8a03e4+12,'B',0)
results=[]
def capture(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 pts=[read(sp+i*4,'I') for i in [1,2,3]]
 results.append([list(struct.unpack('<2f',c.mem_read(v+24,8))) for v in pts])
 # Stop after the native triangle, before batch flush/hardware consumers.
 c.reg_write(UC_X86_REG_EIP,stop)
cpu.hook_add(UC_HOOK_CODE,capture,begin=0x47d8a0,end=0x47d8a0)
cases=[];expected=[]
for size in [16,32]:
 for smooth in [False,True]:
  for raw in [False,True]:
   for shape in range(8):
    cpu.mem_write(0x75d50c,bytes(0xe01*4));write(0x75d50c+0xe00*4,'I',p)
    cpu.mem_write(p,bytes(70));write(p+0x45,'B',shape)
    for off,x,y in [(6,100,100),(26,200,100),(46,100,200)]:write(p+off,'ffIII',x,y,0,0,32)
    write(0x76108c,'BB',0,0);write(0x895da8,'I',0);write(0x895da4,'I',0x80000000 if size==32 else 0)
    write(0x5d54c8,'I',int(smooth));write(ui+0x6d4,'I',int(raw))
    results=[];write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x4673b0,stop,count=200000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop and len(results)==1,(size,smooth,raw,shape,hex(cpu.reg_read(UC_X86_REG_EIP)),results)
    corners=[int(read(0x5a2ff0+(shape+(8 if size==16 else 0))*24+j*4,'I')!=0) for j in range(6)]
    cases.append(dict(size=size,smooth=smooth,raw=raw,corners=corners));expected.append(results[0])
js="""import {terrainTextureBounds} from './app/terrain-texture.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const b=terrainTextureBounds(c.size,c.smooth,c.raw);return [0,2,4].map(i=>[b[c.corners[i]],b[c.corners[i+1]]]);})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout)
for i,(a,b) in enumerate(zip(actual,expected)):assert a==b,(i,cases[i],a,b)
fixture=ROOT/'tests/fixtures/terrain-uv.json'
result=dict(executableSha256=identity['sha256'],cases=cases,expected=expected)
if '--record' in sys.argv:fixture.write_text(json.dumps(result,separators=(',',':'))+'\n')
else:assert json.loads(fixture.read_text())==result,'Stored terrain UV fixture differs from original execution'
print(f'PASS: {len(cases)} native ground triangles, both texture sizes, all UV orientations, filtering and raw-coordinate modes')
