"""Bounded M16 Yellow training producer probe; school/availability leaves supplied."""
import hashlib
import json
import struct
import sys
from pathlib import Path

from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

EXE = Path(sys.argv[1])
SHA = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == SHA
ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(sys.argv[2])
SCRIPT_SHA = "22ece8e21540d8ca760230842a2eed1dde60f229e1fbccf050a08701525d7bc7"
assert hashlib.sha256(SCRIPT.read_bytes()).hexdigest() == SCRIPT_SHA
imported = json.loads((ROOT / "app/original-script-sixteen.json").read_text())["tribes"]["2"]
assert list(struct.unpack_from("<4096H", SCRIPT.read_bytes()))[570:639] == imported["codes"][570:639]
cpu, _ = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x60000)
ai, building, stack, stop = 0x2000000, 0x2002000, 0x205D000, 0x205E000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=500000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


queries = []
available = 6
training_building = 7


def leaf(_cpu, address, _size, _user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x4F67B0:
        queries.append(["available"])
        ret(available)
    elif address == 0x4F6730:
        queries.append(["housingOrders"])
        ret(0)
    else:
        model = read(sp + 8)
        queries.append(["building", model])
        ret(42 if model == training_building else 0)


for address in (0x4F67B0, 0x4F6730, 0x4F36D0):
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)


# 00486160 copies the selected CPATR's bytes80:136 to each enemy's 56-byte profile.
header = SCRIPT.with_name("levl2016.hdr").read_bytes()
assert hashlib.sha256(header).hexdigest() == "748693a7571d36053bd45f5ba2a58f4c48e72cc9eaa35325b1257b0079873ef7"
assert header[90] == 26
profile = SCRIPT.with_name("cpatr026.dat").read_bytes()
assert hashlib.sha256(profile).hexdigest() == "068e7db22ef7a90be9acc632bd0c0ccc365a0c437f707b7bfc63bb6e5409f8f5"
cpu.mem_write(0x96070A + 2 * 56, profile[80:136])
enabled = {model: call(0x408DD0, model, 2) for model in [5,6,7,8]}
assert all(enabled.values()), enabled
assert struct.unpack("<4h", cpu.mem_read(0x5D5500, 8)) == (6, 5, 7, 8)
assert struct.unpack("<4h", cpu.mem_read(0x5D5508, 8)) == (5, 6, 7, 8)
assert struct.unpack("<4h", cpu.mem_read(0x5D5510, 8)) == (4, 5, 3, 6)
results = []
for training_building, person_model, preference, attribute in [(5,4,20,6),(6,5,5,5),(7,3,25,7),(8,6,25,8)]:
  for available in [4,5,6]:
    cpu.mem_write(ai, bytes(0xC65))
    cpu.mem_write(0x9607EA + 2 * 48, bytes(48))
    write(ai + 0x59A, "I", 1 << 6)
    write(ai + 0xC22, "B", 2)
    write(ai + 0x91D, "I", 40)
    write(ai + 0xB7D + training_building * 2, "H", 1)
    write(0x9607EA + 2 * 48 + attribute, "B", preference)
    write(0x89D178, "I", 0x12345678)
    queries.clear()
    result = call(0x4E59A0, ai, 0)
    assert result == int(available >= 5)
    assert read(0x89D178) == 0x32BE789B
    if result:
      assert (read(ai + 0x85, "B"),read(ai + 0x68),read(ai + 0x6C)) == (6,42,0)
    results.append({"building":training_building,"person":person_model,"preference":preference,"available":available,"accepted":result,"queries":list(queries)})
print(json.dumps({"exeSha256":SHA,"scriptSha256":SCRIPT_SHA,"authoredEnabledSchools":enabled,"suppliedLeaves":["completed school lookup", "available people", "housing-order people"],"cases":results},indent=2))
