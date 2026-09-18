#!/usr/bin/env python3
"""Verify reviewed spell HUD appends against an explicit Git base and originals.

python3 -B scripts/check-spell-hud-icons.py GAME_ROOT --base BASE --report NEW_JSON
The checker reproduces the append in an isolated project and proves every pixel,
rectangle and metadata value from the explicit base survives unchanged.
"""

import argparse
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--base', required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if args.report.exists():
        raise ValueError('Use a new evidence path')
    args.report.parent.mkdir(parents=True, exist_ok=True)

    spec = importlib.util.spec_from_file_location(
        'spell_hud_append', ROOT / 'scripts/import-spell-hud-icons.py'
    )
    importer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(importer)
    frames = importer.original_frames(args.source)
    frame_keys = set(frames)

    old_json = subprocess.check_output(
        ['git', 'show', args.base + ':app/original-hud.json'], cwd=ROOT
    )
    old_png = subprocess.check_output(
        ['git', 'show', args.base + ':public/original/hud.png'], cwd=ROOT
    )
    old_meta = json.loads(old_json)
    current_meta = json.loads((ROOT / 'app/original-hud.json').read_bytes())
    old = Image.open(io.BytesIO(old_png)).convert('RGBA')
    current = Image.open(ROOT / 'public/original/hud.png').convert('RGBA')
    importer.validate_rectangles(old_meta, old)
    importer.validate_rectangles(current_meta, current)

    old_present = frame_keys & set(old_meta['rects'])
    accepted_six = {str(i) for i in importer.SPELL_IDS}
    if old_present not in (set(), accepted_six, frame_keys):
        raise AssertionError('Explicit base has an unsupported partial reviewed-frame state')
    if old_present == frame_keys:
        raise AssertionError('Explicit base must precede at least one reviewed append')

    new_keys = frame_keys - old_present
    assert frame_keys <= set(current_meta['rects']), 'Current atlas lacks a reviewed frame'
    assert set(current_meta['rects']) - set(old_meta['rects']) == new_keys

    stripped = deepcopy(current_meta)
    for key in new_keys:
        del stripped['rects'][key]
    stripped['height'] = old_meta['height']
    assert stripped == old_meta, 'Existing metadata changed beyond height/new rects'
    assert current.width == old.width
    assert (
        current.crop((0, 0, old.width, old.height)).tobytes() == old.tobytes()
    ), 'An existing RGBA byte changed'

    old_crops = 0
    for key, rect in old_meta['rects'].items():
        box = (rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h'])
        assert old.crop(box).tobytes() == current.crop(box).tobytes(), key
        old_crops += 1

    preserved_reviewed = []
    for key in sorted(old_present, key=int):
        rect = old_meta['rects'][key]
        current_rect = current_meta['rects'][key]
        assert current_rect == rect, key
        box = (rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h'])
        crop = current.crop(box)
        assert crop.tobytes() == frames[key].tobytes(), key
        preserved_reviewed.append(
            dict(id=int(key), rect=rect, rgbaSHA=sha(crop.tobytes()))
        )

    new_frames = []
    for key in sorted(new_keys, key=int):
        frame = frames[key]
        rect = current_meta['rects'][key]
        assert rect['y'] > old.height
        assert rect['w'] == frame.width and rect['h'] == frame.height
        crop = current.crop(
            (rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h'])
        )
        assert crop.tobytes() == frame.tobytes(), key
        new_frames.append(
            dict(id=int(key), rect=rect, rgbaSHA=sha(frame.tobytes()))
        )

    current_files = {
        p: sha((ROOT / p).read_bytes())
        for p in ['app/original-hud.json', 'public/original/hud.png']
    }
    cases = []
    with tempfile.TemporaryDirectory(
        prefix='spell-hud-check-', dir=args.report.parent.resolve()
    ) as temporary:
        project = Path(temporary) / 'project'
        (project / 'app').mkdir(parents=True)
        (project / 'public/original').mkdir(parents=True)

        def reset():
            (project / 'app/original-hud.json').write_bytes(old_json)
            (project / 'public/original/hud.png').write_bytes(old_png)

        def output_hashes():
            return {p: sha((project / p).read_bytes()) for p in current_files}

        def run(label, source=args.source, extra=(), success=True):
            argv = [
                sys.executable,
                '-B',
                str(ROOT / 'scripts/import-spell-hud-icons.py'),
                str(source),
                '--project-root',
                str(project),
                *extra,
            ]
            before = output_hashes()
            result = subprocess.run(
                argv, capture_output=True, text=True, timeout=10, cwd=temporary
            )
            assert (result.returncode == 0) == success, (label, result.stderr)
            if not success:
                assert output_hashes() == before, label + ' mutated outputs on failure'
            cases.append(
                dict(
                    label=label,
                    argv=argv,
                    exitCode=result.returncode,
                    stdout=result.stdout,
                    stderr=result.stderr,
                )
            )

        reset()
        run('reproduce-from-explicit-base')
        assert output_hashes() == current_files
        run('second-run-byte-idempotence')
        assert output_hashes() == current_files
        run('check-only', extra=('--check',))
        assert output_hashes() == current_files

        reset()
        run('check-missing-does-not-write', extra=('--check',), success=False)

        corrupted = Path(temporary) / 'bad-source'
        (corrupted / 'data').mkdir(parents=True)
        originals = {name: (args.source / name).read_bytes() for name in importer.HASHES}
        for name, data in originals.items():
            (corrupted / name).write_bytes(data)
        for name, data in originals.items():
            changed = bytearray(data)
            changed[len(changed) // 2] ^= 1
            (corrupted / name).write_bytes(changed)
            run('reject-same-length-corruption:' + name, corrupted, success=False)
            (corrupted / name).write_bytes(data)
            assert sha((corrupted / name).read_bytes()) == sha(data)

        partial = deepcopy(old_meta)
        if accepted_six <= set(partial['rects']):
            del partial['rects'][str(importer.SPELL_IDS[-1])]
        else:
            partial['rects'][str(importer.SPELL_IDS[0])] = dict(x=0, y=0, w=28, h=25)
        (project / 'app/original-hud.json').write_text(json.dumps(partial))
        run('reject-partial-six-frame-state', success=False)

        reset()
        run('reject-unknown-option', extra=('--all-sprites',), success=False)

        (project / 'app/original-hud.json').write_bytes(
            (ROOT / 'app/original-hud.json').read_bytes()
        )
        damaged = current.copy()
        rect = current_meta['rects'][str(importer.QUESTION_ID)]
        pixel = damaged.getpixel((rect['x'], rect['y']))
        damaged.putpixel((rect['x'], rect['y']), (pixel[0] ^ 1, *pixel[1:]))
        damaged.save(project / 'public/original/hud.png')
        run('reject-corrupt-installed-question-mark', success=False)

    assert {
        p: sha((ROOT / p).read_bytes()) for p in current_files
    } == current_files

    result = dict(
        at=datetime.now(timezone.utc).isoformat(),
        status='PASS_REVIEWED_SPELL_HUD_APPEND_PRESERVATION',
        base=args.base,
        checkerSHA=sha(Path(__file__).read_bytes()),
        importerSHA=sha((ROOT / 'scripts/import-spell-hud-icons.py').read_bytes()),
        inputSHA=importer.HASHES,
        outputs=current_files,
        oldDimensions=list(old.size),
        newDimensions=list(current.size),
        oldPixelsSHA=sha(old.tobytes()),
        preservedPixelsSHA=sha(
            current.crop((0, 0, old.width, old.height)).tobytes()
        ),
        oldRectanglesChecked=old_crops,
        oldMetadataUnchangedExceptHeight=True,
        preservedReviewedFrames=preserved_reviewed,
        newFrames=new_frames,
        cases=cases,
        originalInputWrites=False,
        sourceOutputWritesByChecker=False,
        limits='Exact original sprite and atlas preservation proof; HUD visibility behavior is separate.',
    )
    with args.report.open('x') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'cases'}, indent=2))


if __name__ == '__main__':
    main()
