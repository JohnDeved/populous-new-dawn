"""Compare 0x438730 for command 3, including native coastal correction.
Usage: python scripts/check-native-movement-order.py /path/to/d3dpoptb.exe
Only the building outside-point lookup is supplied (geometry has its own oracle).
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu, configure_native_constants
root = Path(__file__).resolve().parents[1]
cpu, identity = native_cpu(Path(sys.argv[1])); configure_native_constants(cpu, Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
point, stack, stop, order = 0x2000000, 0x200e000, 0x200f000, 0x93883a
rng = random.Random(0x438730)
def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))
def outside(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP); target, result = read(sp + 4, 'II')
    assert target == 0x2001000
    write(result, 'HH', case['outside']['x'], case['outside']['y'])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4); cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I')[0])
cpu.hook_add(UC_HOOK_CODE, outside, begin=0x4044b0, end=0x4044b0)
write(0x890390 + 100 * 4, 'I', 0x2001000)
cases = []
for i in range(1024):
    x, y = rng.randrange(65536), rng.randrange(65536)
    before = dict(model=3 if i % 7 == 0 else 0, flags=rng.randrange(256), references=1, object=0, a=x, b=y)
    case = dict(before=before, point=dict(x=x, y=y), flags=rng.randrange(256), category=i % 16,
                building=bool(i & 16), outside=dict(x=rng.randrange(65536), y=rng.randrange(65536)))
    cell = (y >> 9) * 128 + (x >> 9)
    write(order, 'BBHHHH', *[before[k] for k in ['model','flags','references','object','a','b']])
    write(point, 'HH', x, y)
    write(0x8a03e4 + cell * 16, 'I', 512 if case['building'] else 0)
    write(0x8a03e4 + cell * 16 + 8, 'H', 100)
    write(0x8a03e4 + cell * 16 + 12, 'B', case['category'])
    write(stack, 'IIIII', stop, 1, 3, point, case['flags'])
    cpu.reg_write(UC_X86_REG_ESP, stack); cpu.emu_start(0x438730, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    case['expected'] = dict(zip(['model','flags','references','object','a','b'], read(order, 'BBHHHH')))
    cases.append(case)
js = """import {prepareMovementOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const land={categories:new Uint8Array(16384),flags:new Uint32Array(16384),buildingIds:new Uint16Array(16384)},i=(c.point.y>>9)*128+(c.point.x>>9);
land.categories[i]=c.category;land.flags[i]=c.building?512:0;land.buildingIds[i]=100;
prepareMovementOrder(c.before,c.point,c.flags,land,id=>{if(id!==100)throw Error('wrong building');return c.outside});return c.before})));"""
actual = json.loads(subprocess.check_output(['node','--input-type=module','-e',js], input=json.dumps(cases).encode(), cwd=root))
for i, (case, result) in enumerate(zip(cases, actual)): assert case['expected'] == result, (i, case, result)
(root/'tests/fixtures/movement-order.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases),separators=(',',':'))+'\n')
print('PASS: 1024 native movement-order preparation cases, all coast categories, original-cell building precedence and unchanged records')
