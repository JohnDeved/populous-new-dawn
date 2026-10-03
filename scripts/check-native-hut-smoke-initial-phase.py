"""Compare the authored early-level class-7 seed contribution with createWorld.

Runs only clear-level's original twelve-byte counter reset, the original level
record allocation branch, and the original primary allocator. Non-class-7
allocation, all model initialization and post-processing are supplied boundaries.
This is not a complete level load or proof of other producers' initial seed cost.
"""
import hashlib
import json
import struct
import subprocess
import sys
from pathlib import Path

from decomp import ROOT, native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EBX, UC_X86_REG_EDI, UC_X86_REG_EIP, UC_X86_REG_ESI, UC_X86_REG_ESP

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x100000)
RECORD, POOL, STACK, STOP = 0x2000000, 0x2040000, 0x20ed000, 0x20ef000
SEEDS, PHASE = 0x96eac1, 0x96eac8
allocations = []


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def return_leaf():
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


def intercept(_, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x4ed8a0:
        cls, model, owner = (read(sp + offset, 'B') for offset in (4, 8, 12))
        if cls == 7:
            allocations.append({'model': model, 'owner': owner, 'counter': read(PHASE, 'B')})
            return  # Execute the real allocation/list/counter instructions.
        cpu.reg_write(UC_X86_REG_EAX, 0)
    return_leaf()


for address in (0x4ed8a0, 0x4ed580, 0x485b00):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)


def reset():
    allocations.clear()
    cpu.mem_write(SEEDS, bytes([173]) * 12)
    cpu.reg_write(UC_X86_REG_EBX, 0)
    cpu.emu_start(0x42bfe7, 0x42bffe, count=20)
    assert bytes(cpu.mem_read(SEEDS, 12)) == bytes(12)
    cpu.mem_write(POOL, bytes(256 * 32))
    for i in range(32):
        slot = POOL + i * 256
        write(slot + 0x24, 'H', 640 + i)
        write(slot + 4, 'I', slot + 256 if i < 31 else 0)
    for address in (0x89031c, 0x890320, 0x890324, 0x89c651, 0x89c659):
        write(address, 'I', 0)
    write(0x89031c, 'I', POOL)
    write(0x89243a, 'B', 0)
    write(0x89ce37, 'B', 0)
    write(0x96eabf, 'B', 4)
    write(0x89c661, 'I', 0)
    write(0x892443, 'I', POOL + 0x10000)
    cpu.mem_write(STACK, bytes(256))
    for tribe in range(4):
        write(STACK + 0x40 + tribe * 4, 'I', tribe)


def record(raw, index):
    assert len(raw) == 55
    cpu.mem_write(RECORD, raw)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.reg_write(UC_X86_REG_ESI, RECORD + 1)
    cpu.reg_write(UC_X86_REG_EDI, index + 1)
    cpu.reg_write(UC_X86_REG_EBX, 0)
    cpu.emu_start(0x484edc, 0x485038, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x485038


runtime = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', """
import {createWorld} from './app/model.ts';
import {missionData} from './app/mission-data.ts';
console.log(JSON.stringify([1,2,3].map(level=>({
  level, phase:createWorld(level).effectCounter,
  sourceSha256:missionData(level).level.sourceSha256,
}))));
"""], cwd=ROOT))
rows = []
for live in runtime:
    level = live['level']
    data = (exe.parent / f'levels/levl2{level:03}.dat').read_bytes()
    assert hashlib.sha256(data).hexdigest() == live['sourceSha256']
    reset()
    for index in range(2000):
        record(data[0x14043 + index * 55:0x14043 + (index + 1) * 55], index)
    rows.append({'level': level, 'authoredPhase': read(PHASE, 'B'),
                 'runtimePhase': live['phase'], 'allocations': allocations.copy(),
                 'sourceSha256': live['sourceSha256']})

# The original branch excludes model83, remaps model81's owner to0, and tests
# signed owner against the level's tribe count. These cases must not be inferred
# from simply counting every class-7 JSON record.
reset()
for index, (model, owner, allocated) in enumerate(((83, 0, False), (24, 4, False),
                                                (24, 255, True), (81, 3, True))):
    before = len(allocations)
    record(bytes([model, 7, owner]) + bytes(52), index)
    assert (len(allocations) == before + 1) == allocated
assert [item['owner'] for item in allocations] == [255, 0]

print(json.dumps({'executableSha256': identity['sha256'], 'resetBytes': 12,
                  'authoredRecords': 6000, 'filterCases': 4, 'levels': rows,
                  'limits': 'Other-class initialization, class7 initialization, and post-processing are supplied; no full load, later stream, root allocation, secondary capacity or browser claim.'}, indent=2), flush=True)
assert all(row['authoredPhase'] == row['runtimePhase'] for row in rows), 'runtime omits the native authored class7 contribution'
print('PASS: early-level authored class7 allocation contribution matches runtime initialization')
