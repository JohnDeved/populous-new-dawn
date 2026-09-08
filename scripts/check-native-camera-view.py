"""Compare original view commands, timers and rendered transition fields.
Usage: python scripts/check-native-camera-view.py /path/to/d3dpoptb.exe
Full native functions execute; renderer/cache notifications are intercepted.
"""
import hashlib, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu
root = Path(__file__).resolve().parents[1]
exe = Path(sys.argv[1]); cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x20000)
stack, stop = 0x201d000, 0x201e000

def write(p, fmt, *values): cpu.mem_write(p, struct.pack('<'+fmt, *values))
def read(p, fmt): return struct.unpack('<'+fmt, cpu.mem_read(p, struct.calcsize('<'+fmt)))[0]
def call(address, *args):
    write(stack, 'I'*(len(args)+1), stop, *[v & 0xffffffff for v in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

def leaf(cpu, address, size, user):
    events.append(address)
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp,'I')); cpu.reg_write(UC_X86_REG_ESP,sp+4)

# Surface offsets, mesh bounds, transform notifications, overview dispatcher.
# Resolution-specific polygon setup 0x416e50 executes unchanged at completion.
for address in [0x429f90,0x46e450,0x46e510,0x47f480,0x418890]:
    cpu.hook_add(UC_HOOK_CODE,leaf,begin=address,end=address)

def compare(js,cases,expected):
    result=subprocess.run(['node','--input-type=module','-e',
        "import * as f from './app/camera-view.ts';import {cameraPreset} from './app/projection.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map("+js+')));'],
        input=json.dumps(cases),text=True,capture_output=True,cwd=root)
    assert result.returncode==0,result.stderr
    actual=json.loads(result.stdout);assert len(actual)==len(expected)
    for c,w,g in zip(cases,expected,actual): assert w==g,(c,w,g)

native=json.loads((root/'app/original-camera.json').read_text())
data=(exe.parent/'data/vconfig0.dat').read_bytes()
assert hashlib.sha256(data).hexdigest()==native['sha256']
cpu.mem_write(0x88f0c0,data)
# Native initialization 0x417000 overrides this field in all 50 records.
for i in range(50): write(0x88f0c0+i*94+52,'h',280)
write(0x89c6f0,'B',0);write(0x89c661,'I',4);write(0x89c6c3,'H',0)
events=[];cases=[];expected=[]
for rate in [0,1,10,20,24,30,60,120,200,256,1000,2147483647]:
    for scale in [None,48,128,256,512]:
        write(0x5ca850,'i',rate);write(0x89c669,'I',0x100000 if scale else 0)
        write(0x89c6a9,'h',scale or 256);call(0x4174b0)
        cases.append([rate,scale]);expected.append(read(0x89d172,'b'))
compare('c=>f.viewTransitionFrames(c[0],c[1]??undefined)',cases,expected)
print('PASS: 60 complete native transition timers, including signed-byte and scaled timing')

fields={'curvature':(0,'i'),'diameter':(4,'i'),'scale':(8,'i'),'spriteScale':(12,'i'),
        'depth':(16,'i'),'perspective':(20,'i'),'pitch':(32,'h'),'offsetX':(42,'h'),
        'offsetY':(44,'h'),'horizon':(46,'h'),'shamanScale':(52,'h'),
        'boundsMode':(84,'B'),'scaledSprites':(93,'B')}
def snapshot(): return {k:read(0x88f004+offset,fmt) for k,(offset,fmt) in fields.items()}
cases=[];expected=[];frames=0
for index in range(10):
    base=native['views'][index*5]
    write(0x89c6ee,'h',index);write(0x89c6cf,'hh',base['width'],base['height'])
    for rate in [10,24,60]:
        write(0x5ca850,'i',rate);write(0x89c669,'I',0)
        for source,target in [(0,3),(3,0),(0,2),(2,0),(3,2),(2,3),(0,4),(2,4),(3,4),(4,0),(4,2),(4,3)]:
            cpu.mem_write(0x88f004,bytes(cpu.mem_read(0x88f0c0+(index*5+source)*94,94)))
            write(0x89c6ec,'b',source);call(0x479f00,12,target,0)
            count=read(0x89ce34,'b');sequence=[]
            for step in range(count):
                call(0x417510);sequence.append(snapshot());frames+=1
            assert read(0x89ce34,'b')==0
            cases.append([index,source,target,rate]);expected.append(sequence)
compare('c=>{const [index,source,target,rate]=c,current=cameraPreset(index,source),to=cameraPreset(index,target),frames=f.viewTransitionFrames(rate),out=[];let n=frames;while(n){n=f.stepViewTransition(current,to,n,frames);out.push(Object.fromEntries('+json.dumps(list(fields))+'.map(k=>[k,current[k]])))}return out}',cases,expected)
print(f'PASS: {len(cases)} native view transitions, {frames} frames, 13 rendered fields across all 10 resolutions')

cases=[];expected=[]
write(0x89c6ee,'h',0);write(0x5ca850,'i',24);write(0x89c669,'I',0)
for preset in [0,1,2,3,4]:
    for inward in [False,True]:
        write(0x89c6ec,'b',preset);write(0x89c6c1,'B',2 if preset==4 else 0)
        events=[];call(0x479f00,15,0,1 if inward else -1)
        next_preset=read(0x89c6ec,'b')
        if 0x418890 in events: next_preset=2 if preset==4 else 4
        cases.append([preset,inward]);expected.append(next_preset)
compare('c=>f.zoomPreset(...c)',cases,expected)
print('PASS: 10 complete native zoom commands; close/normal/bird\'s-eye/world routing and endpoint no-ops')
