"""Compare original 0x474ba0 + 0x46eb80 terrain overlay records and UVs.
Runs every neighbor mask, both terrain diagonals, normal/red/territory modes,
arrow directions, missing triangles and exhausted polygon pools.
Usage: python scripts/check-native-ground-overlay.py EXE
"""
import json,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x100000)
stack,stop,pool,p1,p2,points=0x200e000,0x2000100,0x2010000,0x2020000,0x2020100,0x2030000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
# Execute the native UV initializer, independent of disk/DirectDraw startup.
write(0x895dd1,'B',32);cpu.emu_start(0x42b076,0x42b18b,count=200)
assert cpu.reg_read(UC_X86_REG_EIP)==0x42b18b
write(0x895de0,'I',0)
neighbors=[(0,-1),(1,0),(0,1),(-1,0),(-1,-1),(1,-1),(-1,1),(1,1)]
cases=[];expected=[]
for n in range(256*2*5+64):
    bits=n%256;split=(n//256)%2;mask=[0x80,0x180,0x400,0x1000,0][n//512%5]
    arrow=n>=256*2*5;direction=n%8
    index=[0,127,16256,16383,8240][n%5]
    flag=split|(0x800 if arrow else mask)
    cells={index:flag}
    for k,(dx,dy) in enumerate(neighbors):
        i=((((index>>7)+dy)&127)<<7)|(((index&127)+dx)&127)
        cells[i]=0 if bits&(1<<k) else mask
    cpu.mem_write(0x8a03e4,bytes(16384*16))
    for i,f in cells.items():write(0x8a03e4+i*16,'I',f)
    write(0x5a885a,'B',direction)
    capacity=2 if n<2592 else [0,1,2][n%3];present=[True,True] if n<2592 else [bool(n&1),bool(n&2)]
    write(0x75d504,'II',pool+capacity*68,pool);cpu.mem_write(pool,bytes(140))
    for p in (p1,p2):cpu.mem_write(p,bytes(70));write(p+0x45,'B',3)
    write(stack,'7I',stop,0x8a03e4+index*16,p1 if present[0] else 0,p2 if present[1] else 0,points,points+64,mask)
    cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x474ba0,stop,count=5000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    count=(read(0x75d508,'I')-pool)//68
    assert count==min(capacity,sum(present))==cpu.reg_read(UC_X86_REG_EAX)
    records=[]
    for j in range(count):
        p=pool+j*68;assert read(p,'B')==8 and read(p+0x43,'B')==31
        records.append(dict(tile=read(p+0x42,'B'),color=read(p+0x16,'I'),uv=[read(p+o,'I')/(32*65536-1) for o in (14,18,34,38,54,58)]))
    assert read(p1+0x45,'B')==3 and read(p2+0x45,'B')==3
    cases.append(dict(cells=cells,index=index,mask=mask,direction=direction,capacity=capacity,present=present));expected.append(records)
js="""import {groundOverlay,groundOverlayTriangles} from './app/ground-overlay.ts';let s='';for await(const b of process.stdin)s+=b;console.log(JSON.stringify(JSON.parse(s).map(c=>{const flags=new Uint32Array(16384);for(const [i,v] of Object.entries(c.cells))flags[i]=v;const r=groundOverlay(flags,c.index,c.mask,c.direction);return groundOverlayTriangles(flags[c.index]&1,r.rotation).filter((_,i)=>c.present[i]).slice(0,c.capacity).map(p=>({tile:r.tile,color:r.color===0xffffffff?32:r.color,uv:p.uv}));})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
assert actual==expected,next((i,a,e,cases[i]) for i,(a,e) in enumerate(zip(actual,expected)) if a!=e)
print(f'PASS: {len(cases)} native overlay calls, all neighbor masks/diagonals/tints/arrows, wrapped cells, native UV initializer and triangle allocator, partial/missing triangles and pool exhaustion')
