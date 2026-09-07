"""Compare complete 0x461510 and its real 0x419480 gate against the browser.
Only the computer and territory consumers are supplied; their call order and
all four cooldowns at each call are compared. A consumer may mutate a later
tribe, checking that eligibility is read during iteration, not precomputed.
Usage: python scripts/check-native-tribe-turns.py /path/to/d3dpoptb.exe
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu

root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
stack,stop=0x201d000,0x201e000
rng=random.Random(0x461510);events=[];current=None
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def tribe(i):return 0x89d1c8+i*0xc65
def cooldowns():return [read(tribe(i)+0xc5e,'B') for i in range(4)]
def consumer(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);id=(read(sp+4,'I')-tribe(0))//0xc65
    events.append(['computer' if address==0x4615f0 else 'territory',id,cooldowns()])
    if current['mutate'] and id==0:write(tribe(1)+0x941,'I',64)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4615f0,0x4f6c20]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)

cases=[];expected=[];coverage={'computer':0,'territory':0,'mutated':0,'suppressed':0}
for i in range(2048):
    w=dict(landFlags=rng.choice([0,0,0,2,0x800000]),loadFlags=rng.choice([0,0,0x200]),
      gameFlags=rng.choice([0,0,32]),levelFlags2=rng.choice([0,0,0x100000]),tribeCount=rng.randrange(5))
    ts=[dict(active=bool(rng.randrange(2)),defeatTimer=rng.choice([-2147483648,-1,0,1,96,97,112,2147483647]),
      flags2=rng.choice([0,1,64,128]),playerType=rng.randrange(4)) for _ in range(4)]
    timers=[rng.choice([0,1,12,255]) for _ in range(4)];mutate=i%7==0
    if i<16:
        w.update(landFlags=0,loadFlags=0,gameFlags=0,levelFlags2=0,tribeCount=4)
        ts=[dict(active=True,defeatTimer=0,flags2=0,playerType=j%2+1) for j in range(4)]
        if i<8:
            key,value=[('landFlags',2),('loadFlags',0x200),('gameFlags',32),('levelFlags2',0x100000),
              ('tribeCount',0),('tribeCount',1),('landFlags',0x800000),('tribeCount',4)][i];w[key]=value
        else:ts[1].update(defeatTimer=[-2147483648,-1,0,1,96,97,112,2147483647][i-8])
    current=dict(world=w,tribes=ts,timers=timers,mutate=mutate);cases.append(current)
    cpu.mem_write(tribe(0),bytes(4*0xc65))
    for a,key in [(0x89c661,'landFlags'),(0x89c665,'loadFlags'),(0x89d17c,'gameFlags'),(0x895da4,'levelFlags2')]:write(a,'I',w[key])
    write(0x96eabf,'B',w['tribeCount'])
    for j,t in enumerate(ts):
        a=tribe(j);write(a+0xc20,'B',int(t['active']));write(a+0x949,'i',t['defeatTimer'])
        write(a+0x941,'I',t['flags2']);write(a+0xc1f,'B',t['playerType']);write(a+0xc5e,'B',timers[j])
    write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack);events=[]
    cpu.emu_start(0x461510,stop,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    expected.append(dict(events=events.copy(),timers=cooldowns(),flags=[read(tribe(j)+0x941,'I') for j in range(4)]))
    for kind,_,_ in events:coverage[kind]+=1
    coverage['mutated']+=bool(mutate and events and events[0][1]==0);coverage['suppressed']+=not bool(events)

js="""import {processTribes} from './app/tribe-turns.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const casting=c.timers.map(cooldown=>({cooldown})),events=[];
 const visit=(kind,id)=>{events.push([kind,id,casting.map(t=>t.cooldown)]);if(c.mutate&&id===0)c.tribes[1].flags2=64;};
 processTribes(c.world,c.tribes,casting,{computer:id=>visit('computer',id),territory:id=>visit('territory',id)});
 return {events,timers:casting.map(t=>t.cooldown),flags:c.tribes.map(t=>t.flags2)};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        p=Path('/private/tmp/populous-tribe-turn-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2))
        raise AssertionError((i,str(p)))
assert all(coverage.values()),coverage
print('PASS: 2,048 complete native tribe scheduler calls;',coverage)

# Actual offline outer loop and inner-loop gate/increment. Supply the clock,
# ready command buffer and unrelated command/replay consumers. After the real
# increment, skip remaining object work through the original function epilogue.
trace=[]
def outer_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX,100 if address==0x2000000 else 1 if address==0x43e480 else 0)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x2000000,0x43e480,0x43e890,0x47aac0,0x43e320,0x47ac30,0x4b3920]:
    cpu.hook_add(UC_HOOK_CODE,outer_leaf,begin=a,end=a)
def phase(cpu,address,size,user):
    trace.append([{0x461510:'tribes',0x4ec6f0:'inner',0x4ec709:'increment'}[address],read(0x89d188,'I')])
    if address==0x4ec709:cpu.reg_write(UC_X86_REG_EIP,0x4eca67)
for a in [0x461510,0x4ec6f0,0x4ec709]:cpu.hook_add(UC_HOOK_CODE,phase,begin=a,end=a)
write(0xd0c784,'I',0x2000000);write(0x89d161,'B',12);write(0x89d184,'I',1)
write(0x89bb81,'B',0);write(0x89c669,'I',0);write(0x96a860,'I',0)
write(0x890324,'I',0);write(0x890330,'I',0);write(0x96eabf,'B',0)
for i in range(512):
    land=rng.choice([0,2,0x800000,0x800002]);turn=rng.choice([0,15,71,0x7fffffff,0xffffffff]);subturns=i%4
    write(0x89c661,'I',land);write(0x89d188,'I',turn);write(0x895dac,'b',subturns-1);write(0x5cd92c,'I',99)
    write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack);trace=[]
    cpu.emu_start(0x4a5590,stop,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    wanted=[]
    for _ in range(subturns):
        if not land&0x800000:wanted.append(['tribes',turn])
        wanted.append(['inner',turn])
        if not land&2:turn=(turn+1)&0xffffffff;wanted.append(['increment',turn])
    assert trace==wanted,(i,land,trace,wanted)
    assert read(0x89d188,'I')==turn
print('PASS: 512 actual offline outer-loop phase traces with original inner gate/increment')
