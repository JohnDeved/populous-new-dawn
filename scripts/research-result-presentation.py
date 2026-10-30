"""Extract bounded original result-presentation evidence, never execute the game.

Usage: python3 -B scripts/research-result-presentation.py VERIFIED_EXE > OUTPUT.json
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


def file_offset(start, end):
    rva, size = start - image_base, end - start
    for i in range(sections):
        _, section, raw_size, raw = struct.unpack_from(
            "<IIII", data, section_table + i * 40 + 8)
        if section <= rva and rva + size <= section + raw_size:
            return raw + rva - section
    raise ValueError(f"Unbacked range {start:x}..{end:x}")


def read(start, end):
    offset = file_offset(start, end)
    return data[offset:offset + end - start]


# Half-open, instruction-aligned ranges. No execution/emulation of the input.
code = [
    ("paletteSlotDestination", 0x429DAB, 0x429DBC),
    ("paletteSlots", 0x42ADC0, 0x42AE2B),
    ("levelLoadReset", 0x42B590, 0x42B59C),
    ("statisticsLayout", 0x42B940, 0x42BD68),
    ("clearLevelCounters", 0x42BFA0, 0x42C016),
    ("upperLevelLoadReset", 0x42C7F7, 0x42C82C),
    ("singlePlayerAdmission", 0x43E480, 0x43E621),
    ("admittedCounterIncrement", 0x43E871, 0x43E883),
    ("speedMultiplier", 0x43EC32, 0x43EC8D),
    ("languageFamily", 0x493210, 0x493228),
    ("defaultSettingsInit", 0x49A940, 0x49A9BE),
    ("settingsStartup", 0x4A44E9, 0x4A44F3),
    ("blinkProducerAndDispatch", 0x4A470B, 0x4A475A),
    ("schedulerVisit", 0x4A4B6A, 0x4A4B6F),
    ("renderVisit", 0x4A4C07, 0x4A4C0C),
    ("schedulerDeadline", 0x4A5590, 0x4A55C3),
    ("singlePlayerScheduler", 0x4A5931, 0x4A59DD),
    ("simulationCounterIncrement", 0x4EC6F0, 0x4EC70F),
    ("directGpuGlyph", 0x516C80, 0x516D24),
    ("fontVtableSelection", 0x516D30, 0x516D62),
    ("terminalOverlay", 0x5239F0, 0x523BEA),
    ("panelTiles", 0x523D40, 0x523F95),
    ("statisticsFontAndCenter", 0x523FA0, 0x524084),
    ("statisticsStatusBlink", 0x524228, 0x52432A),
    ("statisticsRewardModulationEnd", 0x5248B4, 0x5248BB),
    ("statisticsPrompt", 0x52495D, 0x524A2F),
    ("directCpuMetrics", 0x5279D0, 0x5279F7),
    ("directCpuGlyph", 0x527A00, 0x527A2B),
]
tables = [
    ("settingsTypeDispatch", 0x49A9C0, 0x49A9D0),
    ("defaultInputRate", 0x5A9D6C, 0x5A9D80),
    ("cpuFontVtables", 0x591688, 0x5916A8),
    ("gpuFontVtables", 0x5DA1F0, 0x5DA210),
]
spans = []
for kind, ranges in (("code", code), ("data", tables)):
    for name, start, end in ranges:
        payload = read(start, end)
        spans.append(dict(name=name, kind=kind, start=f"{start:08x}",
                          end=f"{end:08x}", fileOffset=file_offset(start, end), sha256=hashlib.sha256(payload).hexdigest(),
                          hex=payload.hex()))

# Resolve the actual PE import used at 004a55a7, without loading the DLL.
def u32(address):
    return struct.unpack("<I", read(address, address + 4))[0]

def cstr(address):
    out = bytearray()
    while True:
        value = read(address + len(out), address + len(out) + 1)[0]
        if not value:
            return out.decode("ascii")
        out.append(value)

imports = []
import_rva = struct.unpack_from("<I", data, optional + 104)[0]
descriptor = image_base + import_rva
while any(read(descriptor, descriptor + 20)):
    lookup, _, _, dll_rva, iat = struct.unpack("<IIIII", read(descriptor, descriptor + 20))
    index = 0
    while True:
        thunk = u32(image_base + (lookup or iat) + 4 * index)
        if not thunk:
            break
        thunk_va = image_base + iat + 4 * index
        if thunk_va == 0xD0C784:
            if thunk & 0x80000000:
                raise ValueError("Expected named GetTickCount import")
            imports.append(dict(dll=cstr(image_base + dll_rva),
                name=cstr(image_base + thunk + 2), iat=f"{thunk_va:08x}",
                descriptor=f"{descriptor:08x}",
                descriptorHex=read(descriptor, descriptor + 20).hex(),
                hintName=f"{image_base + thunk:08x}",
                hintNameHex=read(image_base + thunk, image_base + thunk + 15).hex()))
        index += 1
    descriptor += 20
if len(imports) != 1 or imports[0]["name"] != "GetTickCount":
    raise ValueError("Scheduler timer import did not match")
print(json.dumps(dict(executableSha256=identity, imageBase=f"{image_base:08x}",
                     spans=spans, imports=imports), indent=2))
