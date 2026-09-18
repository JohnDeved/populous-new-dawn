#!/usr/bin/env python3
"""Append reviewed static worship objects from original bank 2.

Usage: python scripts/import-worship-models.py GAME_ROOT

This intentionally does not update public/original/provenance.json; that shared
manifest is updated separately after the exact generated-model delta is reviewed.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

MODELS = {
    8: 'acc56278fabe2b45cd9f2642824d06394b6758e462fe06e5b22b67c677f231fc',
    157: '21f743b9265069ef25202079aff0252a6016b827dcdafbf9dc1a1a8322ee090c',
}
EXPECTED = {
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/facs0-2.dat': '01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a',
    'objects/pnts0-2.dat': '09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911',
}


def canonical_sha(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(',', ':')).encode()
    ).hexdigest()


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: import-worship-models.py GAME_ROOT')
    source = Path(sys.argv[1])
    project = Path(__file__).resolve().parents[1]
    spec = importlib.util.spec_from_file_location(
        'import_original', project / 'scripts/import-original.py'
    )
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    raw = {}
    for name, expected in EXPECTED.items():
        data = (source / name).read_bytes()
        actual = hashlib.sha256(data).hexdigest()
        if actual != expected:
            raise ValueError(f'Original worship model input hash mismatch: {name} {actual}')
        raw[name] = data

    models_path = project / 'app/original-models.json'
    models = json.loads(models_path.read_text())
    before = dict(models)
    for model, expected_sha in MODELS.items():
        decoded, _ = module.decode_original_model(
            raw['objects/objs0-2.dat'],
            raw['objects/facs0-2.dat'],
            raw['objects/pnts0-2.dat'],
            model,
        )
        if canonical_sha(decoded) != expected_sha:
            raise ValueError(f'Unexpected decoded worship model {model}')
        existing = models.get(str(model))
        if existing is not None and existing != decoded:
            raise ValueError(f'Refusing to overwrite differing existing model {model}')
        models[str(model)] = decoded

    if any(models.get(key) != value for key, value in before.items()):
        raise AssertionError('Existing original models changed')
    models_path.write_text(json.dumps(models, separators=(',', ':')) + '\n')
    print(
        'Validated/appended original worship models '
        + ', '.join(str(model) for model in MODELS)
        + '; previous models retained; provenance manifest unchanged.'
    )


if __name__ == '__main__':
    main()
