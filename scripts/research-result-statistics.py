"""Read-only original PE extraction for issue 457; never loads or executes code.

Usage: python3 scripts/research-result-statistics.py EXE > /tmp/result-statistics.json
Compare that file with decomp/research/result-statistics/native.json.
Only Python's standard library is needed. No emulator/checker/log access.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

EXPECTED = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
data = Path(sys.argv[1]).read_bytes()
identity = hashlib.sha256(data).hexdigest()
if identity != EXPECTED:
    raise ValueError("Original executable identity mismatch")
pe = struct.unpack_from("<I", data, 0x3C)[0]
if data[pe:pe + 4] != b"PE\0\0":
    raise ValueError("Not a PE image")
sections, optional_size = struct.unpack_from("<H12xH", data, pe + 6)
optional = pe + 24
image_base = struct.unpack_from("<I", data, optional + 28)[0]
section_table = optional + optional_size


def read(va, size):
    rva = va - image_base
    for i in range(sections):
        _, start, raw_size, raw = struct.unpack_from("<IIII", data, section_table + i * 40 + 8)
        if start <= rva and rva + size <= start + raw_size:
            offset = raw + rva - start
            return data[offset:offset + size]
    raise ValueError(f"Unbacked range {va:x}+{size:x}")


# Half-open ranges: descriptor data, small complete helpers, and bounded call
# sites. Larger producers are retained already as indexed Ghidra pseudocode.
ranges = [
    ("descriptor", 0x5ADD30, 0x5ADD5C),
    ("reset", 0x41B520, 0x41B545),
    ("add", 0x41B550, 0x41B571),
    ("knowledge", 0x41B580, 0x41B5C0),
    ("clock", 0x41B5C0, 0x41B5D1),
    ("resetCaller", 0x42CB7D, 0x42CB96),
    ("rendererIndex", 0x5245E3, 0x5245F1),
    ("rendererRead", 0x524653, 0x524675),
    ("rendererClock", 0x5243C3, 0x524414),
    ("buildingRemoval", 0x403820, 0x403856),
    ("buildingPairRemoval", 0x40B130, 0x40B16E),
    ("fightRelease", 0x519C90, 0x519D02),
    ("rewardDelivery", 0x4FB028, 0x4FB15F),
    ("tribeElimination", 0x418F15, 0x418F7A),
]
spans = []
for name, start, end in ranges:
    payload = read(start, end - start)
    spans.append(dict(name=name, start=f"{start:08x}", end=f"{end:08x}",
                      sha256=hashlib.sha256(payload).hexdigest(), hex=payload.hex()))

# Direct E8 references are discovery evidence, NOT an exhaustive control-flow
# graph (indirect calls and alternative disassembly boundaries remain possible).
calls = []
text = read(0x401000, 1591844)
for i in range(len(text) - 4):
    if text[i] != 0xE8:
        continue
    address = 0x401000 + i
    target = address + 5 + struct.unpack_from("<i", text, i + 1)[0]
    if target in (0x41B520, 0x41B550, 0x41B580):
        calls.append(dict(address=f"{address:08x}", target=f"{target:08x}",
                          precedingHex=read(address - 16, 21).hex()))

print(json.dumps(dict(executableSha256=identity, imageBase=f"{image_base:08x}",
                     spans=spans, directCallCandidates=calls), indent=2))
