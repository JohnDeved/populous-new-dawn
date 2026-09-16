"""Mission 11 ATTACK(requested=0) probe, reusing the reviewed type-20 harness."""
import hashlib
import json
import runpy
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1])
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2011.hdr": "c4d8198e104db05ae55f7f141da41e7fe44ee1cf356b7ce084dfb32a4ba0807b",
    "cpscr022.dat": "ba0b39d07de48ac2493d75b8ae01225707a7443dd828f276b4a4dbdef2d43bc5",
}
for name, digest in EXPECTED.items():
    path = EXE if name == EXE.name else EXE.parent / "levels" / name
    assert hashlib.sha256(path.read_bytes()).hexdigest() == digest

header = (EXE.parent / "levels/levl2011.hdr").read_bytes()
marker17 = struct.unpack_from("<H", header, 100 + 17 * 2)[0]
assert marker17 == 0x765C
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(1, str(ROOT))
sys.argv = ["scripts/check-native-computer-attack.py", str(EXE)]
ns = runpy.run_path(str(ROOT / "scripts/check-native-computer-attack.py"))

cpu = ns["cpu"]
write = ns["write"]
initialize = ns["initialize"]
run = ns["run"]
tasks = ns["tasks"]
red = ns["red"]
markers = ns["markers"]
script = json.loads((ROOT / "app/original-script-eleven.json").read_text())["tribes"]["3"]
attack_words = script["codes"][923:938]
assert attack_words == [
    1006, 1059, 1118, 1, 1070, 134, 18, 88, 135, 135, 1078, 1, 136, 134, 43
]
codes = [
    12, 1003,
    1006, 1115, 88, 1121,
    *attack_words,
    1007, 62, 21,
    1004, 1019,
]

initialize()
write(red + 0xC22, "<B", 3)
write(0x89D188, "<I", 0)
run(script["codes"], script)
write(markers + 17 * 2, "<H", marker17)
spell_stock = 0x96071E + 3 * 56 + 11
write(spell_stock, "<B", 0)
write(0x89D178, "<I", 0x12345678)
run(codes, script)
allocated = tasks()
assert len(allocated) == 1, allocated
task = allocated[0]
taskp = red + 0x36 + task["index"] * 0x52
assert task == {
    "index": 0, "flags": 1, "type": 20, "phase": 0,
    "route": marker17, "original": marker17, "marker": 17,
    "entity": 0, "requested": 0, "damage": 2,
}
assert list(cpu.mem_read(taskp + 0x48, 7)) == [0, 34, 34, 0, 34, 0, 0]
assert cpu.mem_read(taskp + 0x1F, 1)[0] == 11
assert cpu.mem_read(taskp + 0x2B, 1)[0] == 20
assert cpu.mem_read(spell_stock, 1)[0] == 1
assert struct.unpack("<i", cpu.mem_read(ns["program"] + 12288 + 5 * 4, 4))[0] == 1
assert struct.unpack("<I", cpu.mem_read(0x89D178, 4))[0] == 0x12345678

# Supply abundant eligible Warriors, Preachers, and Firewarriors. Requested zero
# must still select nobody and retire without staging, routing, or RNG use.
people = ns["people"]
add_person = ns["add_person"]
native_call = ns["native_call"]
cpu.mem_write(0x890390, bytes(4096))
cpu.mem_write(0x8A03E4, bytes(0x40000))
cpu.mem_write(0xA0D108, bytes(4096))
cpu.mem_write(0x938830, bytes(8000))
write(0x96AA78, "<HH", 1, 0)
models = [3] * 5 + [4] * 5 + [6] * 5
for id_, model in reversed(list(enumerate(models, 1))):
    add_person(id_, model, id_ + 1 if id_ < len(models) else 0)
write(red + 0x881, "<I", people + 256)
phases = []
for _ in range(40):
    native_call(0x4CB400, red, task["index"])
    active = struct.unpack("<I", cpu.mem_read(taskp + 0x3E, 4))[0] & 1
    phase = struct.unpack("<H", cpu.mem_read(taskp + 0x42, 2))[0]
    selected = [
        id_ for id_ in range(1, len(models) + 1)
        if cpu.mem_read(people + id_ * 256 + 0xAF, 1)[0] == task["index"] + 1
    ]
    phases.append((phase, active, selected))
    if not active:
        break
assert phases == [(3, 1, []), (23, 1, []), (23, 0, [])], phases
assert struct.unpack("<I", cpu.mem_read(0x89D178, 4))[0] == 0x12345678

# A full queue still receives the Swamp grant and variable-5 latch; allocation
# failure is therefore one-shot rather than a later retry.
initialize(full=True)
write(red + 0xC22, "<B", 3)
write(0x89D188, "<I", 0)
run(script["codes"], script)
write(markers + 17 * 2, "<H", marker17)
write(spell_stock, "<B", 0)
run(codes, script)
assert not [task for task in tasks() if task["type"] == 20]
assert cpu.mem_read(spell_stock, 1)[0] == 1
assert struct.unpack("<i", cpu.mem_read(ns["program"] + 12288 + 5 * 4, 4))[0] == 1
print("PASS: Mission 11 requested-zero ATTACK grants Swamp, selects nobody, retires RNG-neutral, and latches one-shot")
