#!/usr/bin/env python3
"""Import the proved original loading mask.

Usage: python3 scripts/import-loading-art.py /path/to/original/game
The argument may also be the loadlog2.dat file itself.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT = 130, 161
SOURCE_SIZE = WIDTH * HEIGHT
SOURCE_SHA256 = "ef0b112f4fa1d357637380f287e5f517538dd79eff75b1b42b2c0955e9d61a56"
MASK_SHA256 = "73437a1d2e8ec54551489d2c39d0e293aa1f52072f3287fd2b9e58ece3fe190d"

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

def png_rgba(width: int, height: int, rgba: bytes) -> bytes:
    stride = width * 4
    rows = b"".join(b"\x00" + rgba[y * stride:(y + 1) * stride] for y in range(height))
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b"")

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Original game root or data/loadlog2.dat")
    parser.add_argument("--output", type=Path, default=ROOT / "public/original/loading-mask.png")
    args = parser.parse_args()
    source = args.source / "data/loadlog2.dat" if args.source.is_dir() else args.source
    raw = source.read_bytes()
    if len(raw) != SOURCE_SIZE:
        raise SystemExit(f"Unexpected loadlog2.dat size: {len(raw)} (expected {SOURCE_SIZE})")
    if digest(raw) != SOURCE_SHA256:
        raise SystemExit("loadlog2.dat SHA-256 mismatch")
    if not set(raw) <= {0, 254, 255}:
        raise SystemExit("Unexpected loadlog2.dat byte values")
    mask = bytes(255 if value else 0 for value in raw)
    if digest(mask) != MASK_SHA256:
        raise SystemExit("Decoded nonzero mask SHA-256 mismatch")
    rgba = bytearray()
    for alpha in mask:
        rgba.extend((255, 255, 255, alpha))
    output = png_rgba(WIDTH, HEIGHT, bytes(rgba))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(output)
    print(json.dumps({
        "source": str(source),
        "sourceSha256": SOURCE_SHA256,
        "maskSha256": MASK_SHA256,
        "width": WIDTH,
        "height": HEIGHT,
        "output": str(args.output),
        "outputSha256": digest(output),
    }))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
