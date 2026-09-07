# Debug symbols and reusable projects

Inspected 2026-09-07. No matching official PDB/DBG package was found in the public searches and repositories checked. This is not proof none exists. The supplied 2,275,840-byte `d3dpoptb.exe` has a PE debug-directory RVA and size of **zero**, so it has no CodeView/PDB locator there. Reproduce with `python3 scripts/decomp.py check /path/to/d3dpoptb.exe`.

Searches included `Populous debug symbols`, `Populous D3DPopTB.pdb`, Populous PDB/D3D combinations, decompilation/source projects, and the OpenPop resource index. PS1 prototype leads target a different platform/build and have not been established as usable PC symbols. Private source repositories mentioned in community notes are not a public source-code dependency.

## Best leads

| Project | Inspected revision | What it actually supplies | Decision |
| --- | --- | --- | --- |
| [hrttf111/pop3-rev](https://github.com/hrttf111/pop3-rev) | `60408e4e99b76ab2e5461897c8e1b33756360eaa` | Ghidra XML names, types, functions, comments and DirectX metadata; no game bytes/source | Use through pinned, optional metadata import. No explicit repository license file found; keep external checkout and provenance |
| [Toksisitee/PopResourceEditor](https://github.com/Toksisitee/PopResourceEditor) | `140e389a1907b71f18732562e57819f038ba8878` | Model, palette, sprite and alpha-resource readers/editors | Best direct reuse candidate for asset tooling. Existing importer already uses these format findings. [MIT license](https://github.com/Toksisitee/PopResourceEditor/blob/140e389a1907b71f18732562e57819f038ba8878/license.md); preserve notice for copied code |
| [TylerTheFox/Populous-The-Beginning-Public](https://github.com/TylerTheFox/Populous-The-Beginning-Public) | `e76fbe66d3b4902585e51cfdd6d43e7d0c11d14c` | Platform layer: math, input, rendering, audio wrappers, compression and networking | Useful cross-check, not full gameplay engine. No top-level license found; bundled dependency licenses do not establish a license for the platform code |
| [OpenPop/OpenPopulous](https://github.com/OpenPop/OpenPopulous) | `afca2cf36a0243dac37c95845b392a6e7feaa4ea` | C++ clone skeleton, graphics/asset readers and UI code | Not an engine replacement: `Unit::Update`, `Building::Update`, `Route::Calculate` are empty; `Spell.cpp` is zero bytes. GPLv3-or-later headers |
| [Toksisitee/PopSoundEditor](https://github.com/Toksisitee/PopSoundEditor) | `d151ce4cc9ff719de4865d13a801641fea559357` | Reads/exports SDT sound/drum/music banks; WAV and MP2 export | Useful separate extraction/reference tool for native audio. GPLv3; no editor source copied into the browser |
| [Toksisitee/ALACNPopWorldEditor](https://github.com/Toksisitee/ALACNPopWorldEditor) | `1adcc222c6f35cdc76429cbb9c536b6410359df6` | Map/object format and placement definitions | Continue cross-checking level imports; no general top-level code license found in this checkout |

Other rendering-only leads: [populousmapviewer](https://github.com/TambourineReindeer/populousmapviewer) and [Populous-3-RTX-Remix](https://github.com/xmarre/Populous-3-RTX-Remix). Neither has been established here as an original gameplay implementation. No architecture switch is justified by the inspected code.

## Verified useful evidence

The pinned `pop3-rev` XML contains **5,390 FUNCTION entries**, **14,662 SYMBOL entries**, and **4,942 STRUCTURE entries**. These totals include auto-generated names and extensive imported library/Windows/DirectX definitions. Of the function names, 1,725 do not begin `FUN_` or `thunk_FUN_`; this is **not** a count of recovered game function names. The metadata declares reference executable SHA256 `815ba8a550f571c38b602cf3386f65aab942667a4a2d9c7096b3660deac2eacd`, different from ours. XML SHA256 and revision are pinned in `tools.json`.

The public platform repository's `Internal/PopTB Platform/PopTB Platform/src/Pop3Math.cpp` provides an independent numerical check: its **257-entry atan table exactly matches** the executable-derived browser table. The **first 2,048 sine entries exactly match** ours; its remaining 512 entries repeat the first quarter. These are table comparisons, not evidence of whole-engine parity. The current browser math was already derived from the user executable, so no upstream implementation needs copying to gain this validation.

`PopSoundEditor` identifies `Soundd2.SDT` as sound effects/voices, `PopDrum***.SDT` as drums and `PopDrones22.SDT` as music. Our native initializer at `0048b950` independently names those banks. `0048a050` uses a 12-byte cue table at `005acf60`, selecting sample variants and pitch with a **separate audio RNG**. Browser audio integration must not consume the simulation RNG. Native reader tracing now confirms one-based sample IDs and the stereo flag; PCM/cue playback is implemented. Complete spatial mixing and music scheduling still need tracing.

## Working inheritance plan

Use `pop3-rev` to accelerate navigation, verify every port against the supplied bytes, and keep reconstructed routines/tests in this repo. Extend the existing asset importer with the MIT resource editor's format knowledge. Use the public platform layer for math/protocol comparisons and the sound editor for bank inspection. Continue the browser engine rather than replacing it with OpenPop's unfinished gameplay skeleton.

Repeat the math comparison against that pinned checkout with:

```sh
python3 scripts/check-upstream-math.py /path/to/Populous-The-Beginning-Public
```
