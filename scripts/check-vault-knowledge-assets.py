#!/usr/bin/env python3
"""Validate the dedicated Vault atlas, reproducibility and preservation guards.
python -B scripts/check-vault-knowledge-assets.py GAME_ROOT --base COMMIT [--mission 1|3]
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
PRESERVED = ('app/original-hud.json', 'app/original-effects.json', 'app/original-units.json',
             'public/original/hud.png', 'public/original/effects.png', 'public/original/unit-layers.png')
# Independently decoded in the reviewed Mission 1 source/artwork packet.
CAMP_RGBA = [
    '4f728efea07ff160530c49531bb4c82adb017aaed05ae8b3c21fc2327ad261ad',
    'c9f953baa45cd1d316c0aafa5b520d4f8ba48231aa41ac91cc2278b44f0303a9',
    '52ae4afa4435c0faa6912f89d10efbaf7dcbd5b0f5dee502028f9e47f9617cee',
    '74646bca655bb3333afee25ab5cf34921db1dae8ee066eae6b4c1237ca080809',
    '18a872856a9ed9d88d6a3b86dd71c490d1ddb089147b32739be44d39fd549d46',
    'f392f545088465c7f523602e5f76b305af4ecce1a9f2d581934b3d7d3959dec0',
    '648629c3d06067d07c4e82eb7a685b4829c512d84c90a06838d4d44249fe6cac',
    '5dfd6a9fd0c3e745f2825d05c025004405ea90165227b09fdb8898aa86baa120',
    '5b2c6500bd114ea3b22c77059edfb62765dfac082945c3b988ad6e811c9c0397',
    'b2bf23dfeda17ed1b0fc69f8e6ca46ee5c184e16630affd698e63345934f4f80',
    'c09063a2c5904abb5a4ad8945bd0731da9d99d66f2c4123c760d3518cb7e748c',
    '231042b11d9d46b38eaff0169ed32cd02d4df26fd18a89a35534ed4c99d73ad5',
    '097acff087da2cf037bdd41663e18f9ebdf3b7eb9909d05c744d5f7abd06443a',
    '1a92d5c78a2194f513705cbab2cd0646efe40a5cd90b4e199f24081b00c6759e',
    'bde54ba2b4894727b4fccf936d2ac6e48513ac69291ba4589491a808d32f6269',
]


def write(project, files):
    for name, data in files.items():
        path = project / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def check(source, base, mission=3):
    atlas = importer.PRESETS[mission]['atlas']
    files = (f'app/original-{atlas}.json', f'public/original/{atlas}.png')
    installed = {name: (ROOT / name).read_bytes() for name in files}
    if mission == 1:
        metadata = json.loads(installed[files[0]])
        with Image.open(ROOT / files[1]) as image:
            for frame, expected in zip([metadata['body'], *metadata['glow']['frames']], CAMP_RGBA, strict=True):
                pixels = image.crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h'])).convert('RGBA')
                assert importer.sha(pixels.tobytes()) == frame['rgbaSha256'] == expected
    for checking in (True, False):
        receipt, outputs = importer.prepare(ROOT, source, check=checking, mission=mission)
        assert not receipt['changed'] and outputs is None
    preserved = {}
    names = PRESERVED + (('app/original-vault-knowledge.json', 'public/original/vault-knowledge.png') if mission == 1 else ())
    for name in names:
        old = subprocess.run(['git', 'show', f'{base}:{name}'], cwd=ROOT,
                             check=True, capture_output=True).stdout
        assert old == (ROOT / name).read_bytes(), name
        preserved[name] = importer.sha(old)
    with tempfile.TemporaryDirectory(prefix='vault-art-reproduce-') as temporary:
        project = Path(temporary)
        receipt, outputs = importer.prepare(project, source, mission=mission)
        assert receipt['changed'] and len(outputs) == 2
        assert {str(p.relative_to(project)): b for p, b in outputs.items()} == installed
        write(project, installed)
        assert importer.prepare(project, source, mission=mission)[1] is None
    rejected = []
    for case in ('partial', 'pixels', 'metadata'):
        with tempfile.TemporaryDirectory(prefix='vault-art-negative-') as temporary:
            project = Path(temporary)
            write(project, installed)
            if case == 'partial':
                (project / files[1]).unlink()
            elif case == 'pixels':
                with Image.open(project / files[1]) as image:
                    altered = image.convert('RGBA')
                altered.putpixel((2, 2), (255, 0, 255, 255))
                altered.save(project / files[1])
            else:
                altered = json.loads(installed[files[0]])
                altered['body']['source'] += 1
                (project / files[0]).write_text(json.dumps(altered))
            before = {name: (project / name).read_bytes() for name in files if (project / name).exists()}
            try:
                importer.prepare(project, source, check=True, mission=mission)
            except ValueError as error:
                rejected.append(dict(case=case, error=str(error)))
            else:
                raise AssertionError('Expected rejection: ' + case)
            assert before == {name: (project / name).read_bytes() for name in before}
    assert installed == {name: (ROOT / name).read_bytes() for name in files}
    return dict(status='passed', base=base, mission=mission, canonicalRGBA=True, idempotent=True,
                reproducible=True, noRepositoryWrites=True, preserved=preserved,
                outputs={name: importer.sha(data) for name, data in installed.items()},
                negativeCases=rejected)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--base', required=True)
    parser.add_argument('--mission', type=int, choices=importer.PRESETS, default=3)
    args = parser.parse_args()
    print(json.dumps(check(args.source.resolve(), args.base, args.mission), indent=2))
