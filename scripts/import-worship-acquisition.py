#!/usr/bin/env python3
"""Append only the three ordinary acquisition body frames, preserving the HUD atlas.

python3 -B scripts/import-worship-acquisition.py GAME_ROOT [--project-root PROJECT] [--check]
Reuses the accepted non-repacking HUD append and ordinary-palette PSFB decoder.
See decomp/research/worship-acquisition-body-raster.md for the native source contract.
--check reads canonical inputs and validates installed pixels/metadata without writes.
"""

import argparse
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
MODELS = {3: 1059, 4: 1060, 12: 1068}
CROPS = {1059: (8, 2, 13, 23), 1060: (5, 2, 19, 21), 1068: (2, 6, 25, 15)}
PIXEL_HASHES = {
    1059: 'b6044bb1c3c555baa0caeb3c9dbbf1a2fb224cc338e4441ff6f5e135750495a1',
    1060: '7129be75969942bb56382f18ad1f5adb101f855efd00b5c98927a132f33308a1',
    1068: '9c767bdc31459d0c23226bfe7939b3f457bd1b44a27b37dcaa00ece13bbaa61d',
}
spec = importlib.util.spec_from_file_location('hud_append', ROOT / 'scripts/import-spell-hud-icons.py')
hud = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hud)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def body_metadata(frames):
    bodies = {}
    for model, ident in MODELS.items():
        frame = frames[str(ident)]
        bounds = frame.getchannel('A').getbbox()
        if bounds is None:
            raise ValueError(f'Empty acquisition body HFX{ident}')
        x, y, right, bottom = bounds
        crop = (x, y, right - x, bottom - y)
        if frame.size != (28, 25) or crop != CROPS[ident]:
            raise ValueError(f'Acquisition body dimensions/crop differ: HFX{ident}')
        if set(frame.getchannel('A').tobytes()) != {0, 255}:
            raise ValueError(f'Acquisition body must use ordinary-palette opacity: HFX{ident}')
        digest = sha(frame.tobytes())
        if digest != PIXEL_HASHES[ident]:
            raise ValueError(f'Acquisition body canonical pixels differ: HFX{ident}')
        bodies[str(model)] = dict(
            source=ident, w=28, h=25,
            crop=dict(zip(('x', 'y', 'width', 'height'), crop)), rgbaSha256=digest,
        )
    return dict(
        executableSha256=EXE_SHA, sha256=hud.HASHES, atlas='hud', palette='ordinary',
        bodyFrames=bodies,
    )


def prepare(project, source, check=False):
    if sha((source / 'd3dpoptb.exe').read_bytes()) != EXE_SHA:
        raise ValueError('Canonical executable SHA mismatch; no native code is executed')
    frames = hud.original_frames(source, MODELS.values())
    body = body_metadata(frames)
    metadata_path = project / 'app/original-hud.json'
    image_path = project / 'public/original/hud.png'
    body_path = project / 'app/original-worship-acquisition.json'
    meta = json.loads(metadata_path.read_text())
    with Image.open(image_path) as source_image:
        before = source_image.convert('RGBA')
    hud.validate_rectangles(meta, before)
    if meta.get('executableSha256') != EXE_SHA:
        raise ValueError('HUD metadata has a different executable identity')
    for name, expected in hud.HASHES.items():
        if meta['sha256'].get(name) != expected:
            raise ValueError('HUD metadata has a different original input: ' + name)
    present = [str(ident) in meta['rects'] for ident in MODELS.values()]
    if any(present) and not all(present):
        raise ValueError('Partial acquisition append; preserve and inspect existing assets')
    if all(present):
        hud.validate_installed(meta, before, frames, MODELS.values())
        if not body_path.exists() or json.loads(body_path.read_text()) != body:
            raise ValueError('Installed acquisition crop/source metadata differs or is absent')
        return dict(
            status='PASS_ORIGINAL_WORSHIP_ACQUISITION_ART', changed=False,
            frames=body['bodyFrames'], size=list(before.size),
        ), None
    if body_path.exists():
        raise ValueError('Acquisition metadata exists without its complete atlas append')
    if check:
        raise ValueError('Original acquisition body frames are not installed')

    # This helper verifies every existing pixel and metadata value before returning.
    updated, after = hud.append_phase(meta, before, frames, MODELS.values())
    hud.validate_installed(updated, after, frames, MODELS.values())
    png = io.BytesIO()
    after.save(png, format='PNG', compress_level=9)
    outputs = {
        image_path: png.getvalue(),
        metadata_path: (json.dumps(updated, separators=(',', ':')) + '\n').encode(),
        body_path: (json.dumps(body, indent=2) + '\n').encode(),
    }
    receipt = dict(
        status='APPENDED_ORIGINAL_WORSHIP_ACQUISITION_ART', changed=True,
        appended=list(MODELS.values()), oldSize=list(before.size), newSize=list(after.size),
        oldPixelsSha256=sha(before.tobytes()),
        preservedOldPixelsSha256=sha(after.crop((0, 0, *before.size)).tobytes()),
        oldRectanglesPreserved=len(meta['rects']), priorMetadataPreserved=True,
        frames=body['bodyFrames'],
        outputs={str(path): sha(data) for path, data in outputs.items()},
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
        for path, data in (outputs or {}).items():
            with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.' + path.name + '.', delete=False) as temporary:
                temporary.write(data)
                temporary.flush()
                os.fsync(temporary.fileno())
                pending.append((Path(temporary.name), path))
        for temporary, final in pending:
            os.replace(temporary, final)
    finally:
        for temporary, _ in pending:
            if temporary.exists():
                temporary.unlink()
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
