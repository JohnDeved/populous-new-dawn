#!/usr/bin/env python3
"""Import only missing all-world selector artwork, reusing identical opening art.

The original executable is data only. All inputs and the complete existing
manifest are verified before any output. --check is read-only; differing output
must be generated to a new directory for review. No fonts, globes or old PNGs
are regenerated in place.
"""
import argparse
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/original/world-selector/native'


def load_manifest_importer():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        'selector_manifest', ROOT / 'scripts/import-world-selector-manifest.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_art(game_root, executable, language_root):
    source = load_manifest_importer()
    manifest = source.build_manifest(game_root, executable, language_root)
    if manifest != json.loads(source.OUTPUT.read_text()):
        raise ValueError('Selector manifest differs from verified original data')
    inputs = source.read_inputs(game_root, executable, language_root)
    text = source.load_module('selector_text_art', 'import-world-selector-text.py')
    sprites, png, decoder_hashes = text.load_decoder(ROOT / 'scripts/import-original.py')
    existing = {}

    def collect(value, directory):
        if not isinstance(value, dict):
            return
        if all(key in value for key in ('file', 'width', 'height', 'rgbaSha256', 'outputSha256')):
            path = directory / value['file']
            if source.sha(path.read_bytes()) != value['outputSha256']:
                raise ValueError(f'Existing asset hash mismatch: {path}')
            existing.setdefault((value['width'], value['height'], value['rgbaSha256']), []).append((
                '/' + str(path.relative_to(ROOT / 'public')), value['outputSha256']))
        for child in value.values():
            collect(child, directory)

    for name in ('panel', 'text'):
        directory = ROOT / 'public/original/world-selector' / name
        collect(json.loads((directory / 'provenance.json').read_text()), directory)
    outputs, records = {}, {}
    with tempfile.TemporaryDirectory(prefix='selector-art-') as temporary:
        candidate = Path(temporary) / 'candidate.png'

        def emit(filename, frame, preferred=None):
            width, height, rgba = frame
            raw_hash = source.sha(rgba)
            png(candidate, width, height, rgba)
            data = candidate.read_bytes()
            output_hash = source.sha(data)
            matches = existing.get((width, height, raw_hash), [])
            match = next((item for item in matches if item[0] == preferred), matches[0] if matches else None)
            if match is not None:
                url, prior_hash = match
                if prior_hash != output_hash:
                    raise ValueError(f'Existing pixel identity has different PNG encoding: {url}')
            else:
                url = f'/original/world-selector/native/{filename}'
                outputs[filename] = data
            records[url] = dict(width=width, height=height, rgbaSha256=raw_hash,
                                outputSha256=output_hash)
            return url

        banks, titles = {}, {}
        dimensions = {0: (638, 61), 1: (21, 21), 2: (21, 21),
                      3: (13, 15), 4: (13, 15), 5: (10, 12), 6: (10, 12), 10: (37, 37)}
        for suffix, bank in manifest['paletteBanks'].items():
            opening = {'c': 1, 's': 2, 'p': 3}.get(suffix)
            palette = inputs[bank['source']]
            panel = sprites(inputs['data/plspanel.spr'], palette, alpha=False)
            title_font = sprites(inputs[manifest['title']['fontSource']], palette, alpha=False)
            tooltip_font = sprites(inputs[manifest['tooltip']['fontSource']], palette, alpha=False)
            frames = {}
            for index, size in dimensions.items():
                if panel[index][:2] != size:
                    raise ValueError(f'Unexpected panel frame dimensions: {index}')
                frames[str(index)] = emit(f'panel-{suffix}-{index}.png', panel[index],
                                         f'/original/world-selector/panel/{opening}-{index}.png')
            tooltips = {}
            for key, tooltip in manifest['tooltip']['strings'].items():
                frame = text.compose(tooltip_font, tooltip['text'])
                if frame[:2] != (tooltip['width'], tooltip['height']):
                    raise ValueError(f'Unexpected tooltip metrics: {key}')
                tooltips[key] = emit(f'tooltip-{suffix}-{key}.png', frame,
                                     f'/original/world-selector/text/tooltip-{opening}-{key}.png')
            if panel[12][:2] != (26, 27):
                raise ValueError('Unexpected cursor dimensions')
            banks[suffix] = dict(panel=frames, tooltips=tooltips,
                                 cursor=emit(f'cursor-{suffix}.png', panel[12],
                                             f'/original/world-selector/text/cursor-{opening}.png'))
            for world in manifest['worlds']:
                if world['palette'] != suffix:
                    continue
                title = world['title']
                frame = text.compose(title_font, title['text'])
                if source.frame_metrics(frame) != {key: title[key] for key in
                                                  ('width', 'height', 'rgbaSha256')}:
                    raise ValueError(f'Unexpected title pixels: {world["mission"]}')
                titles[str(world['mission'])] = emit(f'title-{world["mission"]}.png', frame)
    runtime = dict(version=1, banks=banks, titles=dict(sorted(titles.items(), key=lambda pair: int(pair[0]))))
    provenance = dict(version=1, sourceManifestSha256=source.sha(source.OUTPUT.read_bytes()),
                      inputs=json.loads(source.SOURCES.read_text())['inputs'],
                      decoderFunctionsSha256=decoder_hashes,
                      fontSlots=dict(title=3, tooltip=11),
                      pixelPolicy='Source palette RGB; literal RLE alpha255; skipped pixels transparent; no scaling or recoloring',
                      limits=['Source-art reconstruction, not native device-rendered RGB parity.',
                              'Cursor palette backend remains unresolved.',
                              'Opt-in rendering prerequisite only; no profile, progression or launch activation.'],
                      assets=dict(sorted(records.items())))
    for filename, value in [('runtime.json', runtime), ('provenance.json', provenance)]:
        outputs[filename] = (json.dumps(value, indent=2) + '\n').encode()
    return outputs


def write_outputs(outputs, output, check=False):
    # Validate the entire destination before writing any member.
    for name, data in outputs.items():
        target = output / name
        if check or target.exists():
            if target.read_bytes() != data:
                raise ValueError(f'Output differs: {name}; choose a new --output directory')
    if not check:
        output.mkdir(parents=True, exist_ok=True)
        for name, data in outputs.items():
            (output / name).write_bytes(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--executable', type=Path)
    parser.add_argument('--language-root', type=Path)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    outputs = build_art(args.game_root, args.executable or args.game_root / 'd3dpoptb.exe',
                        args.language_root or args.game_root)
    write_outputs(outputs, args.output, args.check)
    print(f'{"Verified" if args.check else "Imported"} {len(outputs)} files, '
          f'{sum(map(len, outputs.values()))} bytes; opening assets reused, no activation.')


if __name__ == '__main__':
    main()
