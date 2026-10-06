"""Read recorded outputs only; apply the independently frozen prospective boundary.

The whole-record comparison is a separate artifact and is never rewritten here.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
POLICY_SHA = '5ea3bf389c59cb4ecbf98b19f98566939103e14ce49301b7fb64b330289d0128'


def read(path):
    data = path.read_bytes()
    if path.suffix == '.gz':
        data = gzip.decompress(data)
    return json.loads(data), hashlib.sha256(data).hexdigest()


def compare(native, port, policy):
    specs = json.loads((HERE / 'cases.json').read_text())
    names = [kind + '-' + spec['name'] for kind in ('person', 'building') for spec in specs]
    assert [case['name'] for case in native['cases']] == names
    assert [case['name'] for case in port['cases']] == names
    differences = []
    partial = []
    for index, (n, p) in enumerate(zip(native['cases'], port['cases'], strict=True)):
        cap = specs[index % len(specs)]['visits']
        for side in (n, p):
            assert 0 < len(side['visits']) <= cap
            assert [v['visit'] for v in side['visits']] == list(range(len(side['visits'])))
            assert all(type(v['complete']) is bool for v in side['visits'])
            assert all(not v['complete'] for v in side['visits'][:-1])
            assert side['visits'][-1]['complete'] or len(side['visits']) == cap
        assert n['visits'][0]['before']['fields'] == p['visits'][0]['before']['fields'], n['name']
        for i in range(max(len(n['visits']), len(p['visits']))):
            def mismatch(field, a, b):
                if a != b:
                    differences.append(dict(case=n['name'], visit=i, field=field, native=a, port=b))
            if i >= min(len(n['visits']), len(p['visits'])):
                mismatch('visit-presence', i < len(n['visits']), i < len(p['visits']))
                continue
            nv, pv = n['visits'][i], p['visits'][i]
            mismatch('complete', nv['complete'], pv['complete'])
            if nv['complete'] or pv['complete']:
                continue
            for field in policy['activeAfterFields']:
                mismatch(field, nv['after']['fields'][field], pv['after']['fields'][field])
            for bit in policy['activeAfterBits']:
                field, mask = bit['field'], int(bit['maskHex'], 16)
                mismatch(field + '&' + bit['maskHex'],
                         nv['after']['fields'][field] & mask, pv['after']['fields'][field] & mask)
        if not n['visits'][-1]['complete'] and not p['visits'][-1]['complete']:
            partial.append(n['name'])
    return {'status': 'failed' if differences else 'passed', 'cases': len(names),
            'boundedPartialCases': partial, 'differences': differences,
            'claim': 'Scoped active owned fields and body-completion visit boundary only; full raw diagnostics remain separate.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('native', type=Path)
    parser.add_argument('port', type=Path)
    args = parser.parse_args()
    policy, policy_sha = read(HERE / 'owned-projection.json')
    assert policy_sha == POLICY_SHA, 'Prospective policy changed'
    native, native_sha = read(args.native)
    port, port_sha = read(args.port)
    result = compare(native, port, policy)
    result.update(policySha256=policy_sha, nativeSha256=native_sha, portSha256=port_sha)
    print(json.dumps(result, indent=2))
    return int(result['status'] != 'passed')


if __name__ == '__main__':
    raise SystemExit(main())
