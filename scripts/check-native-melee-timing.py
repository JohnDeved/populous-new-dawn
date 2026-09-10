"""Compare melee action/recoil traces through the original 00518fb0 controller.
Group membership, relocation, damage and final sound/render consumers are supplied;
original animation setters, duration tables, signed countdown and transitions run.
Physics after entering substate 7 is checked separately by the physics driver oracle.
Usage: python scripts/check-native-melee-timing.py /path/to/d3dpoptb.exe
"""
import json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT
exe = Path(sys.argv[1]); cpu, _ = native_cpu(exe); configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x20000)
p, target, group, counts, stack, stop = 0x2000000, 0x2000200, 0x2000400, 0x2008000, 0x201d000, 0x201e000

def write(a, fmt, *v): cpu.mem_write(a, struct.pack('<' + fmt, *v))
def read(a, fmt): return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]
def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

starts = list(struct.iter_unpack('<HH', (exe.parent / 'data/vstart-0.ani').read_bytes()))
frames = list(struct.iter_unpack('<HBBBBH', (exe.parent / 'data/vfra-0.ani').read_bytes()))
write(0x59df44, 'I', counts)
for i, (start, _) in enumerate(starts):
    frame, seen = start, set()
    while frame and frame not in seen:
        seen.add(frame); frame = frames[frame][-1]
    assert frame in [0, start]
    write(counts + i * 6 + 1, 'B', len(seen) & 255)
