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
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
MODULES = ('app/erosion.ts', 'app/erosion-observation.ts', 'app/world-turn.ts', 'app/game-clock.ts', 'qa/erosion-native-replay/capture.mjs',
           'qa/erosion-ordinary/lifecycle.mjs', 'qa/erosion-ordinary/input.mjs', 'qa/erosion-ordinary/minimap-input.mjs')


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


def admit_caller(receipt_bytes, receipt, expected):
    """Expectations come from the coordinator's actual terminal run, not this bundle."""
    require(hex_hash(expected['receipt']) and digest(receipt_bytes) == expected['receipt'], 'Caller-pinned terminal receipt mismatch')
    require(receipt.get('source', {}).get('commit') == expected['source'], 'Caller-pinned source commit mismatch')
    require(receipt.get('source', {}).get('fingerprint') == expected['fingerprint'], 'Caller-pinned source fingerprint mismatch')
    require(receipt.get('profile', {}).get('runId') == expected['run'], 'Caller-pinned actual run mismatch')


def admit_inputs(inputs, capture):
    require(inputs.get('version') == 1 and inputs.get('kind') == 'ordinary-m3-shaman-erosion-inputs' and inputs.get('restoreTested') is False, 'Expected one ordinary Shaman capture input archive')
    require(inputs.get('runId') == capture['runId'] and inputs.get('sourceFingerprint') == capture['source']['fingerprint'], 'Ordinary input run/source mismatch')
    actor = inputs.get('originalActorId')
    require(integer(actor, 1, 0x7fffffff), 'Missing original actor identity')
    initial = inputs.get('initial', {}).get('actor', {})
    require(initial.get('id') == actor and initial.get('team') == 'blue' and initial.get('kind') == 'shaman' and initial.get('hp', 0) > 0, 'Missing original living Blue Shaman')
    actions = inputs.get('actions', [])
    allowed = {'show-all-missions', 'mission-start', 'skip-introduction', 'key', 'button', 'minimap', 'camera-drag', 'head-hit-probe', 'detached-command-context', 'worship-click', 'worship-accepted', 'worship-arrival', 'worship-work'}
    require(isinstance(actions, list) and 1 <= len(actions) <= 64 and all(a.get('kind') in allowed and a.get('ordinal') == i + 1 for i, a in enumerate(actions)), 'Unexpected or unbounded ordinary action archive')
    clicks = [a for a in actions if a['kind'] == 'worship-click']
    require(len(clicks) == 2 and [a.get('phase') for a in clicks] == ['before', 'completed'] and all(a.get('actorId') == actor and a.get('hit', {}).get('id') == 101 for a in clicks), 'Exactly one completed named worship dispatch required')
    accepted = [a for a in actions if a['kind'] == 'worship-accepted']
    require(len(accepted) == 1 and accepted[0].get('actorId') == actor, 'Missing actual worship acceptance')
    entry = accepted[0]
    require(clicks[0]['ordinal'] < clicks[1]['ordinal'] < entry['ordinal'], 'Wrong worship dispatch/acceptance order')
    require(clicks[0].get('hit') == clicks[1].get('hit') == entry.get('hit'), 'Worship target coordinates changed')
    order = entry.get('after', {}).get('actor', {}).get('order', {})
    require(order.get('model') == 27 and order.get('a') == 101 and integer(order.get('flags'), 0, 255) and not order['flags'] & 1, 'Wrong accepted original worship order')
    delivered = entry.get('delivered', {})
    require(delivered.get('restored') is True and delivered.get('errors') == [], 'Pointer observation/cleanup failed')
    events = delivered.get('events', [])
    require([event.get('type') for event in events] == ['pointerdown', 'pointerup'], 'Missing actual delivered pointer pair')
    for event in events:
        require(event.get('button') == 0 and event.get('trusted') is True and event.get('canvasOwned') is True and event.get('canvasTarget') is True, 'Untrusted or unowned worship input')
        require(all(event.get('args', {}).get(key) is False for key in ('ctrlKey', 'shiftKey', 'altKey', 'metaKey')), 'Modified worship input')
        require(event.get('x') == entry['hit'].get('x') and event.get('y') == entry['hit'].get('y'), 'Delivered worship coordinates differ')
        for state in (event.get('state', {}), event.get('after', {})):
            require(all(state.get(key) is True for key in ('currentSceneMatches', 'currentWorldMatches', 'armedWorldMatches', 'armedCanvasMatches')), 'Delivered input ownership changed')
            require(state.get('target', {}).get('id') == 101 and state['target'].get('kind') == 'erosionEffect', 'Wrong actual delivered target')
        require(isinstance(event.get('picks'), list) and all(pick.get('receiverMatches') is True and not pick.get('threw') for pick in event['picks']), 'Actual picker receiver/error mismatch')
    require(any(pick.get('id') == 101 for event in events for pick in event['picks']), 'No actual authored head pick')
    before, after = entry.get('before', {}), entry.get('after', {})
    require(after.get('lastOrderTurn', -1) > before.get('lastOrderTurn', -1) and after.get('pointerAck', {}).get('until', -1) > before.get('pointerAck', {}).get('until', -1) and after['pointerAck'].get('target') == 101, 'No fresh actual order/pointer acknowledgement')
    witnesses = [[a for a in actions if a['kind'] == kind] for kind in ('worship-arrival', 'worship-work')]
    require(all(len(rows) == 1 for rows in witnesses), 'Require actual original-actor arrival and work witnesses')
    for rows in witnesses:
        row, witness = rows[0], rows[0].get('state', {})
        unit, head = witness.get('actor', {}), witness.get('shrine', {})
        require(row['ordinal'] > entry['ordinal'] and unit.get('id') == actor and unit.get('hp', 0) > 0 and unit.get('team') == 'blue' and unit.get('kind') == 'shaman', 'Wrong arrival/work actor or ordering')
        require(unit.get('order', {}).get('model') == 27 and unit['order'].get('a') == 101 and unit.get('state') in (10, 33) and unit.get('speed') == 0 and unit.get('substate', 0) > 0, 'Nonqualifying worship work state')
        require(head.get('id') == 101 and head.get('followers', 0) > 0 and head.get('uses') == 0, 'Wrong arrival/work head')
        distances = [((unit[key] - head[key] + 128) % 256) - 128 for key in ('x', 'z')]
        require(sum(d * d for d in distances) <= 16, 'Original actor not at the authored head')
    require(witnesses[1][0]['state']['shrine'].get('work', 0) > after.get('shrine', {}).get('work', 0), 'No actual head-work transition')
    require(inputs.get('final', {}).get('complete') is True, 'Ordinary capture did not complete')


