#!/usr/bin/env python3
"""Extract the original Populous executable icon group without decoding/resampling it."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
READER = ROOT / 'scripts/check-static-mission18-sky.py'
READER_SHA256 = '74dd55ab6d811f0f0d870c94eb404d2c06915bf96232b6dc39c25f19ceee6da2'
EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
GROUP_ID = 125
LANG_ID = 1033
GROUP_SHA256 = '835b527862c22596f829bb0482de7007635353b3b6a1248617b5e72a74298963'
EXPECTED = (
    (16, 16, 0, 1, 24, 872, 2, '53f055dc0ddbac08ec194b148756f875eee2455b8c79b7d642d44b4a859a3d4d'),
    (32, 32, 0, 1, 8, 2216, 3, '79aa5ebedd510e28cc5eb52075f1b5e7fc77dc46b96f0ac02d14af0e28c70743'),
    (48, 48, 0, 1, 24, 7336, 4, '9b0744d3120f0c78e6df90ca0b2a9675768e34ad2b07e3b40069fc6008cb34da'),
)


class IconExtractionError(ValueError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_pe_reader():
    if sha256(READER.read_bytes()) != READER_SHA256:
        raise IconExtractionError('Existing PE32 reader fingerprint mismatch')
    spec = importlib.util.spec_from_file_location('favicon_pe_reader', READER)
    if spec is None or spec.loader is None:
        raise IconExtractionError('Unable to load existing PE32 reader')
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.PE32


def resource_payload(pe, type_id: int, resource_id: int, lang_id: int) -> bytes:
    data = pe.data
    pe_header = struct.unpack_from('<I', data, 0x3C)[0]
    optional = pe_header + 24
    if struct.unpack_from('<H', data, optional)[0] != 0x10B:
        raise IconExtractionError('Expected PE32 optional header')
    resource_rva, resource_size = struct.unpack_from('<II', data, optional + 96 + 2 * 8)
    if not resource_rva or resource_size < 16:
        raise IconExtractionError('Missing PE resource directory')
    resource_va = pe.base + resource_rva

    def read_rel(offset: int, size: int) -> bytes:
        if offset < 0 or offset + size > resource_size:
            raise IconExtractionError(f'Resource directory offset out of range: {offset:#x}+{size:#x}')
        return pe.read(resource_va + offset, size)

    def find_id(directory_offset: int, wanted: int) -> tuple[bool, int]:
        header = read_rel(directory_offset, 16)
        named, numeric = struct.unpack_from('<HH', header, 12)
        total = named + numeric
        if total > 4096:
            raise IconExtractionError('Unreasonable PE resource directory entry count')
        entries = read_rel(directory_offset + 16, total * 8)
        for index in range(total):
            name, target = struct.unpack_from('<II', entries, index * 8)
            if name & 0x80000000:
                continue
            if (name & 0xFFFF) == wanted:
                return bool(target & 0x80000000), target & 0x7FFFFFFF
        raise IconExtractionError(f'Missing resource id {wanted}')

    is_dir, type_offset = find_id(0, type_id)
    if not is_dir:
        raise IconExtractionError(f'Resource type {type_id} is not a directory')
    is_dir, id_offset = find_id(type_offset, resource_id)
    if not is_dir:
        raise IconExtractionError(f'Resource {resource_id} is not a language directory')
    is_dir, data_entry_offset = find_id(id_offset, lang_id)
    if is_dir:
        raise IconExtractionError(f'Resource language {lang_id} did not resolve to data')
    data_rva, size, _, _ = struct.unpack('<IIII', read_rel(data_entry_offset, 16))
    return pe.read(pe.base + data_rva, size)


def read_group(exe: Path):
    PE32 = load_pe_reader()
    pe = PE32(exe)
    if sha256(pe.data) != EXE_SHA256:
        raise IconExtractionError('Unexpected executable identity')
    group = resource_payload(pe, 14, GROUP_ID, LANG_ID)
    if sha256(group) != GROUP_SHA256:
        raise IconExtractionError('RT_GROUP_ICON bytes do not match reviewed resource')
    reserved, icon_type, count = struct.unpack_from('<HHH', group, 0)
    if (reserved, icon_type, count) != (0, 1, len(EXPECTED)):
        raise IconExtractionError(f'Unexpected icon group header {(reserved, icon_type, count)!r}')
    rows = []
    offset = 6
    for expected in EXPECTED:
        width, height, colors, reserved_byte, planes, bpp, size, icon_id = struct.unpack_from(
            '<BBBBHHIH', group, offset
        )
        offset += 14
        actual = (256 if width == 0 else width, 256 if height == 0 else height, colors, planes, bpp, size, icon_id)
        if actual != expected[:7]:
            raise IconExtractionError(f'Icon group entry mismatch: expected {expected[:7]!r}, got {actual!r}')
        payload = resource_payload(pe, 3, icon_id, LANG_ID)
        if len(payload) != size or sha256(payload) != expected[7]:
            raise IconExtractionError(f'RT_ICON {icon_id} bytes do not match reviewed resource')
        rows.append((width, height, colors, reserved_byte, planes, bpp, payload, icon_id))
    return rows


def build_ico(exe: Path) -> bytes:
    rows = read_group(exe)
    offset = 6 + len(rows) * 16
    directory = bytearray(struct.pack('<HHH', 0, 1, len(rows)))
    payloads = bytearray()
    for width, height, colors, reserved, planes, bpp, payload, _ in rows:
        directory += struct.pack(
            '<BBBBHHII', width, height, colors, reserved, planes, bpp, len(payload), offset
        )
        payloads += payload
        offset += len(payload)
    return bytes(directory + payloads)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('exe', type=Path, help='hash-verified original d3dpoptb.exe')
    parser.add_argument('--output', type=Path, default=ROOT / 'public/favicon.ico')
    args = parser.parse_args()
    ico = build_ico(args.exe)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temp = args.output.with_name(args.output.name + '.tmp')
    temp.write_bytes(ico)
    temp.replace(args.output)
    print(
        f'WROTE {args.output} sha256={sha256(ico)} '
        f'group={GROUP_ID} lang={LANG_ID} images={len(EXPECTED)}'
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
