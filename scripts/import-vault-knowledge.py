#!/usr/bin/env python3
"""Import only Mission 3 Temple HFX1079 and its fourteen-frame knowledge glow.

python -B scripts/import-vault-knowledge.py GAME_ROOT [--project-root PROJECT] [--check]
Owns a dedicated atlas and metadata; never edits an existing shared atlas.
--check validates canonical decoded pixels and metadata without writing files.
"""
import argparse
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import struct
import tempfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HASHES = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'levels/levl2003.dat': 'eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf',
    'levels/levl2003.hdr': '219dd7611a4e3f6c2d4e78620a4d5bb9cf61bf0e9c66c21b2b43b89c8ba4d3f0',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/pal0-p.dat': 'f246c0c22c835208167ae4ad8a4c1f1303691c610a1ff8560edeaf1f7d095f74',
    'data/al0-p.dat': 'd6bb76a8ba8c2613376132fa7b0eec58277254fee4b786129746ed0c96890357',
}


def sha(value):
    return hashlib.sha256(value).hexdigest()


def pe_bytes(image, address, length):
    pe = struct.unpack_from('<I', image, 60)[0]
    base = struct.unpack_from('<I', image, pe + 24 + 28)[0]
    sections = pe + 24 + struct.unpack_from('<H', image, pe + 20)[0]
    for i in range(struct.unpack_from('<H', image, pe + 6)[0]):
        _, _, va, size, offset = struct.unpack_from('<8sIIII', image, sections + i * 40)
        if base + va <= address and address + length <= base + va + size:
            start = offset + address - base - va
            return image[start:start + length]
    raise ValueError(f'Unmapped native data {address:08x}')


def canonical(source):
    raw = {name: (source / name).read_bytes() for name in HASHES}
    for name, data in raw.items():
        if sha(data) != HASHES[name]:
            raise ValueError('Canonical input hash mismatch: ' + name)
    assert raw['levels/levl2003.hdr'][96] == 25
    level = raw['levels/levl2003.dat']
    trigger = level[0x14043 + 91 * 55:0x14043 + 92 * 55]
    reward = level[0x14043 + 92 * 55:0x14043 + 93 * 55]
    assert list(trigger[:2]) == [6, 6] and trigger[7] == 4
    assert struct.unpack_from('<H', trigger, 13)[0] == 93
    assert list(reward[:2]) == [2, 6] and list(reward[7:11]) == [2, 5, 1, 1]
    body = struct.unpack('<H', pe_bytes(raw['d3dpoptb.exe'], 0x5a7228 + 5 * 76 + 10, 2))[0]
    descriptor = pe_bytes(raw['d3dpoptb.exe'], 0x5a6af8 + 43 * 11, 11)
    assert body == 1079 and list(descriptor[:8]) == [1, 14, 0, 4, 1, 0, 0, 0]
    spec = importlib.util.spec_from_file_location('vault_psfb', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    palette, alpha = raw['data/pal0-p.dat'], raw['data/al0-p.dat']
    ordinary = decoder.sprites(raw['data/hfx0-0.dat'], palette)
    alpha_palette = b''.join(
        palette[alpha[(value | 15) * 256] * 4:alpha[(value | 15) * 256] * 4 + 3]
        + bytes([(value & 15) * 17]) for value in range(256)
    )
    translucent = decoder.sprites(raw['data/hfx0-0.dat'], alpha_palette, alpha=True)
    tint_index = alpha[0x2f82]
    tint = list(palette[tint_index * 4:tint_index * 4 + 3])
    assert tint == [247, 235, 201]
    width = height = 384
    atlas = Image.new('RGBA', (width, height))
    frames = []
    for i, ident in enumerate([body, *range(1417, 1417 + descriptor[1])]):
        w, h, pixels = (ordinary if i == 0 else translucent)[ident]
        assert 0 < w <= 94 and 0 < h <= 94
        pixels = bytearray(pixels)
        if i:
            # Fixed Mission 3 palette-0 diffuse tint, multiplied in encoded RGB.
            # Keeping it in this dedicated artwork avoids material color-space drift.
            for at in range(0, len(pixels), 4):
                for channel in range(3):
                    pixels[at + channel] = (pixels[at + channel] * tint[channel] + 127) // 255
        image = Image.frombytes('RGBA', (w, h), bytes(pixels))
        x, y = (i % 4) * 96 + 1, (i // 4) * 96 + 1
        atlas.paste(image, (x, y))
        frames.append(dict(source=ident, x=x, y=y, w=w, h=h, rgbaSha256=sha(pixels)))
    assert (frames[0]['w'], frames[0]['h']) == (21, 23)
    assert (frames[1]['w'], frames[1]['h']) == (81, 68)
    x, y = struct.unpack_from('<hh', trigger, 3)
    metadata = dict(
        sha256=HASHES, atlas='vault-knowledge', width=width, height=height,
        mission=3, landscapeBank=25, buildingModel=5,
        source=dict(triggerIndex=91, rewardIndex=92, x=x / 256 - 8, z=-y / 256 - 8),
        body=frames[0], glow=dict(draw=43, step=descriptor[3], count=descriptor[1],
                                 tint=tint, tintBaked=True, frames=frames[1:]),
        rgbaSha256=sha(atlas.tobytes()),
    )
    return metadata, atlas


def prepare(project, source, check=False):
    metadata, atlas = canonical(source)
    metadata_path = project / 'app/original-vault-knowledge.json'
    image_path = project / 'public/original/vault-knowledge.png'
    present = [metadata_path.exists(), image_path.exists()]
    if any(present) and not all(present):
        raise ValueError('Partial Vault artwork exists; preserve and inspect it')
    if all(present):
        existing = json.loads(metadata_path.read_text())
        with Image.open(image_path) as image:
            pixels = image.convert('RGBA')
            if pixels.size != atlas.size or pixels.tobytes() != atlas.tobytes():
                raise ValueError('Installed Vault pixels differ from the canonical source')
        if existing != metadata:
            raise ValueError('Installed Vault metadata differs from the canonical source')
        return dict(status='PASS_VAULT_KNOWLEDGE_ART', changed=False,
                    rgbaSha256=metadata['rgbaSha256']), None
    if check:
        raise ValueError('Mission 3 Vault HFX artwork is not installed')
    output = io.BytesIO()
    atlas.save(output, format='PNG', compress_level=9)
    files = {metadata_path: (json.dumps(metadata, indent=2) + '\n').encode(),
             image_path: output.getvalue()}
    return dict(status='CREATED_VAULT_KNOWLEDGE_ART', changed=True,
                frames=[metadata['body']['source'], *[f['source'] for f in metadata['glow']['frames']]],
                rgbaSha256=metadata['rgbaSha256'],
                outputs={str(p.relative_to(project)): sha(b) for p, b in files.items()}), files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--project-root', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    receipt, files = prepare(args.project_root.resolve(), args.source.resolve(), args.check)
    pending = []
    try:
        for path, data in (files or {}).items():
            with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.' + path.name + '.', delete=False) as temporary:
                temporary.write(data)
                temporary.flush()
                os.fsync(temporary.fileno())
                pending.append((Path(temporary.name), path))
        for temporary, final in pending:
            os.replace(temporary, final)
    finally:
        for temporary, _ in pending:
            if temporary.exists(): temporary.unlink()
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
