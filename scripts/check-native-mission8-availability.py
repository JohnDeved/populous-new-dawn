"""Probe original Mission 8 Dakini Hut availability, without substituting the leaf.

Usage: python scripts/check-native-mission8-availability.py /path/to/d3dpoptb.exe
Requires adjacent levels/levl2008.hdr and levels/cpscr016.dat. The verified header
is supplied at the file-reader return boundary. Native post-load setup, knowledge
initialization, complete turn-zero script and availability leaf execute unmodified.
This is not a full original game, entity-loading or renderer execution.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from decomp import native_cpu
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit(__doc__)
exe = Path(sys.argv[1]).resolve()
header_path = exe.parent / 'levels/levl2008.hdr'
script_path = exe.parent / 'levels/cpscr016.dat'
expected = {
    header_path: '0d63ff5313d1e97b4a4d498ca68ef627a3318a749b0b0b947543c50a4d0a25c3',
    script_path: '441938566197d62880c924e1b1108dfbef5b95e1ee096c21ef88e9240ee63b98',
}
for path, digest in expected.items():
    assert hashlib.sha256(path.read_bytes()).hexdigest() == digest, path
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x20000)
ai, program, stack, stop = 0x2000000, 0x2008000, 0x201D000, 0x201E000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt='I'):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=500000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)


header = header_path.read_bytes()
assert len(header) == 616 and header[88] == 2
# 004854c0 reads the header at 0089b741. Execute its real post-read tail,
# including per-enemy header copies and 00492be0 script-record initialization.
# Enter/leave at explicit interior boundaries, not a claimed whole-file load.
cpu.mem_write(0x89B741, header)
cpu.reg_write(UC_X86_REG_ESP, stack)
cpu.emu_start(0x4855DC, 0x48564D, count=10000)
assert cpu.reg_read(UC_X86_REG_EIP) == 0x48564D
assert bytes(cpu.mem_read(0x89B9F9, 20)) == header[:20]
# 00485e60 copies the prepared enemy header to the live per-tribe knowledge.
# Its human profile index is supplied as 7; it does not select enemy data.
call(0x485E60, 7)
knowledge = 0x96070E + 56  # tribe 1, primary/secondary/tertiary building masks
loaded_masks = [read(knowledge + offset) for offset in (0, 4, 8)]
assert loaded_masks == list(struct.unpack_from('<III', header, 4))
before_script = call(0x408DD0, 1, 1)
assert before_script == 1

# Execute the entire original script at turn zero, including real command
# handlers. No hooks, replacements, patched instructions or fabricated outcomes.
cpu.mem_write(ai, bytes(0xC65))
write(ai + 0xC22, 'B', 1)
cpu.mem_write(program, script_path.read_bytes())
write(0x89D188, 'I', 0)
call(0x48C6B0, ai, program)
after_script = call(0x408DD0, 1, 1)
assert after_script == 1
assert read(ai + 0x59A) & 1  # construction enabled
assert read(ai + 0x596) & 0x400  # ordinary Tower prefix disabled
assert [read(knowledge + offset) for offset in (0, 4, 8)] == loaded_masks

# Controlled leaf truth table, separate from the authored startup above.
# All 32 x86 shift positions, four tribe strides and eight mask combinations.
count = 0
for tribe in range(4):
    address = 0x96070E + tribe * 56
    for model in range(32):
        bit = 1 << model
        for flags in range(8):
            masks = [bit if flags & (1 << i) else 0 for i in range(3)]
            write(address, 'III', *masks)
            expected_value = 3 if flags & 4 else 1 if flags & 1 else 2 if flags & 2 else 0
            actual = call(0x408DD0, model, tribe)
            assert actual == expected_value, (tribe, model, flags, actual, expected_value)
            count += 1

print(json.dumps({
    'status': 'passed',
    'executable': identity,
    'inputs': {path.name: digest for path, digest in expected.items()},
    'probeSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'nativeEntries': ['004855dc..0048564d', '00485e60', '0048c6b0', '00408dd0'],
    'interceptedLeaves': [],
    'suppliedBoundary': 'Verified M8 header at file-reader return; mapped scratch AI/script/stack.',
    'authoredDakiniBuildingMasks': [hex(mask) for mask in loaded_masks],
    'hutBeforeScript': before_script,
    'hutAfterCompleteTurnZeroScript': after_script,
    'controlledLeafCases': count,
    'limits': [
        'No OS file-reader, entity loader, whole original game, browser or renderer execution.',
        'No whole housing producer, native queue/RNG trajectory or natural victory claim.',
        'Controlled truth-table masks are not additional authored gameplay cases.',
    ],
}, indent=2))
