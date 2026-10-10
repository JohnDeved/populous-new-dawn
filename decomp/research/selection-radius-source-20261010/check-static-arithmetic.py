"""Host arithmetic only; no original instructions or game model run."""
import hashlib
import json
import math
from pathlib import Path

folder = Path(__file__).resolve().parent
seed_path = folder / 'seed-table.json'
seed_bytes = seed_path.read_bytes()
assert hashlib.sha256(seed_bytes).hexdigest() == '11e96468391b95bcfa0fdb773cc532256cde611deba5ae8b18d259c9b0de0216'
seeds = json.loads(seed_bytes)['littleEndianWords']
maximum_steps = 0
for value in range(32769):
    result = 0
    steps = 0
    if value:
        result = seeds[value.bit_length() - 1]
        while value // result < result:
            result = (result + value // result) >> 1
            steps += 1
    assert result == math.isqrt(value), (value, result, math.isqrt(value))
    maximum_steps = max(maximum_steps, steps)
print(json.dumps({
    'claim': 'Static host arithmetic equivalence on the instruction-bound radius domain',
    'inputRangeInclusive': [0, 32768], 'comparedInputs': 32769,
    'mismatches': 0, 'maximumNewtonUpdates': maximum_steps,
    'maximumRoot': math.isqrt(32768),
    'seedArtifactSha256': hashlib.sha256(seed_bytes).hexdigest(),
    'originalInstructionsExecutedOrEmulated': False,
    'limits': 'No original runtime, caller cadence, building membership or ordinary gameplay claim.',
}, indent=2))
