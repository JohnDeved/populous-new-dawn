#!/usr/bin/env python3
"""Frozen original/live-adapter first-selection cases, then stop.

Supplied phase-3/world records; no original world loading or person preparation.
Requires exact-source preflight and a separately granted execution lane.
"""
import argparse
import gc
import hashlib
import json
import os
import resource
import selectors
import signal
import struct
import subprocess
import sys
import time
from pathlib import Path

from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / 'tests/fixtures/mission3-raid-recruitment.json'
ENTRY, BOUNDARY = 0x4CB400, 0x4CB6DA
TRIBES, AI = 0x89D1C8, 0x89D1C8 + 2 * 0xC65
TASK, RNG, OUTPUT = AI + 0x36, 0x89D178, 0xA0D108
MEM, SIZE, STACK, RETURN = 0x2000000, 0x40000, 0x203D000, 0x203E000
TCG = 16 * 1024 * 1024
OBSERVE = {ENTRY: 2, 0x4F6020: 1, 0x4F8490: 9, 0x4F8390: 5,
           0x4F7720: 1, 0x4F61F0: 1, 0x4F25B0: 1, 0x4F39D0: 1,
           0x4DF1C0: 1, 0x4DF0E0: 1, 0x4F55D0: 1, 0x49C720: 2,
           0x4F62C0: 2, 0x4F6720: 1}
ABORT = [0x4ED6F0, 0x4ED640, 0x4CB75A, 0x4CB7B2, 0x435730, 0x435780,
         0x4359B0, 0x4EA920, 0x4CB824, 0x4CCEB0, 0x4F25A0, 0x4F3200, 0x465650]
