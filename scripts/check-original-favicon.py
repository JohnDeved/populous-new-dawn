#!/usr/bin/env python3
"""Static original-byte and transparency proof for the original EXE favicon."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import struct
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
EXTRACTOR = ROOT / 'scripts/extract-exe-icon.py'
TRACKED_ICO = ROOT / 'public/favicon.ico'
LAYOUT = ROOT / 'app/layout.tsx'
EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
GROUP_OFFSET = 0x207B70
GROUP_SIZE = 48
GROUP_SHA256 = '835b527862c22596f829bb0482de7007635353b3b6a1248617b5e72a74298963'
EXPECTED = (
    {
        'width': 16, 'height': 16, 'colors': 0, 'planes': 1, 'bpp': 24,
        'size': 872, 'icon_id': 2, 'source_offset': 0x2052B8,
        'payload_sha256': '53f055dc0ddbac08ec194b148756f875eee2455b8c79b7d642d44b4a859a3d4d',
        'rgba_sha256': '507135d4cf325de6052589667f0faab2db77d9618ac63f98dae03c4df0e42004',
        'transparent': 114, 'opaque': 142,
        'and_sha256': '180b852abf7d1d33acdfe035b9d55714b8003c9240d58cbd701f57a6b703bbf8',
    },
    {
        'width': 32, 'height': 32, 'colors': 0, 'planes': 1, 'bpp': 8,
        'size': 2216, 'icon_id': 3, 'source_offset': 0x205620,
        'payload_sha256': '79aa5ebedd510e28cc5eb52075f1b5e7fc77dc46b96f0ac02d14af0e28c70743',
        'rgba_sha256': '0069621a047830844887c0186f283f116832b4be889b80039c24d19fe2c7195a',
        'transparent': 424, 'opaque': 600,
        'and_sha256': 'f05cd1720e28c0ff8afb153a3b1cb47ecf7a3d604b9f07fad98da3a67cd8cc66',
    },
    {
        'width': 48, 'height': 48, 'colors': 0, 'planes': 1, 'bpp': 24,
        'size': 7336, 'icon_id': 4, 'source_offset': 0x205EC8,
        'payload_sha256': '9b0744d3120f0c78e6df90ca0b2a9675768e34ad2b07e3b40069fc6008cb34da',
        'rgba_sha256': 'df6c121f0855a81c2c02fd1725de39f831cc885a0ef12e3481dc419d006745f2',
        'transparent': 1024, 'opaque': 1280,
        'and_sha256': '85db2ea3c23931473cac7cc2986ca0560869cf2bd38a3b3c1bd1beb0423499f5',
    },
)


class CheckError(ValueError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def decode_dib(payload: bytes, expected: dict) -> tuple[bytes, bytes]:
    if len(payload) < 40:
        raise CheckError('Truncated icon DIB')
    header = struct.unpack_from('<IiiHHIIiiII', payload, 0)
    header_size, width, doubled_height, planes, bpp, compression, _, _, _, colors_used, _ = header
    height = doubled_height // 2
    if (
        header_size != 40
        or width != expected['width']
        or height != expected['height']
        or doubled_height != expected['height'] * 2
        or planes != 1
        or bpp != expected['bpp']
        or compression != 0
    ):
        raise CheckError(f'Unexpected DIB header: {header!r}')
    palette_count = (colors_used or (1 << bpp)) if bpp <= 8 else 0
    pixel_offset = header_size + palette_count * 4
    xor_stride = ((width * bpp + 31) // 32) * 4
    and_offset = pixel_offset + xor_stride * height
    and_stride = ((width + 31) // 32) * 4
    mask = payload[and_offset:and_offset + and_stride * height]
    if len(mask) != and_stride * height:
        raise CheckError('Truncated icon AND mask')
    rgba = bytearray()
    for y in range(height):
        source_y = height - 1 - y
        xor_row = pixel_offset + source_y * xor_stride
        and_row = and_offset + source_y * and_stride
        for x in range(width):
            if bpp == 24:
                blue, green, red = payload[xor_row + x * 3:xor_row + x * 3 + 3]
            elif bpp == 8:
                palette_index = payload[xor_row + x]
                blue, green, red, _ = payload[
                    header_size + palette_index * 4:header_size + palette_index * 4 + 4
                ]
            else:
                raise CheckError(f'Unsupported reviewed bpp {bpp}')
            transparent = (payload[and_row + (x >> 3)] >> (7 - (x & 7))) & 1
            rgba += bytes((red, green, blue, 0 if transparent else 255))
    return bytes(rgba), mask


def parse_ico(data: bytes, source: bytes) -> list[dict]:
    if len(data) < 6 or struct.unpack_from('<HHH', data, 0) != (0, 1, len(EXPECTED)):
        raise CheckError('Unexpected ICO header')
    rows = []
    for index, expected in enumerate(EXPECTED):
        base = 6 + index * 16
        width_byte, height_byte, colors, reserved, planes, bpp, size, offset = struct.unpack_from(
            '<BBBBHHII', data, base
        )
        width = 256 if width_byte == 0 else width_byte
        height = 256 if height_byte == 0 else height_byte
        actual = (width, height, colors, reserved, planes, bpp, size)
        wanted = (
            expected['width'], expected['height'], expected['colors'], 0,
            expected['planes'], expected['bpp'], expected['size']
        )
        if actual != wanted:
            raise CheckError(f'ICO entry {index} mismatch: expected {wanted!r}, got {actual!r}')
        payload = data[offset:offset + size]
        if len(payload) != size:
            raise CheckError(f'ICO entry {index} payload is truncated')
        source_payload = source[
            expected['source_offset']:expected['source_offset'] + expected['size']
        ]
        if payload != source_payload:
            raise CheckError(f'ICO entry {index} is not byte-identical to original RT_ICON payload')
        if sha256(payload) != expected['payload_sha256']:
            raise CheckError(f'ICO entry {index} payload fingerprint mismatch')
        rgba, mask = decode_dib(payload, expected)
        transparent = sum(1 for alpha in rgba[3::4] if alpha == 0)
        opaque = sum(1 for alpha in rgba[3::4] if alpha == 255)
        if sha256(rgba) != expected['rgba_sha256']:
            raise CheckError(f'ICO entry {index} decoded RGBA fingerprint mismatch')
        if (transparent, opaque) != (expected['transparent'], expected['opaque']):
            raise CheckError(f'ICO entry {index} transparency counts mismatch')
        if sha256(mask) != expected['and_sha256']:
            raise CheckError(f'ICO entry {index} AND mask fingerprint mismatch')
        rows.append({
            'size': f"{width}x{height}",
            'bpp': bpp,
            'payload_sha256': sha256(payload),
            'rgba_sha256': sha256(rgba),
            'transparent': transparent,
            'opaque': opaque,
        })
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('exe', type=Path, help='hash-verified original d3dpoptb.exe')
    parser.add_argument('--ico', type=Path, default=TRACKED_ICO)
    args = parser.parse_args()
    source = args.exe.resolve(strict=True).read_bytes()
    if sha256(source) != EXE_SHA256:
        raise CheckError('Original executable SHA-256 mismatch')
    group = source[GROUP_OFFSET:GROUP_OFFSET + GROUP_SIZE]
    if len(group) != GROUP_SIZE or sha256(group) != GROUP_SHA256:
        raise CheckError('Original RT_GROUP_ICON bytes mismatch')
    reserved, icon_type, count = struct.unpack_from('<HHH', group, 0)
    if (reserved, icon_type, count) != (0, 1, len(EXPECTED)):
        raise CheckError('Original icon group header mismatch')
    for index, expected in enumerate(EXPECTED):
        row = struct.unpack_from('<BBBBHHIH', group, 6 + index * 14)
        width, height, colors, reserved_byte, planes, bpp, size, icon_id = row
        actual = (
            256 if width == 0 else width,
            256 if height == 0 else height,
            colors, reserved_byte, planes, bpp, size, icon_id,
        )
        wanted = (
            expected['width'], expected['height'], expected['colors'], 0,
            expected['planes'], expected['bpp'], expected['size'], expected['icon_id'],
        )
        if actual != wanted:
            raise CheckError(f'Original icon group entry {index} mismatch')
        source_payload = source[
            expected['source_offset']:expected['source_offset'] + expected['size']
        ]
        if sha256(source_payload) != expected['payload_sha256']:
            raise CheckError(f'Original RT_ICON {icon_id} fingerprint mismatch')

    tracked = args.ico.resolve(strict=True).read_bytes()
    rows = parse_ico(tracked, source)

    layout = LAYOUT.read_text()
    if "icons: { icon: '/favicon.ico' }" not in layout:
        raise CheckError('app/layout.tsx does not point favicon metadata at /favicon.ico')
    if "icons: { icon: '/favicon.png' }" in layout:
        raise CheckError('Legacy /favicon.png metadata entry is still active')

    with tempfile.TemporaryDirectory(prefix='pnd-favicon-check-') as temp_dir:
        regenerated = Path(temp_dir) / 'favicon.ico'
        subprocess.run(
            [sys.executable, str(EXTRACTOR), str(args.exe), '--output', str(regenerated)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        if regenerated.read_bytes() != tracked:
            raise CheckError('Deterministic extractor output differs from tracked public/favicon.ico')

    print(
        'PASS: original EXE RT_GROUP_ICON 125/lang1033 -> byte-exact multi-image favicon.ico; '
        f'sha256={sha256(tracked)} entries={rows}'
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
