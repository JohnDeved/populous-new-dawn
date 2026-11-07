"""Split only the verified lossless trailer into exact static byte parts.

Usage: python3 scripts/split-coming-soon.py VERIFIED_WEBM NEW_OUTPUT_DIRECTORY
Prints the generated worker/coming-soon-media.json manifest. Does not encode media,
execute original binaries, change hosting or overwrite an existing output directory.
The intact conversion remains retained as research input, not a public static asset.
"""
import hashlib
import json
from pathlib import Path
import sys

SOURCE_SHA256 = '60b08ae8032065f01ff4d1f31a88f64df6114675ec5e0bd99f24dcb98f375e60'
SOURCE_BYTES = 80054836
PART_BYTES = 20 * 1024 * 1024
BUFFER_BYTES = 64 * 1024


def split(source, output):
    if source.stat().st_size != SOURCE_BYTES:
        raise ValueError('Verified trailer size mismatch')
    with source.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != SOURCE_SHA256:
            raise ValueError('Verified trailer hash mismatch')
    output.mkdir(parents=True, exist_ok=False)
    parts = []
    with source.open('rb') as stream:
        remaining = SOURCE_BYTES
        while remaining:
            size = min(PART_BYTES, remaining)
            filename = f'trailer-{SOURCE_SHA256}-{len(parts):02}.bin'
            digest = hashlib.sha256()
            with (output / filename).open('xb') as target:
                left = size
                while left:
                    block = stream.read(min(BUFFER_BYTES, left))
                    if not block:
                        raise ValueError('Trailer changed during splitting')
                    target.write(block)
                    digest.update(block)
                    left -= len(block)
            parts.append({
                'path': f'/original/coming-soon/{filename}',
                'bytes': size,
                'sha256': digest.hexdigest(),
            })
            remaining -= size
        if stream.read(1):
            raise ValueError('Trailer grew during splitting')

    # Read the actual materialized parts back, rather than trusting write counts
    # or merely repeating the input file hash. Never concatenate them in memory.
    joined = hashlib.sha256()
    for part in parts:
        path = output / Path(part['path']).name
        if path.stat().st_size != part['bytes']:
            raise ValueError('Part size changed after splitting')
        digest = hashlib.sha256()
        with path.open('rb') as stream:
            while block := stream.read(BUFFER_BYTES):
                joined.update(block)
                digest.update(block)
        if digest.hexdigest() != part['sha256']:
            raise ValueError('Part bytes changed after splitting')
    if joined.hexdigest() != SOURCE_SHA256:
        raise ValueError('Parts do not reassemble to the verified trailer')
    return {'bytes': SOURCE_BYTES, 'sha256': SOURCE_SHA256, 'parts': parts}


if __name__ == '__main__':
    source, output = map(Path, sys.argv[1:])
    print(json.dumps(split(source, output), indent=2))
