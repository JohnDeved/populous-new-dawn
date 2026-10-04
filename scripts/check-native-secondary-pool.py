"""Execute native secondary-pool bounds, allocation pressure and immediate reuse.

Only model initialization and sunlight bookkeeping are supplied. Index setup,
list reconstruction, allocator, precheck and class-7 removal are original bytes.
No main loop or full-game scheduling is executed.
"""
import json
import struct
import sys
from pathlib import Path

from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
POINT, STACK, STOP = 0x2000000, 0x200d000, 0x200e000
PHASE, COUNT, HEAD, FREE = 0x96eac8, 0x89c655, 0x890330, 0x89032c


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def leaf(_, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x4ed580, 0x4ee190):
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)


def call(address, *args):
    write(STACK, 'I' * (len(args) + 1), STOP, *args)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)


def reset():
    # Native bounds below are executed, not used to manufacture a 160-node pool.
    cpu.mem_write(0x8e0428, bytes(0x57670))
    call(0x4ed820)
    call(0x4ed880)
    call(0x4ee300)
    cpu.mem_write(0x96eac1, bytes([37]) * 12)
    write(0x89243a, 'B', 0)
    write(0x89ce37, 'B', 0)
    write(POINT, 'HHh', 8192, 12288, 400)


def list_nodes(head):
    out, previous = [], 0
    while head:
        assert head not in out
        assert read(head, 'I') == previous
        out.append(head)
        previous, head = head, read(head + 4, 'I')
    return out


reset()
start, end = read(0x890380, 'I'), read(0x89038c, 'I')
assert (start, end) == (0x930ab8, 0x937a98)
assert len(list_nodes(read(FREE, 'I'))) == 160
assert [read(p + 0x24, 'H') for p in list_nodes(read(FREE, 'I'))] == list(range(1999, 1839, -1))
models = [(7, 61), (10, 3), (7, 74), (7, 75), (10, 16), (7, 51), (7, 3), (7, 65)]
allocated = []
for index in range(160):
    cls, model = models[index % len(models)]
    pointer = call(0x4edbd0, cls, model, 0, POINT)
    assert pointer and start <= pointer < end
    allocated.append(pointer)
    assert read(COUNT, 'I') == index + 1
    assert read(PHASE, 'B') == 37
    assert read(pointer + 0x2e, 'B') == 37
    assert bool(call(0x4edae0, 7, 74) & 255) == (index + 1 <= 150)
    assert bool(call(0x4edae0, 7, 75) & 255) == (index + 1 <= 140)
assert list_nodes(read(HEAD, 'I')) == allocated[::-1]
assert read(FREE, 'I') == 0
assert call(0x4edbd0, 7, 61, 0, POINT) == 0
assert read(COUNT, 'I') == 160 and read(PHASE, 'B') == 37

# Remove head, middle and oldest marker/smoke slots through the real destructor.
# Every one becomes reusable immediately; there is no primary three-turn delay.
removed = [allocated[-1], allocated[82], allocated[155], allocated[81], allocated[0]]
for pointer in removed:
    cls, model = read(pointer + 0x2a, 'B'), read(pointer + 0x2b, 'B')
    assert (cls == 7 and model in (61, 65, 74, 75)) or (cls, model) == (10, 3)
    if model == 75:
        write(pointer + 0x2d, 'B', 1)
        write(pointer + 0x6c, 'h', 1)
        call(0x50c260, pointer)  # Real final child visit invokes removal.
    else:
        call(0x4ef180, pointer)
    assert read(pointer + 0x2a, 'B') == 0
    allocated.remove(pointer)
    assert read(COUNT, 'I') == len(allocated)
    assert list_nodes(read(HEAD, 'I')) == allocated[::-1]
for expected in removed[::-1]:
    assert call(0x4edbd0, 7, 75, 0, POINT) == expected
assert read(COUNT, 'I') == 160

# Rebuild, as the original list owner does, with deliberately non-allocation
# physical order. Reconstructed visitation follows descending physical index.
call(0x4ee300)
assert len(list_nodes(read(HEAD, 'I'))) == 160
assert list_nodes(read(HEAD, 'I')) == sorted(list_nodes(read(HEAD, 'I')), reverse=True)
assert read(PHASE, 'B') == 37
print(json.dumps({'status': 'passed', 'executableSha256': identity['sha256'],
                  'secondaryCapacity': 160, 'secondaryIndices': [1840, 1999],
                  'mixedAllocations': 160, 'capacityPrechecks': 320,
                  'emptyPoolFailures': 1, 'immediateReuseCases': len(removed),
                  'rebuiltOrder': 'descending physical unit index',
                  'limits': 'Class/model initialization and sunlight bookkeeping intercepted. No save/load serializer, outer scheduling, UI or browser claim.'}, indent=2))
