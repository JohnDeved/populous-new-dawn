#!/usr/bin/env python3
"""Append only original Shield408–410/Bloodlust411–413 to an existing HUD atlas.

python3 -B scripts/import-spell-hud-icons.py GAME_ROOT [--project-root PROJECT] [--check]
The existing atlas is authoritative: never repack it or run the broad HUD importer.
Existing pixels/rects and every metadata value other than height/new rects survive.
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
IDS = tuple(range(408, 414))
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
    # Reuse only the reviewed PSFB decoder. Do not invoke its importer main.
    spec = importlib.util.spec_from_file_location('hud_psfb', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec); spec.loader.exec_module(decoder)
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
        if min(rect['x'], rect['y'], rect['w'], rect['h']) < 0 or rect['x'] + rect['w'] > image.width or rect['y'] + rect['h'] > image.height:
            raise ValueError('HUD rectangle outside atlas: ' + key)


def prepare(project, source, check=False):
    frames = original_frames(source)  # Reject bad inputs before touching outputs.
    metadata_path = project / 'app/original-hud.json'
    image_path = project / 'public/original/hud.png'
    meta = json.loads(metadata_path.read_text())
    before = Image.open(image_path).convert('RGBA')
    validate_rectangles(meta, before)
    for name, expected in HASHES.items():
        if meta['sha256'].get(name) != expected:
            raise ValueError('Existing HUD metadata has a different original input: ' + name)
    present = [str(i) in meta['rects'] for i in IDS]
    if any(present) and not all(present):
        raise ValueError('Partial six-frame import; preserve and inspect rather than overwrite')
    if all(present):
        for key, frame in frames.items():
            r = meta['rects'][key]
            if (r['w'], r['h']) != frame.size or before.crop((r['x'], r['y'], r['x']+r['w'], r['y']+r['h'])).tobytes() != frame.tobytes():
                raise ValueError('Existing original sprite differs: ' + key)
        return dict(status='PASS_SIX_ORIGINAL_HUD_FRAMES', changed=False,
                    frames={k: sha(v.tobytes()) for k, v in frames.items()},
                    width=before.width, height=before.height, metadata=meta), None
    if check:
        raise ValueError('Six original spell frames are not installed')
    # Append below the entire old image, not merely below occupied rectangles.
    # This preserves transparent/unreferenced old pixels too, with a1px gap.
    updated = deepcopy(meta)
    x, y, row_height = 0, before.height + 1, 0
    for key, frame in frames.items():
        if frame.width > before.width:
            raise ValueError('Original sprite exceeds unchanged atlas width')
        if x + frame.width > before.width:
            y += row_height + 1; x = row_height = 0
        updated['rects'][key] = dict(x=x, y=y, w=frame.width, h=frame.height)
        x += frame.width + 1; row_height = max(row_height, frame.height)
    updated['height'] = y + row_height
    after = Image.new('RGBA', (before.width, updated['height']))
    after.paste(before, (0, 0))  # No alpha mask: preserve all RGBA bytes exactly.
    for key, frame in frames.items():
        r = updated['rects'][key]; after.paste(frame, (r['x'], r['y']))
    validate_rectangles(updated, after)
    if after.crop((0, 0, before.width, before.height)).tobytes() != before.tobytes():
        raise AssertionError('Old atlas pixels changed')
    restored = deepcopy(updated)
    for key in frames: del restored['rects'][key]
    restored['height'] = meta['height']
    if restored != meta:
        raise AssertionError('An old metadata value changed')
    png = io.BytesIO(); after.save(png, format='PNG', compress_level=9)
    outputs = {image_path: png.getvalue(), metadata_path: (json.dumps(updated, separators=(',', ':'))+'\n').encode()}
    receipt = dict(status='APPENDED_SIX_ORIGINAL_HUD_FRAMES', changed=True,
                   oldSize=list(before.size), newSize=list(after.size),
                   oldPixelsSHA=sha(before.tobytes()), preservedOldPixelsSHA=sha(after.crop((0,0,before.width,before.height)).tobytes()),
                   frames={key:dict(rect=updated['rects'][key],rgbaSHA=sha(frame.tobytes())) for key,frame in frames.items()},
                   oldRectanglesPreserved=len(meta['rects']), priorMetadataPreserved=True,
                   outputs={str(file):sha(data) for file,data in outputs.items()})
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
            # Validate/build both files completely before replacing either one.
            for file, data in outputs.items():
                with tempfile.NamedTemporaryFile(dir=file.parent, prefix='.'+file.name+'.', delete=False) as out:
                    out.write(data); out.flush(); os.fsync(out.fileno()); pending.append((Path(out.name), file))
            for temporary, final in pending: os.replace(temporary, final)
    finally:
        for temporary, _ in pending:
            if temporary.exists(): temporary.unlink()
    receipt.pop('metadata', None)
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__': main()
