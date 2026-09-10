"""Execute original overhead gauge/control rules; capture its six GPU quads.
Usage: python check-native-unit-health.py EXE [--record]
Only GPU submission and the Windows CRT ceil entry are supplied.
"""
import json, math, random, struct, subprocess, sys
from pathlib import Path
from PIL import Image
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_ECX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
unit, table, entries, stack, stop, ceil = 0x2010000, 0x2020000, 0x2030000, 0x20fd000, 0x20fe000, 0x20fc000
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
colors = json.loads((ROOT / 'app/original-hud.json').read_text())['colors']
for i, color in enumerate(colors):
    cpu.mem_write(0xd05528 + i * 4, bytes.fromhex(color[1:]) + b'\0')
palette = (Path(sys.argv[1]).parent / 'data/pal0-c.dat').read_bytes()
cpu.mem_write(0x2040000, palette)
write(0x5da074, 'II', 0, 0)
cpu.mem_write(ceil, b'\xdd\x44\x24\x04\xc3') # fld qword ptr [esp+4]; ret
quads = []
def consume(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x55cb50:
        write(sp + 4, 'd', math.ceil(read(sp + 4, 'd')))
        c.reg_write(UC_X86_REG_EIP, ceil)
        return
    vertices = [read(sp + 4 + i * 4, 'I') for i in range(4)]
    points = [struct.unpack('<2f', c.mem_read(v, 8)) for v in vertices]
    quads.append(dict(rect=[int(min(p[0] for p in points)), int(min(p[1] for p in points)),
                            int(max(p[0] for p in points)), int(max(p[1] for p in points))],
                      color=read(vertices[0] + 16, 'I'), flags=read(sp + 24, 'I')))
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I')); c.reg_write(UC_X86_REG_ESP, sp + 28)
for address in (0x47d980, 0x55cb50):
    cpu.hook_add(UC_HOOK_CODE, consume, begin=address, end=address)
def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX)
call(0x42adc0, 0x2040000, 0x89c6f4)
assert read(0x89c6f4, 'B') == 130
# The two original default key records: scan 0x28 (Quote), press without
# modifiers, release with any modifiers; both require a running level.
for index, address in enumerate((0x5d6238, 0x5d6244)):
    scan, command, event, modifiers, gates, predicate = struct.unpack('<BIBBBI', cpu.mem_read(address, 12))
    assert (scan, command, event, modifiers, gates, predicate) == (
        (40, 100, 9, 0, 2, 0) if index == 0 else (40, 101, 12, 64, 2, 0))
    write(entries + index * 15, 'IBBIBI', command, event, modifiers, predicate, gates, entries + 15 if index == 0 else 0)
write(table + 40 * 4, 'I', entries)
for active in (False, True):
    write(0x89c661, 'I', 0x8000 if active else 0)
    for event in (1, 4):
        for modifiers in range(8):
            cpu.reg_write(UC_X86_REG_ECX, table)
            command = call(0x489470, 40, modifiers, event)
            assert command == (100 if event == 1 and modifiers == 0 else 101 if event == 4 else 0) * active
            if command:
                write(0x87ca1c, 'I', 0x82 if command == 100 else 0x8a)
                call(0x4aab80, command, 0, 0)
                assert read(0x87ca1c, 'I') == (0x8a if command == 100 else 0x82)
# Reconstruct the immutable 25-frame atlas directly from final native submissions.
atlas = Image.new('RGBA', (6 * 25, 26))
for fill in range(25):
    quads.clear(); write(unit + 0x6c, 'hh', 24, fill)
    call(0x525450, unit, 3, 26)
    assert len(quads) == 6
    for q in quads:
        left, top, right, bottom = q['rect']; color = q['color']
        rgba = ((color >> 16) & 255, (color >> 8) & 255, color & 255, color >> 24)
        for y in range(top, bottom):
            for x in range(left, right): atlas.putpixel((fill * 6 + x, y), rgba)
path = ROOT / 'public/original/unit-health.png'
if '--record' in sys.argv: atlas.save(path)
else:
    captured = Image.open(path).convert('RGBA')
    assert captured.size == atlas.size and captured.tobytes() == atlas.tobytes()
# Execute the actual object-render branch and all drawing code for eligible people.
rng = random.Random(0x468e1c)
cases, expected = [], []
for i in range(2048):
    maximum = rng.choice([0, 1, 100, 2000, 3000, 32767])
    p = dict(enabled=i % 7 != 0, owner=i % 5, player=i % 4, type=1 if i % 7 else 2,
             flags3=0x1000 if i % 9 == 0 else 0, flags4=0x800 if i % 11 == 0 else 0,
             health=rng.randint(0, maximum + (maximum != 32767)), maximum=maximum,
             frameHeight=rng.randrange(257))
    if i % 3: p['owner'] = p['player']
    x, y = rng.randint(-1000, 1000), rng.randint(-1000, 1000)
    write(unit + 0x10, 'II', p['flags4'], p['flags3'])
    write(unit + 0x2a, 'B', p['type']); write(unit + 0x2f, 'B', p['owner'])
    write(unit + 0x6c, 'hh', maximum, p['health'])
    write(0x89c6f0, 'B', p['player']); write(0x87ca1c, 'I', 8 if p['enabled'] else 0)
    write(stack + 0x18, 'iiii', x, y, unit, p['frameHeight']); write(stack + 0x7c, 'I', unit + 0x2f)
    cpu.reg_write(UC_X86_REG_ESP, stack); quads.clear()
    cpu.emu_start(0x468e1c, 0x468e8a, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x468e8a
    result = None
    if quads:
        assert len(quads) == 6
        rect = quads[1]['rect']
        result = dict(x=rect[0] - x, y=rect[1] - y, width=6, height=26,
                      fill=quads[-1]['rect'][3] - quads[-1]['rect'][1])
    cases.append(p); expected.append(result)
js = """import { unitHealthGauge } from './app/unit-health.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(unitHealthGauge)));"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], input=json.dumps(cases).encode(), cwd=ROOT))
assert actual == expected, next((i,a,e) for i,(a,e) in enumerate(zip(actual,expected)) if a != e)
if '--record' in sys.argv:
    selected = list(range(96))
    (ROOT / 'tests/fixtures/unit-health.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],
        cases=[cases[i] for i in selected], expected=[expected[i] for i in selected]), separators=(',', ':')) + '\n')
print('PASS: 2048 native visibility/anchor/fill comparisons; 32 real key lookups and health commands; 150 native GPU quads reproduce all atlas pixels')
