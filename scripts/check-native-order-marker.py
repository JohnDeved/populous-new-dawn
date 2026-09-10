"""Compare original destination-marker emission, initialization and lifetime.
Executes 0x4afff0, 0x509c10, terrain interpolation, 0x4ee7b0 and 0x50a750.
Only allocation, class callbacks, UI audio and final removal are supplied.
Usage: python scripts/check-native-order-marker.py EXE [--record]
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x40000)
p, point, thunk, stack, stop = 0x2000000, 0x2001000, 0x2002000, 0x203d000, 0x203e000
write = lambda a,f,*v: cpu.mem_write(a,struct.pack('<'+f,*v))
read = lambda a,f: struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
rng = random.Random(0x4afff0)
land = dict(heights=[rng.randrange(1025) for _ in range(16384)], flags=[rng.randrange(2) for _ in range(16384)])
for i,(h,flags) in enumerate(zip(land['heights'],land['flags'])): write(0x8a03e4+i*16,'Ih',flags,h)
write(0x890398,'I',p)
# Allocator adapter returns a real, natively initialized model-61 effect.
cpu.mem_write(thunk,b'\x68'+struct.pack('<I',p)+b'\xb8'+struct.pack('<I',0x509c10)+b'\xff\xd0\x83\xc4\x04\xb8'+struct.pack('<I',p)+b'\xc3')
fields = {'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B')}
freed = False
cues = []
def hook(c,a,size,user):
    global freed
    sp=c.reg_read(UC_X86_REG_ESP)
    if a==0x4edbd0:
        assert (read(sp+4,'I'),read(sp+8,'I'))==(7,61)
        cpu.mem_write(p,bytes(256));write(p+0x24,'H',2);write(p+0x2a,'BB',7,61)
        write(p+0x2f,'B',read(sp+12,'I')&255)
        cpu.mem_write(p+0x3d,bytes(cpu.mem_read(read(sp+16,'I'),6)))
        c.reg_write(UC_X86_REG_EIP,thunk);return
    if a==0x48a050:cues.append(read(sp+8,'I'))
    if a==0x4ef180:freed=True
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4edbd0,0x4ed6f0,0x4ed640,0x48a050,0x4ef180]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop

def snapshot():return {key:read(p+offset,fmt) for key,(offset,fmt) in fields.items()}
cases=[]
for i in range(128):
    origin=dict(x=rng.randrange(65536),y=rng.randrange(65536))
    write(point,'HH',origin['x'],origin['y']);cues.clear();freed=False
    # The cell list is a world registration consumer, not marker behavior.
    for cell in range(16384):write(0x8a03e4+cell*16+8,'H',0)
    call(0x4afff0,point,0)
    assert read(p+0x2c,'B')==48 and read(p+0x6c,'h')==4
    assert cues==[106] and read(0x89bc1e,'h')==5 and read(0x89bc20,'H')==0
    height=read(p+0x41,'h');frames=[snapshot()]
    for _ in range(20):call(0x4ee7b0,p);frames.append(snapshot())
    lifetime=0
    while not freed:call(0x50a750,p);lifetime+=1;assert lifetime<=4
    cases.append(dict(point=origin,height=height,lifetime=lifetime,frames=frames))
js="""import {createWorld,effect,browserPosition} from './app/model.ts';import {animateLiveObjects} from './app/live-people.ts';let s='';for await(const c of process.stdin)s+=c;const {land,cases}=JSON.parse(s),w=createWorld();w.units=[];Object.assign(w.land,land);w.land.landFlags=0;console.log(JSON.stringify(cases.map(c=>{w.effects=[];w.effectCounter=37;const f=effect(w,'orderMarker',browserPosition(c.point));if(w.effectCounter!==37)throw Error('Secondary allocation changed gameplay counter');const keys=['object','renderFlags','f1','f2','draw','morph','palette'],snapshot=()=>Object.fromEntries(keys.map(k=>[k,f.animation[k]])),frames=[snapshot()];for(let i=0;i<20;i++){animateLiveObjects(w);frames.push(snapshot());}return {point:c.point,height:Math.round(f.height*45),lifetime:f.turnsRemaining,frames};})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(land=land,cases=cases)).encode(),cwd=ROOT))
assert actual==cases,next((i,a,e) for i,(a,e) in enumerate(zip(actual,cases)) if a!=e)
if '--record' in sys.argv:
    # Full original heights are already covered by terrain tests; flat land keeps
    # this portable marker regression small and isolates the -160 attachment.
    for cell in range(16384):write(0x8a03e4+cell*16,'Ih',0,384)
    write(point,'HH',65535,1);call(0x4afff0,point,0)
    frames=[snapshot()]
    for _ in range(8):call(0x4ee7b0,p);frames.append(snapshot())
    fixture=dict(executableSha256=identity['sha256'],ground=384,height=read(p+0x41,'h'),point=dict(x=65535,y=1),turns=4,frames=frames)
    (ROOT/'tests/fixtures/order-marker.json').write_text(json.dumps(fixture,indent=2)+'\n')
print('PASS: 128 complete native marker emissions, 2688 animation states, terrain attachment, four-visit deletion and UI cue')

# Reuse the importer decoder to compare every existing atlas texel to the
# shipped nibble-alpha HFX data; this effect needs no additional texture upload.
import importlib.util
from PIL import Image
spec=importlib.util.spec_from_file_location('original_import',ROOT/'scripts/import-original.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
data=Path(sys.argv[1]).parent/'data'
palette=(data/'pal0-c.dat').read_bytes();alpha=(data/'al0-c.dat').read_bytes()
colors=b''.join(palette[alpha[(v|15)*256]*4:alpha[(v|15)*256]*4+3]+bytes([(v&15)*17]) for v in range(256))
source=module.sprites((data/'hfx0-0.dat').read_bytes(),colors,alpha=True)
atlas=Image.open(ROOT/'public/original/effects.png').convert('RGBA')
frames=json.loads((ROOT/'app/original-effects.json').read_text())['animations']['hit']
assert [f['source'] for f in frames]==list(range(1294,1300))
for f in frames:
    width,height,pixels=source[f['source']]
    x=f['index']%8*256;y=f['index']//8*256
    assert atlas.crop((x,y,x+width,y+height)).tobytes()==bytes(pixels)
print('PASS: all six original HFX1294–1299 frames match the existing atlas byte-for-byte')
