#!/usr/bin/env python3
"""Compare all shipped spell HUD icons with canonical descriptor and decoded data.

Only reads the original executable as PE data. Never executes or emulates it.
Default: verify the consumed pixel fixture and the shipped atlas without writes.
--fixture-output creates a new reviewable fixture; --report creates a new receipt.
Neither option overwrites a file or imports/re-packs production artwork.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import subprocess

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INPUTS = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
}
PIXEL_FIXTURE = ROOT / 'tests/fixtures/spell-icon-pixels.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def original_pixels(source):
    raw = {name: (source / name).read_bytes() for name in INPUTS}
    for name, expected in INPUTS.items():
        if sha(raw[name]) != expected:
            raise ValueError('Canonical input SHA-256 mismatch: ' + name)
    reader = module('spell_icon_pe', ROOT / 'scripts/check-static-mission18-sky.py')
    pe = reader.PE32(source / 'd3dpoptb.exe')
    decoder_path = ROOT / 'scripts/import-original.py'
    decoder = module('spell_icon_decoder', decoder_path)
    bank = decoder.sprites(raw['data/hfx0-0.dat'], raw['data/pal0-c.dat'])
    retained = json.loads((ROOT / 'tests/fixtures/spell-icon-states.json').read_text())
    rules = json.loads((ROOT / 'app/original-rules.json').read_text())
    descriptors = []
    for model, expected in retained['icons'].items():
        address = 0x5a80d0 + int(model) * 62
        record = pe.read(address, 62)
        icons = list(struct.unpack_from('<3H', record, 16))
        if icons != expected or icons != rules['spellCharging'][int(model)]['icons']:
            raise ValueError('Original spell descriptor differs: ' + model)
        descriptors.append(dict(model=int(model), address=address,
                                recordSHA256=sha(record), icons=icons))
    ids = sorted({icon for descriptor in descriptors for icon in descriptor['icons']} | {1056})
    if len(descriptors) != 20 or len(ids) != 61:
        raise ValueError('Expected all 20 shipped models and 61 distinct HUD resources')
    pixels, frames = {}, []
    for ident in ids:
        width, height, rgba = bank[ident]
        if width <= 0 or height <= 0 or len(rgba) != width * height * 4:
            raise ValueError('Invalid original frame: ' + str(ident))
        pixels[ident] = bytes(rgba)
        frames.append(dict(id=ident, width=width, height=height, rgbaSHA256=sha(rgba)))
    fixture = dict(schemaVersion=1, sources=INPUTS,
                   decoder=dict(path='scripts/import-original.py', sha256=sha(decoder_path.read_bytes())),
                   descriptorLayout=dict(base=0x5a80d0, stride=62, iconOffsets=[16, 18, 20],
                                         bank='data/hfx0-0.dat', renderer='0049daf0'),
                   descriptors=descriptors, frames=frames)
    return fixture, pixels


def compare_atlas(fixture, pixels):
    metadata = json.loads((ROOT / 'app/original-hud.json').read_text())
    image = Image.open(ROOT / 'public/original/hud.png').convert('RGBA')
    if image.size != (metadata['width'], metadata['height']):
        raise ValueError('HUD metadata/image dimensions disagree')
    for frame in fixture['frames']:
        ident = frame['id']
        rect = metadata['rects'][str(ident)]
        if (rect['w'], rect['h']) != (frame['width'], frame['height']):
            raise ValueError('Wrong original sprite dimensions: ' + str(ident))
        crop = image.crop((rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h']))
        if crop.tobytes() != pixels[ident]:
            raise ValueError('Shipped HUD crop differs from original RGBA: ' + str(ident))


def write_new(path, value):
    with path.open('x') as out:
        out.write(json.dumps(value, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--fixture-output', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    for path in [args.fixture_output, args.report]:
        if path and path.exists():
            raise ValueError('Output must be new: ' + str(path))
    fixture, pixels = original_pixels(args.source)
    compare_atlas(fixture, pixels)
    if args.fixture_output:
        write_new(args.fixture_output, fixture)
    elif json.loads(PIXEL_FIXTURE.read_text()) != fixture:
        raise ValueError('Consumed original-pixel fixture differs from canonical source')
    tracked = ['app/original-rules.json', 'app/original-hud.json', 'public/original/hud.png',
               'tests/fixtures/spell-icon-states.json', 'scripts/import-original.py',
               'scripts/check-static-mission18-sky.py', 'scripts/check-static-spell-icon-pixels.py']
    report = dict(status='passed', sourceHead=subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), sources=INPUTS,
        inputs={name: sha((ROOT / name).read_bytes()) for name in tracked},
        descriptorCount=len(fixture['descriptors']), frameCount=len(fixture['frames']),
        fixtureSHA256=sha((args.fixture_output or PIXEL_FIXTURE).read_bytes()),
        originalInputWrites=False, productionWrites=False,
        limits=['Static descriptor/data comparison only; no original executable execution or emulation.',
                'All 60 spell icon crops and HFX1056 match decoded RGBA; rendered controls require separate browser evidence.',
                'World VFX, reward markers and complete alternate-mode disabled semantics are not covered.'])
    if args.report:
        write_new(args.report, report)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
