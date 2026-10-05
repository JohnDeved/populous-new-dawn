"""Independent direct PSFB expansion for reviewer comparison; no importer calls."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import struct
from PIL import Image

root = Path.cwd()
out = Path(__file__).resolve().parent
metadata = json.loads((root / 'app/original-vault-knowledge.json').read_text())
source = root.parent / 'prerequisites/game'
raw = {name: (source / name).read_bytes() for name in metadata['sha256']}
assert {name: hashlib.sha256(data).hexdigest() for name, data in raw.items()} == metadata['sha256']
bank, palette, alpha = [raw[name] for name in ('data/hfx0-0.dat', 'data/pal0-p.dat', 'data/al0-p.dat')]
assert bank[:4] == b'PSFB'
assert raw['levels/levl2003.hdr'][96] == 25
tint = palette[alpha[0x2f82] * 4:alpha[0x2f82] * 4 + 3]
assert tint == bytes([247, 235, 201])
entries = [metadata['body'], *metadata['glow']['frames']]
assert [frame['source'] for frame in entries] == [1079, *range(1417, 1431)]
atlas = bytearray(metadata['width'] * metadata['height'] * 4)
source_counts = Counter()
for index, frame in enumerate(entries):
    width, height, pointer = struct.unpack_from('<HHI', bank, 8 + frame['source'] * 8)
    assert (width, height) == (frame['w'], frame['h'])
    rgba = bytearray(width * height * 4)
    for y in range(height):
        x = 0
        while True:
            run = int.from_bytes(bank[pointer:pointer + 1], signed=True)
            pointer += 1
            if run == 0:
                break
            if run < 0:
                x -= run
            else:
                for value in bank[pointer:pointer + run]:
                    if frame['source'] == 1417:
                        source_counts[value] += 1
                    palette_index = alpha[(value | 15) * 256] if index else value
                    rgb = palette[palette_index * 4:palette_index * 4 + 3]
                    if index:
                        rgb = bytes(round(component * multiplier / 255) for component, multiplier in zip(rgb, tint))
                    opacity = (value & 15) * 17 if index else 255
                    rgba[(y * width + x) * 4:(y * width + x + 1) * 4] = rgb + bytes([opacity])
                    x += 1
                pointer += run
            assert x <= width
    assert hashlib.sha256(rgba).hexdigest() == frame['rgbaSha256']
    for y in range(height):
        at = ((frame['y'] + y) * metadata['width'] + frame['x']) * 4
        assert not any(atlas[at:at + width * 4])
        atlas[at:at + width * 4] = rgba[y * width * 4:(y + 1) * width * 4]
with Image.open(root / 'public/original/vault-knowledge.png') as image:
    assert image.size == (metadata['width'], metadata['height'])
    assert image.convert('RGBA').tobytes() == atlas
assert hashlib.sha256(atlas).hexdigest() == metadata['rgbaSha256']
result = {
    'status': 'passed', 'frames': len(entries), 'rgbaSha256': metadata['rgbaSha256'],
    'decoderSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'paletteTintIndex': alpha[0x2f82], 'paletteTintRGB': list(tint),
    'alphaMapping': [value * 17 for value in range(16)],
    'highNibbleColors': [],
}
for high in range(16):
    offset = ((high << 4) | 15) * 256
    palette_index = alpha[offset]
    rgb = palette[palette_index * 4:palette_index * 4 + 3]
    values = {str(value): count for value, count in sorted(source_counts.items()) if value >> 4 == high}
    result['highNibbleColors'].append({
        'highNibble': high, 'alOffset': hex(offset), 'paletteIndex': palette_index,
        'rgb': list(rgb), 'tintedRGB': [round(c * t / 255) for c, t in zip(rgb, tint)],
        'positiveRunPixels': sum(values.values()), 'sourceValues': values,
    })
(out / 'independent-decode.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: result[key] for key in ('status', 'frames', 'rgbaSha256', 'decoderSha256')}))
