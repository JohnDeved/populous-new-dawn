"""Compare sunlight table and face normals against the verified original binary.
Usage: python scripts/check-native-model-lighting.py /path/to/d3dpoptb.exe
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x1000000)
stack,stop,points=0x2ffd000,0x2ffe000,0x2010000
rng=random.Random(401790)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def call(a,*args):
    write(stack,'I'*(1+len(args)),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return cpu.reg_read(UC_X86_REG_EAX)
def compare(expression,cases,expected,label):
    r=subprocess.run(['node','--input-type=module','-e',"import {modelStage} from './app/model-faces.ts';import * as f from './app/model-lighting.ts';import models from './app/original-models.json' with {type:'json'};let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map("+expression+")));"],input=json.dumps(cases),text=True,capture_output=True,cwd=ROOT)
    assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(actual,expected)):assert a==b,(label,i,cases[i],a,b)
    print(f'PASS: {len(cases):,} native {label}',flush=True)
# Execute the original default setter, then alternate complete 1,024-entry tables.
call(0x401040)
cases=[[147,147,147,28,15]];expected=[list(cpu.mem_read(0x89bc8e,1024))]
for _ in range(32):
    c=[rng.randrange(-256,257) for _ in range(3)]+[rng.randrange(32),rng.randrange(64)]
    write(0x937aa8,'hhhBB',*c);call(0x401790)
    cases.append(c);expected.append(list(cpu.mem_read(0x89bc8e,1024)))
compare('c=>f.sunlightShades(...c)',cases,expected,'complete sunlight tables (1,024 entries each)')
cases=[[[0,0,0]]*3]
cases += [[[rng.randrange(-1000,1001) for _ in range(3)] for _ in range(3)] for _ in range(4095)]
expected=[]
for c in cases:
    for i,p in enumerate(c):write(points+i*32,'iii',*p)
    expected.append(call(0x40cd00,points,points+32,points+64)&65535)
compare('c=>f.faceNormal(...c)',cases,expected,'quantized face normals, including degenerate faces')

# Run the complete ordinary renderer with real transforms, normals and sunlight.
# Collinear supplied projection suppresses raster submissions; inspect every
# original face's updated normal, including faces the camera would cull.
from unicorn import UC_HOOK_CODE
source=Path(sys.argv[1]).parent/'objects'
objects,faces,vertices,unit,camera,pool=0x2010000,0x2020000,0x2200000,0x2000000,0x2001000,0x2400000
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
raw={n:(source/f'{n}0-2.dat').read_bytes() for n in ['objs','facs','pnts']}
provenance=json.loads((ROOT/'public/original/provenance.json').read_text())['sha256']
for name,data in raw.items():assert hashlib.sha256(data).hexdigest()==provenance[f'objects/{name}0-2.dat']
for a,n in [(objects,'objs'),(faces,'facs'),(vertices,'pnts')]:cpu.mem_write(a,raw[n])
for i in range(len(raw['objs'])//54):
    for off,stride,base in [(16,60,faces),(20,60,faces),(24,6,vertices),(28,6,vertices)]:
        n=read(objects+i*54+off,'I');write(objects+i*54+off,'I',base+(n-1)*stride if n else 0)
write(0x895ec1,'I',objects);write(0x895ec5,'I',faces);write(0x74a350,'I',camera)
write(0x75d504,'I',pool+0x10000);write(0x87ca90,'HH',1024,768)
call(0x401040)
def projection(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I');write(p+12,'ff',100,200)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,projection,begin=0x46de00,end=0x46de00)
models=json.loads((ROOT/'app/original-models.json').read_text())
cases,expected=[],[]
for id,data in models.items():
    for heading in [0,1,511,512,1023,1024,1536,2047,rng.randrange(2048)]:
        for scale in [data['scale'],max(1,data['scale']//2)]:
            cpu.mem_write(unit,bytes(256));write(unit+0x24,'HH',1,heading);write(unit+0x2a,'B',2)
            write(unit+0x33,'HH',int(id),0x200);write(unit+0x68,'i',scale);write(0x75d508,'I',pool)
            call(0x4708d0,unit)
            obj=objects+int(id)*54;face=read(obj+16,'I');shades=[]
            for j in range(read(obj+2,'h')):
                if read(face+j*60+7,'B')==0:continue # Painter skips texture mode 0.
                normal=read(face+j*60,'h');shade=read(0x89bc8e+normal,'B')
                shades += [shade]*(3 if read(face+j*60+6,'B')==3 else 6)
            cases.append(dict(id=id,heading=heading,scale=scale));expected.append(shades)
compare("c=>{const d=models[c.id];return f.modelLighting(d,modelStage(d,4).p,4,c.heading,c.scale).shades}",cases,expected,'complete model normal/shade passes')

# Complete triangle queue checks retain original depth attenuation and emission.
array=unit+256
write(array,'III',points,points+32,points+64)
face=faces
cases,expected=[],[]
for _ in range(1024):
    shade=rng.choice([0,1,28,32,43,255,0xffc8c8c8,0xffffffff]);depth=rng.choice([-3329,-3328,-3327,-3073,-3072,0,30000,rng.randrange(-50000,50000)])
    for i in range(3):write(points+i*32+8,'iff',depth+i*30,100+i,200)
    write(0x75d508,'I',pool);call(0x4718c0,face,array,0,shade,0,1,2,1)
    colors=[read(pool+off,'I') for off in [22,42,62]];assert len(set(colors))==1
    cases.append([shade,depth]);expected.append(colors[0])
compare('c=>f.modelShade(...c)',cases,expected,'complete triangle depth-shade submissions')
