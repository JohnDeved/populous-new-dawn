"""Replay complete Land Bridge controllers against the original executable.
Terrain redraw/notification and trail allocation consumers are supplied; all
cell traversal, height queries, arithmetic and lifetime decisions execute.
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x10000)
p, allocated, stack, stop = 0x2000000, 0x2000200, 0x200e000, 0x200ff00

def write(a, fmt, *v): cpu.mem_write(a, struct.pack('<'+fmt, *v))
def read(a, fmt): return struct.unpack('<'+fmt, cpu.mem_read(a, struct.calcsize('<'+fmt)))[0]
def digest(v): return hashlib.sha256(json.dumps(v,separators=(',',':')).encode()).hexdigest()
def hook(c, a, size, user):
    global alive
    sp = c.reg_read(UC_X86_REG_ESP)
    if a == 0x4ed8a0:
        assert read(sp+4,'I') == 7 and read(sp+8,'I') == 3
        q = read(sp+16,'I')
        trails.append([read(q,'H'),read(q+2,'H'),read(q+4,'h')])
        c.reg_write(UC_X86_REG_EAX, allocated)
    elif a == 0x44ddf0:
        assert read(sp+8,'I') == 2 and read(sp+12,'I') == 1
        changed.append(read(sp+4,'H'))
        if browser: return # Execute the real queue for live-scene replay.
    elif a == 0x44f2f0:
        assert [read(sp+4,'I'),read(sp+12,'I'),read(sp+16,'I')]==[1,2,0xffffffff]
        assert read(sp+8,'H')==changed[-1]
    elif a == 0x4edcf0: alive=False
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed8a0,0x44ddf0,0x44f2f0,0x4edcf0,0x4be230,0x4bdff0]: cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
rng=random.Random(0x50ee00)
heights=[((i*17)^(i>>7)*23)%1537-256 for i in range(16384)]
flags=[i&1 for i in range(16384)]
browser = json.loads(Path(sys.argv[sys.argv.index('--browser')+1]).read_text()) if '--browser' in sys.argv else None
if browser: heights,flags=browser['heights'],browser['flags']
terrain=bytearray(0x40000)
for i,h in enumerate(heights):
    struct.pack_into('<Ih',terrain,i*16,flags[i],h)
    if browser:
        for field,offset in [('cliffs',10),('categories',12),('shadows',14)]: terrain[i*16+offset]=browser[field][i]
if browser: write(0x89c661,'I',browser['landFlags'])
cases=[]
for n in range(1 if browser else 96):
    start=dict(x=rng.randrange(65536),y=rng.randrange(65536))
    dx,dy=[(0,0),(0,4096),(4096,0),(-4096,0),(0,-4096),(8192,8192),(-8192,8192),(32768,0),(0,-32768),(rng.randrange(-8192,8193),rng.randrange(-8192,8193))][n%10]
    target=dict(x=(start['x']+dx)&65535,y=(start['y']+dy)&65535)
    if browser: start,target=browser['start'],browser['target']
    cpu.mem_write(0x8a03e4,bytes(terrain));cpu.mem_write(p,bytes(256))
    write(p+0x3d,'HH',start['x'],start['y']);write(p+0x57,'HH',target['x'],target['y'])
    write(p+0x2f,'B',n%4)
    timeline=[];alive=True
    while alive:
        trails=[];changed=[]
        write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack)
        cpu.emu_start(0x50ee00,stop,count=1000000)
        assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
        if browser:
            write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack)
            cpu.emu_start(0x44df40,stop,count=10000000)
            assert cpu.reg_read(UC_X86_REG_EIP)==stop
        state=dict(turn=read(p+0x6c,'h'),alongY=bool(read(p+0x86,'i')),startCell=read(p+0x8a,'H'),endCell=read(p+0x8c,'H'),direction=read(p+0x7a,'i'),crossStep=read(p+0x82,'i'),heightStep=read(p+0x7e,'i'),raiseWater=bool(read(p+0x8e,'B')))
        raw=cpu.mem_read(0x8a03e4,0x40000)
        values=[struct.unpack_from('<h',raw,i*16+4)[0] for i in range(16384)]
        if trails: assert read(allocated+0x6c,'h')==2
        timeline.append(dict(state=state,alive=alive,heights=digest(values),trails=digest(trails),changed=digest(changed)))
        assert len(timeline)<=64
    cases.append(dict(start=start,target=target,timeline=timeline))
js="""import {createHash} from 'node:crypto';import {createLandBridge,stepLandBridge} from './app/land-bridge.ts';let s='';for await(const c of process.stdin)s+=c;const data=JSON.parse(s),digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');console.log(JSON.stringify(data.cases.map(c=>{const land={heights:Int16Array.from(data.heights),flags:Uint32Array.from(data.flags)},b=createLandBridge(c.start,c.target),timeline=[];let alive=true;while(alive){const trails=[],changed=[];alive=stepLandBridge(land,b,p=>trails.push([p.x,p.y,p.h]),c=>changed.push(c));const {start,target,...state}=b;timeline.push({state,alive,heights:digest(Array.from(land.heights)),trails:digest(trails),changed:digest(changed)});if(timeline.length>64)throw Error('lifetime');}return timeline})));"""
if not browser:
    actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(heights=heights,flags=flags,cases=cases)).encode(),cwd=ROOT))
    for i,(case,result) in enumerate(zip(cases,actual)):
        for t,(a,b) in enumerate(zip(case['timeline'],result)):
            assert a==b,(i,t,case['start'],case['target'],a,b)
        assert len(case['timeline'])==len(result)
if browser:
    assert len(browser['timeline'])==len(cases[0]['timeline'])
    for n,(actual,expected) in enumerate(zip(browser['timeline'],cases[0]['timeline'])):
        assert {key:actual[key] for key in ['state','alive','heights']} == {key:expected[key] for key in ['state','alive','heights']}, (n,actual,expected)
    print('PASS: actual browser-cast terrain/controller state matches every native turn')
if '--record' in sys.argv and not browser:
    (ROOT/'tests/fixtures/land-bridge.json').write_text(json.dumps(dict(identity=identity,heights=heights,flags=flags,cases=cases[:10]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native Land Bridge lifetimes ({sum(len(c["timeline"]) for c in cases)} turns), all terrain heights, ordered trails, notifications and controller state')
