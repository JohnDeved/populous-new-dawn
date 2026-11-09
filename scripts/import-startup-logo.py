"""Convert only verified BLOGO.TGQ to the browser boot-logo asset.

Usage: python3 scripts/import-startup-logo.py GAME_ROOT OUTPUT_DIRECTORY
Requires FFmpeg 7.1.5 with libvpx-vp9/libopus. Does not execute the original game.
OUTPUT_DIRECTORY must be new. No other imported asset is regenerated.
"""
from contextlib import closing
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

DECODE_CHUNK_BYTES = 1024 * 1024


def decoded_chunks(command):
    """Stream one decoder and reap it, including early comparison failures."""
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    try:
        while chunk := process.stdout.read(DECODE_CHUNK_BYTES):
            yield chunk
        code = process.wait()
        if code:
            raise subprocess.CalledProcessError(code, command)
    finally:
        process.stdout.close()
        if process.poll() is None:
            try:
                process.terminate()
            except ProcessLookupError:
                pass
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                try:
                    process.kill()
                except ProcessLookupError:
                    pass
                process.wait(timeout=5)


def compare_decoded_video(original_command, converted_command, expected_bytes, temporary_dir):
    """Compare every decoded byte with bounded buffers and one decoder at a time.

    The temporary reference uses expected_bytes of disk, not a complete Python
    bytes object. It is removed on success and failure. This is not a decoder
    memory limit or a whole-operation deadline.
    """
    if not isinstance(expected_bytes, int) or isinstance(expected_bytes, bool) or expected_bytes <= 0:
        raise ValueError('Expected decoded size must be a positive integer')
    with tempfile.TemporaryFile(dir=temporary_dir) as reference:
        size = 0
        with closing(decoded_chunks(original_command)) as chunks:
            for chunk in chunks:
                size += len(chunk)
                if size > expected_bytes:
                    raise ValueError('Original decoded video exceeds expected frame size')
                reference.write(chunk)
        if size != expected_bytes:
            raise ValueError('Original decoded video has incomplete or missing frames')
        reference.seek(0)
        digest = hashlib.sha256()
        size = 0
        with closing(decoded_chunks(converted_command)) as chunks:
            for chunk in chunks:
                size += len(chunk)
                if size > expected_bytes:
                    raise ValueError('Converted decoded video exceeds expected frame size')
                if reference.read(len(chunk)) != chunk:
                    raise ValueError('Converted logo differs from expanded decoded source')
                digest.update(chunk)
        if size != expected_bytes:
            raise ValueError('Converted decoded video has incomplete or missing frames')
        return digest.hexdigest()


def frames_command(path, filters):
    return [
        'ffmpeg', '-v', 'error', '-nostdin', '-i', str(path), '-map', '0:v:0',
        *filters, '-pix_fmt', 'yuv420p', '-f', 'rawvideo', '-',
    ]


def main():
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
    # Compare every decoded YUV byte and the exact 188-frame size, not encoded
    # container identities. Keep only one FFmpeg decode process alive at a time.
    decoded_sha256 = compare_decoded_video(
        frames_command(source, ['-vf', 'scale=640:352:flags=neighbor,setsar=1']),
        frames_command(target, []), 188 * 640 * 352 * 3 // 2, output,
    )
    print(json.dumps({
        'sourceSha256': expected,
        'outputSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'decodedVideoSha256': decoded_sha256,
        'frames': 188, 'width': 640, 'height': 352, 'fps': 25,
        'ffmpeg': version, 'video': 'lossless decoded YUV equality',
        'audio': 'EA ADPCM decoded and transcoded to Opus; not bit-exact audio parity',
    }, indent=2))


if __name__ == '__main__':
    main()
