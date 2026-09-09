"""Compare the entry clock blocks inside 0x403280; other building work is excluded.
Usage: python scripts/check-native-building-entry.py /path/to/d3dpoptb.exe
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESI, UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu
root = Path(__file__).resolve().parents[1]
cpu, identity = native_cpu(Path(sys.argv[1]))
p = 0x2000000
cpu.mem_map(p, 0x10000)
rng = random.Random(0x4032e0)
fields = {'flags3': (0x14, 'I'), 'entryDelay': (0xab, 'B'), 'entryTimer': (0xae, 'B'), 'entering': (0xad, 'B')}
cases = []
for i in range(1024):
    before = {key: rng.choice([0, 1, 2, 8, 16, 127, 128, 255]) for key in fields}
    before['flags3'] = rng.getrandbits(32)
    counter = i & 255
    for key, (offset, kind) in fields.items():
        cpu.mem_write(p + offset, struct.pack('<' + kind, before[key]))
    cpu.mem_write(p + 0x2e, bytes([counter]))
    cpu.reg_write(UC_X86_REG_ESI, p)
    cpu.reg_write(UC_X86_REG_ESP, p + 0xf000)
    for start, stop in [(0x4032e0, 0x4032f2), (0x40335f, 0x4033a3)]:
        cpu.emu_start(start, stop, count=100)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop
    expected = {key: struct.unpack('<' + kind, cpu.mem_read(p + offset, struct.calcsize(kind)))[0]
                for key, (offset, kind) in fields.items()}
    cases.append(dict(before=before, counter=counter, expected=expected))
js = """import {stepBuildingEntryClocks} from './app/training.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{stepBuildingEntryClocks(c.before,c.counter);return c.before})));"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(cases).encode(), cwd=root))
assert actual == [c['expected'] for c in cases]
(root/'tests/fixtures/building-entry-clocks.json').write_text(json.dumps(
    dict(executableSha256=identity['sha256'], cases=cases), separators=(',', ':')) + '\n')
print('PASS: 1024 native entry-delay, congestion and entering-counter blocks, all byte phases and wrap values')
