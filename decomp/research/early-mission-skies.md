# Early-mission sky selection

## Original selection and bounded correction

Missions 1, 2, and 3 have landscape-bank bytes **12, 28, and 25** at offset 96
of `levl2001.hdr`, `levl2002.hdr`, and `levl2003.hdr`. Their imported mission data
retains these values. The browser previously selected bank c for all three;
`makeSky` special-cased only bank 13 (d) and 16 (g).

The original [filename selector](../generated/0042a140.c) executes a character
mapping of bank + `0x57` for these banks: **c, s, p**. There is no additional
28/25-to-c remap in this routine. It starts by resetting the filename templates
to bank 0. Only a successful candidate palette open (return 0 from `00526280`)
allows the global filename substitutions at `0042a41b..0042a469`. A failed
palette open retains **bank 0**, never c and never the previous bank's names.
See [the existing static proof](mission18-sky.md#1-filename-selection-requires-a-successful-palette-open)
for the lower file-open/path behavior; it is not reinterpreted as an observed
Windows API success here.

The supplied palettes c/s/p are readable and hash-pinned in the checker. All
three D3D PNGs exist for each bank. [Sky initialization](../generated/004b60d0.c)
requests the selected backdrop, then the two cloud layers on its enabled,
successful-load path. This patch supplies the exact s/p PNG bytes and binds
`makeSky` and `updateSky` to the shared `skyEnvironment` selector. Mission 1,
bank d, bank g, and all unhandled-bank behavior remain unchanged. Mission 10
also has landscape bank 25, so it receives the same p sky as an incidental
consequence of the bank-level correction; a narrow regression covers this
shared-bank selection, with no expansion into Mission 10 gameplay. Sky geometry,
wind/motion, horizon, blending, overview rules and defeat-flash palette are
unchanged. The selector is a prevalidated shipped-asset mapping; it does not
pretend to emulate native OS palette failure or all graphics configurations.

## Reproduction and original-byte boundary

From the repository with the pinned `decomp/requirements.txt` environment:

```sh
python scripts/check-native-early-mission-skies.py /path/to/d3dpoptb.exe
node --test tests/sky-environment.test.mjs tests/sky-horizon.test.mjs tests/sky-motion.test.mjs
```

The native checker requires executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
It executes **10 original `0042a140` calls** in Unicorn: banks 12, 28, 25, 13,
and 16, each with supplied open success and failure. Reusing the CPU across
success/failure cases verifies reset rather than stale-bank reuse. It asserts
all five resulting sky/palette filenames, the attempted palette path, read-open
flags, success-only handle close, and the recorded requested bank byte.

Intercepted leaves are palette reset `004a3200`, message cleanup `004a3d20`,
identity path resolution `005001b0`, supplied open result `00526280`, and close
`00526370`. Windows filesystem calls, installation prefixes, image decode,
DirectDraw/Direct3D allocation, full level loading, and original rendered
frames are **not executed**. The success/failure tests establish the conditional
filename routine, not actual original-process file access.

Separately, the checker validates original header/palette hashes; checks six
s/p asset hashes and exact equality against the browser PNGs; decodes their RGBA
to prove they actually differ from c, rather than only PNG metadata; and invokes
the browser selector on the normal imported mission data. It writes no fixtures.
The portable test pins the six PNG hashes without requiring the original game.

## Exact asset import

Only these six files were copied byte-for-byte, without running the broad importer:

| Supplied original | Browser asset | SHA-256 |
| --- | --- | --- |
| `data/d3d/dsky0-sb.png` | `public/original/sky-s.png` | `77d128e30013429d46e16af4027a96d9badff16c814a731467afdce6d5b3556c` |
| `data/d3d/dsky0-s1.png` | `public/original/clouds-s.png` | `7e89bb2c0e44d2dff3b482fb315bf8ff0602df31a0e1e3daee436b74a9c59134` |
| `data/d3d/dsky0-s2.png` | `public/original/clouds-high-s.png` | `03a8afaba9e2e9570f902959e59dcc7c9cb0c9014d27f8973281228cf288e90c` |
| `data/d3d/dsky0-pb.png` | `public/original/sky-p.png` | `552578d0cc9de5a026f99425377aa1ee47d8eb2655b39e3bac29dfd058d06987` |
| `data/d3d/dsky0-p1.png` | `public/original/clouds-p.png` | `8c8e716aaa4f83050f239ee0ccf13ed81535c85be0209c31b2131c629b8c9a64` |
| `data/d3d/dsky0-p2.png` | `public/original/clouds-high-p.png` | `4451cc7feb91c902cd1de930e4b263a83a16dda02ae81f73b0020104be3d450a` |

Backdrop images are 128×128; clouds are 512×512. Each new image has different
decoded pixels from c. For example, the top-left backdrop RGBA is c
`(82,87,116,255)`, s `(37,0,63,255)`, and p `(142,30,117,255)`. These are source
texels, not claims about particular rendered screen pixels.

## Browser acceptance and remaining limits

Through normal world selection, start Missions 1, 2 and 3 and wait for the
backdrop and both cloud images. Expect texture names without a suffix, with
`-s`, and with `-p`, respectively. Dismiss the opening/flyby, check a visible
horizon after camera rotation/zoom, toggle overview and return, and restart.
Preserve the existing Mission 18 g single opaque lens/no backdrop and Mission
19 d backdrop/two-cloud-layer behavior. Existing `check-browser-sky.mjs`,
`check-browser-sky-coverage.mjs` and `check-browser-sky-clock.mjs` cover horizon,
coverage and clock regressions separately. This note defines acceptance; it
does not claim those browser runs happened.

This is only the early-mission sky subset of issue #14. Terrain palettes and
textures, ambience, other banks, runtime fallback, device fidelity, and matched
original whole-frame parity remain open. No parity status or percentage changes.
