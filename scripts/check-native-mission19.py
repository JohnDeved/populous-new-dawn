"""Verify Mission 19 rewards, objective script, bank-d inputs, and Teleport timing."""

import hashlib
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import native_cpu


if len(sys.argv) != 2:
    raise SystemExit("Usage: check-native-mission19.py /path/to/d3dpoptb.exe")

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1]).resolve()
GAME = EXE.parent
paths = {
    "exe": EXE,
    "level": GAME / "levels/levl2019.dat",
    "header": GAME / "levels/levl2019.hdr",
    "red": GAME / "levels/cpscr031.dat",
    "yellow": GAME / "levels/cpscr041.dat",
    "red_attributes": GAME / "levels/cpatr031.dat",
    "yellow_attributes": GAME / "levels/cpatr041.dat",
    "constants": GAME / "levels/constant.dat",
    "language": GAME / "language/lang00.dat",
    "palette": GAME / "data/pal0-d.dat",
    "sky": GAME / "data/sky0-d.dat",
    "clouds": GAME / "data/al0-d.dat",
    "clouds_high": GAME / "data/bl320-d.dat",
}
expected = {
    "exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "level": "33892de2c0fa0efa7c0cbb2ffcc86ffe6bb3b5afbf7f298cd28cb3a7d6fe0359",
    "header": "72c4982a400702b8e6b05afd2257cb2453a4f3113d493d744db5352925e1661a",
    "red": "5e2ca2197261d52c43f9dfbcf0936d973959dd38900c1030f818661a1184e2a5",
    "yellow": "e0b7ae11f1a711caf8da9cc3ddff24ed328afb3fad7983a5fe9209c1cae87703",
    "red_attributes": "b84df5fd48aca492109f7318d151928a69af72f398637f0d8d211321060638a6",
    "yellow_attributes": "28aa16863faca6b232fe68eb92efcb6b5defb4ecd9439b765a7ae68efa33bc26",
    "constants": "e905e513c798171d5540082565b8addc9f54e5851006b56e8d1976687ba42f24",
    "language": "e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d",
    "palette": "baadb5c8fb8a31d64835db3ddccf85857d11f3cdc8f67e3ae233b4d919967a4f",
    "sky": "0972127c5e7f4bbeb9ac6ad90315113f00e7a19af64b90f4fc7e3d34522e6b81",
    "clouds": "853e30988ccffe1d5961888d05f05e7b4c215dba91075fe92f3a4305eaa62489",
    "clouds_high": "26fbee4d3cb590462e1ef3c9afe1964283f1b662e8c58057ed8f2cbf324b2a05",
}
assert {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in paths.items()} == expected
assert list(paths["header"].read_bytes()[88:97]) == [3, 31, 41, 64, 5, 2, 5, 8, 13]

level = paths["level"].read_bytes()


def record(index):
    raw = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    return raw, raw[7:39]


for trigger, reward, spell, link_offset in ((69, 67, 8, 6), (97, 121, 16, 8), (208, 209, 21, 6)):
    trigger_raw, settings = record(trigger)
    reward_raw, reward_settings = record(reward)
    assert (trigger_raw[1], trigger_raw[0]) == (6, 6)
    assert struct.unpack_from("<H", settings, link_offset)[0] == reward + 1
    assert (reward_raw[1], reward_raw[0], reward_raw[2], list(reward_settings[:4])) == (
        6,
        2,
        255,
        [11, spell, 3, 1],
    )

red = struct.unpack_from("<4096H", paths["red"].read_bytes())
yellow = struct.unpack_from("<4096H", paths["yellow"].read_bytes())
assert red[584:604] == (
    1005, 35, 1003, 1000, 1020, 1013, 99, 23, 1014, 79, 1,
    1003, 1006, 1169, 1007, 79, 23, 1004, 1002, 1004,
)
assert red[401:434] == (
    1000, 1020, 1014, 80, 1, 1013, 99, 35, 1003, 1000, 1020,
    1013, 100, 23, 1013, 98, 23, 1003, 1006, 1177, 101, 96, 46,
    97, 1006, 1180, 1007, 80, 23, 1004, 1002, 1004, 1002,
)
assert yellow[310:360] == (
    1005, 41, 1003, 1000, 1020, 1013, 79, 12, 1014, 70, 1, 1003,
    1006, 1170, 1007, 70, 12, 1004, 1002, 1000, 1014, 72, 1, 1003,
    1006, 1077, 1, 80, 71, 1000, 1012, 71, 1, 1003, 1006, 1176,
    81, 1006, 1180, 1006, 1179, 82, 1007, 72, 12, 1004, 1002, 1004,
    1002, 1004,
)

# Run the original model-21 handler with only allocation/retirement leaves intercepted.
cpu, _ = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x20000)
obj, stack, stop = 0x2000000, 0x201D000, 0x201E000
events = []


def read(address, fmt):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def leaf(uc, address, _size, _user):
    sp = uc.reg_read(UC_X86_REG_ESP)
    events.append("alloc" if address == 0x4ED8A0 else "finish")
    if address == 0x4ED8A0:
        uc.reg_write(UC_X86_REG_EAX, 0)
    uc.reg_write(UC_X86_REG_EIP, read(sp, "I"))
    uc.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x4ED8A0, 0x4EDCF0):
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)


def finishes(before, height):
    events.clear()
    cpu.mem_write(obj, bytes(256))
    cpu.mem_write(0x89D1C8, bytes(4 * 0xC65))
    cpu.mem_write(obj + 0x2F, bytes(1))
    cpu.mem_write(obj + 0x41, struct.pack("<h", height))
    cpu.mem_write(obj + 0x6C, struct.pack("<h", before))
    cpu.mem_write(stack, struct.pack("<II", stop, obj))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x515180, stop, timeout=1_000_000, count=1_000_000)
    return "finish" in events


assert not finishes(0, 0) and events == ["alloc"]
for visit, threshold in ((8, 819), (9, 615), (10, 411), (11, 207), (12, -1)):
    assert not finishes(visit - 1, threshold)
    assert finishes(visit - 1, threshold + 1)

for name, digest in {
    "sky-d.png": "18884313097e5929692ae122efe77303d097b2c540b80ef0382d1be6f81a2242",
    "clouds-d.png": "ec63862289656fc1843de9ebf710acf0aa294d40732bcde9452b90b345df8a1f",
    "clouds-high-d.png": "bda963bb6ba7a56f861220ba6c1cda384263973f40056d8c44f547310c734aae",
}.items():
    assert hashlib.sha256((ROOT / "public/original" / name).read_bytes()).hexdigest() == digest

print("PASS: Mission 19 rewards, objective, bank-d assets, and native Teleport timing")
