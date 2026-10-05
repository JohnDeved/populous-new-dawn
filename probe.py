"""Bounded authored Mission 3 Erosion producer and scheduler composition.

No original OS launch. Raw DAT terrain, seed, free pool and worship completion
are supplied. Original allocation, initialization, decode, linking, template
suspension, cloning, dispatch, list traversal and erosion arithmetic execute.
Presentation, sound, terrain notifications and unrelated scheduler leaves are
intercepted. This is not an ordinary native gameplay trace.
"""
import argparse, hashlib, json, struct, sys, traceback
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'scripts'))
from decomp import native_cpu, configure_native_constants
from capstone import Cs, CS_ARCH_X86, CS_MODE_32
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('exe', type=Path)
p.add_argument('--output', required=True, type=Path)
args = p.parse_args()
cpu, identity = native_cpu(args.exe)
configure_native_constants(cpu, args.exe)
cpu.mem_map(0x2000000, 0x100000)
POOL, RECORD, POSITION, SCRATCH, STACK, STOP = 0x2000000, 0x2010000, 0x2011000, 0x2020000, 0x20ed000, 0x20ef000
HEAD, SOURCE, CLONE = POOL, POOL + 0xb3, POOL + 0xb3 * 2
level_path = args.exe.parent / 'levels/levl2003.dat'
level = level_path.read_bytes()
report = {'identity': identity, 'levelSha256': hashlib.sha256(level).hexdigest(),
          'scope': __doc__, 'snapshots': [], 'events': [], 'intercepted': [],
          'supplied': {'seed': 0x12345678, 'terrain': 'all raw authored DAT heights; all terrain flags zero',
                       'records': [101, 103], 'freePool': '8 records, indices 640..647',
                       'completion': 'head +0x6d bit2 after clearing its native initial-reset visit'}}
phase = 'setup'

