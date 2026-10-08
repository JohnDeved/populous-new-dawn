"""Finite CPU reference for source-derived building face feedback, not native execution.

Transformed corner depths are supplied. This does not implement the geometry
transform, full controller, companion, elapsed clock, painter or GPU renderer.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import struct


def short(value):
    return ((value + 32768) & 65535) - 32768


def face(threshold=3000):
    return {'threshold': threshold, 'angles': [0, 0, 0], 'heading': 0,
            'countdown': 0, 'flags': 2}


def feedback(faces, depths):
    """00473772..004737cd, called after transforms and before clipping/culling."""
    result = deepcopy(faces)
    selected = []
    for index, (item, corners) in enumerate(zip(result, depths, strict=True)):
        if len(selected) >= 4 or not item['flags'] & 2:
            continue
        threshold = short(item['threshold'])
        depth = sum(corners[:3]) + 3000
        if threshold != 0 and threshold >= depth:
            item['flags'] |= 4
            selected.append(index)
        if threshold < depth:
            item['threshold'] = short(depth)
    return result, selected


def controller_visit(faces, visits, yaw, complete=False, paused=False):
    """Phase4 feedback consumer only: 00483d8d..00483e86, then visit increment.

    Call only after phase4's visits==12 initialization; no pending phase transition
    is supplied here. Radius/spin/pulse/retirement are outside this small reference.
    """
    result = deepcopy(faces)
    if paused:
        return result, visits, complete
    all_started = True
    for index, item in enumerate(result):
        if not item['flags'] & 1 and item['flags'] & 4:
            item['flags'] = (item['flags'] | 1) & ~2
            item['heading'] = short(yaw)
            item['countdown'] = 10
        if item['flags'] & 1:
            a, b, c = item['angles']
            item['angles'] = [(a + ((index & 15) << 3) + 8) & 2047,
                              (b + (((index - 7) & 15) << 3) + 8) & 2047,
                              (c + (((index + 5) & 15) << 3) + 8) & 2047]
            if item['countdown']:
                item['countdown'] -= 1
        else:
            all_started = False
    if all_started and not complete:
        complete = True
        if visits <= 90:
            visits = 90
    return result, visits + 1, complete


def flight_sample(countdown, scale=40):
    """004736d5..00473772 and 004737cd..00473881, one bounded screen sample.

    The input first projected corner is (0,0), target=(100,50). This records
    the shared delta only, not the preceding float32 projection or matrix math.
    """
    tenth = struct.unpack('<f', bytes.fromhex('cdcccc3d'))[0]
    if countdown <= 0:
        return {'scale': 0, 'delta': [0, 0]}
    return {'scale': scale - int(scale / countdown),
            'delta': [int(value * (11 - countdown) * tenth) for value in (100, 50)]}


cases = []
depths = [[0, 0, 0, 999999]] * 5  # The fourth corner is deliberately irrelevant.
out, selected = feedback([face() for _ in range(5)], depths)
assert selected == [0, 1, 2, 3]
assert [item['flags'] for item in out] == [6, 6, 6, 6, 2]
cases.append({'case': 'equality-four-budget-and-unused-fourth-corner',
              'selected': selected, 'flags': [item['flags'] for item in out]})

items = [face() for _ in range(4)] + [face(-16384)]
out, selected = feedback(items, depths)
assert out[4]['threshold'] == -16384
cases.append({'case': 'budget-skips-later-threshold-write',
              'selected': selected, 'fifth': out[4]})

out, selected = feedback([face(2999), face(0), face(3001)], [[0, 0, 0]] * 3)
assert selected == [2]
assert [item['threshold'] for item in out] == [3000, 3000, 3001]
cases.append({'case': 'below-zero-and-above-threshold', 'selected': selected,
              'thresholds': [item['threshold'] for item in out]})

out, selected = feedback([face(-30000)], [[37000, 0, 0]])
assert not selected and out[0]['threshold'] == -25536
cases.append({'case': 'signed16-threshold-store', 'selected': selected, 'face': out[0]})

items, visits, complete = [face() for _ in range(5)], 20, False
trace = []
for paused in (True, True, False, False):
    items, visits, complete = controller_visit(items, visits, 640, complete, paused)
    items, selected = feedback(items, depths)
    trace.append({'paused': paused, 'visits': visits, 'complete': complete,
                  'selected': selected, 'flags': [item['flags'] for item in items],
                  'countdowns': [item['countdown'] for item in items]})
assert [row['visits'] for row in trace] == [20, 20, 21, 91]
assert [row['selected'] for row in trace] == [[0, 1, 2, 3], [0, 1, 2, 3], [4], []]
assert trace[-1]['countdowns'] == [8, 8, 8, 8, 9] and complete
assert items[0]['angles'] == [16, 160, 96] and items[4]['heading'] == 640
cases.append({'case': 'paused-feedback-next-visit-flight-and-all-started-shortening', 'trace': trace})

_, visits, complete = controller_visit([dict(face(), flags=1)], 95, 640)
assert visits == 96 and complete
cases.append({'case': 'late-all-started-does-not-rewind', 'visits': visits, 'complete': complete})

flight = [dict(countdown=count, **flight_sample(count)) for count in (10, 9, 1, 0)]
assert flight == [
    {'countdown': 10, 'scale': 36, 'delta': [10, 5]},
    {'countdown': 9, 'scale': 36, 'delta': [20, 10]},
    {'countdown': 1, 'scale': 0, 'delta': [100, 50]},
    {'countdown': 0, 'scale': 0, 'delta': [0, 0]},
]
cases.append({'case': 'bounded-flight-scale-and-shared-target-delta', 'samples': flight})

print(json.dumps({'status': 'passed', 'kind': 'finite-source-derived-CPU-reference',
                  'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  'nativeExecution': False, 'transformedDepthsSupplied': True,
                  'completeControllerComparison': False, 'cases': cases}, indent=2))
