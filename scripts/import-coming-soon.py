"""Convert the verified Coming Soon trailer without running the original game.

Usage: python3 scripts/import-coming-soon.py GAME_ROOT NEW_OUTPUT_DIRECTORY
Requires the same FFmpeg 7.1.5 conversion tools as import-startup-logo.py.
Only trailer.webm is created. No other imported asset is regenerated.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys


def main():
    game, output = map(Path, sys.argv[1:])
    source = game / 'fmv/trailer.tgq'
    expected = 'ee3d455f715a9b35a1d974c3918bc3600e98d43d64ec87124a3460e2848b9dfe'
    assert source.stat().st_size == 32317876, 'Trailer size mismatch'
    assert hashlib.sha256(source.read_bytes()).hexdigest() == expected, 'Trailer identity mismatch'
    version = subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0]
    assert version.startswith('ffmpeg version 7.1.5'), version
    # Reuse the accepted one-decoder-at-a-time, full-byte comparator. Importing
    # the module does not call its BLOGO-only main or regenerate that asset.
    specification = importlib.util.spec_from_file_location(
        'startup_logo_importer', Path(__file__).with_name('import-startup-logo.py'),
    )
    comparator = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(comparator)
    output.mkdir(parents=True, exist_ok=False)
    target = output / 'trailer.webm'
    filters = ['-vf', 'scale=640:480:flags=neighbor,setsar=1']
    arguments = [
        '-v', 'error', '-nostdin', '-threads', '2', '-filter_threads', '1',
        '-i', str(source), '-map', '0:v:0', '-map', '0:a:0', '-vf', 'setsar=1',
        '-c:v', 'libvpx-vp9', '-lossless', '1', '-row-mt', '1', '-threads', '2',
        '-c:a', 'libopus', '-b:a', '128k', '-map_metadata', '-1',
        '-fflags', '+bitexact', '-flags:v', '+bitexact', '-flags:a', '+bitexact', str(target),
    ]
    subprocess.run(['ffmpeg', *arguments], check=True)

    def decoded(path, transform):
        return [
            'ffmpeg', '-v', 'error', '-nostdin', '-threads', '2',
            '-filter_threads', '1', '-i', str(path), '-map', '0:v:0',
            *transform, '-pix_fmt', 'yuv420p', '-f', 'rawvideo', '-',
        ]

    decoded_sha256 = comparator.compare_decoded_video(
        decoded(source, filters), decoded(target, filters), 2425 * 640 * 480 * 3 // 2, output,
    )
    metadata = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-count_frames', '-show_streams',
        '-show_format', '-of', 'json', str(target),
    ], text=True))
    video = next(stream for stream in metadata['streams'] if stream['codec_type'] == 'video')
    audio = next(stream for stream in metadata['streams'] if stream['codec_type'] == 'audio')
    assert [video['width'], video['height'], int(video['nb_read_frames'])] == [320, 240, 2425]
    assert video['r_frame_rate'] == '25/1'
    assert audio['codec_name'] == 'opus' and audio['channels'] == 2
    print(json.dumps({
        'sourceSha256': expected,
        'sourceBytes': source.stat().st_size,
        'outputSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'outputBytes': target.stat().st_size,
        'decodedVideoSha256': decoded_sha256,
        'frames': 2425, 'width': 320, 'height': 240, 'fps': 25,
        'displayRect': [0, 0, 640, 480],
        'comparisonWidth': 640, 'comparisonHeight': 480,
        'sourceWidth': 320, 'sourceHeight': 240,
        'ffmpeg': version,
        'video': 'All decoded YUV bytes equal the both-axis nearest-neighbor expanded source',
        'audio': 'EA ADPCM decoded and transcoded to stereo Opus; not bit-exact audio parity',
        'audioDecoderLimit': 'FFmpeg 7.1.5 emits all 2424 audio packets; final 1015 samples round to 1008. An invalid-sample decoder diagnostic is retained in stderr; its origin is not established.',
        'outputMetadata': metadata,
    }, indent=2))


if __name__ == '__main__':
    main()
