"""Compare the bounded model-12 Shaman death presentation with the original PE.

Usage: python scripts/check-native-shaman-death-vfx.py EXE [--evidence-only]
Reuses the model-12 boundaries from check-native-reincarnation.py. The original
producer, initializer, phase controller, object setter and animation step execute.
Allocation/registration, terrain predicates, audio, bookkeeping and spawning are
supplied leaves, not a native gameplay replay. No fixtures/assets are rewritten.
"""
import argparse
import hashlib
import json
import struct
import subprocess
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('exe', type=Path)
parser.add_argument('--data-dir', type=Path)
parser.add_argument('--evidence-only', action='store_true')
args = parser.parse_args()
exe = args.exe
cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x20000)
p, source, link, fake = 0x2001000, 0x2002000, 0x2003000, 0x2004000
counts, stack, stop = 0x2008000, 0x201d000, 0x201e000
allocations = []
unsupported = False
ground = 240


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1000000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))


def intercept(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    result = 0
    if address == 0x4ed8a0:
        kind, model, owner, point = struct.unpack('<4I', cpu.mem_read(sp + 4, 16))
        x, y, h = struct.unpack('<HHh', cpu.mem_read(point, 6))
        allocations.append(dict(kind=kind, model=model, owner=owner & 255, x=x, y=y, h=h))
        result = fake
    elif address == 0x44e940:
        result = ground
    elif address == 0x44f980:
        result = 0 if unsupported else 1
    elif address == 0x4eeff0:
        result = int(unsupported)
    cpu.reg_write(UC_X86_REG_EAX, result)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


# The actual object setter (004ee700) is deliberately NOT intercepted.
for address in (0x4ed8a0, 0x4ed6f0, 0x4ed640, 0x4ee470,
                0x44e940, 0x44f980, 0x4eeff0, 0x48a050,
                0x4d5fe0, 0x41b550, 0x4a3960, 0x499d90, 0x4d4b50,
                0x4da0f0, 0x4edcf0):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)

# Original loaded VSTART/VFRA chains, not browser frame-count assumptions.
starts_path, frames_path = ((args.data_dir or exe.parent / 'data') / name for name in ('vstart-0.ani', 'vfra-0.ani'))
starts = list(struct.iter_unpack('<HH', starts_path.read_bytes()))
frames = list(struct.iter_unpack('<HBBBBH', frames_path.read_bytes()))
frame_counts = []
for start, _ in starts:
    frame, seen = start, set()
    while frame and frame not in seen:
        assert frame < len(frames)
        seen.add(frame)
        frame = frames[frame][-1]
    assert frame in (0, start)
    frame_counts.append(len(seen) & 255)
write(0x59df44, 'I', counts)
for i, count in enumerate(frame_counts):
    write(counts + i * 6 + 1, 'B', count)
units = json.loads((ROOT / 'app/original-units.json').read_text())
for base in (352, 360, 680, 688, 696, 704):
    directions = units['shamanSources'][str(base)]
    for direction in directions:
        assert len(direction['frames']) == frame_counts[direction['source']]
assert [frame_counts[i] for i in (680, 352, 360)] == [8, 1, 10]

# 004d5cf0: ready ordinary Shaman death allocates class10/model12 at the death
# coordinate, unless reincarnation is disabled. Delay and no-reincarnation gates
# are negative cases. Audio/mana/counters following this allocation are out of scope.
producer_cases = 0
for owner in range(4):
    for delay, disabled in ((0, False), (1, False), (0, True)):
        cpu.mem_write(source, bytes(256))
        write(source + 0x2b, 'B', 7)
        write(source + 0x2d, 'B', delay)
        write(source + 0x2f, 'B', owner)
        write(source + 0xb0, 'B', 255)
        write(source + 0x3d, 'HHh', 4352 + owner, 55040, ground)
        write(0x89d1c8 + owner * 0xc65 + 0x93f, 'B', int(disabled))
        write(0x892443, 'I', link)
        allocations.clear()
        call(0x4d5cf0, source)
        expected = [] if delay or disabled else [dict(kind=10, model=12, owner=owner, x=4352 + owner, y=55040, h=ground)]
        assert allocations == expected, (owner, delay, disabled, allocations)
        write(0x89d1c8 + owner * 0xc65 + 0x93f, 'B', 0)
        producer_cases += 1

