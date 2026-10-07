"""Extract existing accepted records; never execute original code or record a fixture."""
import hashlib
import json
from pathlib import Path
import sys

EXPECTED_SHA = '1275f73e5781d068074015b758979d450fb792c67a459a0ef6b1e680fdfae890'
source = Path(sys.argv[1])
raw = source.read_bytes()
assert hashlib.sha256(raw).hexdigest() == EXPECTED_SHA
rows = [json.loads(line) for line in raw.splitlines()]
returned = {r['turn']: r for r in rows if r['kind'] == 'returned-pending-validation'}
result = rows[-1]
assert result['kind'] == 'timeline-result' and result['calls'] == 11
children = [(int(key), value) for key, value in result['generations'].items()
            if value['birth'] and value['class'] == 7 and value['model'] == 3]
assert len(children) == 32
requests = {e['request']['serial']: e['request'] for e in returned[6]['events'] if 'request' in e}
particles = []
for generation, child in children:
    handle = child['handle']
    request = requests[generation]
    assert child['born'] == 6 and child['visits'][0] == 7
    assert request['class'] == 7 and request['model'] == 3 and request['argumentFlag'] == 0
    particles.append({
        'generation': generation,
        'handle': handle,
        'gameplayBefore': request['rngs']['gameplay'],
        'cosmeticBefore': request['rngs']['cosmetic'],
        'birthHex': returned[6]['rawRecords'][str(handle)],
        'visits': [{'turn': turn, 'recordHex': returned[turn]['rawRecords'][str(handle)]}
                   for turn in child['visits']],
        'retired': child['retired'],
    })
output = {
    'sourceCommit': '566723189bb2177596fce44bf6fc7598f2344601',
    'sourcePath': 'references/verification/reincarnation-scheduled-burst-observer-2026-10-06/attempt-02/native-stdout.log',
    'sourceSha256': EXPECTED_SHA,
    'reviewCommit': '5732cc32',
    'executableSha256': result['executable']['sha256'],
    'nativeProducer': '0050ccd0',
    'nativeConsumer': '0050bd70 -> 004e7a80',
    'nativeConsumerCallEvidence': [r for r in result['directCalls'] if r[2] == '0x4e7a80'][:1],
    'groundHeight': 256,
    'limits': 'Existing supplied-context native component records, not a new execution or full original startup. Startup producer identity is separately traced in the source audit.',
    'particles': particles,
}
assert output['executableSha256'] == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
text = json.dumps(output, indent=2) + '\n'
if len(sys.argv) == 3:
    destination = Path(sys.argv[2])
    if destination.exists():
        assert destination.read_text() == text, 'Retained extraction differs; do not overwrite it'
    else:
        destination.write_text(text)
print(json.dumps({'particles': len(particles), 'visits': sum(len(p['visits']) for p in particles), 'fixtureSha256': hashlib.sha256(text.encode()).hexdigest()}))
