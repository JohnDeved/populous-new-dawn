"""Derive the scoped M3 model/sparkle atlases from already recovered DATA.

No installer, extractor or native instruction is invoked. Existing c assets and
model indices remain untouched. --check regenerates in memory and compares.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PATCHES = [92, 93, 94, 95, 100, 101, 102, 103, 108, 123, 127, 160]
TILES = [12, 24, 44, 92, 93, 94, 95, 100, 101, 102, 103, 108, 109, 122, 123, 127, 143, 160, 226]
HASHES = {
    'bl320-p.dat': '26fbee4d3cb590462e1ef3c9afe1964283f1b662e8c58057ed8f2cbf324b2a05',
    'pal0-p.dat': 'f246c0c22c835208167ae4ad8a4c1f1303691c610a1ff8560edeaf1f7d095f74',
    'al0-p.dat': 'd6bb76a8ba8c2613376132fa7b0eec58277254fee4b786129746ed0c96890357',
    'hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
}
DECODER = '02127ee637d42c033119a16045c26b01adaa7d8c2833a82c3bedd03d247039e0'
BASE_ATLAS = 'fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0'
SOURCE_HASHES = {
    'app/original-rules.json': '876ec0fad0fd380b6ae305624a3707f50ec5fa0d7b6a4c75702e50c2499ed4c6',
    'app/original-effects.json': '8e43389fe9610e70fcedbbd8fe63b11d4addf9a001378225ee5ce273c5b83fdb',
    'public/original/effects.png': 'dabd1d661b2b7cfe82d3f717f045bccbaa082a34ae0e2b0abf812c7744052a97',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def crop(pixels, width, x, y, w, h):
    return b''.join(pixels[((y + row) * width + x) * 4:((y + row) * width + x + w) * 4]
                    for row in range(h))


def paste(pixels, width, x, y, w, h, data):
    for row in range(h):
        start = ((y + row) * width + x) * 4
        pixels[start:start + w * 4] = data[row * w * 4:(row + 1) * w * 4]


def generate(project, bl320, source):
    for name, expected in SOURCE_HASHES.items():
        assert sha((project / name).read_bytes()) == expected, 'Source input mismatch: ' + name
    inputs = {'bl320-p.dat': bl320.read_bytes()}
    inputs.update({name: (source / name).read_bytes() for name in HASHES if name != 'bl320-p.dat'})
    for name, data in inputs.items():
        assert sha(data) == HASHES[name], 'Canonical DATA mismatch: ' + name
    script = project / 'scripts/import-original.py'
    assert sha(script.read_bytes()) == DECODER
    spec = importlib.util.spec_from_file_location('original_data_decoder', script)
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    atlas_path = project / 'public/original/atlas.png'
    assert sha(atlas_path.read_bytes()) == BASE_ATLAS
    width, height, base = decoder.read_owned_rgba_png(atlas_path)
    assert (width, height) == (256, 1024)
    rules = json.loads((project / 'app/original-rules.json').read_text())
    pal, al = inputs['pal0-p.dat'], inputs['al0-p.dat']
    decoded = decoder.object_texture(decoder.object_atlas(inputs['bl320-p.dat'], pal, al, rules['objectTextureAlpha']))
    atlas = bytearray(base)
    tiles = []
    for tile in TILES:
        x, y = tile % 8 * 32, tile // 8 * 32
        original, replacement = crop(base, width, x, y, 32, 32), crop(decoded, width, x, y, 32, 32)
        assert original[3::4] == replacement[3::4], 'Alpha must be preserved'
        assert (original != replacement) == (tile in PATCHES)
        if tile in PATCHES:
            paste(atlas, width, x, y, 32, 32, replacement)
        tiles.append(dict(tile=tile, cRgbaSha256=sha(original), pRgbaSha256=sha(replacement)))
    assert atlas[3::4] == base[3::4]
    for tile in set(range(256)) - set(PATCHES):
        x, y = tile % 8 * 32, tile // 8 * 32
        assert crop(atlas, width, x, y, 32, 32) == crop(base, width, x, y, 32, 32)

    alpha_palette = b''.join(pal[al[(v | 15) * 256] * 4:al[(v | 15) * 256] * 4 + 3]
                             + bytes([(v & 15) * 17]) for v in range(256))
    sprites = decoder.sprites(inputs['hfx0-0.dat'], alpha_palette, alpha=True)
    ew, eh, existing = decoder.read_owned_rgba_png(project / 'public/original/effects.png')
    effects = json.loads((project / 'app/original-effects.json').read_text())
    assert (ew, eh) == (effects['width'], effects['height'])
    sparkles = bytearray(400 * 300 * 4)
    frames = []
    for index, ident in enumerate(range(1288, 1300)):
        w, h, pixels = sprites[ident]
        assert (w, h) == (100, 100)
        old = next(f for rows in effects['animations'].values() for f in rows if f['source'] == ident)
        c = crop(existing, ew, old['index'] % 8 * 256, old['index'] // 8 * 256, w, h)
        assert c[3::4] == pixels[3::4]
        x, y = index % 4 * 100, index // 4 * 100
        paste(sparkles, 400, x, y, w, h, pixels)
        frames.append(dict(source=ident, x=x, y=y, w=w, h=h, rgbaSha256=sha(pixels)))
    tints = []
    for selector in range(-2, 3):
        index = al[selector * 4096 + 0x2f82]
        rgb = list(pal[index * 4:index * 4 + 3])
        tints.append(dict(selector=selector, paletteIndex=index, rgb=rgb))
    metadata = dict(mission=3, landscapeBank=25, model=95, sha256=HASHES,
                    decoderSha256=DECODER, baseAtlasSha256=BASE_ATLAS, sourceFilesSha256=SOURCE_HASHES,
                    modelAtlas='temple-model-p', width=width, height=height,
                    changedTiles=PATCHES, tiles=tiles, modelRgbaSha256=sha(atlas),
                    sparkleAtlas='temple-sparkles-p', sparkleWidth=400, sparkleHeight=300,
                    frames=frames, sparkleRgbaSha256=sha(sparkles), tints=tints)
    files = {'app/original-temple-acquisition.json': (json.dumps(metadata, indent=2) + '\n').encode()}
    # The existing deterministic PNG encoder writes only temporary derived files.
    with tempfile.TemporaryDirectory() as temporary:
        for name, w, h, pixels in [('temple-model-p', width, height, atlas), ('temple-sparkles-p', 400, 300, sparkles)]:
            p = Path(temporary) / (name + '.png')
            decoder.png(p, w, h, pixels)
            files['public/original/' + name + '.png'] = p.read_bytes()
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bl320', type=Path, required=True)
    parser.add_argument('--source', type=Path, required=True, help='Existing PAL-p/AL-p/HFX DATA directory')
    parser.add_argument('--project', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    files = generate(args.project, args.bl320, args.source)
    for name, data in files.items():
        p = args.project / name
        if args.check:
            assert p.read_bytes() == data, 'Generated output mismatch: ' + name
        else:
            p.write_bytes(data)
    print(json.dumps({'status': 'checked' if args.check else 'generated',
                      'outputs': {p: {'bytes': len(b), 'sha256': sha(b)} for p, b in files.items()}}, indent=2))


if __name__ == '__main__':
    main()