presentation_cases = []
boundaries = []
for owner in range(4):
    for unsupported in (False, True):
        cpu.mem_write(p, bytes(256))
        cpu.mem_write(source, bytes(256))
        cpu.mem_write(link, bytes(20))
        write(p + 0xc, 'I', 0x400)
        write(p + 0x2f, 'B', owner)
        write(p + 0x3d, 'HHh', 4352 + owner, 55040, ground)
        write(source + 0x26, 'H', 731)
        write(source + 0x2b, 'B', 7)
        write(source + 0x2f, 'B', owner)
        write(link, 'I', source)
        write(0x892443, 'I', link + 20)
        call(0x502910, p)
        assert read(p + 0x2d, 'B') == (3 if unsupported else 0)
        assert read(p + 0x26, 'H') == 731
        assert read(p + 0x74, 'B') == read(p + 0x75, 'B') == 7
        assert read(p + 0x68, 'I') == owner
        visited = [0] * 6
        allocations.clear()
        while read(p + 0x2d, 'B') < 5:
            phase = read(p + 0x2d, 'B')
            call(0x5029d0, p)
            visited[phase] += 1
            object_ = read(p + 0x33, 'H')
            flags = read(p + 0x35, 'H')
            frame = read(p + 0x39, 'B')
            assert object_ == (680 if phase == 0 else 352 if phase == 1 else 360)
            assert read(p + 0x3d, 'H') == 4352 + owner
            assert read(p + 0x3f, 'H') == 55040
            if phase == 3:
                assert flags & 0x6002 == 0x6002 and not flags & 16
                assert frame == frame_counts[360] - 1 == 9
                assert read(p + 0x41, 'h') == ground + visited[3] * 40
                # The separate original animation visitor must not advance the frozen rise.
                call(0x4ee7b0, p)
                assert read(p + 0x39, 'B') == 9
            if phase == 4:
                assert flags & 16
                assert read(p + 0x41, 'h') == ground + 1280
            presentation_cases.append(dict(team=['blue', 'red', 'yellow', 'green'][owner], phase=phase,
                visible=not bool(flags & 16), frame=frame if phase >= 3 else 0))
        assert visited == ([0, 0, 0, 32, 300, 0] if unsupported else [4, 128, 3, 32, 300, 0]), visited
        # Only supported/unsupported phase2 splash emission is considered here;
        # later site model8 and spawn consumers are not death-site effects.
        assert not allocations
        boundaries.append(dict(owner=owner, unsupported=unsupported, visits=visited))

if not args.evidence_only:
    js = """import {shamanDeathVfx} from './app/shaman-death-vfx.ts';
    let s='';for await(const c of process.stdin)s+=c;
    console.log(JSON.stringify(JSON.parse(s).map(c=>{const v=shamanDeathVfx(c.phase);
      return {team:c.team,phase:c.phase,visible:v.visible,frame:v.frame};})));"""
    actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
        input=json.dumps(presentation_cases).encode(), cwd=ROOT))
    assert actual == presentation_cases

print(json.dumps(dict(status='PASS', producerCases=producer_cases, presentationVisits=len(presentation_cases),
    originalFrames={'680': 8, '352': 1, '360': 10}, riseFrame=9, riseNativeHeight=1280,
    boundaries=boundaries, hashes={str(path): hashlib.sha256(path.read_bytes()).hexdigest()
      for path in (exe, starts_path, frames_path)},
    limits='Supplied allocator/terrain/audio/gameplay leaves. Native draw-loop cadence and full gameplay/renderer parity are not claimed.'), indent=2))
