#!/usr/bin/env python3
"""Cross-check public Pop3Math tables against the executable-derived browser tables."""
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
checkout = Path(sys.argv[1])
expected = 'e76fbe66d3b4902585e51cfdd6d43e7d0c11d14c'
revision = subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', 'HEAD'], text=True).strip()
assert revision == expected, 'Upstream changed; inspect it before updating the comparison'
source = (checkout / 'Internal/PopTB Platform/PopTB Platform/src/Pop3Math.cpp').read_text()
rules = json.loads((root / 'app/original-rules.json').read_text())
for upstream, key, size in [('atantable', 'atan', 257), ('SinTable', 'sine', 2560)]:
    body = re.search(r'Pop3Math::' + upstream + r'\[\]\s*=\s*\{(.*?)\}', source, re.S)
    assert body, f'Missing {upstream}'
    values = [int(n) for n in re.findall(r'[+-]?\d+', body[1])]
    assert len(values) == size, f'Unexpected {upstream} length'
    assert values[:len(rules[key])] == rules[key], f'{key} differs from native values'
    if key == 'sine':
        assert values[2048:] == values[:512], 'Extra sine quarter differs'
print('257 atan and 2048 sine entries match; extra 512 sine entries repeat the first quarter')
