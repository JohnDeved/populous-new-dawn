# Campaign sky audit — October 3, 2026

Audited source: `a4aff01ffb9b53599aee48277a38e67669399108`.
This is a read-only checkpoint for [issue #14](https://github.com/JohnDeved/populous-new-dawn/issues/14),
not a new rendering implementation or a whole-frame parity claim.

## Result

The early-mission asset correction is already present: Missions 1/2/3 select
the supplied **c/s/p** backdrops and both cloud layers. The decoded RGBA pixels
of all nine selected browser images equal their supplied originals. Bank d is
also bound; bank g deliberately uses its indexed single-lens fallback.

**Fourteen other supported missions still receive c instead of their authored
bank.** These are thirteen distinct banks because Missions 7 and 11 share bank 6.
For every missing bank, the supplied backdrop and both cloud files exist, and
each of their decoded RGBA images differs from its current c counterpart. This
is an asset-selection gap, not an unavailable-input blocker. No later-mission
assets or gameplay were changed during this audit.

| Missions | Header byte 96 | Filename suffix | Current browser selection |
| --- | ---: | --- | --- |
| 1, 6, 17 | 12 | c | c, matching supplied PNG pixels |
| 2 | 28 | s | s, matching supplied PNG pixels |
| 3, 10 | 25 | p | p, matching supplied PNG pixels |
| 4, 19 | 13 | d | d, matching supplied PNG pixels |
| 5 | 22 | m | c; all three images differ |
| 7, 11 | 6 | 6 | c; all three images differ |
| 8 | 11 | b | c; all three images differ |
| 9 | 5 | 5 | c; all three images differ |
| 12 | 17 | h | c; all three images differ |
| 13 | 1 | 1 | c; all three images differ |
| 14 | 10 | a | c; all three images differ |
| 15 | 24 | o | c; all three images differ |
| 16 | 21 | l | c; all three images differ |
| 18 | 16 | g | indexed type-1 lens; supplied gb PNG absent |
| 20 | 9 | 9 | c; all three images differ |
| 21 | 29 | t | c; all three images differ |
| 22 | 4 | 4 | c; all three images differ |
| 23 | 30 | u | c; all three images differ |

For suffix X, the supplied filenames are `data/d3d/dsky0-Xb.png`,
`dsky0-X1.png`, and `dsky0-X2.png`. All 23 supplied campaign header hashes equal
the existing `headerSha256` values in the imported level modules. Header banks
also equal `missionData(number).level.landscapeBank`. Missions 24/25 are not in
the current supported campaign registry and were not included. The separate
tutorial is outside this inventory.

The original [filename routine](../generated/0042a140.c) starts with bank-0
defaults, then uses bank + `0x30` below 10 or bank + `0x57` otherwise. Substitution
requires a successful palette open. Readable supplied files do not prove an
original-process Windows open succeeded. See the retained
[failure-path proof](mission18-sky.md) and
[early-mission execution boundary](early-mission-skies.md).

## Projection, orientation, colors and camera coverage

- The original sky is a screen-space lens grid, not a world sphere.
  `check-native-clouds.py` compares original `00523830`, `00523720`, `00517310`,
  `00517290`, `00517420` and their real triangle allocator against `app/sky.ts`.
  Its 128 updates cover signed camera wraps, half-heading rotation, lens UVs,
  coordinates, fades and flags; nine outer `00517630` dispatches additionally
  cover the camera horizon and backdrop's top-to-bottom V=0..1 quad.
- The browser cloud shader samples `(u, 1-v)` with the texture loader's normal
  vertically flipped image upload. The backdrop starts at image top and maps
  the native horizon to image bottom. The retained below-horizon edge extension
  is a deliberate modern wide-view adaptation. These are source observations;
  no fresh GPU or original-device orientation comparison was made here.
- `scene-assets.ts` gives sky/cloud images encoded-color bilinear filtering,
  no mipmaps and anisotropy 1. `check-native-texture-filter.py` checks original
  filter selection with supplied COM leaves. The historical browser calibration
  exercises actual sky materials with known colors, not an original-device
  framebuffer. Initial c/s/p/d/g palettes have identical four defeat-flash
  tribe RGB entries; no early-mission color correction follows from that lookup.
- `advanceSkyMotion` intentionally integrates wind and half-heading camera
  motion continuously between native camera snapshots. `sky-motion.test.mjs`
  checks wind rates and subdivision invariance; it does not claim bit-identical
  native intermediate raster frames. Historical `check-browser-sky-clock.mjs`
  covers camera modes, pause, blur and variable render schedules. That script
  writes a tracked historical performance file even without a record option,
  so it was inspected but not run during this audit.

The six portable tests in `sky-environment.test.mjs`, `sky-horizon.test.mjs` and
`sky-motion.test.mjs` passed on the audited source. Existing browser coverage
scripts are evidence of available assertions, not fresh execution receipts.
No new early-mission defect was established by this bounded inspection.

## Reproduce the read-only asset inventory

Use the pinned original executable (SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`), its supplied
adjacent `levels/` and `data/` directories, Node with TypeScript stripping, and
the already-required Pillow dependency. From the checkout root:

```sh
python - "$POPULOUS_EXE" <<'PY'
import hashlib, json, subprocess, sys
from pathlib import Path
from PIL import Image
exe = Path(sys.argv[1])
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert digest(exe) == json.loads(Path('decomp/tools.json').read_text())['executableSha256']
js = """import {missionData,missionNumbers} from './app/mission-data.ts';
import {skyEnvironment} from './app/sky-environment.ts';
console.log(JSON.stringify(missionNumbers.map(n=>{
  const level=missionData(n).level;
  return {n,bank:level.landscapeBank,header:level.headerSha256,...skyEnvironment(level.landscapeBank)};
})));"""
rows = json.loads(subprocess.check_output(['node','--input-type=module','-e',js], text=True))
for row in rows:
    header = exe.parent / f'levels/levl{2000 + row["n"]}.hdr'
    assert digest(header) == row['header']
    assert header.read_bytes()[96] == row['bank']
    suffix = chr(row['bank'] + (0x30 if row['bank'] < 10 else 0x57))
    layers = []
    for layer, name in zip(('b','1','2'), (row['backdrop'], *row['clouds'])):
        original = exe.parent / f'data/d3d/dsky0-{suffix}{layer}.png'
        if not original.exists():
            layers.append({'layer': layer, 'supplied': False})
            continue
        source = Image.open(original).convert('RGBA')
        browser = Image.open(f'public/original/{name}.png').convert('RGBA')
        layers.append({'layer': layer, 'sha256': digest(original),
          'equal': source.size == browser.size and source.tobytes() == browser.tobytes()})
    print(json.dumps({**row, 'suffix': suffix, 'layers': layers}))
PY
```

For bank g, this command reports the configured default/cloud image names,
which `makeSky` replaces with `sky-g` for its first lens and hides for its second.
The PNG comparison is therefore **not** a g rendering verdict. Use
[Mission 18's indexed-texture evidence](mission18.md#bank-g-sky) for that path.

## Remaining acceptance

Keep Missions 1–3 as the immediate priority. Their next visual-parity decision
needs matched, retained original/browser frames at known camera, viewport,
elapsed sky time and graphics settings. Native draw commands, exact source
images and browser self-consistency are useful independent checks; together
they still do not establish original-device whole-frame parity.

Later work under #14 can bind the thirteen missing supplied banks and verify
ordinary mission start, restart, load and transition before claiming those
environments. Terrain palettes/textures, ambience, runtime fallback, graphics
options and device blending remain separate acceptance. No parity percentage
or issue completion status changes in this checkpoint. No new screenshots are
presented because no visual change or fresh browser capture was made.
