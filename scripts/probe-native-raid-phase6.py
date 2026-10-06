#!/usr/bin/env python3
"""Exactly two supplied phase-6 compositions; default is host-only validation."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import struct
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / 'decomp/research/raid-phase6-settlement'
spec = importlib.util.spec_from_file_location('response_primitives', ROOT / 'scripts/probe-native-preacher-response.py')
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)
digest, git, pe_bytes, write_json = shared.digest, shared.git, shared.pe_bytes, shared.write_json
NAMES = ['captured-combat-timeout', 'captured-moving-not-settled']


def preflight(args):
    assert not sys.flags.optimize, 'Optimized Python removes guards'
    raw = (PACKET / 'launch-manifest.json').read_bytes()
    if args.expected_manifest_sha:
        assert digest(raw) == args.expected_manifest_sha
    manifest = json.loads(raw)
    if args.expected_source_head:
        assert git('rev-parse', 'HEAD').decode().strip() == args.expected_source_head
    assert not git('status', '--porcelain', '--', 'app', 'tests/mission6.test.mjs')
    assert not git('diff', manifest['runtimeHead'], '--', 'app', 'tests/mission6.test.mjs')
    assert git('rev-parse', 'HEAD:app').decode().strip() == manifest['runtimeAppTree']
    for row in manifest['files']:
        assert digest((ROOT / row['path']).read_bytes()) == row['sha256'], row['path']
    for row in manifest['toolFiles']:
        assert digest(Path(row['path']).read_bytes()) == row['sha256'], row['path']
    executable = Path(manifest['executable']['path'])
    blob = executable.read_bytes()
    assert digest(blob) == manifest['executable']['sha256']
    assert digest((executable.parent / 'levels/constant.dat').read_bytes()) == manifest['constantsSha256']
    binding = json.loads((PACKET / 'no-cast-binding.json').read_text())
    script = json.loads((ROOT / binding['script']).read_text())['tribes']['2']
    assert script['codes'][811:826] == binding['codeSlice']
    assert script['fields'][64] == [0, -1]
    assert binding['marker']['allocatorArgument'] == 13 and binding['marker']['taskOffset'] == 0x2f
    for row in binding['ranges']:
        assert digest(pe_bytes(blob, row['start'], row['stopExclusive'])) == row['nativeBytesSha256']
    cases = json.loads((PACKET / 'cases.json').read_text())
    assert cases['caseCount'] == 2 and [r['case'] for r in cases['cases']] == NAMES
    for row in cases['cases']:
        folder = (PACKET / row['fixture']).parent
        raw = (PACKET / row['fixture']).read_bytes()
        assert digest(raw) == row['sha256']
        f = json.loads(raw)
        assert f['case'] == row['case'] and f['allowlist']['interceptions'] == []
        assert f['limits'] == {'nativeInstructions': 100000, 'nativeTimeoutMicroseconds': 1000000,
                               'portSeconds': 5, 'outerSeconds': 15, 'retry': False}
        capture_raw = (PACKET / f['capturePath']).read_bytes()
        assert digest(capture_raw) == f['captureSha256']
        capture = json.loads(capture_raw)
        observed = {p['id']: p for p in capture['preachers'] + capture['raiders']}
        people = bytearray()
        for index, p in enumerate(f['people']):
            assert p['capturedUnit'] == observed[p['id']]
            assert p['capturedUnit']['registryOwner'] and p['capturedUnit']['p']['computerAssignment'] == 0
            assert p['nativeValues']['computerAssignment'] == 1
            captured = p['capturedUnit']['p']
            for key in f['personFields']:
                if key not in ['tribeNext', 'computerAssignment']:
                    assert p['nativeValues'][key] == captured.get(key, 0)
            assert p['nativeCommands'] == captured['commands']
            assert p['nativeValues']['tribeNext'] == (f['people'][index + 1]['address'] if index < 3 else 0)
            chain = p['capturedUnit']['chain']; rank = chain.index(p['id'])
            assert captured['cellPrevious'] == (chain[rank - 1] if rank else 0)
            assert captured['cellNext'] == (chain[rank + 1] if rank + 1 < len(chain) else 0)
            assert captured['flags2'] & 0x20000
            assert (captured['y'] >> 9) * 128 + (captured['x'] >> 9) == p['capturedUnit']['cell']
            raw = bytearray(256)
            for key, field in f['personFields'].items():
                struct.pack_into('<' + field['format'], raw, field['offset'], p['nativeValues'][key])
            struct.pack_into('<8H', raw, 0x8b, *p['nativeCommands'])
            people.extend(raw)
        assert people == (folder / 'people-input.bin').read_bytes()
        tribe = bytearray(f['tribe']['size'])
        for key in f['task']['fields']:
            if key in f['task']['observed']:
                assert f['task']['nativeValues'][key] == f['task']['observed'][key]
        for key, field in f['task']['fields'].items():
            struct.pack_into('<' + field['format'], tribe, 0x36 + field['offset'], f['task']['nativeValues'][key])
        struct.pack_into('<I', tribe, 0x36 + 0x52 + 0x3e, 1)
        struct.pack_into('<I', tribe, 0x881, f['people'][0]['address'])
        struct.pack_into('<b', tribe, 0xc22, 2)
        assert tribe == (folder / 'tribe-input.bin').read_bytes()
        assert tribe[0x36 + 0x2f] == 255 and tribe[0x36 + 0x26] == 0
        expected = bytearray(tribe)
        struct.pack_into('<i', expected, 0x36 + 4, f['expected']['nativeElapsed'])
        struct.pack_into('<I', expected, 0x36 + 8, 1)
        struct.pack_into('<H', expected, 0x36 + 0x42, f['expected']['nativePhase'])
        assert expected == (folder / 'tribe-expected.bin').read_bytes()
        pool = bytearray(8000)
        for index, order in f['pool']['knownOrders'].items():
            struct.pack_into('<BB4H', pool, int(index) * 10,
                             *[order[key] for key in ['model', 'flags', 'references', 'object', 'a', 'b']])
        assert pool == (folder / 'orders-input.bin').read_bytes()
        pointers = bytearray(4096)
        for person in f['people']:
            struct.pack_into('<I', pointers, person['id'] * 4, person['address'])
        struct.pack_into('<I', pointers, 290 * 4, f['tombstone']['address'])
        assert pointers == (folder / 'pointers-input.bin').read_bytes()
        tombstone = bytearray(256)
        struct.pack_into('<I', tombstone, 0xc, 1); struct.pack_into('<H', tombstone, 0x24, 290)
        assert tombstone == (folder / 'tombstone-input.bin').read_bytes()
        for item in f['rawInputs']:
            data = (folder / item['path']).read_bytes()
            assert len(data) == item['bytes'] and digest(data) == item['sha256']
        for fn in f['abi']['functions']:
            assert digest(pe_bytes(blob, fn['entry'], fn['stopExclusive'])) == fn['nativeBytesSha256']
        for part in f['abi']['codeRanges']:
            assert digest(pe_bytes(blob, part['start'], part['stopExclusive'])) == part['sha256']
    return manifest, cases, executable


def native_once(f, executable, folder, output, tools):
    # Original-code execution is reachable only from the explicit supervised gate.
    import unicorn
    from unicorn import x86_const as x86
    from unicorn.unicorn_py3.unicorn import uclib
    from decomp import native_cpu, configure_native_constants
    assert unicorn.__version__ == tools['unicornVersion']
    assert Path(unicorn.__file__).resolve() == Path(tools['unicornModule']).resolve()
    assert Path(uclib._name).resolve() == Path(tools['unicornLibrary']).resolve()
    cpu, identity = native_cpu(executable)
    configure_native_constants(cpu, executable)
    abi = f['abi']; stack, stop = abi['stack'], abi['stop']
    cpu.mem_map(abi['scratchMapAddress'], abi['scratchMapBytes'])
    raw_people = (folder / 'people-input.bin').read_bytes()
    for index, p in enumerate(f['people']):
        cpu.mem_write(p['address'], raw_people[index * 256:(index + 1) * 256])
    for address, name in [(f['tribe']['address'], 'tribe-input.bin'),
                          (f['pool']['address'], 'orders-input.bin'),
                          (f['pointerTable']['address'], 'pointers-input.bin'),
                          (f['tombstone']['address'], 'tombstone-input.bin')]:
        cpu.mem_write(address, (folder / name).read_bytes())
    cpu.mem_write(0x89d178, struct.pack('<I', f['world']['simulationRandom']))
    cpu.mem_write(0x89bc72, struct.pack('<I', f['world']['cosmeticRandom']))
    cpu.mem_write(stack - 4096, bytes([0xa5]) * 4108)
    cpu.mem_write(stack, struct.pack('<III', stop, *abi['arguments']))
    for name, value in abi['initialRegisters'].items():
        cpu.reg_write(getattr(x86, 'UC_X86_REG_' + name), value)
    cpu.reg_write(x86.UC_X86_REG_EFLAGS, 2)
    cpu.reg_write(x86.UC_X86_REG_ESP, stack)
    def read(address, fmt):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    def snapshot():
        return {'peopleHex': [bytes(cpu.mem_read(p['address'], 256)).hex() for p in f['people']],
                'tribeHex': bytes(cpu.mem_read(f['tribe']['address'], f['tribe']['size'])).hex(),
                'poolHex': bytes(cpu.mem_read(f['pool']['address'], 8000)).hex(),
                'pointersHex': bytes(cpu.mem_read(f['pointerTable']['address'], 4096)).hex(),
                'tombstoneHex': bytes(cpu.mem_read(f['tombstone']['address'], 256)).hex(),
                'simulationRandom': read(0x89d178, 'I'), 'cosmeticRandom': read(0x89bc72, 'I'),
                'stackHex': bytes(cpu.mem_read(stack - 4096, 4108)).hex()}
    result = {'case': f['case'], 'identity': identity, 'unicorn': unicorn.__version__,
              'before': snapshot(), 'calls': [], 'memory': [], 'instructionCount': 0, 'interceptions': []}
    frames = []; functions = {fn['entry']: fn for fn in abi['functions']}
    def returned(address):
        frame = frames.pop()
        assert cpu.reg_read(x86.UC_X86_REG_ESP) == frame['sp'] + 4, 'cdecl stack drift'
        eax = cpu.reg_read(x86.UC_X86_REG_EAX); bits = frame['function']['returnBits']
        result['calls'].append({'phase': 'return', 'entry': frame['function']['entry'], 'pc': address,
                                'rawEax': eax, 'value': eax & ((1 << bits) - 1) if bits else None})
    def code(machine, address, size, _):
        result['instructionCount'] += 1
        assert any(r['start'] <= address and address + size <= r['stopExclusive'] for r in abi['codeRanges']), f'Unexpected code {address:08x}'
        if frames and frames[-1]['return'] == address:
            returned(address)
        if address in functions:
            fn = functions[address]; sp = machine.reg_read(x86.UC_X86_REG_ESP)
            args = [read(sp + 4 + i * 4, 'I') for i in range(fn['argumentSlots'])]
            frames.append({'function': fn, 'sp': sp, 'return': read(sp, 'I'), 'args': args})
            result['calls'].append({'phase': 'enter', 'entry': address, 'sp': sp, 'args': args})
    def memory(machine, access, address, size, value, _):
        kind = 'write' if access == unicorn.UC_MEM_WRITE else 'read'
        allowed = any(r['address'] <= address and address + size <= r['address'] + r['size'] for r in f['allowlist'][kind])
        row = {'kind': kind, 'pc': machine.reg_read(x86.UC_X86_REG_EIP), 'address': address,
               'size': size, 'allowed': allowed, 'beforeHex': bytes(machine.mem_read(address, size)).hex()}
        if kind == 'write':
            row['valueHex'] = (value & ((1 << (size * 8)) - 1)).to_bytes(size, 'little').hex()
        result['memory'].append(row)
        assert allowed, f'Unexpected {kind} {address:08x}+{size}'
    def invalid(machine, access, address, size, value, _):
        result['invalidMemory'] = {'access': access, 'address': address, 'size': size}
        return False
    cpu.hook_add(unicorn.UC_HOOK_CODE, code)
    cpu.hook_add(unicorn.UC_HOOK_MEM_READ | unicorn.UC_HOOK_MEM_WRITE, memory)
    cpu.hook_add(unicorn.UC_HOOK_MEM_INVALID, invalid)
    write_json(output / 'native-before.json', result['before'])
    try:
        cpu.emu_start(abi['entry'], stop, timeout=1000000, count=100000)
        assert cpu.reg_read(x86.UC_X86_REG_EIP) == stop, 'Native time/instruction bound or incomplete return'
        assert len(frames) == 1 and frames[0]['return'] == stop
        returned(stop)
        for name in ['EBX', 'ESI', 'EDI', 'EBP']:
            assert cpu.reg_read(getattr(x86, 'UC_X86_REG_' + name)) == abi['initialRegisters'][name]
        result['status'] = 'returned'
    except BaseException as error:
        result.update(status='failed', error=f'{type(error).__name__}: {error}')
        raise
    finally:
        result['after'] = snapshot()
        write_json(output / 'native.json', result)
    return result


def verify_native(f, n, folder):
    entered = [r for r in n['calls'] if r['phase'] == 'enter']
    returned = [r for r in n['calls'] if r['phase'] == 'return']
    assert [r['entry'] for r in entered] == f['expected']['entrySequence']
    assert len(entered) == len(returned) and all('rawEax' in r for r in returned)
    for entry, expected in [(0x462750, [2]), (0x4f2460, [1] * 8), (0x4f39f0, [0] * 4),
                            (0x4df0e0, f['expected']['sermonALReturns'])]:
        assert [r['value'] for r in returned if r['entry'] == entry] == expected
    a = f['abi']; tribe = f['tribe']['address']; task = f['task']['address']
    assert entered[0]['args'] == [tribe, 0]
    assert next(r for r in entered if r['entry'] == 0x4d14f0)['args'] == [tribe, task, 0, a['stack'] - 0x28, a['stack'] - 0x50, 23, 1]
    assert [r['args'] for r in entered if r['entry'] == 0x4f2460] == [[p['address'], 1] for p in f['people']] * 2
    assert [r['args'] for r in entered if r['entry'] == 0x4f39f0] == [[p['address']] for p in f['people']]
    assert bytes.fromhex(''.join(n['before']['peopleHex'])) == (folder / 'people-input.bin').read_bytes()
    assert bytes.fromhex(n['before']['tribeHex']) == (folder / 'tribe-input.bin').read_bytes()
    assert bytes.fromhex(n['after']['tribeHex']) == (folder / 'tribe-expected.bin').read_bytes()
    for key, filename in [('poolHex', 'orders-input.bin'), ('pointersHex', 'pointers-input.bin'),
                          ('tombstoneHex', 'tombstone-input.bin')]:
        assert bytes.fromhex(n['before'][key]) == (folder / filename).read_bytes()
    for key in ['peopleHex', 'poolHex', 'pointersHex', 'tombstoneHex', 'simulationRandom', 'cosmeticRandom']:
        assert n['before'][key] == n['after'][key]
    writes = [r for r in n['memory'] if r['kind'] == 'write' and r['address'] == task + 4]
    assert [int.from_bytes(bytes.fromhex(r['valueHex']), 'little') for r in writes] == ([2] + [1801] * 4 if f['captureTurn'] == 8370 else [47])


def verify_port(f, n, p):
    assert p['case'] == f['case'] and p['semanticReturn'] == 'undefined'
    assert len(p['calls']) == 15 and all(r['actual'] == r['expected'] for r in p['calls'])
    before, after = p['before'], p['after']
    expected = json.loads(json.dumps(before))
    expected['tasks'][0]['elapsed'] = f['expected']['portElapsed']
    expected['tasks'][0]['phase'] = f['expected']['portPhase']
    expected['cursor'] = 1
    assert after == expected, 'Unspecified port mutation'
    assert before['tasks'][0] == f['task']['observed']
    assert before['poolHex'] == n['before']['poolHex']
    assert before['simulationRandom'] == n['before']['simulationRandom']
    assert before['cosmeticRandom'] == n['before']['cosmeticRandom']
    assert all(before['registryIdentities'])
    for actual, supplied in zip(before['selected'], f['people'], strict=True):
        assert actual == supplied['capturedUnit']['p']
        assert actual['computerAssignment'] == 0 and supplied['nativeValues']['computerAssignment'] == 1
    task = bytes.fromhex(n['after']['tribeHex'])[0x36:0x36 + 0x52]
    assert struct.unpack_from('<i', task, 4)[0] == f['expected']['nativeElapsed']
    assert struct.unpack_from('<H', task, 0x42)[0] == f['expected']['nativePhase']
    assert struct.unpack_from('<I', task, 0x3e)[0] == after['tasks'][0]['flags'] == 1
    return {'case': f['case'], 'native': {'elapsed': f['expected']['nativeElapsed'], 'phase': f['expected']['nativePhase']},
            'port': {'elapsed': after['tasks'][0]['elapsed'], 'phase': after['tasks'][0]['phase']},
            'nativeSemanticReturn': 'void', 'portSemanticReturn': p['semanticReturn'],
            'membership': {'portIds': after['tasks'][0]['members'], 'nativeSuppliedAssignment': 1, 'portObservedAssignment': 0},
            'scope': 'conditional admitted-member projection; not literal full-raid equality'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--expected-source-head'); parser.add_argument('--expected-manifest-sha')
    args = parser.parse_args(); manifest, cases, executable = preflight(args)
    if not args.execute:
        print('PASS: two-case host fixture/source guards; no native or application execution')
        return
    assert args.expected_source_head and args.expected_manifest_sha
    assert os.environ.get('PND_PREACHER_RESPONSE_SUPERVISED') == '1'
    assert sys.flags.ignore_environment and sys.flags.no_user_site and not sys.flags.optimize
    assert Path(sys.executable).resolve() == Path(manifest['python']).resolve()
    assert os.sched_getaffinity(0) == {4}
    assert not os.environ.get('NODE_OPTIONS') and not os.environ.get('NODE_PATH')
    output = ROOT / manifest['output']; output.mkdir(parents=True, exist_ok=False)
    receipt = {'status': 'running', 'head': args.expected_source_head, 'manifestSha256': args.expected_manifest_sha,
               'pid': os.getpid(), 'processGroup': os.getpgrp(), 'cpuAffinity': [4], 'nativeCases': [], 'retry': False}
    write_json(output / 'launch.json', manifest); write_json(output / 'receipt.json', receipt)
    native_rows = []
    try:
        for row in cases['cases']:
            path = PACKET / row['fixture']; f = json.loads(path.read_text()); case_output = output / f['case']; case_output.mkdir()
            receipt['nativeCases'].append({'case': f['case'], 'status': 'started'}); write_json(output / 'receipt.json', receipt)
            n = native_once(f, executable, path.parent, case_output, manifest['toolIdentity'])
            verify_native(f, n, path.parent); native_rows.append((f, n))
            receipt['nativeCases'][-1]['status'] = 'verified'; write_json(output / 'receipt.json', receipt)
        command = [manifest['node'], str(ROOT / 'scripts/raid-phase6-pair.mjs'), str(PACKET / 'cases.json')]
        try:
            run = subprocess.run(command, cwd=ROOT, capture_output=True, timeout=5)
        except subprocess.TimeoutExpired as error:
            (output / 'port.stdout').write_bytes(error.stdout or b''); (output / 'port.stderr').write_bytes(error.stderr or b'')
            raise
        (output / 'port.stdout').write_bytes(run.stdout); (output / 'port.stderr').write_bytes(run.stderr)
        assert run.returncode == 0, f'Port runner exited {run.returncode}'
        port = json.loads(run.stdout); write_json(output / 'port.json', port)
        assert len(port['rows']) == 2
        comparisons = [verify_port(f, n, p) for (f, n), p in zip(native_rows, port['rows'], strict=True)]
        write_json(output / 'comparison.json', comparisons)
        preflight(args)
        receipt['status'] = 'expected-settlement-mismatches-confirmed'
    except BaseException as error:
        receipt.update(status='failed', error=f'{type(error).__name__}: {error}')
        raise
    finally:
        write_json(output / 'receipt.json', receipt)
    print(json.dumps({'status': receipt['status'], 'nativeInvocations': 2, 'portInvocations': 2, 'retry': False}))


if __name__ == '__main__':
    main()
