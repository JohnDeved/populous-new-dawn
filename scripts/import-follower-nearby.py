#!/usr/bin/env python3
"""Append only canonical HFX876–878 without repacking or replacing existing HUD art.

python3 -B scripts/import-follower-nearby.py GAME_ROOT [--project-root PROJECT] [--check]
Reads original data only; never executes the game. --check never writes outputs.
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
IDS = (876, 877, 878)
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
spec = importlib.util.spec_from_file_location('hud_append', ROOT / 'scripts/import-spell-hud-icons.py')
hud = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hud)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def prepare(project, source, check=False):
    frames = hud.original_frames(source, (875, *IDS))
    for key, frame in frames.items():
        if frame.size != (19, 16):
            raise ValueError('Original nearby frame dimensions differ: HFX' + key)
    metadata_path = project / 'app/original-hud.json'
    image_path = project / 'public/original/hud.png'
    meta = json.loads(metadata_path.read_text())
    with Image.open(image_path) as image:
        before = image.convert('RGBA')
    hud.validate_rectangles(meta, before)
    if meta.get('executableSha256') != EXE_SHA:
        raise ValueError('Existing HUD executable identity differs')
    for name, expected in hud.HASHES.items():
        if meta['sha256'].get(name) != expected:
            raise ValueError('Existing HUD original input differs: ' + name)
    hud.validate_installed(meta, before, frames, (875,))
    present = [str(ident) in meta['rects'] for ident in IDS]
    if any(present) and not all(present):
        raise ValueError('Partial nearby append; preserve and inspect existing assets')
    frame_data = {key: dict(width=frame.width, height=frame.height, rgbaSha256=sha(frame.tobytes()))
                  for key, frame in frames.items()}
    if all(present):
        hud.validate_installed(meta, before, frames, IDS)
        return dict(status='PASS_ORIGINAL_FOLLOWER_NEARBY_ART', changed=False,
                    frames=frame_data, size=list(before.size)), None
    if check:
        raise ValueError('Original follower nearby frames are not installed')
    updated, after = hud.append_phase(meta, before, frames, IDS)
    hud.validate_installed(updated, after, frames, IDS)
    png = io.BytesIO()
    after.save(png, format='PNG', compress_level=9)
    outputs = {image_path: png.getvalue(),
               metadata_path: (json.dumps(updated, separators=(',', ':')) + '\n').encode()}
    return dict(status='APPENDED_ORIGINAL_FOLLOWER_NEARBY_ART', changed=True,
                appended=list(IDS), oldSize=list(before.size), newSize=list(after.size),
                oldPixelsSha256=sha(before.tobytes()),
                preservedOldPixelsSha256=sha(after.crop((0, 0, *before.size)).tobytes()),
                oldRectanglesPreserved=len(meta['rects']), priorMetadataPreserved=True,
                frames=frame_data, inputs=hud.HASHES,
                outputs={str(path): sha(data) for path, data in outputs.items()}), outputs


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