def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f='I'): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)
def invoke(a, *values, stop=STOP):
    write(STACK, 'I' * (len(values) + 1), STOP, *values)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(a, stop, count=3_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
def heights(): return [read(0x8a03e8 + i * 16, 'h') for i in range(16384)]
def snapshot(label, pointer):
    h = heights()
    row = {'label': label, 'phase': phase, 'pointer': hex(pointer),
           **{k: read(pointer + o, f) for k, o, f in [
               ('index', 0x24, 'H'), ('class', 0x2a, 'B'), ('model', 0x2b, 'B'),
               ('state', 0x2c, 'B'), ('classCounter', 0x2e, 'B'), ('remaining', 0x6c, 'h'),
               ('flags2', 0xc, 'I'), ('flags4', 0x10, 'I'), ('flags3', 0x14, 'I'),
               ('spriteStamp', 0x18, 'I')]},
           'position': list(struct.unpack('<HHh', cpu.mem_read(pointer + 0x3d, 6))),
           'randomState': read(0x89d178), 'heightSha256': hashlib.sha256(struct.pack('<16384h', *h)).hexdigest(),
           'changedHeights': [[i, v] for i, v in enumerate(h) if v != initial_heights[i]],
           'objectHex': bytes(cpu.mem_read(pointer, 0xb3)).hex()}
    report['snapshots'].append(row)
    return row

def leaf(c, a, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    e = {'phase': phase, 'address': f'{a:08x}', 'args': list(struct.unpack('<4I', c.mem_read(sp + 4, 16)))}
    report['events'].append(e)
    ret()

# No sound-bit write is fabricated; the sound request is a recorded boundary.
leaf_addresses = [0x4fbd20, 0x44fad0, 0x48a050, 0x44ddf0, 0x44f2f0, 0x4ee190]
for a in leaf_addresses: cpu.hook_add(UC_HOOK_CODE, leaf, begin=a, end=a)
report['intercepted'] = [f'{a:08x}' for a in leaf_addresses]
def observe(c, a, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if a == 0x4ede10:
        snapshot('new-allocation-before-clone', read(sp + 4))
        snapshot('template-before-clone', read(sp + 8))
    elif a == 0x4fbb6c: snapshot('after-clone', CLONE)
    elif a == 0x4fbb87: snapshot('after-immediate-processing', CLONE)
    elif a == 0x4ed700:
        ptr = read(sp + 4)
        report['events'].append({'phase': phase, 'address': f'{a:08x}', 'pointer': hex(ptr),
                                 'callerReturn': hex(read(sp)), 'index': read(ptr + 0x24, 'H'),
                                 'remaining': read(ptr + 0x6c, 'h')})
        if ptr == CLONE: snapshot('before-dispatch', ptr)
for a in [0x4ede10, 0x4fbb6c, 0x4fbb87, 0x4ed700]: cpu.hook_add(UC_HOOK_CODE, observe, begin=a, end=a)

try:
    initial_heights = list(struct.unpack('<16384h', level[:32768]))
    cpu.mem_write(0x8a03e4, b''.join(struct.pack('<Ih10x', 0, h) for h in initial_heights))
    write(0x59df0c, 'I', SCRATCH)
    write(0x89d178, 'I', report['supplied']['seed'])
    write(0x89d17c, 'I', 0)
    write(0x890378, 'I', POOL)
    write(0x890384, 'I', POOL + 8 * 0xb3)
    for i in range(8):
        ptr = POOL + i * 0xb3
        write(ptr, 'II', ptr - 0xb3 if i else 0, ptr + 0xb3 if i < 7 else 0)
        write(ptr + 0x24, 'H', 640 + i)
        write(0x890390 + (640 + i) * 4, 'I', ptr)
    write(0x89031c, 'I', POOL)
    for index, expected in [(101, HEAD), (103, SOURCE)]:
        raw = level[0x14043 + index * 55:0x14043 + (index + 1) * 55]
        cpu.mem_write(RECORD, raw)
        cpu.mem_write(POSITION, raw[3:7] + b'\0\0')
        actual = invoke(0x4ed8a0, raw[1], raw[0], raw[2], POSITION)
        assert actual == expected, (hex(actual), hex(expected))
        snapshot(f'row{index}-allocated', actual)
        invoke(0x485b00, actual, RECORD)
        write(actual + 8, 'I', index + 1)
        snapshot(f'row{index}-decoded', actual)
    phase = 'post-load'
    invoke(0x4851e0)
    assert read(HEAD + 0x72, 'H') == 641
    write(HEAD + 8, 'I', 0); write(SOURCE + 8, 'I', 0)
    invoke(0x4866a0)
    invoke(0x4edf50)
    snapshot('template-after-load-init', SOURCE)
    invoke(0x485074, stop=0x4850d2)
    snapshot('template-after-loader-mark', SOURCE)
    # Consume the constructor's initial head presentation/reset branch normally.
    invoke(0x4ed700, HEAD)
    assert read(HEAD + 0x6e, 'B') == 0
    assert read(SOURCE + 0x2c, 'B') == 0 and read(SOURCE + 0x6c, 'h') == 64
    # Real scheduler entry with unrelated processors supplied, preserving actual
    # allocation prepend and the cached successor used by the same loop.
    outer_calls = {int(i.op_str, 16) for i in Cs(CS_ARCH_X86, CS_MODE_32).disasm(
        bytes(cpu.mem_read(0x4ec6f0, 0x390)), 0x4ec6f0) if i.mnemonic == 'call'}
    report['schedulerSuppliedCalls'] = [f'{a:08x}' for a in sorted(outer_calls - {0x4ed700})]
    for a in outer_calls - {0x4ed700}: cpu.hook_add(UC_HOOK_CODE, leaf, begin=a, end=a)
    write(HEAD + 0x6d, 'B', read(HEAD + 0x6d, 'B') | 2)
    phase = 'activation-scheduler-visit'
    snapshot('template-before-activation', SOURCE)
    invoke(0x4ec6f0)
    snapshot('after-activation-scheduler', CLONE)
    phase = 'next-scheduler-visit'
    invoke(0x4ec6f0)
    snapshot('after-next-scheduler', CLONE)
    assert [(r['label'], r['remaining'], r['state']) for r in report['snapshots']
            if r['label'] in ['after-clone', 'after-immediate-processing', 'after-activation-scheduler', 'after-next-scheduler']] == [
                ('after-clone', 64, 24), ('after-immediate-processing', 63, 24),
                ('after-activation-scheduler', 63, 24), ('after-next-scheduler', 62, 24)]
    report['result'] = 'passed'
except BaseException as error:
    report['result'] = 'failed'
    report['error'] = repr(error)
    report['eip'] = hex(cpu.reg_read(UC_X86_REG_EIP))
    report['traceback'] = traceback.format_exc()
    raise
finally:
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'result': report.get('result'), 'output': str(args.output),
                      'snapshots': len(report['snapshots']), 'events': len(report['events'])}))
