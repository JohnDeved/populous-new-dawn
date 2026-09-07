"""Compare 0x44df40 terrain passes and 0x44ddf0 queueing against the supplied EXE.
Only the two final texture consumers are supplied; their ordering is compared.
Usage: python scripts/check-native-terrain.py /path/to/d3dpoptb.exe
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1])
cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x10000)
stack,stop=0x200d000,0x200e000;rng=random.Random(0x44df40);events=[]
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def digest(data):return hashlib.sha256(data).hexdigest()
def texture(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);events.append([0 if address==0x4be230 else 1,read(sp+4,'H')])
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for address in [0x4be230,0x4bdff0]:cpu.hook_add(UC_HOOK_CODE,texture,begin=address,end=address)
def call(address,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,timeout=20000000,count=100000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))

cases=[];expected=[]
for trial in range(66):
    seed=rng.randrange(256);landflags=rng.choice([0,128,129,255]);terrain=bytearray([0x3c]*0x40000)
    heights=[];flags=[];cliffs=[];categories=[];shadows=[]
    for i in range(16384):
        h=[0,0,0,1,7,8,336,337,511,512,1025,32767,-32768][((i*17+seed)^(i>>7))%13]
        f=[0,0x20,0x200,0x4000000,0x1040020][(i+seed)%5]
        cliff=(i*31+seed)&255;category=(i*13+seed)&255;shadow=(i*7+seed)&255
        if trial>=64:h=0;f=0;cliff=0;category=0;shadow=0
        heights.append(h);flags.append(f);cliffs.append(cliff);categories.append(category);shadows.append(shadow)
    if trial==65:
        # Exact first-mission height field, imported before any browser resampling.
        level=json.loads((root/'app/level-one.ts').read_text().split('export default ',1)[1].strip().removesuffix(';'))
        for x,y,h in level['heights']:heights[y*128+x]=h
    for i in range(16384):
        struct.pack_into('<Ih',terrain,i*16,flags[i],heights[i]);terrain[i*16+10]=cliffs[i];terrain[i*16+12]=categories[i];terrain[i*16+14]=shadows[i]
    cpu.mem_write(0x8a03e4,bytes(terrain));cpu.mem_write(0x68c6d0,bytes(0x4418))
    write(0x89c661,'I',landflags);center=rng.choice([0,65535,rng.randrange(65536)])
    ops=[dict(center=center,radius=[0,1,3,7,16][trial%5],texture=trial%3),
         dict(center=center,radius=1,texture=255),dict(center=(center+2)&65535,radius=2,texture=1)]
    if trial>=64:
        landflags=0;write(0x89c661,'I',0)
        ops=[dict(center=0,radius=64,texture=trial-64)]
    events=[];states=[]
    for op in ops+[None]:
        if op:call(0x44ddf0,op['center'],op['radius'],op['texture'])
        else:call(0x44df40)
        count=read(0x6906d8,'i');after=bytes(cpu.mem_read(0x8a03e4,0x40000))
        states.append(dict(terrain=digest(after),queued=list(struct.unpack('<'+'H'*count,cpu.mem_read(0x690ae8,count*2))),
          updates=list(cpu.mem_read(0x6906e0,count)),dirty=digest(cpu.mem_read(0x68c6d8,16384)),landFlags=read(0x89c661,'I'),
          attempts=read(0x68c6d0,'i'),duplicates=read(0x6906dc,'i'),recursing=bool(read(0x690ae0,'B')),events=events.copy()))
    cases.append(dict(heights=heights,flags=flags,cliffs=cliffs,categories=categories,shadows=shadows,landFlags=landflags,ops=ops));expected.append(states)

js="""
import {createHash} from 'node:crypto';
import {createNativeTerrain,queueTerrain,processTerrain} from './app/native-terrain.ts';
let input='';for await(const c of process.stdin)input+=c;
const digest=b=>createHash('sha256').update(b).digest('hex');
console.log(JSON.stringify(JSON.parse(input).map(c=>{
  const l=createNativeTerrain(c.heights);for(const key of ['flags','cliffs','categories','shadows'])l[key].set(c[key]);l.landFlags=c.landFlags;
  const events=[],textures={surface:cell=>events.push([0,cell]),globe:cell=>events.push([1,cell])};
  return [...c.ops,null].map(op=>{
    if(op)queueTerrain(l,op.center,op.radius,op.texture,textures);else processTerrain(l,textures);
    const buffer=Buffer.alloc(0x40000,0x3c);
    for(let i=0;i<16384;i++){buffer.writeUInt32LE(l.flags[i],i*16);buffer.writeInt16LE(l.heights[i],i*16+4);buffer[i*16+10]=l.cliffs[i];buffer[i*16+12]=l.categories[i];buffer[i*16+14]=l.shadows[i];}
    return {terrain:digest(buffer),queued:l.queued.slice(),updates:l.textureUpdates.slice(),dirty:digest(l.dirty),landFlags:l.landFlags>>>0,attempts:l.attempts,duplicates:l.duplicates,recursing:l.recursing,events:events.slice()};
  });
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        p=Path('/private/tmp/populous-terrain-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b)));raise AssertionError((i,str(p)))
print('PASS:',sum(map(len,expected)),'native terrain queue/process checkpoints, including complete ocean and first-mission rebuilds')
