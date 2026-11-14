#!/usr/bin/env python3
"""Import the original Guard Post world mesh (bank-2 object 7) and panel icon.

Usage: python3 -I scripts/import-guard-post.py GAME_ROOT [--check]

Evidence: decomp/research/guard-posts.md. The class-10/model-16 initializer
00500a30 case 0x10 calls unit_set_object(obj, 2, 7). The ninth building-panel
descriptor (005cc458 + 8 * 0x42, retained in decomp/research/native-help/source.json)
selects menu model 0x11 with normal icon HFX 1036. Object 7 must equal the
identity already pinned in app/original-help-previews.json and be identical in
object banks 2 and 6. No shared model catalog or atlas is regenerated; existing
outputs are never overwritten with different bytes. --check is read-only.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
HASHES = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
}
OBJECT = 7
ICON = 1036
PANEL_SLOT = 8


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def read(source, name, digest):
    data = (source / name).read_bytes()
    if hashlib.sha256(data).hexdigest() != digest:
        raise ValueError('Original Guard Post input SHA mismatch: ' + name)
    return data


def panel_record():
    arrays = json.loads((ROOT / 'decomp/research/native-help/source.json').read_text())['hudArrays']
    table = next(entry for entry in arrays if entry['address'] == '005cc458')
    raw = bytes.fromhex(table['hex'])
    if hashlib.sha256(raw).hexdigest() != table['sha256'] or len(raw) != 9 * 0x42:
        raise ValueError('Retained building-panel descriptor bytes differ')
    record = raw[PANEL_SLOT * 0x42:(PANEL_SLOT + 1) * 0x42]
    icon = struct.unpack_from('<H', record, 0x25)[0]
    model = record[0x37]
    if icon != ICON or model != 0x11:
        raise ValueError('Unexpected Guard Post panel descriptor')
    # The eight existing building icons sit at the same offset (1028..1035).
    hut = struct.unpack_from('<H', raw, 0x25)[0]
    if hut != 1028 or raw[0x37] != 1:
        raise ValueError('Unexpected building-panel descriptor layout')
    return {'address': '005cc458', 'slot': PANEL_SLOT, 'stride': 0x42, 'menuModel': model, 'icon': icon}


def decode(source):
    previews = json.loads((ROOT / 'app/original-help-previews.json').read_text())
    pins = previews['sources']
    identity = previews['identities']['2'][str(OBJECT)]
    decoder = module('original_decoder', ROOT / 'scripts/import-original.py')
    raw = {name: read(source, name, digest) for name, digest in HASHES.items()}
    models = {}
    for bank in (2, 6):
        files = {kind: read(source, f'objects/{kind}0-{bank}.dat', pins[f'objects/{kind}0-{bank}.dat'])
                 for kind in ('objs', 'facs', 'pnts')}
        objects = files['objs']
        geometry, (scale, _) = decoder.decode_original_model(objects, files['facs'], files['pnts'], OBJECT)
        record = objects[OBJECT * 54:(OBJECT + 1) * 54]
        if bank == 2 and hashlib.sha256(record).hexdigest() != identity['objectSha256']:
            raise ValueError('Object 7 differs from the pinned help-preview identity')
        if len(geometry['tiles']) != identity['faceCount'] or scale <= 0:
            raise ValueError('Unexpected original object 7')
        models[bank] = geometry
    if models[2] != models[6]:
        raise ValueError('Guard Post object 7 differs between banks 2 and 6')
    width, height, rgba = decoder.sprites(raw['data/hfx0-0.dat'], raw['data/pal0-c.dat'])[ICON]
    return {
        'version': 1,
        'object': OBJECT,
        'bank': 2,
        'model': models[2],
        'panel': panel_record(),
        'icon': {'id': ICON, 'width': width, 'height': height,
                 'rgbaSha256': hashlib.sha256(rgba).hexdigest()},
        'sha256': {**HASHES, **{name: pins[name] for name in pins if name.startswith('objects/')}},
    }, (width, height, rgba), decoder


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data, (width, height, rgba), decoder = decode(args.source)
    text = json.dumps(data, separators=(',', ':')) + '\n'
    output = ROOT / 'app/original-guard-post.json'
    icon = ROOT / 'public/original/guard-post-icon.png'
    if args.check:
        if output.read_text() != text:
            raise ValueError('Imported Guard Post data differs from original')
        if decoder.read_owned_rgba_png(icon)[2] != bytes(rgba):
            raise ValueError('Guard Post icon pixels differ from original')
    else:
        if output.exists() and output.read_text() != text:
            raise ValueError('Refusing to overwrite differing Guard Post data')
        if icon.exists() and decoder.read_owned_rgba_png(icon)[2] != bytes(rgba):
            raise ValueError('Refusing to overwrite a differing Guard Post icon')
        output.write_text(text)
        if not icon.exists():
            decoder.png(icon, width, height, rgba)
    print(f'Verified Guard Post object {OBJECT} (banks 2/6) and panel icon HFX{ICON} {width}x{height}.')


if __name__ == '__main__':
    main()
