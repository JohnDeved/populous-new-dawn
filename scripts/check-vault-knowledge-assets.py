#!/usr/bin/env python3
"""Validate the dedicated Vault atlas, reproducibility and preservation guards.
python -B scripts/check-vault-knowledge-assets.py GAME_ROOT --base COMMIT
Only temporary files are written. Native CPU and render/device code are not run.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('vault_import', ROOT / 'scripts/import-vault-knowledge.py')
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)
FILES = ('app/original-vault-knowledge.json', 'public/original/vault-knowledge.png')
PRESERVED = ('app/original-hud.json', 'app/original-effects.json', 'app/original-units.json',
             'public/original/hud.png', 'public/original/effects.png', 'public/original/unit-layers.png')


def write(project, files):
    for name, data in files.items():
        path = project / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def check(source, base):
    installed = {name: (ROOT / name).read_bytes() for name in FILES}
    for checking in (True, False):
        receipt, outputs = importer.prepare(ROOT, source, check=checking)
        assert not receipt['changed'] and outputs is None
    preserved = {}
    for name in PRESERVED:
        old = subprocess.run(['git', 'show', f'{base}:{name}'], cwd=ROOT,
                             check=True, capture_output=True).stdout
        assert old == (ROOT / name).read_bytes(), name
        preserved[name] = importer.sha(old)
    with tempfile.TemporaryDirectory(prefix='vault-art-reproduce-') as temporary:
        project = Path(temporary)
        receipt, outputs = importer.prepare(project, source)
        assert receipt['changed'] and len(outputs) == 2
        assert {str(p.relative_to(project)): b for p, b in outputs.items()} == installed
        write(project, installed)
        assert importer.prepare(project, source)[1] is None
    rejected = []
    for case in ('partial', 'pixels', 'metadata'):
        with tempfile.TemporaryDirectory(prefix='vault-art-negative-') as temporary:
            project = Path(temporary)
            write(project, installed)
            if case == 'partial':
                (project / FILES[1]).unlink()
            elif case == 'pixels':
                with Image.open(project / FILES[1]) as image:
                    altered = image.convert('RGBA')
                altered.putpixel((2, 2), (255, 0, 255, 255))
                altered.save(project / FILES[1])
            else:
                altered = json.loads(installed[FILES[0]])
                altered['body']['source'] = 1077
                (project / FILES[0]).write_text(json.dumps(altered))
            before = {name: (project / name).read_bytes() for name in FILES if (project / name).exists()}
            try:
                importer.prepare(project, source, check=True)
            except ValueError as error:
                rejected.append(dict(case=case, error=str(error)))
            else:
                raise AssertionError('Expected rejection: ' + case)
            assert before == {name: (project / name).read_bytes() for name in before}
    assert installed == {name: (ROOT / name).read_bytes() for name in FILES}
    return dict(status='passed', base=base, canonicalRGBA=True, idempotent=True,
                reproducible=True, noRepositoryWrites=True, preserved=preserved,
                outputs={name: importer.sha(data) for name, data in installed.items()},
                negativeCases=rejected)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--base', required=True)
    args = parser.parse_args()
    print(json.dumps(check(args.source.resolve(), args.base), indent=2))
