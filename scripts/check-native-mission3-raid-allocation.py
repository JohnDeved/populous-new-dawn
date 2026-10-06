#!/usr/bin/env python3
"""Bounded original Mission3 ATTACK allocator versus the actual campaign adapter.

Controlled fixtures, not ordinary gameplay acceptance. Only the three population
reads are supplied. Allocation/gates/target selection/geometry/RNG execute natively.
Stop and print both observations at the first paired difference; no runtime repair.
"""
import argparse
import gc
import hashlib
import json
import os
import resource
import signal
import struct
import subprocess
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, load_native_shapes

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_INPUTS = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'levels/cpscr012.dat': 'd5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601',
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/shapes.dat': 'ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849',
}
MEM, SIZE = 0x2000000, 0x40000
OBJECTS, SHAPES, PROGRAM = MEM, MEM + 0x4000, MEM + 0x8000
ENTITIES, STACK, STOP = MEM + 0xC000, MEM + 0x3D000, MEM + 0x3E000
TRIBES, AI, ATTRS = 0x89D1C8, 0x89D1C8 + 2 * 0xC65, 0x9607EA + 2 * 48
TASK_BASE, STRIDE = AI + 0x36, 0x52
RNG = 0x89D178
OBSERVE = {
    0x461D70: 1, 0x4F52C0: 1, 0x4D1420: 1,
    0x48C6B0: 2, 0x48FC50: 2, 0x4E5FD0: 14,
    0x4627F0: 3, 0x462D40: 2, 0x462730: 1, 0x462790: 7, 0x462CA0: 2,
    0x4F5240: 2, 0x4F6100: 1, 0x4F6180: 1, 0x404420: 2, 0x48C650: 3,
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class Probe:
    def __init__(self, executable, fixture, case, program):
        self.fixture, self.case = fixture, case
        self.cpu, self.identity = native_cpu(executable)
        self.cpu.mem_map(MEM, SIZE)
        self.events, self.reads, self.rng_writes = [], [], []
        self.stage = 'initializer'
        for address, count in OBSERVE.items():
            self.cpu.hook_add(UC_HOOK_CODE, self.observe, count, begin=address, end=address)
        for address in (0x4CB400, 0x4F8490):
            self.cpu.hook_add(UC_HOOK_CODE, self.forbidden, begin=address, end=address)
        self.cpu.hook_add(UC_HOOK_CODE, self.population, begin=0x48F350, end=0x48F350)
        self.cpu.mem_write(TRIBES, bytes(4 * 0xC65))
        for tribe in range(4):
            self.write(TRIBES + tribe * 0xC65 + 0xC22, 'B', tribe)
        self.call(0x461D70, AI)
        self.cpu.mem_write(ATTRS, bytes(fixture['attributes']))
        self.write(AI + 0x59A, 'I', fixture['states'] if case['enabled']
                   else fixture['states'] & ~(1 << 20))
        self.write(0x89D188, 'I', fixture['turn'])
        self.write(RNG, 'I', fixture['seed'])
        self.cpu.mem_write(PROGRAM, program)
        load_native_shapes(self.cpu, executable, OBJECTS, SHAPES)
        self.cpu.mem_write(0x890390, bytes(1024 * 4))
        buildings = fixture['buildings']
        assert len(buildings) == 2 and len({b['id'] for b in buildings}) == 2
        assert len({b['object'] for b in buildings}) == 1 and buildings[0]['object'] == 131
        for i, b in enumerate(buildings):
            assert 0 < b['id'] < 1024 and b['model'] == 1 and b['angle'] in (0, 512)
            address = ENTITIES + i * 256
            self.cpu.mem_write(address, bytes(256))
            self.write(address + 8, 'I', ENTITIES + (i + 1) * 256 if i + 1 < len(buildings) else 0)
            self.write(address + 0x24, 'H', b['id'])
            self.write(address + 0x26, 'h', b['angle'])
            self.write(address + 0x2A, 'BBB', 2, b['model'], 2)
            self.write(address + 0x2F, 'B', 0)
            self.write(address + 0x33, 'h', b['object'])
            self.write(address + 0x7A, 'HH', b['anchorX'], b['anchorY'])
            self.write(0x890390 + b['id'] * 4, 'I', address)
        self.write(TRIBES + 0x885, 'I', ENTITIES)
        self.write(TRIBES + 0x925, 'I', len(buildings))
        occupied = [t['index'] for t in case['occupied']]
        assert len(occupied) == len(set(occupied)) and all(0 <= i < 10 for i in occupied)
        for task in case['occupied']:
            self.write(TASK_BASE + STRIDE * task['index'] + 0x3E, 'I', 1)
            self.write(TASK_BASE + STRIDE * task['index'] + 0x4F, 'B', task['type'])
        self.before = bytes(self.cpu.mem_read(TASK_BASE, STRIDE * 10))
        self.attributes_before = list(self.cpu.mem_read(ATTRS, 48))
        self.cpu.hook_add(UC_HOOK_MEM_WRITE, self.random_write, begin=RNG, end=RNG + 3)
        self.stage = 'raid-block'

    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(self, address, fmt='I'):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def args(self, count):
        return list(struct.unpack('<' + 'I' * count,
                                 self.cpu.mem_read(self.cpu.reg_read(UC_X86_REG_ESP) + 4, count * 4)))

    def observe(self, cpu, address, size, count):
        assert len(self.events) < 128, 'Unexpectedly large function trace'
        self.events.append({'stage': self.stage, 'routine': f'{address:08x}',
                            'args': self.args(count), 'rng': self.read(RNG)})

    def forbidden(self, cpu, address, size, user):
        raise AssertionError(f'PhaseA reached deferred recruitment/controller {address:08x}')

    def random_write(self, cpu, access, address, size, value, user):
        assert address == RNG and size == 4 and len(self.rng_writes) < 4
        self.rng_writes.append({'pc': cpu.reg_read(UC_X86_REG_EIP), 'value': value & 0xFFFFFFFF})

    def population(self, cpu, address, size, user):
        field = self.args(3)[2]
        kind, value = self.read(field), self.read(field + 4, 'i')
        if kind != 2 or str(value) not in self.fixture['populations']:
            return
        self.reads.append(value)
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, self.fixture['populations'][str(value)])
        cpu.reg_write(UC_X86_REG_EIP, self.read(sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def call(self, address, *args):
        self.write(STACK, 'I' * (len(args) + 1), STOP, *args)
        self.cpu.reg_write(UC_X86_REG_ESP, STACK)
        self.cpu.emu_start(address, STOP, timeout=1_000_000, count=2_000_000)
        assert self.cpu.reg_read(UC_X86_REG_EIP) == STOP, f'Native limit reached at {self.cpu.reg_read(UC_X86_REG_EIP):08x}'
        return self.cpu.reg_read(UC_X86_REG_EAX)

    def run(self):
        self.call(0x48C6B0, AI, PROGRAM)
        after = bytes(self.cpu.mem_read(TASK_BASE, STRIDE * 10))
        allocated = []
        for index in range(10):
            offset, address = index * STRIDE, TASK_BASE + index * STRIDE
            if struct.unpack_from('<I', self.before, offset + 0x3E)[0] & 1 or not self.read(address + 0x3E) & 1:
                continue
            allocated.append({
                'index': index, 'flags': self.read(address + 0x3E),
                'type': self.read(address + 0x4F, 'B'), 'phase': self.read(address + 0x42, 'H'),
                'entity': self.read(address + 0x32), 'target': self.read(address + 0x10, 'H'),
                'origin': self.read(address + 0x1A, 'H'), 'requested': self.read(address + 0x36, 'i'),
                'damage': self.read(address + 0x3A, 'i'), 'marker': self.read(address + 0x23, 'B'),
                'quotas': list(self.cpu.mem_read(address + 0x48, 6)),
                'retreatPercent': self.read(address + 0x2B, 'B'),
                'spells': list(self.cpu.mem_read(address + 0x1F, 3)),
            })
        occupied_unchanged = all(
            self.before[t['index'] * STRIDE:(t['index'] + 1) * STRIDE]
            == after[t['index'] * STRIDE:(t['index'] + 1) * STRIDE]
            for t in self.case['occupied'])
        result = {'name': self.case['name'], 'rng': self.read(RNG), 'reads': self.reads,
                  'allocated': allocated, 'occupiedUnchanged': occupied_unchanged,
                  'attributes': list(self.cpu.mem_read(ATTRS, 48))}
        assert bool(allocated) == self.case['nativeAllocation'], result
        return result, {'events': self.events, 'rngWrites': self.rng_writes,
                        'attributesBefore': self.attributes_before,
                        'taskBytesBefore': self.before.hex(), 'taskBytesAfter': after.hex()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('executable', type=Path)
    parser.add_argument('--node', required=True, type=Path)
    args = parser.parse_args()
    # Independent of the outer receipt runner. Normal timeout is a failed probe.
    signal.alarm(60)
    resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    executable = args.executable.resolve()
    for relative, expected in EXPECTED_INPUTS.items():
        assert sha(executable.parent / relative) == expected, relative
    fixture_path = ROOT / 'tests/fixtures/mission3-raid-allocation.json'
    fixture = json.loads(fixture_path.read_text())
    script = json.loads((ROOT / 'app/original-script-three.json').read_text())
    assert fixture['scriptSha256'] == script['sha256']
    assert fixture['tribe'] == 2 and fixture['turn'] == 2046
    assert len(fixture['cases']) == 5 and len(fixture['attributes']) == 48
    assert fixture['attributes'][25] == 1 and fixture['states'] & (1 << 20)
    assert fixture['block'] == [796, 833]
    codes = [12, 1003, *script['codes'][796:833], 1004, 1019]
    program = bytearray(12552)
    struct.pack_into('<' + 'H' * len(codes), program, 0, *codes)
    for index, field in enumerate(script['fields']):
        struct.pack_into('<Ii', program, 8192 + index * 8, *field)
    struct.pack_into('<64i', program, 12288, *script['variables'])
    # Run the actual adapter in a separate short-lived process before the native
    # address-space limit; V8 reserves virtual memory beyond its explicit heap cap.
    pair = subprocess.run([str(args.node), '--max-old-space-size=256',
                           str(ROOT / 'scripts/mission3-raid-allocation-pair.mjs'), str(fixture_path)],
                          cwd=ROOT, text=True, capture_output=True, timeout=20,
                          env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'})
    assert pair.returncode == 0, pair.stderr
    assert len(pair.stdout) < 65536, 'Unexpectedly large portable output'
    portable = json.loads(pair.stdout)
    assert len(portable) == 5
    resource.setrlimit(resource.RLIMIT_AS, (1024 ** 3, 1024 ** 3))
    report = {'scope': 'controlled allocator composition; no ordinary gameplay acceptance',
              'sourceHead': fixture['sourceHead'], 'fixtureSha256': sha(fixture_path),
              'attributesBytesSha256': hashlib.sha256(bytes(fixture['attributes'])).hexdigest(),
              'programBytesSha256': hashlib.sha256(program).hexdigest(),
              'inputSha256': EXPECTED_INPUTS,
              'interceptedConsumers': {'0048f350': 'only internal1153/2/1 population reads'},
              'deferredConsumers': ['004cb400 task execution', '004f8490 recruitment', 'person/path/combat'],
              'cases': []}
    for case, actual in zip(fixture['cases'], portable, strict=True):
        probe = Probe(executable, fixture, case, bytes(program))
        native, detail = probe.run()
        projected = {key: actual[key] for key in native}
        different = [key for key in native if native[key] != projected[key]]
        report['cases'].append({'native': native, 'portable': actual, 'nativeDetail': detail,
                                'differentFields': different})
        del probe  # Only one native CPU/image is live at a time.
        gc.collect()  # Release bound-hook cycles before constructing the next CPU.
        if different:
            report['status'] = 'mismatch; stopped before remaining native cases'
            print(json.dumps(report, indent=2))
            return 1
    report['status'] = 'passed bounded allocator composition'
    print(json.dumps(report, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
