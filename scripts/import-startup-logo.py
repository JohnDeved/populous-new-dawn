"""Convert only verified BLOGO.TGQ to the browser boot-logo asset.

Usage: python3 scripts/import-startup-logo.py GAME_ROOT OUTPUT_DIRECTORY
Requires FFmpeg 7.1.5 with libvpx-vp9/libopus. Does not execute the original game.
OUTPUT_DIRECTORY must be new. No other imported asset is regenerated.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

game, output = map(Path, sys.argv[1:])
source = game / 'fmv/blogo.tgq'
expected = '65602921453014c11b079b95f664a29c89727fb0b2d0dce4c40fee94665a80fa'
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected, 'BLOGO identity mismatch'
version = subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0]
assert version.startswith('ffmpeg version 7.1.5'), version
output.mkdir(parents=True, exist_ok=False)
target = output / 'blogo.webm'
arguments = [
    '-v', 'error', '-nostdin', '-i', str(source), '-map', '0:v:0', '-map', '0:a:0',
    '-vf', 'scale=640:352:flags=neighbor,setsar=1', '-c:v', 'libvpx-vp9',
    '-lossless', '1', '-row-mt', '1', '-threads', '2', '-c:a', 'libopus', '-b:a', '128k',
    '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact',
    '-flags:a', '+bitexact', str(target),
]
subprocess.run(['ffmpeg', *arguments], check=True)
# Compare decoded YUV planes, not encoded container identities. This proves all
# 188 frames survive lossless VP9 after the source-derived horizontal expansion.
def frames(path, filters):
    return subprocess.check_output([
        'ffmpeg', '-v', 'error', '-nostdin', '-i', str(path), '-map', '0:v:0',
        *filters, '-pix_fmt', 'yuv420p', '-f', 'rawvideo', '-',
    ])

original = frames(source, ['-vf', 'scale=640:352:flags=neighbor,setsar=1'])
converted = frames(target, [])
assert len(original) == 188 * 640 * 352 * 3 // 2
assert original == converted, 'Converted logo differs from expanded decoded source'
print(json.dumps({
    'sourceSha256': expected,
    'outputSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'decodedVideoSha256': hashlib.sha256(converted).hexdigest(),
    'frames': 188, 'width': 640, 'height': 352, 'fps': 25,
    'ffmpeg': version, 'video': 'lossless decoded YUV equality',
    'audio': 'EA ADPCM decoded and transcoded to Opus; not bit-exact audio parity',
}, indent=2))
