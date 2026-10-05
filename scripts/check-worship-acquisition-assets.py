#!/usr/bin/env python3
"""Check canonical acquisition pixels, non-repacking preservation and failure guards.

python3 -B scripts/check-worship-acquisition-assets.py GAME_ROOT --base BEFORE_COMMIT
Only temporary files are written. The named base must precede the three-frame append.
No native executable code, renderer, package tool or broad importer is run.
"""

import argparse
from copy import deepcopy
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('worship_import', ROOT / 'scripts/import-worship-acquisition.py')
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)
FILES = ('app/original-hud.json', 'public/original/hud.png', 'app/original-worship-acquisition.json')


def write_files(project, files):
    for name, data in files.items():
        path = project / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def check(project, source, base):
    installed = {name: (project / name).read_bytes() for name in FILES}
    result, outputs = importer.prepare(project, source, check=True)
    assert result['changed'] is False and outputs is None
    result, outputs = importer.prepare(project, source)
    assert result['changed'] is False and outputs is None

    before = {
        name: subprocess.run(['git', 'show', f'{base}:{name}'], cwd=project,
                             check=True, capture_output=True).stdout
        for name in FILES[:2]
    }
    old_meta = json.loads(before[FILES[0]])
    meta = json.loads(installed[FILES[0]])
    old_image = Image.open(io.BytesIO(before[FILES[1]])).convert('RGBA')
    image = Image.open(io.BytesIO(installed[FILES[1]])).convert('RGBA')
    restored = deepcopy(meta)
    for ident in importer.MODELS.values():
        assert str(ident) not in old_meta['rects'], 'Base must precede this append'
        del restored['rects'][str(ident)]
    restored['height'] = old_meta['height']
    assert restored == old_meta, 'Prior metadata or an unrelated rectangle changed'
    old_pixels = old_image.tobytes()
    assert image.width == old_image.width
    assert image.crop((0, 0, *old_image.size)).tobytes() == old_pixels, 'Prior atlas pixels changed'

    with tempfile.TemporaryDirectory(prefix='worship-art-check-') as temp:
        fixture = Path(temp)
        write_files(fixture, before)
        receipt, generated = importer.prepare(fixture, source)
        assert receipt['appended'] == list(importer.MODELS.values())
        assert receipt['oldPixelsSha256'] == receipt['preservedOldPixelsSha256']
        assert {str(path.relative_to(fixture)): data for path, data in generated.items()} == installed, 'Append is not reproducible'

    rejected = []
    for case in ('partial-append', 'wrong-pixels', 'wrong-crop'):
        with tempfile.TemporaryDirectory(prefix='worship-art-negative-') as temp:
            fixture = Path(temp)
            write_files(fixture, installed)
            if case == 'partial-append':
                corrupted = deepcopy(meta)
                del corrupted['rects']['1060']
                (fixture / FILES[0]).write_text(json.dumps(corrupted))
            elif case == 'wrong-pixels':
                corrupted = image.copy()
                rect = meta['rects']['1059']
                corrupted.putpixel((rect['x'], rect['y']), (255, 0, 255, 255))
                corrupted.save(fixture / FILES[1])
            else:
                corrupted = json.loads(installed[FILES[2]])
                corrupted['bodyFrames']['3']['crop']['width'] += 1
                (fixture / FILES[2]).write_text(json.dumps(corrupted))
            hashes = {name: importer.sha((fixture / name).read_bytes()) for name in FILES}
            try:
                importer.prepare(fixture, source, check=True)
            except ValueError as error:
                rejected.append(dict(case=case, error=str(error)))
            else:
                raise AssertionError('Expected rejection: ' + case)
            assert hashes == {name: importer.sha((fixture / name).read_bytes()) for name in FILES}, 'Check altered a rejected fixture'

    assert installed == {name: (project / name).read_bytes() for name in FILES}, 'Check wrote to installed assets'
    return dict(
        status='passed', base=base, canonicalPixels=True, cropMetadata=True,
        idempotent=True, reproducible=True, noRepositoryWrites=True,
        preservedRectangles=len(old_meta['rects']), oldSize=list(old_image.size),
        newSize=list(image.size), preservedPixelsSha256=importer.sha(old_pixels),
        outputHashes={name: importer.sha(data) for name, data in installed.items()},
        negativeCases=rejected,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--project-root', type=Path, default=ROOT)
    parser.add_argument('--base', required=True)
    args = parser.parse_args()
    print(json.dumps(check(args.project_root.resolve(), args.source.resolve(), args.base), indent=2))


if __name__ == '__main__':
    main()
