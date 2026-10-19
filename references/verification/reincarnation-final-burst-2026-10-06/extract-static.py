"""Read and disassemble pinned PE bytes only; never execute native/app code."""
import hashlib
import json
import platform
import struct
import sys
from pathlib import Path

import capstone

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = Path(__file__).resolve().parent
BASE = '1c7e6b05687aca14d9350e17c7ae14dc6c68bb97'
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
RANGES = [(0x004da0f0, 0x004da16e), (0x00502d03, 0x00502e8a),
          (0x0050ccd0, 0x0050ce98)]
SOURCES = [
    'app/world-turn.ts', 'app/reincarnation.ts', 'app/reincarnation-wave-runtime.ts',
    'app/world-state.ts', 'app/world-effects.ts', 'app/level-start-runtime.ts',
    'app/level-start.ts', 'app/spell-trails.ts', 'app/game-store.ts',
    'app/world-initialization.ts', 'scripts/check-native-reincarnation.py',
    'scripts/check-native-reincarnation-wave.py', 'scripts/check-native-level-start.py',
    'scripts/check-browser-reincarnation-wave.mjs', 'decomp/generated/004ec6f0.c',
    'decomp/generated/004ed8a0.c', 'decomp/generated/004ed580.c',
    'decomp/generated/00509c10.c', 'decomp/generated/0050bcd0.c',
    'decomp/generated/0050ccd0.c', 'decomp/generated/0050bf60.c',
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


data = Path(sys.argv[1]).read_bytes()
assert sha(data) == EXE_SHA, 'EXE identity differs'
pe = struct.unpack_from('<I', data, 60)[0]
assert data[pe:pe + 4] == b'PE\0\0'
assert struct.unpack_from('<H', data, pe + 24)[0] == 0x10b
count = struct.unpack_from('<H', data, pe + 6)[0]
opt = struct.unpack_from('<H', data, pe + 20)[0]
base = struct.unpack_from('<I', data, pe + 52)[0]


def read(address, size):
    for i in range(count):
        _, _, va, length, offset = struct.unpack_from('<8sIIII', data, pe + 24 + opt + i * 40)
        if base + va <= address and address + size <= base + va + length:
            start = offset + address - base - va
            return data[start:start + size]
    raise ValueError(f'Unbacked PE range: {address:08x} + {size}')


decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
lines = ['Static disassembly only; no original instructions executed.', f'EXE SHA256 {EXE_SHA}']
ranges = []
for start, end in RANGES:
    raw = read(start, end - start)
    ranges.append({'start': f'{start:08x}', 'endExclusive': f'{end:08x}', 'sha256': sha(raw)})
    lines.extend(['', f'Range {start:08x}..{end:08x} (end exclusive), SHA256 {sha(raw)}'])
    decoded = list(decoder.disasm(raw, start))
    assert sum(i.size for i in decoded) == len(raw), 'Incomplete static decode'
    lines.extend(f'{i.address:08x} {i.bytes.hex():22} {i.mnemonic} {i.op_str}'.rstrip()
                 for i in decoded)
text = '\n'.join(lines) + '\n'
(OUTPUT / 'native-static.txt').write_text(text)
manifest = {
    'mode': 'static PE reading/disassembly; no native/app/browser execution',
    'inspectedMain': BASE, 'exeSha256': EXE_SHA,
    'python': platform.python_version(), 'capstone': capstone.__version__,
    'ranges': ranges, 'nativeStaticSha256': sha(text.encode()),
    'extractorSha256': sha(Path(__file__).read_bytes()),
    'sources': {path: sha((ROOT / path).read_bytes()) for path in SOURCES},
}
(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'PASS: static-only identity/decode, {len(ranges)} ranges, {len(SOURCES)} source fingerprints')
