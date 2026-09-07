"""Native cast eligibility, usage recovery and four-tribe cooldown pass.
Usage: python scripts/check-native-cast-cooldowns.py /path/to/d3dpoptb.exe
The AI timer prefix stops before unrelated world work at 0x461655. The complete
spell initializer supplies projectile/UI leaves and compares only timer outputs.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
base,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x4615f0)
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def call(a,*args,end=stop):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,end,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==end,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
def compare(cases,expected,body):
    js="import * as s from './app/spell-casting.ts';import {createWorld} from './app/model.ts';let text='';for await(const c of process.stdin)text+=c;console.log(JSON.stringify(JSON.parse(text).map(c=>{"+body+"})));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-cast-cooldown-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
def reset():
    cpu.mem_write(base,bytes(0x10000));cpu.mem_write(0x89d1c8,bytes(4*0xc65));write(0x89d17c,'I',0);write(0x96eabf,'B',0)
def state(t):
    return dict(flags=read(t+0x93d,'I'),cooldown=read(t+0xc5e,'B'),aiCooldown=read(t+0x5bd,'B'),
      spells=[dict(used=read(t+0x53e+i*4,'B'),interval=read(t+0x53f+i*4,'B'),remaining=read(t+0x540+i*4,'H')) for i in range(22)])
def fixture(t,s):
    write(t+0x93d,'I',s['flags']);write(t+0xc5e,'B',s['cooldown']);write(t+0x5bd,'B',s['aiCooldown'])
    for i,v in enumerate(s['spells']):write(t+0x53e+i*4,'BBH',v['used'],v['interval'],v['remaining'])
def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX,0xffffffff if address==0x430bd0 else 0)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4c1b80,0x430bd0,0x4ed8a0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
for batch in range(8):
    cases=[];expected=[]
    for i in range(256):
        reset();owner=i%4;t=0x89d1c8+owner*0xc65
        s=dict(flags=rng.choice([0,8,32,0x80000]),cooldown=rng.choice([0,0,1,12,255]),aiCooldown=rng.choice([0,0,1,12,255]),
          spells=[dict(used=rng.choice([0,1,2,4,15,255]),interval=rng.choice([0,1,2,128,255]),remaining=rng.choice([0,0,1,2,64,32768,65535])) for _ in range(22)])
        p=dict(state=rng.choice([0,3,22,25,29,33]),flags2=rng.choice([0,0,1,2,0x800000]),flags4=rng.choice([0,0,0x400,0x800]))
        player=rng.randrange(4);ai=rng.choice([0,0x40000]);game=rng.choice([0,32]);opened=rng.choice([0,16]);model=rng.randrange(1,22)
        fixture(t,s);write(t+0xc1f,'B',player);write(t+0x596,'I',ai);write(0x89d17c,'I',game);write(0x98f746,'I',opened)
        write(base+0x2f,'B',owner);write(base+0x2b,'B',model);write(base+0x2c,'B',p['state']);write(base+0xc,'I',p['flags2']);write(base+0x10,'I',p['flags4'])
        can=bool(call(0x4c2d80,base));allowed=bool(call(0x4f2100,base,model))
        # No initialization stack: price zero, actual initializer counter/timer branches.
        call(0x4c14c0,base);registered=state(t)
        call(0x4615f0,t,end=0x461655);stepped=state(t)
        cases.append(dict(state=s,p=p,player=player,ai=ai,game=game,opened=opened,model=model))
        expected.append(dict(can=can,allowed=allowed,registered=registered,stepped=stepped))
    compare(cases,expected,"const can=s.canShamanCast(c.state,c.player,c.p),allowed=s.computerSpellAllowed(c.state,c.ai,c.game,c.model);s.registerSpellCooldown(c.state,c.player,c.ai,c.game,c.opened,c.model);const registered=structuredClone(c.state);s.stepComputerCastCooldown(c.state,c.ai);return {can,allowed,registered,stepped:c.state};")
print('PASS: 2,048 native eligibility/usage-limit queries, initializer timers and AI timer-prefix updates')
cases=[];expected=[]
for i in range(512):
    reset();land=rng.choice([0,2]);load=rng.choice([0,0x200]);game=rng.choice([0,32]);level=rng.choice([0,0x100000])
    write(0x89c661,'I',land);write(0x89c665,'I',load);write(0x89d17c,'I',game);write(0x895da4,'I',level)
    states=[];active=[]
    for j in range(4):
        t=0x89d1c8+j*0xc65;write(t+0xc5e,'B',rng.choice([0,1,12,255]));a=rng.choice([0,1,255]);write(t+0xc20,'B',a)
        states.append(state(t));active.append(bool(a))
    call(0x461510)
    cases.append(dict(states=states,active=active,land=land,load=load));expected.append([state(0x89d1c8+j*0xc65) for j in range(4)])
compare(cases,expected,"c.states.forEach((t,i)=>s.stepTribeCastCooldown(t,c.active[i],c.land,c.load));return c.states;")
print('PASS: 512 complete native four-tribe timer passes across load/land/special-mode gates')
reset();write(0x89c661,'I',0);write(0x89c6f0,'B',0)
for i in range(4):
    t=0x89d1c8+i*0xc65;write(t+0xc22,'B',i);call(0x42b660,i)
    expected=[state(t),read(0x960815+i*48,'B') if i else 0]
    compare([i],[expected],"const w=createWorld();return [w.castingTribes[c],c?w.ai.attributes[43]:0];")
print('PASS: actual tribe initialization of usage intervals and the configured 12-turn AI delay')
# The original allocator writes the configured delay even when allocation fails.
cases=[];expected=[]
for delay in [0,1,12,64,255]:
    reset();t=0x89d1c8;write(t+0x89d,'I',base);write(0x892443,'I',base+0x1000);write(0x960815,'B',delay)
    call(0x4f4de0,t,2,0);assert read(t+0x5bd,'B')==delay
print('PASS: allocator delay assignment on failure, including zero and maximum byte values')
