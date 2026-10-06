"""Finite command-21 firing comparison; deliberately fails on actual differences.

Not a world/clock/browser witness. Read preflight.md before executing. The mapper
is supplied explicitly and fingerprinted; it must support a 16 MiB TCG cache before
mapping. No instruction in the EXE is modified. Actual setters and launch execute.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import resource
import signal
import struct
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
MAPPER_SHA = '0a4783a8ee924c52e1125a5df3e4e625b3ab00835e848a2013e444bcfd979c2e'
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
FIELDS = {
    'id': (0x24, 'H'), 'class': (0x2a, 'B'), 'model': (0x2b, 'B'),
    'state': (0x2c, 'B'), 'substate': (0x2d, 'B'), 'counter': (0x2e, 'B'),
    'tribe': (0x2f, 'b'), 'physics': (0x30, 'B'), 'flags2': (0xc, 'I'),
    'flags3': (0x14, 'I'), 'flags4': (0x10, 'I'), 'stamp': (0x18, 'I'),
    'angle': (0x26, 'H'), 'heading': (0x5d, 'H'), 'turnAngle': (0x57, 'H'),
    'turnY': (0x59, 'H'), 'x': (0x3d, 'H'), 'y': (0x3f, 'H'), 'h': (0x41, 'h'),
    'speed': (0x5f, 'h'), 'timer': (0x70, 'h'), 'target': (0x72, 'H'),
    'assignment': (0x76, 'H'), 'cargo': (0x78, 'h'), 'stateObject': (0x87, 'H'),
    'workTarget': (0x89, 'H'), 'vehicle': (0x9f, 'H'), 'commandStatus': (0xa7, 'B'),
    'animationMode': (0xa8, 'B'), 'commandAux': (0xa9, 'B'), 'commandPhase': (0xaa, 'B'),
    'object': (0x33, 'H'), 'renderFlags': (0x35, 'H'), 'f1': (0x37, 'h'),
    'f2': (0x39, 'B'), 'draw': (0x3a, 'B'), 'morph': (0x3b, 'B'),
    'palette': (0x3c, 'B'), 'cooldown': (0xb2, 'B'),
}
COMPARE = [name for name in FIELDS if name not in ('target', 'stateObject', 'stamp')]
COMPARE.append('trackedProjectile')
MAX_INSTRUCTIONS = 1_000_000
MAX_CALLS = 96
MUTABLE = [
    ('four-actor-records', 0x2000100, 0x2000500),
    ('allocation-context', 0x2000800, 0x2000900),
    ('native-stack', 0x2049000, 0x204e000),
    ('player-alert', 0x89d167, 0x89d168),
    ('simulation-rng', 0x89d178, 0x89d17c),
    ('allocation-flag', 0x89243a, 0x89243b),
    ('allocation-context-pointer', 0x892443, 0x892447),
]
# A +/-96 launch offset from the supplied coarse-cell corner can reach only
# these four cells. Only their two-byte object-list head is guest-writable.
MUTABLE += [(f'land-list-{x}-{y}', 0x8a03e4 + (y * 128 + x) * 16 + 6,
             0x8a03e4 + (y * 128 + x) * 16 + 8)
            for y in (17, 18) for x in (16, 17)]


def write_region(address, size):
    assert 0 < size <= 16 and 0 <= address < 2**32
    for label, begin, end in MUTABLE:
        if begin <= address and address + size <= end:
            return label
    raise AssertionError(f'Forbidden emulated write {address:08x}+{size}')


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    with temporary.open('w') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)


def native_visit(path, visit, snapshot, operation, events):
    record = {'visit': visit, 'status': 'running', 'before': snapshot()}
    save_json(path, record)
    try:
        record['complete'] = operation()
        record['after'] = snapshot()
        record['status'] = 'completed'
        return record
    except BaseException as error:
        record['status'] = 'failed'
        record['error'] = {'type': type(error).__name__, 'message': str(error)}
        try:
            record['afterFailure'] = snapshot()
        except BaseException as snapshot_error:
            record['snapshotError'] = str(snapshot_error)
        raise
    finally:
        record['events'] = list(events)
        save_json(path, record)


def run_port_child(command, input_path, output, timeout=20, limits=None):
    """One direct child, disk-backed logs, wait4 termination and exact child RSS."""
    result = {'status': 'not-started', 'command': command, 'reaped': False}
    process = None
    def reap_until(deadline):
        while True:
            pid, status, usage = os.wait4(process.pid, os.WNOHANG)
            if pid:
                assert pid == process.pid
                process.returncode = os.waitstatus_to_exitcode(status)
                result.update(reaped=True, returnCode=process.returncode,
                              maxRssKiB=usage.ru_maxrss)
                return True
            if time.monotonic() >= deadline:
                return False
            time.sleep(0.01)
    try:
        with input_path.open('rb') as stdin, (output / 'port.stdout.json').open('wb') as stdout, \
                (output / 'port.stderr.txt').open('wb') as stderr:
            process = subprocess.Popen(command, stdin=stdin, stdout=stdout, stderr=stderr,
                                       cwd=ROOT, preexec_fn=limits,
                                       env={**os.environ, 'NODE_OPTIONS': '', 'NODE_PATH': '',
                                            'UV_THREADPOOL_SIZE': '1'})
            result.update(status='running', pid=process.pid)
            save_json(output / 'port-process.json', result)
            if not reap_until(time.monotonic() + timeout):
                raise TimeoutError(f'Direct port child exceeded {timeout} seconds')
            result['status'] = 'completed' if process.returncode == 0 else 'failed'
            return result
    except BaseException as error:
        result.update(status='failed', error={'type': type(error).__name__, 'message': str(error)})
        raise
    finally:
        # Signals here target only the unreaped direct child from this Popen.
        # An unreaped child PID cannot be reused. No process-name/PID scan.
        if process is not None and not result['reaped']:
            try:
                os.kill(process.pid, signal.SIGTERM)
                result['sentTerm'] = True
                if not reap_until(time.monotonic() + 1):
                    os.kill(process.pid, signal.SIGKILL)
                    result['sentKill'] = True
                    assert reap_until(time.monotonic() + 2), 'Direct child did not reap after KILL'
            except BaseException as cleanup_error:
                result['cleanupError'] = str(cleanup_error)
        result['logs'] = {}
        for name in ('port.stdout.json', 'port.stderr.txt'):
            path = output / name
            if path.exists():
                data = path.read_bytes()
                result['logs'][name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        save_json(output / 'port-process.json', result)


def node_limits():
    resource.setrlimit(resource.RLIMIT_AS, (8 * 1024**3, 8 * 1024**3))
    resource.setrlimit(resource.RLIMIT_CPU, (15, 20))


def finish_probe(output, state, operation):
    save_json(output / 'terminal.json', state)
    try:
        code = operation()
        state.update(status='passed' if code == 0 else 'failed', phase='finished', exitCode=code)
        return code
    except BaseException as error:
        state.update(status='failed', exitCode=2,
                     error={'type': type(error).__name__, 'message': str(error)})
        if state.get('case'):
            case_path = output / 'cases' / state['case'] / 'case.json'
            if case_path.exists():
                case = json.loads(case_path.read_text())
                case.update(status='failed', error=state['error'], failedVisit=state.get('visit'))
                save_json(case_path, case)
        return 2
    finally:
        signal.alarm(0)
        state['maxRssKiB'] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        save_json(output / 'terminal.json', state)


def interrupted(signum, frame):
    raise TimeoutError(f'Probe interrupted by {signal.Signals(signum).name}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('game', type=Path)
    parser.add_argument('--native-helper', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert args.output.resolve().is_relative_to(ROOT / 'work/orchestration'), 'Output must stay in the owned ignored evidence directory'
    assert not args.output.exists(), 'Output must be fresh'
    args.output.mkdir(parents=True)
    state = {'status': 'running', 'phase': 'setup', 'case': None, 'visit': None,
             'rejectedFreeze': 'e2bcc32a6fd0a088e3ef4f9f092f7bab3af8b984'}
    code = finish_probe(args.output, state, lambda: run_probe(args, state))
    print(json.dumps(state))
    return code


def run_probe(args, state):
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024**2, 8 * 1024**3))
    resource.setrlimit(resource.RLIMIT_CPU, (30, 35))
    resource.setrlimit(resource.RLIMIT_FSIZE, (8 * 1024**2, 8 * 1024**2))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    for signum in (signal.SIGALRM, signal.SIGTERM, signal.SIGXCPU, signal.SIGXFSZ):
        signal.signal(signum, interrupted)
    signal.alarm(45)
    started = time.monotonic()
    digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest(args.native_helper) == MAPPER_SHA
    exe = args.game / 'd3dpoptb.exe'
    assert digest(exe) == EXE_SHA
    spec = importlib.util.spec_from_file_location('frozen_native_mapper', args.native_helper)
    mapper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mapper)
    assert digest(mapper.ROOT / 'app/original-constants.json') == digest(ROOT / 'app/original-constants.json')
    from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE, UC_PROT_READ, UC_PROT_WRITE, UC_PROT_EXEC
    from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
    cpu, identity = mapper.native_cpu(exe, tcg_buffer_size=16 * 1024**2)
    mapper.configure_native_constants(cpu, exe)
    cpu.mem_map(0x2000000, 0x50000)
    base, source, target = 0x2000000, 0x2000100, 0x2000200
    shots = [0x2000300, 0x2000400]
    counts, order, thunk_base, stack, stop = 0x2010000, 0x2020000, 0x2030000, 0x204d000, 0x204e000
    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))
    def read(address, fmt):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    def person():
        return {name: read(source + offset, fmt) for name, (offset, fmt) in FIELDS.items()}
    def snapshot():
        p = person()
        fields = {name: p['target'] if name == 'trackedProjectile' else p[name] for name in COMPARE}
        return {'person': p, 'personBytes': bytes(cpu.mem_read(source, 256)).hex(),
                'registers': {'pc': f'{cpu.reg_read(UC_X86_REG_EIP):08x}',
                              'sp': f'{cpu.reg_read(UC_X86_REG_ESP):08x}',
                              'eax': cpu.reg_read(UC_X86_REG_EAX)},
                'targetBytes': bytes(cpu.mem_read(target, 256)).hex(),
                'projectiles': [bytes(cpu.mem_read(p, 256)).hex() for p in shots],
                'world': {'randomState': read(0x89d178, 'I'), 'musicActivity': read(0x89d167, 'B')},
                'fields': fields}
    def ret(value=0):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, value)
        cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    calls = 0
    instructions = 0
    capacity = 0
    events = []
    observed = set()
    write_counts = {}
    def guard_write(_, access, address, size, value, user):
        try:
            label = write_region(address, size)
        except AssertionError:
            events.append({'forbiddenWrite': {'address': f'{address:08x}', 'size': size,
                                              'value': value, 'pc': f'{cpu.reg_read(UC_X86_REG_EIP):08x}'}})
            raise
        write_counts[label] = write_counts.get(label, 0) + 1
    cpu.hook_add(UC_HOOK_MEM_WRITE, guard_write)
    # These are observations only. Animation producers and setters always execute.
    watch = {0x51a2a0, 0x51f990, 0x4d3ff0, 0x4d4040, 0x4ee700, 0x51fbf0,
             0x4ed580, 0x4bbcf0, 0x518390, 0x4d4da0, 0x51b98c, 0x51ba2b,
             0x51badf, 0x51bb16, 0x51bb49, 0x51bb5a}
    supplied = {0x4ed8a0, 0x48a050, 0x4010b0, 0x404420}
    def hook(_, address, size, user):
        nonlocal instructions, capacity
        instructions += 1
        state['instructions'] = instructions
        assert instructions <= MAX_INSTRUCTIONS, 'Cumulative instruction cap'
        assert 0x400000 <= address < 0x590000 or thunk_base <= address < thunk_base + 64, hex(address)
        if address not in watch | supplied:
            return
        sp = cpu.reg_read(UC_X86_REG_ESP)
        argv = [read(sp + 4 + i * 4, 'I') for i in range(4)]
        observed.add(address)
        events.append({'address': f'{address:08x}', 'args': argv, 'person': person(),
                       'supplied': address in supplied})
        assert len(events) <= 4096
        if address == 0x4ed8a0:
            assert argv[:3] == [8, 6, 0] and capacity < 2
            index = capacity
            capacity += 1
            p = shots[index]
            cpu.mem_write(p, bytes(256))
            write(p + 0x24, 'H', 3 + index)
            write(p + 0x2a, 'BBB', 8, 6, 1)
            write(p + 0x2f, 'B', 0)
            cpu.mem_write(p + 0x3d, bytes(cpu.mem_read(argv[3], 6)))
            write(p + 0xc, 'I', 0x400)
            # Real initializer consumes the actual allocation-context stack.
            address = thunk_base + index * 32
            code = (b'\x68' + struct.pack('<I', p) + b'\xb8' + struct.pack('<I', 0x4ed580)
                    + b'\xff\xd0\x83\xc4\x04\xb8' + struct.pack('<I', p) + b'\xc3')
            cpu.mem_write(address, code)
            cpu.reg_write(UC_X86_REG_EIP, address)
        elif address == 0x404420:
            assert argv[0] == target
            cpu.mem_write(argv[1], bytes(cpu.mem_read(target + 0x3d, 4)))
            ret()
        elif address in (0x48a050, 0x4010b0):
            ret()
    cpu.hook_add(UC_HOOK_CODE, hook)
    frames = list(struct.iter_unpack('<HBBBBH', (args.game / 'data/vfra-0.ani').read_bytes()))
    starts = list(struct.iter_unpack('<HH', (args.game / 'data/vstart-0.ani').read_bytes()))
    write(0x59df44, 'I', counts)
    for i, (first, _) in enumerate(starts):
        at, seen = first, set()
        while at and at not in seen:
            assert len(seen) < 256
            seen.add(at)
            at = frames[at][-1]
        assert at in (0, first)
        write(counts + i * 6 + 1, 'B', len(seen))
    rules = json.loads((ROOT / 'app/original-rules.json').read_text())
    rows = list(struct.unpack('<252h', cpu.mem_read(0x5a6d50, 504)))
    assert rows == rules['personAnimationObjects']
    assert rows[15 * 9 + 6] == 94
    assert bytes(cpu.mem_read(0x5a6af8 + 13 * 11, 11)) == bytes(cpu.mem_read(0x5a6af8 + 14 * 11, 11))
    specs = json.loads((HERE / 'cases.json').read_text())
    assert len(specs) == 8 and sum(s['visits'] for s in specs) == 35
    # Default-deny guest writes: the original image is RX, fixture storage R.
    # Host fixture writes deliberately use mem_write and do not grant guest write
    # permission. Re-enable only pages containing the named mutable byte ranges;
    # guard_write still checks exact byte containment on those shared pages.
    raw = exe.read_bytes()
    pe = struct.unpack_from('<I', raw, 60)[0]
    image_base = struct.unpack_from('<I', raw, pe + 24 + 28)[0]
    image_size = (struct.unpack_from('<I', raw, pe + 24 + 56)[0] + 4095) & ~4095
    cpu.mem_protect(image_base, image_size, UC_PROT_READ | UC_PROT_EXEC)
    cpu.mem_protect(base, 0x50000, UC_PROT_READ)
    writable_pages = {page for _, begin, end in MUTABLE
                      for page in range(begin & ~4095, (end + 4095) & ~4095, 4096)}
    for page in sorted(writable_pages):
        cpu.mem_protect(page, 4096, UC_PROT_READ | UC_PROT_WRITE)
    cpu.mem_protect(thunk_base, 4096, UC_PROT_READ | UC_PROT_EXEC)
    save_json(args.output / 'write-policy.json', {'mutableByteRanges': MUTABLE,
                                                'writablePages': sorted(writable_pages),
                                                'originalImageDefault': 'read-execute',
                                                'fixtureDefault': 'read'})
    land = bytearray(16384 * 16)
    for i in range(16384):
        struct.pack_into('<Ih', land, i * 16, 8, 128)
    native, fixtures = [], []
    for target_class in (1, 2):
        for case in specs:
            case = {**case, 'name': ('person-' if target_class == 1 else 'building-') + case['name']}
            state.update(phase='native-case-setup', case=case['name'], visit=None)
            case_output = args.output / 'cases' / case['name']
            save_json(case_output / 'case.json', {'status': 'setup', 'spec': case, 'targetClass': target_class})
            cpu.mem_write(base, bytes(0x1000))
            cpu.mem_write(0x890390, bytes(4096))
            write(0x890394, 'IIII', source, target, *shots)
            cpu.mem_write(0x8a03e4, bytes(land))
            write(0x892443, 'I', base + 0x800)
            write(0x89243a, 'B', 0)
            write(0x890324, 'I', source)
            write(0x89d178, 'I', 0x12345678)
            write(0x89d167, 'B', 0)
            write(0x89c6f0, 'B', 0)
            write(0x89d17c, 'I', 0)
            write(0xafc288, 'I', 0)
            write(0x895da8, 'I', 0)
            for i in range(4):
                write(0x89db05 + i * 0xc65, 'I', 0)
                write(0x89d1c8 + i * 0xc65 + 0xc1f, 'B', 0)
            p = {name: 0 for name in FIELDS}
            p.update(id=1, **{'class': 1}, model=6, state=10, substate=10 if target_class == 1 else 11,
                     counter=1, tribe=0, physics=rules['personModels'][6]['physics'],
                     x=0x2200, y=0x2400, h=128, flags2=0x40000000 if case['changedTarget'] else 0,
                     flags3=0x40000, flags4=0x20000100, workTarget=2, commandStatus=21,
                     animationMode=case['phase'], assignment=case['assignment'], object=case['object'],
                     draw=case['draw'], f1=case['f1'], f2=case['f2'], timer=case['timer'],
                     cooldown=case['cooldown'], target=4 if case['projectile'] else 0)
            for name, (off, fmt) in FIELDS.items():
                write(source + off, fmt, p[name])
            write(source + 0x1c, 'h', 64)
            write(source + 0x6e, 'h', 1000)
            write(target + 0x24, 'H', 2)
            write(target + 0x2a, 'BBB', target_class, 2 if target_class == 1 else 4, 2)
            write(target + 0x2f, 'B', 1)
            write(target + 0x3d, 'HHh', 0x2600, 0x2400, 128)
            write(target + 0x1c, 'h', 64)
            write(target + 0x6e, 'h', 1000)
            if case['projectile']:
                write(shots[1] + 0x24, 'H', 4)
                write(shots[1] + 0x2a, 'BBB', 8, 6, 6)
            command = dict(model=21, flags=32, references=1, object=0, a=0x2422, b=0x0404)
            write(order, 'BBHHHH', *command.values())
            # Explicit role mapping: native +0x72 is this command's projectile;
            # current port stores it in p.stateObject. Retain both raw records.
            port_person = {**p, 'target': 0, 'stateObject': p['target'], 'marchCooldown': 0}
            fixtures.append(dict(spec=case, targetClass=target_class, person=port_person,
                                 order=command, compareFields=COMPARE))
            save_json(case_output / 'fixture.json', fixtures[-1])
            visits = []
            capacity = 0
            for visit in range(case['visits']):
                calls += 1
                assert calls <= MAX_CALLS
                events = []
                state.update(phase='native-visit', visit=visit, calls=calls)
                write(stack, 'III', stop, source, order)
                cpu.reg_write(UC_X86_REG_ESP, stack)
                def execute_visit():
                    cpu.emu_start(0x51a2a0, stop, count=100_000, timeout=1_000_000)
                    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
                    return bool(cpu.reg_read(UC_X86_REG_EAX) & 255)
                visits.append(native_visit(case_output / f'visit-{visit:02d}.json', visit,
                                           snapshot, execute_visit, events))
                if visits[-1]['complete']:
                    break
            native.append(dict(name=case['name'], visits=visits))
            save_json(case_output / 'case.json', {'status': 'completed', 'spec': case,
                                                 'targetClass': target_class, 'visits': len(visits)})
    assert {0x4d3ff0, 0x4d4040, 0x4ee700, 0x51fbf0, 0x4ed580, 0x4bbcf0, 0x518390} <= observed
    report = dict(status='native-complete-port-not-run', identity=identity, calls=calls,
                  instructions=instructions, observed=[f'{x:08x}' for x in sorted(observed)],
                  cases=native, comparisonFields=COMPARE, emulatedWriteCounts=write_counts)
    (args.output / 'native.json').write_text(json.dumps(report, indent=2) + '\n')
    (args.output / 'supplied-fixtures.json').write_text(json.dumps(fixtures, indent=2) + '\n')
    state.update(phase='port-batch', case=None, visit=None)
    proc = run_port_child(['node', '--max-old-space-size=128', str(HERE / 'port.mjs')],
                          args.output / 'supplied-fixtures.json', args.output, limits=node_limits)
    assert proc['reaped'] and proc['returnCode'] == 0, f'Port process failed: {proc}; see retained logs'
    port = json.loads((args.output / 'port.stdout.json').read_text())
    state['phase'] = 'comparison-batch'
    differences = []
    for n, p in zip(native, port['cases'], strict=True):
        assert n['name'] == p['name']
        for i in range(max(len(n['visits']), len(p['visits']))):
            if i >= len(n['visits']) or i >= len(p['visits']):
                differences.append(dict(case=n['name'], visit=i, field='visit-presence',
                                        native=i < len(n['visits']), port=i < len(p['visits'])))
                continue
            nv, pv = n['visits'][i], p['visits'][i]
            for field in COMPARE + ['complete']:
                a = nv['complete'] if field == 'complete' else nv['after']['fields'][field]
                b = pv['complete'] if field == 'complete' else pv['after']['fields'][field]
                if a != b:
                    differences.append(dict(case=n['name'], visit=i, field=field, native=a, port=b))
    summary = dict(status='failed' if differences else 'passed', comparisons='actual-native-versus-actual-port',
                   differences=differences, calls=calls, instructions=instructions,
                   elapsedSeconds=time.monotonic() - started,
                   maxRssKiB=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                   childMaxRssKiB=resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss)
    (args.output / 'comparison.json').write_text(json.dumps(summary, indent=2) + '\n')
    if differences:
        (args.output / 'first-mismatch.json').write_text(json.dumps(differences[0], indent=2) + '\n')
    print(json.dumps({k: v for k, v in summary.items() if k != 'differences'} | {'mismatches': len(differences)}))
    return 1 if differences else 0


if __name__ == '__main__':
    raise SystemExit(main())