sounds = []
def consumer(c, a, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if a == 0x519a70:
        write(read(sp + 8, 'I'), '2I', p, target)
        c.reg_write(UC_X86_REG_EAX, 1)
    elif a == 0x48a050: sounds.append(read(sp + 8, 'I'))
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I')); c.reg_write(UC_X86_REG_ESP, sp + 4)
for a in [0x519a70, 0x519d10, 0x4a39c0, 0x48a050, 0x4ea460]:
    cpu.hook_add(UC_HOOK_CODE, consumer, begin=a, end=a)

cases, expected = [], []
for model in [2, 3, 7]:
    for target_model in [2, 3, 7]:
        for phase in [2, 3, 4, 5, 6]:
            for timer in [None, -1, 0, 1, 2, 5, 7, 32767, -32768]:
                for a in [p, target, group]: cpu.mem_write(a, bytes(256))
                write(p + 0x24, 'H', 1); write(target + 0x24, 'H', 2)
                write(p + 0x2a, '4B', 1, model, 25, phase)
                write(target + 0x2a, '4B', 1, target_model, 0, 0)
                write(p + 0x72, 'H', 2)
                write(p + 0xc, 'I', 0x40000000 if timer is None else 0)
                write(p + 0x70, 'h', timer or 0)
                write(group + 0x2e, 'B', 1); write(group + 0x68, 'B', 2)
                write(group + 0x6c, 'H', 1); write(group + 0x70, '2H', 1, 2)
                write(0x890394, '2I', p, target)
                player = 0 if len(cases) % 2 else 3
                write(0x89c6f0, 'B', player)
                trace = []
                for _ in range(12):
                    write(0x89d167, 'B', 0)
                    sounds.clear(); call(0x518fb0, group)
                    state = read(p + 0x2d, 'B')
                    trace.append([state, read(p + 0x70, 'h') if state in [2,3,4,5,6] else None, sounds.copy(), read(0x89d167, 'B')])
                    if state in [0, 7]: break
                cases.append(dict(model=model, targetModel=target_model, phase=phase, timer=timer, playerTribe=player))
                expected.append(trace)
js = """
import {createWorld,addUnit,tick} from './app/model.ts';
let input='';for await(const c of process.stdin)input+=c;
const kinds={2:'brave',3:'warrior',7:'shaman'}, actions={2:'attack',3:'strike',4:'special',5:'recoil',6:'recoil'};
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const w=createWorld();w.terrain.fill(3);w.terrainVersion++;w.units=[];w.buildings=[];
 w.manaWorld.playerTribe=c.playerTribe;
 const target=addUnit(w,'red',kinds[c.targetModel],{x:0,z:0}),p=addUnit(w,'blue',kinds[c.model],{x:180/256,z:0});
 const b={id:w.nextId++,x:0,z:0,angle:512,members:[target.id,p.id]};w.fights=[b];
 target.fight={group:b.id,opponent:p.id,action:'strike',started:0,remaining:32767};
 p.fight={group:b.id,opponent:target.id,action:actions[c.phase],started:0,remaining:c.timer??undefined,knockback:c.phase===5};
 const trace=[];
 for(let i=0;i<12;i++){
  w.sounds=[];tick(w,1/12);const f=p.fight,state={approach:0,push:7,attack:2,strike:3,special:4,recoil:c.phase}[f.action];
  trace.push([state,state===0||state===7?null:f.remaining,w.sounds.filter(s=>[13,14,39,43,50].includes(s.cue)).map(s=>s.cue),w.musicActivity]);
  if(state===0||state===7)break;
 }
 return trace;
})));
"""
actual = json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
assert len(actual) == len(expected)
for c, a, e in zip(cases, actual, expected): assert a == e, (c, a, e)
print(f'PASS: {len(cases)} original melee action/recoil traces, animation-table initialization, signed timers, next-turn transitions and completion sounds/music activity across all three live classes/targets; grouping/damage/physics consumers remain separate.')

# Substate-7 entry executes the native impulse helper and its RNG draw. Supply a
# flat height consumer; the full terrain/physics oracle separately covers slopes.
def flat_height(c, a, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    c.reg_write(UC_X86_REG_EAX, 135)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I')); c.reg_write(UC_X86_REG_ESP, sp + 4)
cpu.hook_add(UC_HOOK_CODE, flat_height, begin=0x44e940, end=0x44e940)
cases, expected = [], []
for model in [2, 3, 7]:
    for angle in range(0, 2048, 64):
        for seed in [0, 1, 75, 0xffffffff]:
            for a in [p, target, group]: cpu.mem_write(a, bytes(256))
            write(p + 0x24, 'H', 1); write(target + 0x24, 'H', 2)
            write(p + 0x2a, '4B', 1, model, 25, 7)
            write(target + 0x2a, '4B', 1, 2, 0, 0)
            write(p + 0x3d, 'HHh', 2048, 63488, 135)
            write(p + 0x5d, 'H', angle)
            write(p + 0xc, 'I', 0x40201280); write(p + 0x10, 'I', 0x20000000)
            write(group + 0x2e, 'B', 1); write(group + 0x68, 'B', 2)
            write(group + 0x6c, 'H', 1); write(group + 0x70, '2H', 1, 2)
            write(0x890394, '2I', p, target); write(0x89d178, 'I', seed)
            call(0x4d3ff0, p, 9)
            elapsed = (angle >> 6) % 9
            write(p + 0x39, 'B', min(read(counts + read(p + 0x33, 'H') * 6 + 1, 'B') - 1, elapsed))
            call(0x518fb0, group)
            cases.append(dict(model=model, angle=angle, seed=seed, elapsed=elapsed))
            expected.append(dict(frame=read(p+0x39,'B'),velocity=list(struct.unpack('<hhh',cpu.mem_read(p + 0x49,6))), flags2=read(p+0xc,'I'), flags3=read(p+0x14,'I'), flags4=read(p+0x10,'I'), randomState=read(0x89d178,'I')))
js = """
import {createWorld,addUnit} from './app/model.ts';import {startMeleeKnockback} from './app/live-people.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const w=createWorld();w.terrain.fill(3);w.land.heights.fill(135);w.units=[];
 const u=addUnit(w,'blue',{2:'brave',3:'warrior',7:'shaman'}[c.model],{x:0,z:0});
 u.heading=Math.PI-c.angle*Math.PI/1024;u.fight={group:1,opponent:0,action:'push',started:-c.elapsed};w.randomState=c.seed;startMeleeKnockback(w,u);
 const p=u.flight;return {frame:p.f2,velocity:[p.velocity.x,p.velocity.y,p.velocity.z],flags2:p.flags2,flags3:p.flags3,flags4:p.flags4,randomState:w.randomState};
})));
"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
assert len(actual)==len(expected)
for c,a,e in zip(cases,actual,expected): assert a==e,(c,a,e)
print(f'PASS: {len(cases)} complete native knockback initializations: impulse direction/strength, RNG, retained recoil frame and recovery flags.')
