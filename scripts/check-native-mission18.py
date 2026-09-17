"""Verify Mission 18 authored rewards, Red patrol, and bank-g sky inputs."""

import hashlib
import struct
import sys
import zlib
from pathlib import Path


if len(sys.argv) != 2:
    raise SystemExit("Usage: check-native-mission18.py /path/to/d3dpoptb.exe")

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1]).resolve()
GAME = EXE.parent
paths = {
    "exe": EXE,
    "level": GAME / "levels/levl2018.dat",
    "header": GAME / "levels/levl2018.hdr",
    "script": GAME / "levels/cpscr019.dat",
    "sky": GAME / "data/sky0-g.dat",
    "palette": GAME / "data/pal0-g.dat",
}
expected = {
    "exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "level": "e595708398cc656f422db6041129fb8732e4887dd7681891d3656dc569bd7e04",
    "header": "6ede1c60604d8f0e4f8c959ece873506e8a5882b93c93df12a000061483232c4",
    "script": "bfe23efdd9c012d660649a0151db17d193cfc0261fabdc5eefbe0d894adf3e2e",
    "sky": "4b805749d7c4d9fee6aafa80f91f2de8659b179e606984ccc97f59b505b95bd4",
    "palette": "63abc7be002f6ebe763a39f921e8b7442fe2839150e8ca7a05c0084440e982ac",
}
assert {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in paths.items()} == expected

header = paths["header"].read_bytes()
assert list(header[88:97]) == [4, 19, 20, 32, 1, 2, 4, 8, 16]

level = paths["level"].read_bytes()


def record(index):
    raw = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    return raw, raw[7:39]


for trigger, reward, spell, target in ((473, 475, 18, 350), (476, 478, 16, 200), (479, 481, 16, 200)):
    trigger_raw, settings = record(trigger)
    reward_raw, reward_settings = record(reward)
    assert (trigger_raw[1], trigger_raw[0], trigger_raw[2]) == (6, 6, 0)
    assert struct.unpack_from("<H", settings, 6)[0] == reward + 1
    assert (settings[3], struct.unpack_from("<h", settings, 4)[0]) == (1, 6)
    assert struct.unpack_from("<h", settings, 26)[0] == target
    assert (reward_raw[1], reward_raw[0], reward_raw[2], list(reward_settings[:4])) == (
        6,
        2,
        255,
        [11, spell, 3, 1],
    )

script = paths["script"].read_bytes()
codes = struct.unpack_from("<4096H", script)
fields = list(struct.iter_unpack("<Ii", script[8192:12288]))
assert codes[168:176] == (1091, 6, 6, 9, 1, 41, 14, 6)
assert [fields[index] for index in codes[169:176]] == [
    (0, 1),
    (0, 1),
    (0, 2),
    (0, 0),
    (0, 7),
    (0, 3),
    (0, 1),
]
assert codes[299:310] == (1006, 1092, 6, 86, 86, 86, 1006, 1174, 22, 1006, 1187)
assert fields[6] == (0, 1) and fields[22] == (0, 5) and fields[86] == (0, -1)

d3d_names = {path.name.casefold() for path in (GAME / "data/d3d").iterdir()}
assert "dsky0-gb.png" not in d3d_names
assert {"dsky0-g1.png", "dsky0-g2.png"} <= d3d_names
sky = paths["sky"].read_bytes()
palette = paths["palette"].read_bytes()
assert len(sky) == 512 * 512 and len(palette) == 1024
rgba = bytearray()
for y in range(128):
    for x in range(128):
        colors = [
            palette[sky[(y * 4 + dy) * 512 + x * 4 + dx] * 4 :][:3]
            for dy in range(4)
            for dx in range(4)
        ]
        rgba.extend(sum(color[channel] for color in colors) >> 4 for channel in range(3))
        rgba.append(255)
assert hashlib.sha256(rgba).hexdigest() == "afe74d4c1fe39cc37b2285bfb6313117b9fca50fdbc5fc7fa158d62009b6d463"
png = (ROOT / "public/original/sky-g.png").read_bytes()
assert hashlib.sha256(png).hexdigest() == (
    "99a8a6522464f6268d476db2707f7bf753258ab26d3d4ba205438949e7604caa"
)
assert png[:8] == b"\x89PNG\r\n\x1a\n"
offset, compressed = 8, bytearray()
while offset < len(png):
    length = struct.unpack_from(">I", png, offset)[0]
    kind = png[offset + 4 : offset + 8]
    data = png[offset + 8 : offset + 8 + length]
    crc = struct.unpack_from(">I", png, offset + 8 + length)[0]
    assert zlib.crc32(kind + data) & 0xFFFFFFFF == crc
    if kind == b"IHDR":
        assert struct.unpack(">IIBBBBB", data) == (128, 128, 8, 6, 0, 0, 0)
    elif kind == b"IDAT":
        compressed.extend(data)
    offset += length + 12
rows = zlib.decompress(compressed)
assert len(rows) == 128 * (1 + 128 * 4)
assert bytes(row for y in range(128) for row in rows[y * 513 + 1 : (y + 1) * 513]) == rgba

print("PASS: Mission 18 rewards, Red marker patrol, bank-g fallback, and exact 4x4 sky average")
