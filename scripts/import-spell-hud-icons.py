#!/usr/bin/env python3
"""Append reviewed original spell HUD frames to an existing atlas without repacking it.

python3 -B scripts/import-spell-hud-icons.py GAME_ROOT [--project-root PROJECT] [--check]
The existing atlas is authoritative. The accepted Shield/Bloodlust six-frame append
is preserved byte-for-byte; HFX1056 is appended as a later migration below it.
"""

import argparse
from copy import deepcopy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import os
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPELL_IDS = tuple(range(408, 414))
QUESTION_ID = 1056
IDS = (*SPELL_IDS, QUESTION_ID)
HASHES = {
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
}
sha = lambda b: hashlib.sha256(b).hexdigest()


def original_frames(source):
    raw = {}
    for name, expected in HASHES.items():
        data = (source / name).read_bytes()
        if sha(data) != expected:
            raise ValueError('Canonical input SHA mismatch: ' + name)
        raw[name] = data
    spec = importlib.util.spec_from_file_location('hud_psfb', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    bank = decoder.sprites(raw['data/hfx0-0.dat'], raw['data/pal0-c.dat'])
    result = {}
    for ident in IDS:
        width, height, pixels = bank[ident]
        if width <= 0 or height <= 0 or len(pixels) != width * height * 4:
            raise ValueError('Invalid original sprite: ' + str(ident))
        result[str(ident)] = Image.frombytes('RGBA', (width, height), bytes(pixels))
    return result


def validate_rectangles(meta, image):
    if image.size != (meta['width'], meta['height']):
        raise ValueError('HUD image and metadata size disagree')
    for key, rect in meta['rects'].items():
        if any(type(rect.get(field)) is not int for field in ('x', 'y', 'w', 'h')):
            raise ValueError('Non-integer HUD rectangle: ' + key)
        if (
            min(rect['x'], rect['y'], rect['w'], rect['h']) < 0
            or rect['x'] + rect['w'] > image.width
            or rect['y'] + rect['h'] > image.height
        ):
            raise ValueError('HUD rectangle outside atlas: ' + key)


def validate_installed(meta, image, frames, ids):
    for ident in ids:
        key = str(ident)
        frame = frames[key]
        rect = meta['rects'].get(key)
        if not rect:
            raise ValueError('Missing installed original sprite: ' + key)
        crop = image.crop((rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h']))
        if (rect['w'], rect['h']) != frame.size or crop.tobytes() != frame.tobytes():
            raise ValueError('Existing original sprite differs: ' + key)


def append_phase(meta, image, frames, ids):
    updated = deepcopy(meta)
    x, y, row_height = 0, image.height + 1, 0
    for ident in ids:
        key = str(ident)
        frame = frames[key]
        if frame.width > image.width:
            raise ValueError('Original sprite exceeds unchanged atlas width')
        if x + frame.width > image.width:
            y += row_height + 1
            x = row_height = 0
        updated['rects'][key] = dict(x=x, y=y, w=frame.width, h=frame.height)
        x += frame.width + 1
        row_height = max(row_height, frame.height)
    updated['height'] = y + row_height
    after = Image.new('RGBA', (image.width, updated['height']))
    after.paste(image, (0, 0))
    for ident in ids:
        key = str(ident)
        frame = frames[key]
        rect = updated['rects'][key]
        after.paste(frame, (rect['x'], rect['y']))
    validate_rectangles(updated, after)
    if after.crop((0, 0, image.width, image.height)).tobytes() != image.tobytes():
        raise AssertionError('Existing atlas pixels changed')
    restored = deepcopy(updated)
    for ident in ids:
        del restored['rects'][str(ident)]
    restored['height'] = meta['height']
    if restored != meta:
        raise AssertionError('An existing metadata value changed')
    return updated, after


def prepare(project, source, check=False):
    frames = original_frames(source)
    metadata_path = project / 'app/original-hud.json'
    image_path = project / 'public/original/hud.png'
    meta = json.loads(metadata_path.read_text())
    before = Image.open(image_path).convert('RGBA')
    validate_rectangles(meta, before)
    for name, expected in HASHES.items():
        if meta['sha256'].get(name) != expected:
            raise ValueError('Existing HUD metadata has a different original input: ' + name)

    spell_present = [str(i) in meta['rects'] for i in SPELL_IDS]
    if any(spell_present) and not all(spell_present):
        raise ValueError('Partial six-frame spell HUD append; preserve and inspect rather than overwrite')
    question_present = str(QUESTION_ID) in meta['rects']
    if question_present and not all(spell_present):
        raise ValueError('Question-mark frame cannot precede the accepted six-frame append')

    if all(spell_present):
        validate_installed(meta, before, frames, SPELL_IDS)
    if question_present:
        validate_installed(meta, before, frames, (QUESTION_ID,))

    if check and (not all(spell_present) or not question_present):
        raise ValueError('Reviewed original spell HUD frames are not fully installed')

    original_meta = deepcopy(meta)
    original_pixels = before.tobytes()
    working_meta, working_image = meta, before
    appended = []
    if not all(spell_present):
        working_meta, working_image = append_phase(working_meta, working_image, frames, SPELL_IDS)
        appended.extend(SPELL_IDS)
    if not question_present:
        working_meta, working_image = append_phase(
            working_meta, working_image, frames, (QUESTION_ID,)
        )
        appended.append(QUESTION_ID)

    if not appended:
        return (
            dict(
                status='PASS_REVIEWED_ORIGINAL_HUD_FRAMES',
                changed=False,
                frames={k: sha(v.tobytes()) for k, v in frames.items()},
                width=before.width,
                height=before.height,
                metadata=meta,
            ),
            None,
        )

    if working_image.crop((0, 0, before.width, before.height)).tobytes() != original_pixels:
        raise AssertionError('Existing atlas pixels changed across append phases')
    restored = deepcopy(working_meta)
    for ident in appended:
        del restored['rects'][str(ident)]
    restored['height'] = original_meta['height']
    if restored != original_meta:
        raise AssertionError('Existing metadata changed across append phases')

    png = io.BytesIO()
    working_image.save(png, format='PNG', compress_level=9)
    outputs = {
        image_path: png.getvalue(),
        metadata_path: (json.dumps(working_meta, separators=(',', ':')) + '\n').encode(),
    }
    receipt = dict(
        status='APPENDED_REVIEWED_ORIGINAL_HUD_FRAMES',
        changed=True,
        appended=appended,
        oldSize=list(before.size),
        newSize=list(working_image.size),
        oldPixelsSHA=sha(original_pixels),
        preservedOldPixelsSHA=sha(
            working_image.crop((0, 0, before.width, before.height)).tobytes()
        ),
        frames={
            str(ident): dict(
                rect=working_meta['rects'][str(ident)],
                rgbaSHA=sha(frames[str(ident)].tobytes()),
            )
            for ident in IDS
        },
        oldRectanglesPreserved=len(original_meta['rects']),
        priorMetadataPreserved=True,
        outputs={str(file): sha(data) for file, data in outputs.items()},
    )
    return receipt, outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--project-root', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    receipt, outputs = prepare(args.project_root.resolve(), args.source.resolve(), args.check)
    pending = []
    try:
        if outputs:
            for file, data in outputs.items():
                with tempfile.NamedTemporaryFile(
                    dir=file.parent, prefix='.' + file.name + '.', delete=False
                ) as out:
                    out.write(data)
                    out.flush()
                    os.fsync(out.fileno())
                    pending.append((Path(out.name), file))
            for temporary, final in pending:
                os.replace(temporary, final)
    finally:
        for temporary, _ in pending:
            if temporary.exists():
                temporary.unlink()
    receipt.pop('metadata', None)
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
