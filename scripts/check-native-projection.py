"""Compare camera configuration, integer bases and screen projection with x86.
Usage: python scripts/check-native-projection.py /path/to/d3dpoptb.exe
The sibling data/vconfig0.dat must be extracted from the supplied installer.
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX, UC_X86_REG_EBX, UC_X86_REG_EDX, UC_X86_REG_FPCW
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x20000)
# Explicit 53-bit x87 precision; native device/startup mode selection is separate.
cpu.reg_write(UC_X86_REG_FPCW, 0x27f)
stack, stop, point, ui, tribe = 0x201d000, 0x201e000, 0x2000000, 0x2001000, 0x2003000
def write(p, fmt, *values): cpu.mem_write(p, struct.pack(fmt, *values))
def read(p, fmt): return struct.unpack(fmt, cpu.mem_read(p, struct.calcsize(fmt)))[0]
def call(address, *args):
    write(stack, '<'+'I'*(len(args)+1), stop, *[a & 0xffffffff for a in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
def compare(js, cases, expected):
    result = subprocess.run(['node','--input-type=module','-e',
        "import * as f from './app/projection.ts';let s='';for await(const c of process.stdin)s+=c;"+
        'console.log(JSON.stringify(JSON.parse(s).map('+js+')));'],
        input=json.dumps(cases), text=True, capture_output=True, cwd=root)
    assert result.returncode == 0, result.stderr
    actual = json.loads(result.stdout)
    assert len(actual) == len(expected)
    for case, want, got in zip(cases, expected, actual): assert want == got, (case, want, got)

data = (exe.parent/'data/vconfig0.dat').read_bytes()
native = json.loads((root/'app/original-camera.json').read_text())
assert hashlib.sha256(data).hexdigest() == native['sha256']
assert hashlib.sha256(exe.read_bytes()).hexdigest() == native['executableSha256']
cpu.mem_write(0x88f0c0, data)
rng = random.Random(46000)
cases = [(v['width'],v['height']) for v in native['views'][::5]]
cases += [(rng.randint(1,32767),rng.randint(1,32767)) for _ in range(256)]
expected = []
for width, height in cases:
    call(0x4171f0, width, height); expected.append(cpu.reg_read(UC_X86_REG_EAX))
compare('c=>f.cameraConfigIndex(...c)', cases, expected)
print(f'PASS: {len(cases)} native camera resolution selections')

# Nonzero zoom invokes viewport/mesh-bound leaves; only those are intercepted.
def skip(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'<I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
hooks=[cpu.hook_add(UC_HOOK_CODE,skip,begin=a,end=a) for a in (0x429f90,0x46e450)]
cases,expected=[],[]
fields={'curvature':(0,'<i'),'diameter':(4,'<i'),'scale':(8,'<i'),'pitch':(32,'<h'),
        'offsetY':(44,'<h'),'horizon':(46,'<h'),'globe':(93,'<B')}
for index in range(10):
    for zoom in [-16384,-16383,-8192,-123,-1,1,123,8192,16383,16384]:
        cpu.mem_write(0x88f004,data[index*470:index*470+94]);write(0x89c6ee,'<h',index)
        call(0x41c700,zoom,16384)
        expected.append({k:read(0x88f004+offset,fmt) for k,(offset,fmt) in fields.items()})
        cases.append([index,zoom,16384])
compare('c=>{const v=f.cameraConfig(...c);return Object.fromEntries('+json.dumps(list(fields))+'.map(k=>[k,v[k]]))}',cases,expected)
for hook in hooks:cpu.hook_del(hook)
print(f'PASS: {len(cases)} native zoom configurations, including both endpoints')

cases,expected=[],[]
for yaw in range(2048):
    for pitch in (1932,1732,1988):
        write(0x89c6f0,'<b',0);write(0x89d1fa,'<h',yaw);write(0x88f024,'<h',pitch)
        call(0x47f480)
        cases.append([yaw,pitch]);expected.append(list(struct.unpack('<9i',cpu.mem_read(0x89d1c8,36))))
compare('c=>f.cameraMatrix(...c)',cases,expected)
matrices=expected[::61]
print(f'PASS: {len(cases)} native yaw/pitch bases, all 2,048 headings')

identity=[16384,0,0,0,16384,0,0,0,16384]
cases,expected=[],[]
for i in range(512):
    matrix=rng.choice(matrices+[identity]);axis=rng.randint(1,3);angle=rng.randint(-65536,65535)
    write(point,'<9i',*matrix);call(0x47fab0,point,angle,axis)
    cases.append([matrix,angle,axis]);expected.append(list(struct.unpack('<9i',cpu.mem_read(point,36))))
compare('c=>f.rotateBasis(...c)',cases,expected)
print(f'PASS: {len(cases)} native rotations about all three current basis axes')

write(0x74a350,'<I',tribe);write(0xafc2f4,'<I',ui)
cases,expected=[],[]
for i in range(2048):
    config=rng.choice(native['views']);fractionX=rng.choice([0,4]);fractionY=rng.choice([0,4])
    v=dict(matrix=rng.choice(matrices+[identity]),curvature=config['curvature'],depth=config['depth'],
        scale=config['scale'],perspective=config['perspective'],width=config['width'],height=config['height'],
        centerX=config['width']//2+config['offsetX'],centerY=config['height']//2+config['offsetY'],
        fractionX=fractionX,fractionY=fractionY,pixelScaleX=2**-fractionX,pixelScaleY=2**-fractionY)
    # Include signed arithmetic overflow, points behind the camera and existing flags.
    extent=32768 if i&1 else 8192
    p=dict(x=rng.randint(-extent,extent),y=rng.randint(-1000,3000),z=rng.randint(-extent,extent),flags=rng.randrange(256))
    if i<6:p.update(x=0,y=0,z=-v['depth']+(i%3)-1);v['matrix']=identity
    write(0x74a354,'<9i',*v['matrix']);write(tribe+0x2a,'<i',v['scale'])
    for address,key in [(0x87ca5c,'curvature'),(0x87ca64,'depth'),(0x87ca68,'perspective')]:write(address,'<i',v[key])
    for address,key in [(0x87ca90,'width'),(0x87ca92,'height'),(0x87caa4,'centerX'),(0x87caa6,'centerY')]:write(address,'<h',v[key])
    write(ui+0xcf8,'<ii',fractionX,fractionY);write(ui+0xd00,'<ff',v['pixelScaleX'],v['pixelScaleY'])
    for clip in (True,False):
        write(point,'<7i',p['x'],p['y'],p['z'],0,0,0,p['flags'])
        call(0x46dbe0 if clip else 0x46de00,point)
        values=struct.unpack('<3i2f2i',cpu.mem_read(point,28))
        expected.append(dict(zip(['x','y','z','screenX','screenY','flags'],values[:5]+values[6:])))
        cases.append([p,v,clip])
compare('c=>f.projectPoint(...c)',cases,expected)
print(f'PASS: {len(cases)} native screen projections, curvature, clip flags and float32 outputs')

# Object points are captured immediately before projection. Face count is zero:
# this checks scaling, all three rotations, placement and wrap, not face emission.
record, obj, raw = 0x2005000, 0x2005100, 0x2005200
write(0x895ec1,'<I',record)
cpu.mem_write(record,bytes(54));write(record+4,'<h',1);write(record+24,'<I',raw)
captured=[]
def capture(cpu,address,size,user):
    p=read(cpu.reg_read(UC_X86_REG_ESP)+4,'<I')
    captured.append(dict(zip(['x','y','z'],struct.unpack('<3i',cpu.mem_read(p,12)))))
    skip(cpu,address,size,user)
hook=cpu.hook_add(UC_HOOK_CODE,capture,begin=0x46de00,end=0x46de00)
# The projection routine already has translated blocks from the preceding cases.
# Flush them so Unicorn installs the new capture hook in those blocks too.
cpu.ctl_flush_tb()
models=json.loads((root/'app/original-models.json').read_text())
cases,expected=[],[]
for i in range(1024):
    model=rng.choice(list(models.values()));k=rng.randrange(len(model['p'])//3)*3
    p=[round(n*model['scale']*3) for n in model['p'][k:k+3]];p[2]=-p[2]
    scale=model['scale'];heading=rng.randrange(2048) if i&1 else 0
    pitch=rng.randrange(2048) if i%3==0 else 0;roll=rng.randrange(2048) if i%5==0 else 0
    x,y,cx,cy=[rng.randrange(65536) for _ in range(4)]
    if i<8:x,y,cx,cy=[0,32768,65535,1][i%4],0,[32768,0,1,65535][i%4],32768
    altitude=rng.randint(-32768,32767)
    cpu.mem_write(obj,bytes(128));write(obj+0x26,'<h',heading);write(obj+0x6c,'<hh',pitch,roll)
    write(obj+0x3d,'<HHh',x,y,altitude);write(tribe+0x24,'<HH',cx,cy)
    write(record+12,'<i',scale);write(raw,'<3h',*p)
    before=len(captured);call(0x471490,obj)
    assert len(captured)==before+1
    cases.append(dict(raw=p,scale=scale,heading=heading,pitch=pitch,roll=roll,x=x,y=y,cx=cx,cy=cy,altitude=altitude))
    expected.append(captured[-1])
compare('c=>f.modelPoint(c.raw,c.scale,f.modelMatrix(c.heading,c.pitch,c.roll),{x:f.relativeCoordinate(c.x,c.cx),y:c.altitude,z:f.relativeCoordinate(c.y,c.cy)})',cases,expected)
cpu.hook_del(hook)
print(f'PASS: {len(cases)} native model point transforms, real mesh points, pitch/roll and toroidal ties')

cases=list(range(223));expected=[]
for diameter in cases:
    call(0x46e450,diameter)
    expected.append([list(x) for x in struct.iter_unpack('<hh',cpu.mem_read(0x760d10,222*4))])
compare('c=>f.circularMeshBounds(c)',cases,expected)
print(f'PASS: {len(cases)} native circular landscape bounds')
cases,expected=[],[]
for i in range(1024):
    bounds=rng.choice(native['views'])['bounds'];heading=rng.randrange(2048)
    write(point+68,'<8h',*bounds);write(tribe+0x32,'<h',heading)
    call(0x46e510,point)
    cases.append([bounds,heading]);expected.append([list(x) for x in struct.iter_unpack('<hh',cpu.mem_read(0x760d10,222*4))])
compare('c=>f.polygonMeshBounds(...c)',cases,expected)
print(f'PASS: {len(cases)} native rotated polygon landscape bounds')

cases,expected=[],[]
for i in range(4096):
    view=rng.choice(native['views']);flags=rng.choice([0,0x80,0x100,0x200,0x380])
    bucket=rng.choice([-3585,-1792,-1791,-1,0,1,1791,1792,3585,rng.randint(-4096,4096)])
    value=rng.randint(-256,256)
    write(tribe+0x2a,'<i',view['scale']);write(0x87ca6c,'<ii',view['spriteScale'],view['shamanScale']);write(0x89c669,'<I',flags)
    write(point,'<ii',value,-value);call(0x476090,bucket,point,point+4)
    cases.append([value,bucket,flags,view]);expected.append(read(point,'<i'))
compare('c=>f.spriteCoordinate(...c)',cases,expected)
print(f'PASS: {len(cases)} native sprite scaling/offset cases, normal and zoomed views')

# Execute only the sprite-direction instructions within the landscape draw loop.
# Entry loads both signed angle fields; stop is before adding the animation base.
cases,expected=[],[]
for camera in range(2048):
    for heading in (0,127,128,129,255,256,1024,2047,32768):
        write(tribe+0x32,'<H',camera);write(obj+0x26,'<H',heading)
        cpu.reg_write(UC_X86_REG_EAX,tribe);cpu.reg_write(UC_X86_REG_EDX,obj)
        cpu.emu_start(0x468c7b,0x468c94,timeout=100000,count=100)
        assert cpu.reg_read(UC_X86_REG_EIP)==0x468c94
        cases.append([camera,heading]);expected.append(cpu.reg_read(UC_X86_REG_EBX))
compare('c=>f.spriteDirection(...c)',cases,expected)
print(f'PASS: {len(cases)} native sprite direction selections, including sector boundaries')
