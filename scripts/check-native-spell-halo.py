"""Compare 0x475a70's original halo loop, movement, height and queue records.
Only spell-range and camera projection inputs are supplied; native trig,
terrain interpolation, phase advancement, animation and allocation execute.
Usage: python scripts/check-native-spell-halo.py EXE
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX,UC_X86_REG_FPCW
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x100000)
stack,stop,person,camera,pool=0x200e000,0x2000100,0x2010000,0x2011000,0x2020000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
cpu.reg_write(UC_X86_REG_FPCW,0x27f)
rng=random.Random(0x475a70)
land=dict(heights=[rng.randrange(-128,1025) for _ in range(16384)],flags=[rng.randrange(2) for _ in range(16384)])
for i,(h,flags) in enumerate(zip(land['heights'],land['flags'])):write(0x8a03e4+i*16,'Ih',flags,h)
write(0x89da65,'I',person);write(0x74a350,'I',camera);write(camera+0x24,'HH',0,0)
write(0x89d17c,'I',0);write(0x89c6f0,'b',0);write(0x89c6e7,'B',13);write(0x89ce81,'B',2)
depths=[-40000,-28453,-28308,-28307,0,28683,28684,40000]
def hook(c,a,size,user):
    sp=c.reg_read(UC_X86_REG_ESP)
    if a==0x475c17:
        pos=read(sp,'I');points.append(dict(x=read(pos,'H'),y=read(pos+2,'H')));return
    if a==0x4c2e30:c.reg_write(UC_X86_REG_EAX,p['range']&0xffffffff)
    else:
        q=read(sp+4,'I');i=len(points)-1
        points[i]['h']=read(q+4,'i')
        write(q+8,'iff',depths[i%len(depths)],float(i),float(-i));write(q+24,'I',0)
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x475c17,0x4c2e30,0x46dbe0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
cases=[];expected=[];buckets=[]
for n in range(256):
    p=dict(origin=dict(x=rng.randrange(65536),y=rng.randrange(65536)),range=rng.choice([-32769,-32768,-1,0,1,512,4096,10000,32767,65535,65536,2147483647]),angle=rng.randrange(65536),frame=rng.randrange(0x7fffffaa))
    write(person+0x3d,'HHh',p['origin']['x'],p['origin']['y'],512);write(0x59d9d0,'H',p['angle']);write(0x897981,'I',p['frame'])
    write(0x75d504,'II',pool+4096,pool);cpu.mem_write(pool,bytes(4096));cpu.mem_write(0x75d50c,bytes(3585*4))
    write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack);points=[];cpu.emu_start(0x475a70,stop,count=200000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop and len(points)==85
    assert read(0x75d508,'I')==pool+85*22
    for i,point in enumerate(points):
        at=pool+i*22;assert read(at,'B')==24 and read(at+12,'B')==25
        point['frame']=read(at+10,'h')
    # The queue contains each body and its shadow in the recovered depth bucket.
    found=[]
    for bucket in range(3585):
        at=read(0x75d50c+bucket*4,'I')
        while at:
            if read(at,'B')==24:found.append(((at-pool)//22,bucket))
            at=read(at+2,'I')
    buckets=[b for _,b in sorted(found)]
    cases.append(p);expected.append(dict(angle=read(0x59d9d0,'H'),points=points,buckets=buckets))
js="""import {spellHalo,haloBucket} from './app/spell-halo.ts';let s='';for await(const b of process.stdin)s+=b;const {land,cases,depths}=JSON.parse(s);console.log(JSON.stringify(cases.map(p=>{const state={angle:p.angle};return {points:spellHalo(land,p.origin,p.range,state,p.frame),angle:state.angle,buckets:Array.from({length:85},(_,i)=>haloBucket(depths[i%depths.length]))};})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(land=land,cases=cases,depths=depths)).encode(),cwd=ROOT))
assert actual==expected,next((i,a,e,cases[i]) for i,(a,e) in enumerate(zip(actual,expected)) if a!=e)
print('PASS: 256 native halo loops, 21760 wrapped positions/stored-diagonal heights/animation frames, 43520 body-shadow records and depth buckets; native movement and terrain routines execute')
