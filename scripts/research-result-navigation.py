"""Extract bounded original result-navigation evidence, never execute the game.

Usage: python3 -B scripts/research-result-navigation.py VERIFIED_EXE > OUTPUT.json
Only the standard library is used. Compare scratch output with retained native.json.
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


def read(start, end):
    rva, size = start - image_base, end - start
    for i in range(sections):
        _, section, raw_size, raw = struct.unpack_from(
            "<IIII", data, section_table + i * 40 + 8)
        if section <= rva and rva + size <= section + raw_size:
            return data[raw + rva - section:raw + rva - section + size]
    raise ValueError(f"Unbacked range {start:x}..{end:x}")


# Half-open, instruction-aligned code spans. Existing renderer/camera/UI exports
# are linked by README instead of duplicated. Data spans are not disassembled.
code = [
    ("terminalExit", 0x41B4F0, 0x41B520),
    ("resultFontSelection", 0x42BDE0, 0x42BE9A),
    ("tribeDispatch", 0x43E90B, 0x43E929),
    ("tribeNextLevel", 0x43FB95, 0x43FBAD),
    ("queueTribeCommand", 0x479CF0, 0x479D66),
    ("headerSentinelGuard", 0x485660, 0x485679),
    ("headerSentinelReturn", 0x4858DC, 0x4858E6),
    ("nextLevel", 0x4858F0, 0x485AE3),
    ("levelSpecLoad", 0x486350, 0x48644B),
    ("blinkProducer", 0x4A470B, 0x4A472D),
    ("keyboardRoutes", 0x4A9F09, 0x4AA0FF),
    ("commandDispatch", 0x4AABAC, 0x4AABD8),
    ("statisticsDismiss", 0x4AB498, 0x4AB4EA),
    ("commandPausedGuard", 0x4ABBE2, 0x4ABC15),
    ("resultStatisticsOpen", 0x4ABD86, 0x4ABDEF),
    ("resultKeyPredicate", 0x4FF4F0, 0x4FF52C),
]
tables = [
    ("tribeDispatchIndex", 0x44242E, 0x44242F),
    ("tribeDispatchTarget", 0x442348, 0x44234C),
    ("queueDispatchIndex", 0x479DC2, 0x479DC3),
    ("queueDispatchTarget", 0x479D80, 0x479D84),
    ("commandTargets", 0x4AD5C4, 0x4AD740),
    ("commandIndices", 0x4AD740, 0x4AD802),
    ("unpausedCommandTargets", 0x4AD814, 0x4AD8DC),
    ("unpausedCommandIndices", 0x4AD8DC, 0x4AD994),
    ("spaceRotateKey", 0x5D64CC, 0x5D64D8),
    ("spaceResultKeys", 0x5D65C8, 0x5D65EC),
    ("levelSpecFilename", 0x5A1E50, 0x5A1E5D),
    ("levelSpecDirectory", 0x59CD2C, 0x59CD33),
    ("levelSpecPathFormat", 0x599B34, 0x599B3A),
    ("statusFormats", 0x5DDDA4, 0x5DDDBC),
]
spans = []
for kind, ranges in (("code", code), ("data", tables)):
    for name, start, end in ranges:
        payload = read(start, end)
        spans.append(dict(name=name, kind=kind, start=f"{start:08x}",
                          end=f"{end:08x}", sha256=hashlib.sha256(payload).hexdigest(),
                          hex=payload.hex()))
print(json.dumps(dict(executableSha256=identity, imageBase=f"{image_base:08x}",
                     spans=spans), indent=2))
