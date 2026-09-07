"""Compare flyby queues, command encoding and camera motion with original x86.
Usage: python scripts/check-native-flyby.py /path/to/d3dpoptb.exe
"""
import json, math, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_FPCW
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
# Explicit 53-bit x87 precision; full native startup/device-mode comparison is pending.
cpu.reg_write(UC_X86_REG_FPCW, 0x27f)
stack, stop, axis, timing = 0x201d000, 0x201e000, 0x2000000, 0x2000020
def write(p, fmt, *v): cpu.mem_write(p, struct.pack(fmt, *v))
def read(p, fmt): return struct.unpack(fmt, cpu.mem_read(p, struct.calcsize(fmt)))[0]
def call(address, *args):
    write(stack, '<'+'I'*(len(args)+1), stop, *[a & 0xffffffff for a in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try: cpu.emu_start(address, stop, timeout=100000, count=100000)
    except Exception:
        print(f"Native failure at {cpu.reg_read(UC_X86_REG_EIP):08x}");raise
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
def browser(js, cases):
    result = subprocess.run(['node', '--input-type=module', '-e',
        "import * as f from './app/flyby.ts';let s='';for await(const c of process.stdin)s+=c;"+js],
        input=json.dumps(cases), text=True, capture_output=True, cwd=root)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)
def snapshot_axis(p=axis, t=timing):
    return dict(zip(['acceleration','braking','cruise','velocity','initial','accelerateUntil','brakeFrom'],
        struct.unpack('<5f', cpu.mem_read(p,20))+struct.unpack('<2f', cpu.mem_read(t,8))))

rng = random.Random(1209)
cases, expected = [], []
for i in range(1000):
    distance = rng.randint(-32768,32767)
    duration = rng.randint(1,250)
    velocity = rng.choice([0, rng.uniform(-400,400)])
    velocity = struct.unpack('<f',struct.pack('<f',velocity))[0]
    cpu.mem_write(axis,bytes(40));write(axis+12,'<f',velocity)
    call(0x44a070, distance, duration, axis, timing)
    cases.append(dict(distance=distance,duration=duration,velocity=velocity))
    expected.append({k: v if math.isfinite(v) else None for k,v in snapshot_axis().items()})
actual = browser("console.log(JSON.stringify(JSON.parse(s).map(c=>{const a=f.createFlybyAxis();a.velocity=c.velocity;f.planFlybyAxis(a,c.distance,c.duration);return a})));", cases)
for c, want, got in zip(cases,expected,actual): assert want == got, (c,want,got)
print(f'PASS: {len(cases)} native float32 acceleration/braking profiles')

# Native zoom updates include the original x87 conversion to a signed short.
# Only the subsequent renderer zoom setter is intercepted.
def skip(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'<I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,skip,begin=0x41c700,end=0x41c700)
cases,expected=[],[]
for i in range(100):
    position=rng.randint(-16000,16000);target=rng.randint(-16000,16000);duration=rng.randint(4,120)
    cpu.mem_write(0x969d52,bytes(28));write(0x89c6f0,'<b',0);write(0x89d1fc,'<h',position)
    write(0x969cf0,'<h',duration)
    call(0x44a070,target-position,duration,0x969d52,0x969d66)
    frames=[]
    for frame in range(duration+1):
        write(0x969cee,'<h',frame);call(0x449b30)
        frames.append([read(0x89d1fc,'<h'),read(0x969d5e,'<f')])
    cases.append(dict(position=position,target=target,duration=duration));expected.append(frames)
actual=browser("console.log(JSON.stringify(JSON.parse(s).map(c=>{const a=f.createFlybyAxis();f.planFlybyAxis(a,c.target-c.position,c.duration);return Array.from({length:c.duration+1},(_,i)=>{c.position=Math.max(-16384,Math.min(16384,f.stepFlybyAxis(a,c.position,i,c.duration)));return [c.position,a.velocity]})})));",cases)
for c,want,got in zip(cases,expected,actual): assert want==got,(c,want,got)
print(f'PASS: {sum(len(x) for x in expected)} native zoom frames and velocities')

cases,expected=[],[]
for trial in range(40):
    call(0x448ec0);events=[]
    for i in range(40):
        e=dict(kind=rng.randint(1,6),flags=rng.randrange(256),value=rng.randrange(65536),start=rng.randint(-100,100),duration=rng.randint(1,100))
        events.append(e);call(0x449240,e['kind'],e['value'],e['start'],e['duration'],e['flags'])
    expected.append([dict(zip(['kind','flags','value','start','duration'],struct.unpack('<BBHhh',cpu.mem_read(0x969be2+i*8,8)))) for i in range(read(0x969bd3,'<B'))])
    cases.append(events)
actual=browser("console.log(JSON.stringify(JSON.parse(s).map(events=>{const a=f.createFlyby();for(const e of events)f.addFlybyEvent(a,e);return a.events})));",cases)
for want,got in zip(expected,actual):assert want==got,(want,got)
print('PASS: 1,600 native event insertions, stable ties and 32-slot capacity')

# Execute the unchanged first-mission flyby bytecode in the real native VM.
script=json.loads((root/'app/original-script.json').read_text())
codes=[12,1003,*script['codes'][961:1075],1004,1019]
blob=bytearray(12552)
struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
for i,field in enumerate(script['fields']):struct.pack_into('<Ii',blob,8192+i*8,*field)
program,tribe=0x2004000,0x2008000
commands=[];pc=961
while pc<1075:
    assert script['codes'][pc]==1006
    opcode=script['codes'][pc+1];arity=script['commands'][str(opcode)]
    args=script['codes'][pc+2:pc+2+arity]
    commands.append([opcode,[int(a==1022) if opcode==1208 else script['fields'][a][1] for a in args]])
    pc+=2+arity
signals=[]
def presentation(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x44d7f0:signals.append([read(sp+4,'<B'),read(sp+8,'<H'),read(sp+12,'<h')])
    skip(cpu,address,size,user)
for address in [0x44d7f0,0x4af440,0x479f00,0x4af0a0,0x4af1c0,0x47aa20]:
    cpu.hook_add(UC_HOOK_CODE,presentation,begin=address,end=address)

def camera():return dict(x=read(0x89d1ec,'<h'),y=read(0x89d1ee,'<h'),angle=read(0x89d1fa,'<H'),zoom=read(0x89d1fc,'<h'))
def timeline():
    return dict(camera=camera(),cursor=read(0x969bd2,'<B'),warmup=read(0x969bd4,'<B'),
        frameRate=read(0x969bd5,'<b'),frame=read(0x969be0,'<h'),flags=read(0x969bd7,'<B')&127,
        tracks=[dict(frame=read(0x969ce2+i*4,'<h'),duration=read(0x969ce4+i*4,'<h'),active=bool(read(0x969bd6,'<B')&(1<<i))) for i in range(7)],
        signals=list(signals))
cases,expected=[],[]
for fps in [8,10,12,24,60]:
    for interrupt in [-1,3,60,350]:
        cpu.mem_write(program,bytes(blob));cpu.mem_write(tribe,bytes(0xc65))
        write(0x89c6f0,'<b',0);write(0x89c661,'<I',0);write(0x98f746,'<B',0)
        write(0x59cd3c,'<i',0);write(0x5ca850,'<i',fps)
        initial=dict(x=17*256,y=-41*256,angle=0,zoom=0)
        write(0x89d1ec,'<hh',initial['x'],initial['y']);write(0x89d1fa,'<H',0);write(0x89d1fc,'<h',0)
        call(0x48c6b0,tribe,program)
        frames=[]
        for frame in range(750):
            signals.clear()
            if frame==interrupt:call(0x449080)
            call(0x449320)
            frames.append(timeline())
            if not (read(0x969bd7,'<B')&1):break
        cases.append(dict(fps=fps,interrupt=interrupt,camera=initial,commands=commands));expected.append(frames)
actual=browser("""console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const a=f.createFlyby(),frames=[];for(const [op,args] of c.commands)f.flybyCommand(a,op,args);
 for(let i=0;i<750;i++){
  if(i===c.interrupt)f.interruptFlyby(a,c.camera);
  const signals=f.stepFlyby(a,c.camera,c.fps).filter(e=>e.kind===5).map(e=>[e.flags,e.value,e.duration]);
  frames.push({camera:{...c.camera},cursor:a.cursor,warmup:a.warmup,frameRate:a.frameRate,frame:a.frame,flags:a.flags&127,tracks:structuredClone(a.tracks),signals});
  if(!(a.flags&1))break;
 }return frames;
})));""",cases)
for c,want,got in zip(cases,expected,actual):
    assert len(want)==len(got),(c['fps'],c['interrupt'],len(want),len(got))
    for frame,(a,b) in enumerate(zip(want,got)):assert a==b,(c['fps'],c['interrupt'],frame,a,b)
print(f'PASS: {sum(len(x) for x in expected)} native opening flyby frames, five frame rates and four interrupt paths')
