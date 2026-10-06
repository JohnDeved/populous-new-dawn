"""Static-only PE boundary extraction; does not import or run the probe draft."""
import hashlib
import json
import platform
import struct
import sys
from pathlib import Path

import capstone

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = Path(__file__).resolve().parent
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
PLAN_HEAD = 'c849415e32a231aceb71bf74a43a541a74e3397e'
RANGES = [(0x4d23d0, 0x4d2717), (0x4d5920, 0x4d5b5c),
          (0x4ed8a0, 0x4edad7), (0x4ed580, 0x4ed605), (0x4ed640, 0x4ed6c4)]
EXTRA_SOURCES = [
    'decomp/generated/004d2740.c', 'decomp/generated/00432260.c',
    'decomp/generated/004ee470.c', 'decomp/generated/004ee4f0.c',
    'decomp/generated/004ef180.c', 'decomp/generated/004a3940.c',
    'decomp/generated/004d47d0.c', 'decomp/generated/004e9b40.c',
    'decomp/generated/004ea460.c', 'decomp/generated/0050bd70.c',
    'decomp/generated/0050beb0.c', 'scripts/check-native-shaman-death-ground.py',
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


data = Path(sys.argv[1]).read_bytes()
assert sha(data) == EXE_SHA
pe = struct.unpack_from('<I', data, 60)[0]
assert data[pe:pe + 4] == b'PE\0\0'
assert struct.unpack_from('<H', data, pe + 24)[0] == 0x10b
count = struct.unpack_from('<H', data, pe + 6)[0]
opt = struct.unpack_from('<H', data, pe + 20)[0]
base = struct.unpack_from('<I', data, pe + 52)[0]


def read(address, size):
    for index in range(count):
        _, _, va, length, offset = struct.unpack_from('<8sIIII', data, pe + 24 + opt + index * 40)
        if base + va <= address and address + size <= base + va + length:
            start = offset + address - base - va
            return data[start:start + size]
    raise ValueError(f'Unbacked PE range: {address:08x} + {size}')


decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
lines = ['Static boundary extraction only; no original instructions executed.',
         f'EXE SHA256 {EXE_SHA}']
ranges = []
for start, end in RANGES:
    raw = read(start, end - start)
    ranges.append({'start': f'{start:08x}', 'endExclusive': f'{end:08x}', 'sha256': sha(raw)})
    decoded = list(decoder.disasm(raw, start))
    assert sum(item.size for item in decoded) == len(raw)
    lines.extend(['', f'Range {start:08x}..{end:08x}, end exclusive, SHA256 {sha(raw)}'])
    lines.extend(f'{item.address:08x} {item.bytes.hex():22} {item.mnemonic} {item.op_str}'.rstrip()
                 for item in decoded)
descriptors = {str(cls): read(0x5a6830 + cls * 3, 3).hex() for cls in (1, 7, 10)}
assert descriptors == {'1': '080800', '7': '5e2802', '10': '133000'}
shaman_branch = struct.unpack('<I', read(0x4d2718 + 6 * 4, 4))[0]
assert shaman_branch == 0x4d25d5
lines.extend(['', f'Class descriptors, stride3: {descriptors}',
              f'Model7 initializer table target: {shaman_branch:08x}'])
text = '\n'.join(lines) + '\n'
(OUTPUT / 'native-boundaries.txt').write_text(text)
old = json.loads((ROOT / 'references/verification/reincarnation-final-burst-2026-10-06/manifest.json').read_text())
sources = {**old['sources'], **{path: sha((ROOT / path).read_bytes()) for path in EXTRA_SOURCES}}
for path, expected in sources.items():
    assert sha((ROOT / path).read_bytes()) == expected, path
manifest = {
    'mode': 'source preparation; static PE only; draft never imported/executed',
    'inspectedMain': old['inspectedMain'], 'planHead': PLAN_HEAD,
    'exeSha256': EXE_SHA, 'python': platform.python_version(), 'capstone': capstone.__version__,
    'ranges': ranges, 'classDescriptorStride': 3, 'classDescriptors': descriptors,
    'shamanInitializerTableTarget': f'{shaman_branch:08x}',
    'nativeBoundariesSha256': sha(text.encode()), 'sources': sources,
    'preparationSources': {name: sha((OUTPUT / name).read_bytes())
                           for name in ('phase5-fixture-draft.py', 'extract-boundaries.py', 'README.md')},
}
(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'PASS: static-only boundaries; {len(ranges)} code ranges, stride3 descriptors, {len(sources)} source fingerprints')