def admit_runtime(plan_bytes, plan, receipt, modules, source_bytes):
    """Check existing records under the caller-pinned trusted terminal receipt.

    This validates correspondence, not authenticity of an arbitrary submitted bundle.
    The coordinator reviews actual script observations and the bounded compiler set.
    """
    source = receipt['source']; binding = receipt['result']['erosionReplay']
    require(hex_hash(binding.get('launchPlanSha256')) and digest(plan_bytes) == binding['launchPlanSha256'], 'Reviewed launch-plan bytes mismatch')
    policy = json.loads(source_bytes(source['commit'], 'qa/erosion-ordinary/policy.json'))
    require(plan.get('kind') == 'erosion-ordinary-capture-launch-plan' and plan.get('operationalGrantReceived') is True, 'Missing reviewed launch plan')
    require(plan.get('purpose') == 'capture', 'Startup-only smoke cannot be admitted as an Erosion capture')
    require(plan.get('sourceHead') == source['commit'] and plan.get('sourceFingerprint') == source['fingerprint'] and plan.get('root') == source.get('root'), 'Launch/source mismatch')
    require(plan.get('applicationTree') == policy['applicationTree'] and plan.get('limits') == policy['limits'] and plan.get('restoreTested') is False and binding.get('restoreTested') is False, 'Wrong application composition or scope')
    require(plan.get('scenarioSha256') == receipt['scenario']['sha256'] and receipt['scenario']['path'] == str(Path(plan['root']) / 'qa/erosion-ordinary/scenario.mjs'), 'Launch/scenario mismatch')
    profile = receipt['profile']
    require(profile.get('mode') == 'created' and profile.get('path') == plan.get('profilePath') and profile.get('previousRun') is None and profile.get('checkpointAtStart') is None, 'Requires the fresh ordinary profile')
    server = binding.get('serverIdentity', {})
    require(plan.get('serverIdentitySha256') == digest(json.dumps(server, separators=(',', ':'), ensure_ascii=False).encode()), 'Launch/compiler identity mismatch')
    runtime = receipt['runtime']
    require(all(server.get(key) == runtime.get(key) for key in ('node', 'platform', 'arch')), 'Actual runtime/compiler host mismatch')
    files = server.get('files', {})
    require(files.get('node_modules/.package-lock.json') == runtime.get('installedLockSha256') and hex_hash(files.get('node_modules/.package-lock.json')), 'Installed dependency lock mismatch')
    for path in ('package-lock.json', 'scripts/local-render/harness.mjs', 'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs', 'scripts/local-render/vite.config.mjs'):
        require(files.get(path) == digest(source_bytes(source['commit'], path)), 'Pinned compiler/server source mismatch: ' + path)
    packages, launcher = server.get('packages', {}), server.get('launcher', {})
    require(isinstance(packages, dict) and 1 <= len(packages) <= 512, 'Missing bounded immutable compiler package closure')
    for package in packages.values():
        require(isinstance(package.get('name'), str) and isinstance(package.get('version'), str) and package.get('files') and all(hex_hash(value) for value in package['files'].values()), 'Invalid compiler package file identity')
    vites = [(root, package) for root, package in packages.items() if package['name'] == 'vite']
    require(len(vites) == 1 and launcher.get('path') == str(Path(plan['root']) / 'node_modules/.bin/vite'), 'Missing actual Vite launcher identity')
    vite_root, vite = vites[0]
    require(launcher.get('target') == str(Path(vite_root) / 'bin/vite.js') and launcher.get('sha256') == vite['files'].get('bin/vite.js') and hex_hash(launcher.get('sha256')), 'Actual Vite CLI not in pinned closure')
    observations = binding.get('scriptObservations', [])
    require(isinstance(observations, list) and [row.get('path') for row in observations] == list(MODULES), 'Missing/duplicate/reordered actual script observations')
    contexts = set()
    for row in observations:
        path, url = row['path'], urlparse(row.get('url', ''))
        require(f'{url.scheme}://{url.netloc}' == plan.get('origin') and url.path == '/' + path, 'Actual script origin/path mismatch')
        require(isinstance(row.get('scriptId'), str) and row['scriptId'].isdigit() and integer(row.get('executionContextId'), 1, 0x7fffffff), 'Invalid actual script/context identity')
        require(hex_hash(row.get('cdpHash')) and hex_hash(row.get('sourceMapSha256')), 'Missing actual script observation hashes')
        require(row.get('correspondence') in ('exact', 'inline-source-map'), 'Missing pinned-source correspondence')
        if row['correspondence'] == 'exact':
            require(modules[path]['servedBody'].encode() == source_bytes(source['commit'], path), 'Wrong exact loaded source')
        contexts.add(row['executionContextId'])
    require(len(contexts) == 1 and len({row['scriptId'] for row in observations}) == len(MODULES), 'Script context/identity multiplicity')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('capture', 'receipt', 'lifecycle', 'modules', 'inputs', 'launch-plan'):
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--executable', type=Path)
    parser.add_argument('--validate-only', action='store_true')
    for name in ('receipt-sha256', 'source-commit', 'source-fingerprint', 'run-id'):
        parser.add_argument('--expected-' + name, required=True)
    args = parser.parse_args()
    blobs = {}
    for name in ('capture', 'receipt', 'lifecycle', 'modules', 'inputs', 'launch-plan'):
        path = getattr(args, name.replace('-', '_'))
        require(path.stat().st_size <= 32 * 1024 * 1024, 'Evidence file exceeds bounded 32MiB input: ' + name)
        blobs[name] = path.read_bytes()
    documents = {name: json.loads(data, parse_constant=reject_constant, object_pairs_hook=strict_object) for name, data in blobs.items()}
    admit_caller(blobs['receipt'], documents['receipt'], {'receipt': args.expected_receipt_sha256, 'source': args.expected_source_commit,
                 'fingerprint': args.expected_source_fingerprint, 'run': args.expected_run_id})
    admit_inputs(documents['inputs'], documents['capture'])
    hashes = {name: digest(blobs[name]) for name in ('capture', 'lifecycle', 'modules', 'inputs')}
    def source_bytes(commit, path):
        return subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)
    steps = validate(documents['capture'], documents['receipt'], documents['lifecycle'], documents['modules'], hashes, source_bytes)
    admit_runtime(blobs['launch-plan'], documents['launch-plan'], documents['receipt'], documents['modules'], source_bytes)
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
