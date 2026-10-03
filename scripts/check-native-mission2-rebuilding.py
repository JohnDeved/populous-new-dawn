"""Probe actual Mission 2 construction gates and the retained native base lifecycle.

Original instructions run in Unicorn only. Producer and phase-3 base/plan geometry
cases have no intercepted leaves. The phase-0 search-entry probe intercepts only
site-search 004f7aa0, so it does not certify site choice or whole-game timing.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, load_native_shapes

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1]).resolve()
SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == SHA
profile = [4,0,0,0,0,0,0,0,0,1,3,0,100,0,2,1,0,0,45,0,0,0,0,0,255,1,0,0,50,1,0,0,0,1,0,0,0,0,0,0,30,0,0,12,0,0,0,0]
header = (EXE.parent / 'levels/levl2002.hdr').read_bytes()
assert hashlib.sha256(header).hexdigest() == '44be9f709f03f4b4d936d86056256e7bb98683088332b4bb47354ad709ea8a49'
assert header[91] == 74
cpatr = (EXE.parent / 'levels/cpatr074.dat').read_bytes()
assert len(cpatr) == 144
assert hashlib.sha256(cpatr).hexdigest() == '5e9653ab4ec0a8d40c799ab9cd301a5ec4567ca7bb1335c5d7bdf43f8342ea5b'
assert struct.unpack_from('<III', cpatr, 84) == (0x2109E, 0, 0)
shapes = json.loads((ROOT / 'app/original-shapes.json').read_text())
AI, PEOPLE, BUILDINGS = 0x89D1C8 + 3 * 0xC65, 0x2020000, 0x2030000
STACK, STOP = 0x205D000, 0x205E000

class Probe:
    def __init__(self):
        self.cpu, _ = native_cpu(EXE)
        configure_native_constants(self.cpu, EXE)
        self.cpu.mem_map(0x2000000, 0x60000)
        self.cpu.mem_write(AI, bytes(0xC65))
        self.write(AI + 0xC22, 'B', 3)
        self.write(AI + 0x5B4, 'B', 1)
        self.call(0x461D70, AI)
        assert self.read(AI + 0x5B4, 'B') == 0
        self.cpu.mem_write(0x9607EA + 3 * 48, bytes(profile))
        self.cpu.mem_write(0x96070A + 3 * 56, cpatr[80:136])
        self.write(AI + 0x596, 'I', 0x120)
        self.write(AI + 0x59A, 'I', 1181419)
        self.write(AI + 0x5A2, 'H', 0x8062)
        self.write(AI + 0x5A4, 'H', 0x8232)
        self.write(0x89D178, 'I', 0x12345678)
    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))
    def read(self, address, fmt='I'):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    def call(self, address, *values):
        self.write(STACK, 'I' * (len(values) + 1), STOP, *values)
        self.cpu.reg_write(UC_X86_REG_ESP, STACK)
        self.cpu.emu_start(address, STOP, timeout=1000000, count=2000000)
        assert self.cpu.reg_read(UC_X86_REG_EIP) == STOP
        return self.cpu.reg_read(UC_X86_REG_EAX)
    def people(self, available):
        self.write(AI + 0x881, 'I', PEOPLE if available else 0)
        for index in range(available):
            person = PEOPLE + index * 256
            self.write(person + 8, 'I', person + 256 if index + 1 < available else 0)
            self.write(person + 0x2A, 'BBB', 1, 2, 17)
            self.write(person + 0x2F, 'B', 3)
    def buildings(self, tower, huts):
        models = ([4] if tower else []) + [1] * huts
        self.write(AI + 0xB85, 'H', int(tower))
        self.write(AI + 0x885, 'I', BUILDINGS if models else 0)
        for index, model in enumerate(models):
            building = BUILDINGS + index * 256
            self.write(building + 8, 'I', building + 256 if index + 1 < len(models) else 0)
            self.write(building + 0x2A, 'BBB', 2, model, 2)
            self.write(building + 0x2F, 'B', 3)

producer = []
for base, tower, huts, available, disabled, occupied, model in [
    (False, True, 3, 2, False, False, 4),
    (True, True, 3, 2, False, False, 0),
    (True, False, 3, 2, False, False, 4),
    (True, True, 0, 2, False, False, 1),
    (True, False, 0, 2, False, False, 4),
    (True, True, 1, 2, False, False, 0),
    (False, True, 3, 1, False, False, 0),
    (False, True, 3, 2, True, False, 0),
    (False, True, 3, 2, False, True, 0),
]:
    p = Probe()
    p.people(available)
    p.buildings(tower, huts)
    p.write(AI + 0x5B4, 'B', int(base))
    p.write(AI + 0x36A, 'H', 0x8234)
    if disabled:
        p.write(AI + 0x596, 'I', 0x520)
    if occupied:
        p.write(AI + 0x74, 'I', 1)
    result = p.call(0x4E5580, AI, int(occupied))
    assert result == int(model != 0)
    if model:
        assert (p.read(AI + 0x74), p.read(AI + 0x85, 'B'), p.read(AI + 0x68),
                p.read(AI + 0x6C), p.read(AI + 0x78, 'H')) == (1, 0, model, 0x8234 if base else 0x8062, 0)
    assert p.read(0x89D178) == 0x12345678
    producer.append({'baseEstablished': base, 'tower': tower, 'huts': huts,
                     'available': available, 'towerModeDisabled': disabled,
                     'constructionOccupied': occupied, 'requestedModel': model})

# Tower phase0 uses the authored coordinate latch, not the request's base origin.
p = Probe()
p.people(2)
p.buildings(True, 3)
assert p.call(0x4E5580, AI, 0) == 1
searches = []
def search(_cpu, _address, _size, _user):
    searches.append({'searchCell': p.read(AI + 0x36, 'H'), 'origin': p.read(AI + 0x6C),
                     'rotation': p.read(AI + 0x44, 'B'), 'rng': p.read(0x89D178)})
    sp = p.cpu.reg_read(UC_X86_REG_ESP)
    p.cpu.reg_write(UC_X86_REG_EAX, 0)
    p.cpu.reg_write(UC_X86_REG_EIP, p.read(sp))
    p.cpu.reg_write(UC_X86_REG_ESP, sp + 4)
p.cpu.hook_add(UC_HOOK_CODE, search, begin=0x4F7AA0, end=0x4F7AA0)
p.call(0x4C6DA0, AI, 0)
assert searches == [{'searchCell': 0x8232, 'origin': 0x8062, 'rotation': 3, 'rng': 0x32BE789B}]

# Actual phase3 and plan-exterior helper establish the even cell exactly once.
lifecycle = []
for rotation in range(4):
    for existing, exact in ((False, False), (True, False), (False, True)):
        p = Probe()
        load_native_shapes(p.cpu, EXE, 0x2000000, 0x2004000)
        cell, plan = 0x8434, BUILDINGS
        shape = shapes['shapes'][shapes['objects'][79][rotation]]
        start = (((cell & 255) - shape['x']) & 254) | ((((cell >> 8) - shape['y']) & 254) << 8)
        p.write(AI + 0x36, 'H', cell)
        p.write(AI + 0x70, 'I', int(exact))
        p.write(AI + 0x78, 'H', 3)
        p.write(AI + 0x5B4, 'B', int(existing))
        p.write(AI + 0x36A, 'H', 0x1234)
        p.write(plan + 0x24, 'H', 1)
        p.write(plan + 0x2A, 'B', 9)
        p.write(plan + 0x68, 'H', start)
        p.write(plan + 0x9B, 'B', shapes['objects'][79][rotation])
        p.write(plan + 0x9E, 'B', 4)
        p.write(0x890394, 'I', plan)
        index = ((cell & 0xFE00) >> 9) * 128 + ((cell & 254) >> 1)
        p.write(0x8A03EC + index * 16, 'H', 1)
        p.call(0x4C6DA0, AI, 0)
        x = (((start & 254) << 8) + shape['outside'][0] * 64) & 65535
        y = ((start & 0xFE00) + shape['outside'][1] * 64) & 65535
        expected = 0x1234 if existing or exact else ((x >> 8) & 254) | (y & 0xFE00)
        assert p.read(AI + 0x36A, 'H') == expected
        assert p.read(AI + 0x5B4, 'B') == int(existing or not exact)
        assert p.read(AI + 0x78, 'H') == 4
        assert p.read(0x89D178) == 0x12345678
        lifecycle.append({'rotation': rotation, 'existingBase': existing, 'exactPlacement': exact,
                          'baseCell': expected, 'phase': 4})
print(json.dumps({'executableSha256': SHA, 'cpatrSha256': hashlib.sha256(cpatr).hexdigest(),
                  'producer': producer, 'searchEntry': searches, 'baseLifecycle': lifecycle}, indent=2))
print('PASS: M2 initial/rebuilding gates, authored search latch and native construction-base lifecycle')
