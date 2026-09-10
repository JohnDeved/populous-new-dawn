"""Compare the ready-fighter decision block in the supplied executable.
Runs 005193d4..0051947e with real 0051e3d0 slot geometry and 00450450
wrapped squared distance; choice/target selection are supplied inputs. This is
not a comparison of the entire 00518fb0 fight lifecycle or damage application.
Usage: python scripts/check-native-melee-decisions.py /path/to/d3dpoptb.exe
"""
import json, struct, subprocess, sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EDI, UC_X86_REG_EBP, UC_X86_REG_ESI, UC_X86_REG_EDX
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
attacker, target, fight, out, stack, stop = 0x2000000, 0x2000200, 0x2000400, 0x2000600, 0x201d000, 0x201e000

def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))

def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]

cases, expected = [], []
offsets = [(0, 0), (359, 0), (360, 0), (361, 0), (215, 288), (216, 288), (217, 288), (-359, 0), (0, -360), (32768, 32768)]
for model in [2, 3, 7]:
    for count in [2, 3, 4]:
        for index in range(count):
            for phase in [0, 1, 2, 5, 6, 7, 14]:
                for choice in range(16):
                    for dx, dy in offsets:
                        n = len(cases)
                        x, y, angle = [0, 32760, 65530][n % 3], [65530, 0, 32760][n % 3], (n * 137) & 2047
                        cpu.mem_write(fight, bytes(256))
                        write(fight + 0x3d, 'HH', x, y)
                        write(fight + 0x26, 'H', angle)
                        write(fight + 0x68, 'B', count)
                        write(stack, '4I', stop, out, fight, index)
                        cpu.reg_write(UC_X86_REG_ESP, stack)
                        cpu.emu_start(0x51e3d0, stop, count=1000)
                        assert cpu.reg_read(UC_X86_REG_EIP) == stop
                        tx, ty = (read(out, 'H') + dx) & 65535, (read(out + 2, 'H') + dy) & 65535
                        cpu.mem_write(attacker, bytes(256)); cpu.mem_write(target, bytes(256))
                        write(attacker + 0x2b, 'BBB', model, 25, 1)
                        write(attacker + 0x72, 'H', 73)
                        write(target + 0x24, 'H', 91)
                        write(target + 0x2c, 'BB', 14 if phase == 14 else 25, phase)
                        write(target + 0x3d, 'HH', tx, ty)
                        cpu.mem_write(stack, bytes(256))
                        write(stack + 0x1c, 'I', count)
                        write(stack + 0x44 + index * 4, 'I', target)
                        for reg, value in [(UC_X86_REG_ESP, stack), (UC_X86_REG_EDI, attacker), (UC_X86_REG_EBP, fight), (UC_X86_REG_ESI, choice), (UC_X86_REG_EDX, index)]:
                            cpu.reg_write(reg, value)
                        cpu.emu_start(0x5193d4, 0x51947e, count=2000)
                        assert cpu.reg_read(UC_X86_REG_EIP) == 0x51947e
                        cases.append(dict(model=model, count=count, index=index, phase=phase, choice=choice, x=x, y=y, angle=angle, tx=tx, ty=ty))
                        expected.append([read(attacker + 0x2d, 'B'), read(attacker + 0x72, 'H'), read(attacker + 0xc, 'I')])
js = """
import {chooseMeleeAttack} from './app/melee.ts';
import {movePosition} from './app/native-math.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const slot={x:c.x,y:c.y};
 if(c.index)movePosition(slot,c.angle+(c.count===3?[0,0,512][c.index]:[0,0,682,1365][c.index]),180);
 const dx=((slot.x-c.tx)<<16)>>16,dy=((slot.y-c.ty)<<16)>>16;
 const action=chooseMeleeAttack(c.model===7?'shaman':c.model===3?'warrior':'brave',c.choice,
  {ready:c.phase===1,fighting:c.phase!==14,slotDistanceSquared:(dx*dx+dy*dy)|0},c.count);
 return action?[{attack:2,strike:3,special:4}[action],91,0x40000000]:[1,73,0];
})));
"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], input=json.dumps(cases).encode(), cwd=ROOT))
assert len(actual) == len(expected)
for case, a, e in zip(cases, actual, expected):
    assert a == e, (case, a, e)
print(f'PASS: {len(cases)} native melee decisions; three live classes, 2/3/4 fighters, every opponent slot, all 16 choices, ready/busy/leaving targets, reach boundaries and toroidal coordinates. Decision block only; full lifecycle remains open.')