FIELDS = ['selector', 'count', 'ids', 'ranks', 'flags3', 'task', 'rng']


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class Portable:
    """One parked adapter. A request executes one case; no batch precomputation."""
    def __init__(self, node, fixture_path, maximum):
        assert maximum in (1, 2, 3)
        self.maximum = maximum
        self.process = subprocess.Popen(
            [str(node), '--max-old-space-size=256', '--experimental-test-module-mocks',
             str(ROOT / 'scripts/mission3-raid-recruitment-pair.mjs'), str(fixture_path)],
            cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            bufsize=0, env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1', 'NODE_OPTIONS': '', 'NODE_PATH': ''})
        self.deadline = time.monotonic() + 20
        self.streams = selectors.DefaultSelector()
        self.streams.register(self.process.stdout, selectors.EVENT_READ, 'out')
        self.streams.register(self.process.stderr, selectors.EVENT_READ, 'err')
        self.errors = bytearray()
        self.calls = 0

    def call(self, index):
        assert index == self.calls and index < self.maximum
        self.process.stdin.write((json.dumps({'caseIndex': index}) + '\n').encode())
        self.process.stdin.flush()
        output = bytearray()
        while b'\n' not in output:
            remaining = self.deadline - time.monotonic()
            assert remaining > 0, 'Portable process exceeded 20 seconds'
            events = self.streams.select(remaining)
            assert events, 'Portable response timed out'
            for key, _ in events:
                data = os.read(key.fd, 8192)
                if not data:
                    self.streams.unregister(key.fileobj)
                    assert key.data != 'out', f'Portable exited before response: {self.errors.decode()}'
                    continue
                if key.data == 'err':
                    self.errors.extend(data)
                    assert len(self.errors) <= 16384, 'Portable stderr limit'
                else:
                    output.extend(data)
                    assert len(output) <= 65536, 'Portable stdout limit'
        assert output.count(b'\n') == 1 and output.endswith(b'\n'), 'Unexpected adapter output'
        self.calls += 1
        return json.loads(output)

    def close(self):
        self.process.stdin.close()
        try:
            self.process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait(timeout=2)
            raise AssertionError('Parked portable process did not close')
        tail = self.process.stdout.read(65537)
        self.errors.extend(self.process.stderr.read(16385))
        self.streams.close()
        assert not tail, 'Adapter computed an unsolicited response'
        assert len(self.errors) <= 16384 and self.process.returncode == 0, self.errors.decode()
        return self.errors.decode()


class Probe:
    def __init__(self, executable, fixture, case):
        self.fixture, self.case = fixture, case
        self.cpu, self.identity = native_cpu(executable, tcg_buffer_size=TCG)
        self.tcg = self.cpu.ctl_get_tcg_buffer_size()
        assert 0 < self.tcg <= TCG
        self.cpu.mem_map(MEM, SIZE)
        self.cpu.mem_write(TRIBES, bytes(4 * 0xC65))
        self.cpu.mem_write(0x890390, bytes(1024 * 4))
        self.cpu.mem_write(0x938830, bytes(8000))
        self.cpu.mem_write(OUTPUT, bytes(400))
        for tribe in range(4):
            self.write(TRIBES + tribe * 0xC65 + 0xC22, 'B', tribe)
        self.write(AI + 0x596, 'I', fixture['aiFlags'])
        self.write(AI + 0x59A, 'I', 1 << 20)
        self.write(AI + 0x5B3, 'B', fixture['selectionOwner'])
        self.write(AI + 0x5B5, 'B', fixture['queueCursor'])
        self.write(AI + 0x46E, 'H', fixture['defencePosition'])
        self.write(AI + 0x5BE, 'B', fixture['defenceRadius'])
        self.write(AI + 0x5B4, 'B', case['hasConstructionBase'])
        self.write(AI + 0x36A, 'H', case['constructionBaseCell'])
        self.write(AI + 0x36C, 'B', case['nativeBaseRadius'])
        self.write(AI + 0x5A2, 'H', fixture['shamanCell'])
        self.write(RNG, 'I', fixture['seed'])
        self.write(0x89D188, 'I', fixture['turn'])
        self.write(TASK + 0x3E, 'I', 1)
        self.write(TASK + 0x4F, 'B', 20)
        self.write(TASK + 0x42, 'H', 3)
        self.write(TASK + 0x36, 'i', 3)
        self.cpu.mem_write(TASK + 0x48, bytes(fixture['task']['quotaBytes']))
        self.addresses = {person['id']: MEM + i * 256 for i, person in enumerate(fixture['people'])}
        for p in fixture['people']:
            address = self.addresses[p['id']]
            self.cpu.mem_write(address, bytes(256))
            self.write(0x890390 + p['id'] * 4, 'I', address)
            self.write(address + 0x24, 'H', p['id'])
            self.write(address + 0x2A, 'BBB', 1, p['model'], p['state'])
            self.write(address + 0x2F, 'B', p['tribe'])
            self.write(address + 0x3D, 'HH', p['x'], p['y'])
            self.write(address + 0xC, 'III', p['flags2'], p['flags4'], p['flags3'])
            self.write(address + 0x76, 'H', p['assignment'])
            self.write(address + 0xAF, 'B', p['busy'])
            self.write(address + 0x9F, 'H', p['vehicle'])
            self.write(address + 0x8B, '8H', *p['commands'])
            self.write(address + 0x9B, 'H', p['immediateCommand'])
            self.write(address + 0xA6, 'B', p['commandCursor'])
        order = fixture['listOrder']
        for i, person in enumerate(order):
            self.write(self.addresses[person] + 8, 'I', self.addresses[order[i + 1]] if i + 1 < len(order) else 0)
        self.write(AI + 0x881, 'I', self.addresses[order[0]])
        if 'liveShamanId' in case:
            self.write(AI + 0x89D, 'I', self.addresses[case['liveShamanId']] if case['liveShamanId'] else 0)
        self.write(STACK, 'III', RETURN, AI, 0)
        self.cpu.reg_write(UC_X86_REG_ESP, STACK)
        self.before_tasks = bytes(self.cpu.mem_read(TASK, 10 * 82))
        self.before_people = {id_: bytes(self.cpu.mem_read(address, 256)) for id_, address in self.addresses.items()}
        self.before_orders = bytes(self.cpu.mem_read(0x938830, 8000))
        self.input_people = []
        linked = self.read(AI + 0x881)
        for id_ in order:
            assert linked == self.addresses[id_]
            self.input_people.append({
                'id': self.read(linked + 0x24, 'H'), 'class': self.read(linked + 0x2A, 'B'),
                'model': self.read(linked + 0x2B, 'B'), 'state': self.read(linked + 0x2C, 'B'),
                'tribe': self.read(linked + 0x2F, 'B'), 'x': self.read(linked + 0x3D, 'H'),
                'y': self.read(linked + 0x3F, 'H'), 'flags2': self.read(linked + 0xC),
                'flags3': self.read(linked + 0x14), 'flags4': self.read(linked + 0x10),
                'assignment': self.read(linked + 0x76, 'H'), 'busy': self.read(linked + 0xAF, 'B'),
                'vehicle': self.read(linked + 0x9F, 'H'), 'driver': 0, 'inside': 0,
                'immediateCommand': self.read(linked + 0x9B, 'H'),
                'commands': list(struct.unpack('<8H', self.cpu.mem_read(linked + 0x8B, 16))),
                'commandCursor': self.read(linked + 0xA6, 'B')})
            linked = self.read(linked + 8)
        assert linked == 0
        self.trace, self.selector, self.stopped = [], None, False
        for address, count in OBSERVE.items():
            self.cpu.hook_add(UC_HOOK_CODE, self.observe, count, begin=address, end=address)
        for address in ABORT:
            self.cpu.hook_add(UC_HOOK_CODE, self.forbidden, begin=address, end=address)
        self.cpu.hook_add(UC_HOOK_CODE, self.stop, begin=BOUNDARY, end=BOUNDARY)
        self.cpu.hook_add(UC_HOOK_MEM_WRITE, self.guard_write)

    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(self, address, fmt='I'):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def args(self, count):
        return list(struct.unpack('<' + 'I' * count, self.cpu.mem_read(self.cpu.reg_read(UC_X86_REG_ESP) + 4, count * 4)))

    def observe(self, cpu, address, size, count):
        assert len(self.trace) < 128, 'Native call trace limit'
        args = self.args(count)
        self.trace.append({'entry': f'{address:08x}', 'args': args})
        if address == 0x4F8490:
            assert self.selector is None
            assert args[:5] == [AI, 2, 2, 0xFFFFFFFF, 1] and args[6:] == [7, 3, OUTPUT]
            self.selector_raw_args = args
            self.selector = dict(model=2, alternative=2, target=-1, mode=1,
                                 origin=args[5] & 65535, flags=7, requested=3)
            expected = self.case['constructionBaseCell'] if self.case['hasConstructionBase'] else self.fixture['shamanCell']
            assert self.selector['origin'] == expected

    def forbidden(self, cpu, address, size, user):
        raise AssertionError(f'Deferred or unexpected native entry {address:08x}')

    def guard_write(self, cpu, access, address, size, value, user):
        allowed = [(MEM + 0x30000, MEM + SIZE), (OUTPUT, OUTPUT + 400),
                   (TASK + 8, TASK + 12), (TASK + 0x25, TASK + 0x26)]
        allowed.extend((p + 0x14, p + 0x18) for p in self.addresses.values())
        assert any(start <= address and address + size <= end for start, end in allowed), f'Unexpected write {address:08x}+{size}'

    def stop(self, cpu, address, size, user):
        assert address == BOUNDARY and self.selector is not None
        self.stopped = True
        cpu.emu_stop()

    def run(self):
        self.cpu.emu_start(ENTRY, RETURN, timeout=1_000_000, count=2_000_000)
        assert self.stopped and self.cpu.reg_read(UC_X86_REG_EIP) == BOUNDARY
        stack_args = list(struct.unpack('<9I', self.cpu.mem_read(self.cpu.reg_read(UC_X86_REG_ESP), 36)))
        assert stack_args == self.selector_raw_args, 'Stop must precede caller argument cleanup'
        count = self.cpu.reg_read(UC_X86_REG_EAX)
        assert 0 <= count <= 3
        scratch = bytes(self.cpu.mem_read(OUTPUT, 400))
        ranks = [dict(zip(('distance', 'id'), struct.unpack_from('<HH', scratch, 4 * i))) for i in range(count)]
        ids = [entry['id'] for entry in ranks]
        assert len(ids) == len(set(ids)) and set(ids) <= self.addresses.keys()
        expected_tasks = bytearray(self.before_tasks)
        struct.pack_into('<I', expected_tasks, 8, 1)
        expected_tasks[0x25] = 1
        tasks_after = bytes(self.cpu.mem_read(TASK, 10 * 82))
        assert tasks_after == expected_tasks, 'Task writes escaped first-selector boundary'
        people_after, flags = {}, []
        for id_, address in self.addresses.items():
            expected = bytearray(self.before_people[id_])
            if id_ in ids:
                struct.pack_into('<I', expected, 0x14, struct.unpack_from('<I', expected, 0x14)[0] & ~1)
            actual = bytes(self.cpu.mem_read(address, 256))
            assert actual == expected, f'Unexpected person mutation: {id_}'
            people_after[str(id_)] = actual.hex()
            flags.append({'id': id_, 'value': self.read(address + 0x14)})
        assert bytes(self.cpu.mem_read(0x938830, 8000)) == self.before_orders
        assert self.read(RNG) == self.fixture['seed']
        assert self.read(AI + 0x5B5, 'B') == self.fixture['queueCursor']
        assert [event['entry'] for event in self.trace].count('004f6020') == 1
        comparison = {'selector': self.selector, 'count': count, 'ids': ids, 'ranks': ranks,
                      'flags3': flags, 'task': {'type': self.read(TASK + 0x4F, 'B'),
                      'phase': self.read(TASK + 0x42, 'H'), 'selected': self.read(TASK + 0xC, 'h'),
                      'cursor': self.read(TASK + 0x25, 'B'), 'requested': self.read(TASK + 0x36, 'i'),
                      'quotas': list(self.cpu.mem_read(TASK + 0x48, 6)), 'flags': self.read(TASK + 0x3E),
                      'entity': self.read(TASK + 0x32, 'H')}, 'rng': self.read(RNG)}
        return {'id': self.case['id'], 'comparison': comparison,
                'inputs': {'tribe': {'hasBase': bool(self.read(AI + 0x5B4, 'B')),
                           'base': self.read(AI + 0x36A, 'H'), 'shaman': self.read(AI + 0x5A2, 'H'),
                           'radius': self.read(AI + 0x36C, 'B')},
                           'people': self.input_people, 'listOrder': self.fixture['listOrder'], 'orders': [],
                           'liveShamanPointer': self.read(AI + 0x89D), 'retainedShamanCell': self.read(AI + 0x5A2, 'H')},
                'detail': {'stopPc': f'{self.cpu.reg_read(UC_X86_REG_EIP):08x}', 'selectorStackAtStop': stack_args, 'trace': self.trace,
                           'scratchBytes': scratch.hex(), 'taskBytesBefore': self.before_tasks.hex(),
                           'taskBytesAfter': tasks_after.hex(), 'personBytesBefore': {str(k): v.hex() for k, v in self.before_people.items()},
                           'personBytesAfter': people_after, 'queueCursor': self.read(AI + 0x5B5, 'B'),
                           'visitCounter': self.read(TASK + 8), 'tcgBufferBytes': self.tcg,
                           'peakRssKiB': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('executable', type=Path)
    parser.add_argument('--node', required=True, type=Path)
    parser.add_argument('--manifest', required=True, type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--loaded-cell', action='store_true',
                      help='Only the two frozen loaded-cell lifecycle cases; retain both declared differences')
    mode.add_argument('--all-origins', action='store_true',
                      help='Replay the three frozen origin cases only')
    mode.add_argument('--established-base', action='store_true',
                        help='Only the predeclared established-base-distinct pair; preserve earlier witnesses')
    args = parser.parse_args()
    signal.alarm(60)
    resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    manifest = json.loads(args.manifest.read_text())
    for relative, expected in manifest['sourceSha256'].items():
        assert sha(ROOT / relative) == expected, relative
    for path, expected in manifest['toolAndInputSha256'].items():
        assert sha(path) == expected, path
    assert str(args.executable.resolve()) == manifest['executable']
    assert str(args.node.resolve()) == manifest['node']
    assert str(Path(sys.executable).resolve()) == manifest['python']
    assert str(Path(sys.modules['unicorn'].__file__).resolve()) == manifest['unicornInit']
    assert str(Path(sys.modules['decomp'].__file__).resolve()) == str(ROOT / 'scripts/decomp.py')
    loaded_library = sys.modules['unicorn.unicorn_py3.unicorn'].uclib._name
    assert str(Path(loaded_library).resolve()) == manifest['unicornLibrary']
    fixture_path = (ROOT / 'tests/fixtures/mission3-raid-recruitment-loaded-cell.json' if args.loaded_cell else
                    ROOT / 'tests/fixtures/mission3-raid-recruitment-origins.json' if args.all_origins else
                    ROOT / 'tests/fixtures/mission3-raid-recruitment-established.json' if args.established_base else FIXTURE)
    expected_cases = (['loaded-cell-shaman-moved', 'loaded-cell-shaman-absent'] if args.loaded_cell else
                      ['common-origin-control', 'no-base-authored-coordinates', 'established-base-distinct']
                      if args.all_origins else ['established-base-distinct'] if args.established_base else
                      ['common-origin-control', 'no-base-authored-coordinates'])
    assert manifest['plannedCases'] == expected_cases
    fixture = json.loads(fixture_path.read_text())
    assert fixture['comparisonFields'] == FIELDS
    assert [c['id'] for c in fixture['cases']] == expected_cases
    assert len(fixture['people']) == 7 and not fixture['orders']
    assert fixture['turn'] == 2047 and fixture['queueCursor'] == 0 and fixture['tribe'] == 2
    assert fixture['task'] == {'index': 0, 'type': 20, 'phase': 3, 'flags': 1, 'mode': 0,
                               'requested': 3, 'quotaBytes': [100, 0, 0, 0, 0, 0],
                               'selected': 0, 'nativeCursor': 0, 'portRemaining': 0, 'entity': 0}
    assert [fixture[k] for k in ('seed', 'aiFlags', 'selectionOwner', 'defencePosition', 'defenceRadius', 'shamanCell')] == [0x12345678, 0x102, 0, 0x64FC, 11, 0x60DA]
    assert all(p['state'] == 17 and p['flags2'] == 0 and p['vehicle'] == 0 for p in fixture['people'])
    assert sha(args.executable) == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
    report = {'scope': fixture['scope'], 'comparisonFields': FIELDS,
              'nonComparedInputs': fixture['nonComparedInputs'], 'fixtureSha256': sha(fixture_path),
              'manifestSha256': sha(args.manifest), 'interceptedNativeLeaves': [],
              'differencePolicy': 'retain both frozen lifecycle differences' if args.loaded_cell else 'stop first difference',
              'cases': [], 'plannedPairs': len(expected_cases), 'executedPairs': 0, 'status': 'not-started'}
    portable = Portable(args.node, fixture_path, len(expected_cases))
    try:
        # V8 starts before the parent-only address-space cap. Its process has a
        # 256 MiB heap cap and 20-second watchdog; it waits for one request at a time.
        resource.setrlimit(resource.RLIMIT_AS, (1024 ** 3, 1024 ** 3))
        for index, case in enumerate(fixture['cases']):
            actual = portable.call(index)
            assert actual['id'] == case['id']
            paired = {'portable': actual, 'nativeStatus': 'not-started'}
            report['cases'].append(paired)
            supplied = {**fixture, 'people': case.get('people', fixture['people']),
                        'listOrder': case.get('listOrder', fixture['listOrder'])}
            assert len(supplied['people']) == (6 if case['id'] == 'loaded-cell-shaman-absent' else 7)
            probe = Probe(args.executable, supplied, case)
            assert probe.input_people == actual['inputs']['people'], 'Native/adapter roster inputs differ'
            assert actual['inputs']['orders'] == [], 'Unexpected portable orders'
            paired['nativeStatus'] = 'running'
            native = probe.run()
            differences = [field for field in FIELDS if native['comparison'][field] != actual['comparison'][field]]
            context_differences = [field for field in ('hasBase', 'base', 'shaman', 'radius')
                                   if native['inputs']['tribe'][field] != actual['inputs']['tribe'][field]]
            paired.update({'native': native, 'nativeStatus': 'stopped-at-boundary',
                           'differentComparisonFields': differences,
                           'recordedNonComparedTribeInputDifferences': context_differences})
            report['executedPairs'] += 1
            del probe
            gc.collect()
            if differences:
                report['status'] = 'mismatch'
                if not args.loaded_cell:
                    break
        else:
            if report['status'] != 'mismatch':
                report['status'] = 'matched-declared-projection'
    except BaseException as error:
        report['status'] = 'probe-failure'
        report['error'] = {'type': type(error).__name__, 'message': str(error)}
        raise
    finally:
        try:
            report['portableStderr'] = portable.close()
        except BaseException as error:
            report['status'] = 'probe-failure'
            report['shutdownError'] = {'type': type(error).__name__, 'message': str(error)}
            raise
        finally:
            report['portableCalls'] = portable.calls
            print(json.dumps(report, indent=2), flush=True)
    return 1 if report['status'] == 'mismatch' else 0


if __name__ == '__main__':
    sys.exit(main())
