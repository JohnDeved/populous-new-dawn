"""Finite original-byte config, active-window and Flip-call boundary probe.

No clock, actual registry, Windows process, GPU or complete startup is executed.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE, __version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

repo, executable, output = map(Path, sys.argv[1:])
sys.path.insert(0, str(repo / 'scripts'))
from decomp import native_cpu

data = executable.read_bytes()
pe = struct.unpack_from('<I', data, 60)[0]
count = struct.unpack_from('<H', data, pe + 6)[0]
opt = struct.unpack_from('<H', data, pe + 20)[0]
sections = []
for i in range(count):
    off = pe + 24 + opt + i * 40
    name, size, va, raw_size, raw = struct.unpack_from('<8sIIII', data, off)
    flags = struct.unpack_from('<I', data, off + 36)[0]
    sections.append((name, size, 0x400000 + va, raw_size, raw, flags))

def file_read(address, length):
    for _, _, base, raw_size, raw, _ in sections:
        if base <= address and address + length <= base + raw_size:
            return data[raw + address - base:raw + address - base + length]
    raise ValueError(hex(address))

def string(address):
    return file_read(address, 128).split(b'\0')[0].decode('ascii')

rows = []
for i in range(512):
    addr = 0x5a9a60 + i * 20
    target, mask, default, current, size, kind, flags = struct.unpack('<IIIIHBB', file_read(addr, 20))
    if kind == 255:
        break
    rows.append(dict(index=i, address=hex(addr), target=hex(target), mask=mask,
                     default=default, current=current, size=size, kind=kind, flags=flags))
assert len(rows) == 59
sim = [r for r in rows if r['target'] == '0x89d161']
assert len(sim) == 1 and sim[0]['default'] == 12
assert not any(int(r['target'], 16) <= 0x89ce62 < int(r['target'], 16) + r['size'] for r in rows)

results = []
STOP, STACK, SURFACE, VTABLE, FLIP = 0x20fe000, 0x20fd000, 0x2000000, 0x2000100, 0x20fe100

def fixture():
    cpu, identity = native_cpu(executable)
    cpu.mem_map(0, 4096)
    cpu.mem_map(0x2000000, 0x100000)
    guards = [(base, bytes(cpu.mem_read(base, max(size, raw_size))))
              for _, size, base, raw_size, _, flags in sections
              if flags & 0x40000000 and not flags & 0x80000000]
    return cpu, guards

def write(cpu, address, value, size=4):
    cpu.mem_write(address, int(value).to_bytes(size, 'little'))

def read(cpu, address, size=4):
    return int.from_bytes(cpu.mem_read(address, size), 'little')

def ret(cpu, value=0, popped=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(cpu, sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4 + popped)

def execute(cpu, guards, entry, hooks=None, end=STOP):
    write(cpu, STACK, STOP)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    hooks = hooks or {}
    def hook(uc, address, size, _):
        if address == end:
            uc.emu_stop()
        elif address in hooks:
            hooks[address](uc)
    cpu.hook_add(UC_HOOK_CODE, hook)
    cpu.emu_start(entry, end, timeout=1_000_000, count=100_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == end
    for address, expected in guards:
        assert bytes(cpu.mem_read(address, len(expected))) == expected, hex(address)

for label, opened, found, value, expected in [
        ('missing-key', False, False, 0, 40), ('missing-value', True, False, 0, 40),
        *[(f'value-{v}', True, True, v, max(12, min(60, v))) for v in [0, 11, 12, 24, 40, 60, 61, 0xffffffff]]]:
    cpu, guards = fixture()
    calls = []
    def registry_read(uc):
        sp = uc.reg_read(UC_X86_REG_ESP)
        assert read(uc, sp + 4) == 0x5cda88
        calls.append('DrawFrameRateLimit')
        write(uc, read(uc, sp + 8), value)
        ret(uc, 0 if found else 1, 8)
    execute(cpu, guards, 0x4a42a0, {
        0x52a480: lambda uc: ret(uc),
        0x529e80: lambda uc: ret(uc, 0 if opened else 1, 8),
        0x52a390: registry_read,
    }, 0x4a431b)
    actual = read(cpu, 0x89ce62, 1)
    assert actual == expected
    results.append(dict(case=label, draw_limit=actual, intercepted_registry_reads=calls))

cpu, guards = fixture()
write(cpu, 0x89d161, 99, 1)
write(cpu, 0x89ce62, 40, 1)
execute(cpu, guards, 0x49a940)
assert read(cpu, 0x89d161, 1) == 12 and read(cpu, 0x89ce62, 1) == 40
results.append(dict(case='real-clear-config', simulation_rate=12, draw_limit=40, intercepted_leaves=[]))

for label, pointer, active, expected in [('null-ui', 0, 1, 0), ('active-ui', SURFACE, 1, 1), ('inactive-ui', SURFACE, 0, 0)]:
    cpu, guards = fixture()
    write(cpu, 0xafc2f4, pointer)
    write(cpu, 0x5cdc40, active)
    execute(cpu, guards, 0x4b2670)
    assert cpu.reg_read(UC_X86_REG_EAX) == expected
    results.append(dict(case=label, readiness=expected, intercepted_leaves=[]))

for label, fullscreen, returns in [('windowed', 0, []), ('flip-success', 1, [0]),
        ('flip-busy-retry', 1, [0x887601ae, 0]), ('flip-still-drawing-retry', 1, [0x8876021c, 0]),
        ('flip-other-error', 1, [0x887601c2])]:
    cpu, guards = fixture()
    write(cpu, 0x5cdc44, fullscreen)
    write(cpu, 0x98ea28, SURFACE)
    write(cpu, 0x98f13c, SURFACE + 0x200)
    write(cpu, SURFACE, VTABLE)
    write(cpu, VTABLE + 0x2c, FLIP)
    calls = []
    pending = list(returns)
    def flip(uc):
        sp = uc.reg_read(UC_X86_REG_ESP)
        args = [read(uc, sp + off) for off in (4, 8, 12)]
        assert args == [SURFACE, SURFACE + 0x200, 1]
        result = pending.pop(0)
        calls.append(dict(leaf='surface-vtable+0x2c', args=args, supplied_hresult=hex(result)))
        ret(uc, result, 12)
    def invalidate(uc):
        sp = uc.reg_read(UC_X86_REG_ESP)
        calls.append(dict(leaf='InvalidateRect', args=[read(uc, sp + off) for off in (4, 8, 12)]))
        ret(uc, 1, 12)
    execute(cpu, guards, 0x4b0ae0, {FLIP: flip, read(cpu, 0xd0c8a0): invalidate})
    assert not pending
    results.append(dict(case=label, calls=calls))

report = dict(executable_sha256=hashlib.sha256(data).hexdigest(), unicorn=unicorn_version,
    source_head='596475b6839c948604897f8b68ff89c6290cf39d',
    registry_path='HKLM\\' + string(0x5e0948) + '\\' + string(struct.unpack('<I', file_read(0x5cd954, 4))[0]),
    config_descriptors=rows, cases=results, case_count=len(results),
    limits='No clock or historical cadence measured. Registry/device results and UI pointers supplied. Full startup, COM/GPU, complete draw, OS scheduling and actual user settings are not executed. All mapped read-only PE regions are guarded unchanged after each case.')
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(dict(status='passed', cases=len(results), output=str(output))))
