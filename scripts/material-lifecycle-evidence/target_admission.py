"""Fresh-host before/after source checks; no old-host inode acceptance."""
import importlib.util
import json
from pathlib import Path
import sys
import controller as policy
import fresh_projection as fresh

PROFILE = None
SHARED = None


def configure(profile_path, profile_sha, adapter_path, adapter_sha):
    global PROFILE, SHARED
    policy.require(PROFILE is None and SHARED is None, 'Fresh admission already configured')
    policy.require(policy.sha256_file(profile_path) == profile_sha and
                   policy.sha256_file(adapter_path) == adapter_sha, 'Fresh admission input changed')
    spec = importlib.util.spec_from_file_location('material_fresh_shared', adapter_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    value = json.loads(Path(profile_path).read_bytes())
    policy.require(value['version'] == 2 and value['kind'] == 'fresh-host-material-projection',
                   'Wrong fresh admission profile')
    PROFILE, SHARED = value, module


def save(path, value):
    with Path(path).open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def snapshot(root, evidence, label):
    policy.require(PROFILE is not None and SHARED is not None and label in ('before', 'after'),
                   'Fresh admission is not configured')
    root = policy.physical(root)
    policy.require(str(root) == PROFILE['namespaceRuntime'], 'Wrong target root')
    actual = fresh.inspect(SHARED, root, PROFILE['git'])
    policy.require(actual == PROFILE['baseline'], 'Mounted source/dependencies differ from reviewed preparation')
    ancestors = {str(path): fresh.key(path) for path in root.parents}
    root_key = fresh.key(root)
    root_key[3] = root_key[4] = None
    result = {'rootKeyExceptOutputTimestamps': root_key, 'ancestorKeys': ancestors, 'kind': 'fresh-host-material-snapshot', 'source': actual,
              'privateOutputs': {name: fresh.key(policy.physical(root/name)) for name in fresh.PRIVATE_OUTPUTS}}
    save(Path(evidence)/'receipt'/('source-'+label+'.json'), result)
    return result


def compare_browser_sources(before, after):
    policy.require(before['kind'] == after['kind'] == 'fresh-host-material-snapshot' and
                   before['source'] == after['source'] and
                   before['rootKeyExceptOutputTimestamps'] == after['rootKeyExceptOutputTimestamps'] and
                   before['ancestorKeys'] == after['ancestorKeys'], 'Protected fresh-host source changed')
    policy.require(set(before['privateOutputs']) == set(after['privateOutputs']) == set(fresh.PRIVATE_OUTPUTS),
                   'Private output inventory incomplete')
    for name in fresh.PRIVATE_OUTPUTS:
        a, b = before['privateOutputs'][name], after['privateOutputs'][name]
        policy.require(all(a[index] == b[index] for index in (0, 1, 5)), 'Private output identity/mode changed')
    return {'status': 'protected-source-identical', 'allSourceLeavesAndReadonlyAncestorsExact': True,
            'kind': 'fresh-host-material-source-comparison',
            'source': before['source'], 'privateOutputMetadataMayChange': True}
