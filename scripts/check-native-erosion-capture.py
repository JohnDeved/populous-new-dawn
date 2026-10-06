#!/usr/bin/env python3
"""Replay actual browser Erosion inputs; never launch the original OS binary.

Ordinary browser/profile capture composition is deliberately separate. A complete
terminal harness receipt, prospective lifecycle, exact input archive and captured
module bodies are mandatory. --validate-only never starts the native emulator.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MODULES = ('app/erosion.ts', 'app/erosion-observation.ts', 'app/world-turn.ts', 'app/game-clock.ts', 'qa/erosion-native-replay/capture.mjs')


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def hex_hash(value, length=64):
    return isinstance(value, str) and re.fullmatch('[0-9a-f]{%d}' % length, value) is not None


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def state(value, remaining):
    require(isinstance(value, dict) and set(value) == {'center', 'remaining', 'randomState', 'heights'}, 'Unexpected captured state fields')
    require(integer(value['remaining'], 0, 64) and value['remaining'] == remaining, 'Wrong Erosion countdown')
    require(integer(value['randomState'], 0, 0xffffffff), 'Invalid observed simulation RNG')
    center = value['center']
    require(isinstance(center, dict) and set(center) == {'x', 'y', 'h'}, 'Invalid native center')
    require(all(integer(center[k], 0, 65535) for k in ('x', 'y')) and integer(center['h'], -32768, 32767), 'Invalid native position range')
    heights = value['heights']
    require(isinstance(heights, list) and len(heights) == 16384, 'All 16384 native heights are required')
    require(all(integer(h, -32768, 32767) for h in heights), 'Heights must be signed shorts')


def validate(capture, receipt, lifecycle, modules, hashes, source_bytes):
    """Validate documents only. source_bytes is pinned git content in the CLI."""
    require(set(capture) == {'version', 'kind', 'level', 'shrineId', 'effectId', 'onsetTurn', 'failure', 'detached', 'runId', 'profileId', 'source', 'steps', 'creation'}, 'Unexpected capture fields')
    require(integer(capture.get('version'), 2, 2) and capture.get('kind') == 'ordinary-m3-erosion-controller-inputs', 'Requires version2 immediate-activation capture')
    require(capture.get('level') == 3 and capture.get('shrineId') == 101, 'Requires authored Mission 3 head101')
    require(integer(capture.get('effectId'), 1, 0x7fffffff), 'Missing actual effect identity')
    require(integer(capture.get('onsetTurn'), 0, 0x7fffffff), 'Missing actual onset turn')
    require(capture.get('failure') is None and capture.get('detached') is True, 'Capture failed or was not closed')
    source = receipt.get('source', {})
    require(receipt.get('status') == 'passed' and receipt.get('errors') == [], 'Successful error-free terminal harness receipt required')
    require(source == receipt.get('sourceAfter') and source.get('status') == '' and source.get('untracked') == [], 'Source drift or dirty source')
    require(source.get('trackedDiffSha256') == digest(b''), 'Tracked source diff is not empty')
    require(hex_hash(source.get('commit'), 40) and hex_hash(source.get('tree'), 40) and hex_hash(source.get('fingerprint')), 'Missing pinned source identity')
    require(capture.get('source') == {'commit': source['commit'], 'fingerprint': source['fingerprint']}, 'Capture source mismatch')
    runtime = receipt.get('runtime', {})
    require(runtime and runtime == receipt.get('runtimeAfter') and hex_hash(runtime.get('browserSha256')), 'Missing/stale actual runtime identity')
    scenario = receipt.get('scenario', {})
    require(scenario == receipt.get('scenarioAfter') and hex_hash(scenario.get('sha256')), 'Scenario drift')
    profile = receipt.get('profile', {})
    require(profile.get('cleanupVerified') is True and profile.get('continuationVerified') is True, 'Unverified profile terminal/cleanup')
    require(isinstance(capture.get('runId'), str) and bool(capture['runId']) and capture['runId'] == profile.get('runId'), 'Run identity mismatch')
    require(isinstance(capture.get('profileId'), str) and bool(capture['profileId']) and capture['profileId'] == profile.get('id'), 'Profile identity mismatch')
    binding = receipt.get('result', {}).get('erosionReplay', {})
    require(binding.get('files') == hashes, 'Terminal receipt does not bind these exact evidence bytes')
    require(binding.get('sourceFingerprint') == source['fingerprint'] and binding.get('runId') == capture['runId'], 'Terminal capture attribution mismatch')
    require(set(modules) == set(MODULES), 'Require each exact loaded controller/caller/clock module')
    for path in MODULES:
        module = modules[path]
        require(isinstance(module, dict) and set(module) == {'sourceSha256', 'servedSha256', 'servedBody'}, 'Invalid loaded module record')
        require(module['sourceSha256'] == digest(source_bytes(source['commit'], path)), 'Captured source module does not match pinned git bytes: ' + path)
        require(isinstance(module['servedBody'], str) and bool(module['servedBody']) and module['servedSha256'] == digest(module['servedBody'].encode()), 'Missing/corrupt captured served module: ' + path)
    require(lifecycle.get('runId') == capture['runId'] and lifecycle.get('sourceFingerprint') == source['fingerprint'], 'Lifecycle source/run mismatch')
    require(lifecycle.get('errors') == [] and lifecycle.get('speedViolations') == [], 'Lifecycle observer errors')
    observation = lifecycle.get('erosion', {})
    require(integer(observation.get('version'), 2, 2) and observation.get('shrineId') == 101 and observation.get('initialUses') == 0, 'Missing prospective version2 unused shrine observation')
    require(integer(observation.get('armedAtTurn'), 0, capture['onsetTurn'] - 1), 'Late lifecycle arm')
    require(observation.get('use', {}).get('turn') == capture['onsetTurn'] and observation['use'].get('uses') == 1, 'Missing actual shrine-use transition')
    require(len(observation.get('effects', [])) == 1, 'One actual authored Erosion required')
    effect = observation['effects'][0]
    onset = effect.get('onset', {})
    require(effect.get('onsetTurn') == capture['onsetTurn'] and onset.get('id') == capture['effectId'] and onset.get('kind') == 'erosion' and onset.get('remaining') == 63 and onset.get('age') == 0, 'Wrong observed controller onset after immediate processing')
    creation = capture['creation']
    require(isinstance(creation, dict) and set(creation) == {'center', 'remaining'} and integer(creation['remaining'], 64, 64) and creation['center'] == onset.get('center'), 'Missing matching constructor state before first processing')
    retired = effect.get('retired', {})
    require(retired.get('turnBefore') == capture['onsetTurn'] + 62 and retired.get('turnAfter') == capture['onsetTurn'] + 63 and retired.get('remaining') == 0 and retired.get('absentFromWorld') is True, 'Missing actual retirement at activation+63')
    require(effect.get('samples') == [[capture['onsetTurn'] + i, 63 - i] for i in range(64)], 'Incomplete adjacent version2 lifecycle samples including retirement')
    steps = capture.get('steps')
    require(isinstance(steps, list) and len(steps) == 64, 'Exactly 64 actual step records required')
    for ordinal, row in enumerate(steps, 1):
        require(set(row) == {'turn', 'visit'} and row['turn'] == capture['onsetTurn'] + ordinal - 1, 'Missing/duplicate/reordered observed step turn')
        visit = row['visit']
        require(set(visit) == {'ordinal', 'before', 'after', 'alive', 'completed', 'notifications', 'copyMilliseconds'}, 'Unexpected visit fields')
        require(integer(visit['ordinal'], ordinal, ordinal) and visit['completed'] is True and visit['alive'] is (ordinal < 64), 'Incomplete or reordered controller call')
        state(visit['before'], 65 - ordinal)
        state(visit['after'], 64 - ordinal)
        require(visit['before']['center'] == visit['after']['center'] == onset.get('center'), 'Changed controller center')
        elapsed = visit['copyMilliseconds']
        require(type(elapsed) in (int, float) and 0 <= elapsed < 1e6, 'Invalid diagnostic duration')
        notifications = visit['notifications']
        require(isinstance(notifications, list), 'Invalid notification list')
        if ordinal == 64:
            require(notifications == [], 'Retirement must not notify')
        else:
            require(1 <= len(notifications) <= 2 and notifications[0] == {'kind': 'sound', 'completed': True}, 'Missing/extra/reordered browser sound callback')
            if len(notifications) == 2:
                event = notifications[1]
                require(set(event) == {'kind', 'cell', 'completed'} and event['kind'] == 'terrain' and event['completed'] is True and integer(event['cell'], 0, 65535), 'Invalid terrain callback')
    return steps


def replay(executable, steps):
    # Import emulator dependencies only after all capture admission checks pass.
    from unicorn import UC_HOOK_CODE
    from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP
    from decomp import native_cpu
    cpu, identity = native_cpu(executable)
    cpu.mem_map(0x2000000, 0x10000)
    effect, scratch, stack, stop = 0x2000000, 0x2001000, 0x200e000, 0x200ff00
    write = lambda address, fmt, *values: cpu.mem_write(address, struct.pack('<' + fmt, *values))
    read = lambda address, fmt: struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    write(0x59df0c, 'I', scratch)
    events = []

    def hook(machine, address, size, user):
        sp = machine.reg_read(UC_X86_REG_ESP)
        if address == 0x48a050:
            args = [read(sp + 4, 'I'), read(sp + 8, 'I'), read(sp + 12, 'I')]
            require(args == [effect, 169, 2], 'Unexpected native sound arguments')
            events.append({'kind': 'sound', 'args': args})
        elif address == 0x44ddf0:
            args = [read(sp + 4, 'H'), read(sp + 8, 'I'), read(sp + 12, 'I')]
            require(args[1:] == [6, 1], 'Unexpected native queue arguments')
            events.append({'kind': 'queue', 'args': args})
        elif address == 0x44f2f0:
            args = [read(sp + 4, 'I'), read(sp + 8, 'H'), read(sp + 12, 'I'), read(sp + 16, 'I')]
            require(events and events[-1] == {'kind': 'queue', 'args': [args[1], 6, 1]} and args[::2] == [1, 6] and args[3] == 0xffffffff, 'Unexpected native terrain notification order/arguments')
            events.append({'kind': 'terrain', 'args': args})
        else:
            require(read(sp + 4, 'I') == effect, 'Unexpected native deletion target')
            events.append({'kind': 'delete', 'args': [effect]})
        machine.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
        machine.reg_write(UC_X86_REG_ESP, sp + 4)

    for address in (0x48a050, 0x44ddf0, 0x44f2f0, 0x4edcf0):
        cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)
    results = []
    for sound_bit in (0, 16):
        for row in steps:
            visit, events[:] = row['visit'], []
            before, after = visit['before'], visit['after']
            terrain = bytearray(0x40000)
            for i, height in enumerate(before['heights']):
                struct.pack_into('<h', terrain, i * 16 + 4, height)
            cpu.mem_write(0x8a03e4, bytes(terrain))
            cpu.mem_write(effect, bytes(256))
            write(effect + 0x10, 'I', sound_bit)
            write(effect + 0x3d, 'HHh', *(before['center'][k] for k in ('x', 'y', 'h')))
            write(effect + 0x6c, 'h', before['remaining'])
            write(0x89d178, 'I', before['randomState'])
            write(stack, 'II', stop, effect)
            cpu.reg_write(UC_X86_REG_ESP, stack)
            cpu.emu_start(0x50ff30, stop, count=3000000)
            require(cpu.reg_read(UC_X86_REG_EIP) == stop, 'Native instruction bound exhausted')
            raw = cpu.mem_read(0x8a03e4, 0x40000)
            heights = [struct.unpack_from('<h', raw, i * 16 + 4)[0] for i in range(16384)]
            mismatches = [i for i, pair in enumerate(zip(heights, after['heights'])) if pair[0] != pair[1]]
            require(not mismatches, f'Native height mismatch turn {row["turn"]}: {len(mismatches)} cells; first {mismatches[:20]}')
            require(read(0x89d178, 'I') == after['randomState'], f'Native RNG mismatch turn {row["turn"]}')
            require(read(effect + 0x6c, 'h') == after['remaining'], 'Native countdown mismatch')
            deleted = [event for event in events if event['kind'] == 'delete']
            require(len(deleted) == (not visit['alive']), 'Native deletion boundary mismatch')
            cells = [event['args'][0] for event in events if event['kind'] == 'queue']
            require(cells == [event['cell'] for event in visit['notifications'] if event['kind'] == 'terrain'], 'Native terrain callback mismatch')
            require(len([event for event in events if event['kind'] == 'terrain']) == len(cells), 'Missing paired native terrain notification')
            expected_order = ([] if sound_bit or not visit['alive'] else ['sound']) + ['queue', 'terrain'] * len(cells) + (['delete'] if not visit['alive'] else [])
            require([event['kind'] for event in events] == expected_order, 'Native callback order differs from selected sound-bit policy')
            results.append({'turn': row['turn'], 'selectedSoundBit': sound_bit, 'heightsSha256': digest(struct.pack('<16384h', *heights)), 'randomState': after['randomState'], 'remaining': after['remaining'], 'alive': not deleted, 'nativeInterceptedEvents': list(events)})
    return {'status': 'passed', 'nativeExecuted': True, 'executable': identity, 'calls': results,
            'claim': 'Same observed per-call heights/RNG/countdown and terrain notification cells under both explicitly selected sound-bit settings.',
            'notEstablished': ['Actual native sound policy/cadence', 'Native reward activation scheduling', 'Full engine timing', 'Downstream terrain queue, walk masks, object updates or rendering'],
            'intercepted': ['0048a050', '0044ddf0', '0044f2f0', '004edcf0']}


def strict_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate JSON field: ' + key)
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError('Nonfinite JSON: ' + value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('capture', 'receipt', 'lifecycle', 'modules', 'inputs'):
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--executable', type=Path)
    parser.add_argument('--validate-only', action='store_true')
    args = parser.parse_args()
    blobs = {}
    for name in ('capture', 'receipt', 'lifecycle', 'modules', 'inputs'):
        path = getattr(args, name)
        require(path.stat().st_size <= 32 * 1024 * 1024, 'Evidence file exceeds bounded 32MiB input: ' + name)
        blobs[name] = path.read_bytes()
    documents = {name: json.loads(blobs[name], parse_constant=reject_constant, object_pairs_hook=strict_object) for name in ('capture', 'receipt', 'lifecycle', 'modules')}
    hashes = {name: digest(blobs[name]) for name in ('capture', 'lifecycle', 'modules', 'inputs')}
    def source_bytes(commit, path):
        return subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)
    steps = validate(documents['capture'], documents['receipt'], documents['lifecycle'], documents['modules'], hashes, source_bytes)
    if args.validate_only:
        result = {'status': 'validation-passed', 'nativeExecuted': False, 'steps': len(steps), 'files': hashes}
    else:
        require(args.executable is not None, '--executable is required unless --validate-only')
        result = replay(args.executable, steps)
        result['files'] = hashes
        result['receiptSha256'] = digest(blobs['receipt'])
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
