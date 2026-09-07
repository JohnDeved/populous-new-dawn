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
| [hrttf111/faithful](https://github.com/hrttf111/faithful) | `6abcf22eba7a2086e8ca6950cc538d2f074eccce` | Rust/OpenGL terrain renderer and resource viewer, CPU/GPU palette texturing, water texture generation, layered animation decoding | Strongest additional rendering reference; GPLv3. Inspect alongside native rendering routines before adapting code; not a gameplay engine |
| [TylerTheFox/populous-tb-worldview](https://github.com/TylerTheFox/populous-tb-worldview) | `b92f5f175a4011d18ff7c1e019233bf3271f75b7` | Educational C++ software globe renderer and explanation of fixed-point projection, texture tables and map wrapping | Useful projection lead, not verified against our executable. No license file found; README links a credits/license section that is absent. Keep as an external reference |
| [LinusU/pop3-graphics](https://github.com/LinusU/pop3-graphics) | `13d7de3d51137154fbc45fff72c92e135a1eb2df` | Small JavaScript palette, sprite and font readers | `package.json` declares MIT; no standalone license file found. Existing importer already covers sprites; inspect font handling when original text rendering is ported |
| [IntelOrca/poptools.net](https://github.com/IntelOrca/poptools.net) | `1391f681ebca2331b13ea7df3f84a5b22bf7b65e` | VB.NET map symmetry tool, level and color helpers | MIT; useful for map-format comparison, no simulation implementation |
| [peterderivaz/populous](https://github.com/peterderivaz/populous) | `6b4ef9a34b5b79ce203be54fbeaf1ec974b7cd1f` | Illustrated original-frame rendering analysis; repository contains only README | Reference material for terrain curvature, lighting, adaptive triangulation, shorelines and water. No engine code to inherit; validate the author's findings against native routines |

Other rendering-only leads: [populousmapviewer](https://github.com/TambourineReindeer/populousmapviewer) and [Populous-3-RTX-Remix](https://github.com/xmarre/Populous-3-RTX-Remix). Neither has been established here as an original gameplay implementation. No architecture switch is justified by the inspected code.

The broader GitHub repository search found the additional leads above. `populousmapviewer` revision `b1157b4c0bbe024e2d3ff8fedc9d02aa2974fcb9` has an MIT license and a small native OpenGL viewer. The RTX Remix project reconstructs terrain and initial level objects for a renderer hook; its README does not establish complete live simulation parity. Remakes of the earlier, isometric Populous are not substitutes for The Beginning's engine.

### Rendering follow-up from the expanded search

Faithful's `src/pop/landscape/land.rs`, `water.rs`, `globe.rs`, `src/pop/animation.rs`, and `shaders/landscape.frag` were inspected directly at the pinned revision. They provide concrete displacement/table indexing and animation record layouts. Its README explicitly reports seams and incorrect height ratios, and its shader uses desktop GLSL 4.60 buffer samplers: direct browser reuse needs adaptation and native comparisons. Keep it as a separate reference tool until a particular port justifies taking GPL code into the project.

The worldview project describes the planetary overview renderer; this is not sufficient evidence for the normal close gameplay camera. The frame breakdown describes that close view separately. Compare both with the corresponding original entry points before replacing the current browser sphere. These references can reduce investigation time without treating a community reconstruction as recovered original source.

## Verified useful evidence

The pinned `pop3-rev` XML contains **5,390 FUNCTION entries**, **14,662 SYMBOL entries**, and **4,942 STRUCTURE entries**. These totals include auto-generated names and extensive imported library/Windows/DirectX definitions. Of the function names, 1,725 do not begin `FUN_` or `thunk_FUN_`; this is **not** a count of recovered game function names. The metadata declares reference executable SHA256 `815ba8a550f571c38b602cf3386f65aab942667a4a2d9c7096b3660deac2eacd`, different from ours. XML SHA256 and revision are pinned in `tools.json`.

The public platform repository's `Internal/PopTB Platform/PopTB Platform/src/Pop3Math.cpp` provides an independent numerical check: its **257-entry atan table exactly matches** the executable-derived browser table. The **first 2,048 sine entries exactly match** ours; its remaining 512 entries repeat the first quarter. These are table comparisons, not evidence of whole-engine parity. The current browser math was already derived from the user executable, so no upstream implementation needs copying to gain this validation.

`PopSoundEditor` identifies `Soundd2.SDT` as sound effects/voices, `PopDrum***.SDT` as drums and `PopDrones22.SDT` as music. Our native initializer at `0048b950` independently names those banks. `0048a050` uses a 12-byte cue table at `005acf60`, selecting sample variants and pitch with a **separate audio RNG**. Browser audio integration must not consume the simulation RNG. Native reader tracing now confirms one-based sample IDs and the stereo flag; PCM/cue playback is implemented. Complete spatial mixing and music scheduling still need tracing.

## Working inheritance plan

Use `pop3-rev` to accelerate navigation, verify every port against the supplied bytes, and keep reconstructed routines/tests in this repo. Extend the existing asset importer with the MIT resource editor's format knowledge. Use the public platform layer for math/protocol comparisons and the sound editor for bank inspection. Continue the browser engine rather than replacing it with OpenPop's unfinished gameplay skeleton.

Prioritize Faithful and the frame breakdown for the next terrain/rendering comparison, and the worldview project for the planetary overview. No complete publicly reusable original gameplay engine was found in the projects inspected; combat, AI, economy, scheduling and spell behavior still need the native reconstruction work.

Repeat the math comparison against that pinned checkout with:

```sh
python3 scripts/check-upstream-math.py /path/to/Populous-The-Beginning-Public
```

## Additional symbol and campaign-tool checks

The [PopRe world editor](https://github.com/PopRe/Pop-World-Editor/tree/3d02fa3113f737913cac9aefc5c6d2f635845df3) at `3d02fa3113f737913cac9aefc5c6d2f635845df3` includes `script.h`, `script_compile.cpp`, and `script_decompile.cpp`. Direct inspection confirms a version-12 PopScript compiler/decompiler, token constants, and constant/user/internal field handling. This can accelerate campaign bytecode decoding; it does not implement the engine's AI scheduler or command behavior. The only license file found in its recursive tree belongs to the bundled 3DS toolkit, so keep this as an external format reference until reuse terms for the editor code are established.

The [historical community search for debug information](https://www.popre.net/forum/populous-tools-testing-f17/poptb-with-debug-information-t6976.html) includes requests for a PDB, not evidence that a matching package was located. Do not confuse cheat/debug mode with compiler debug symbols.

### Modern Linux server: real symbols, different subsystem

Downloaded the Linux server build 4708 linked by the [PopTB development team](https://www.populous3.info/), and inspected the ZIP/ELF without executing the program or its installer:

- [Published archive](https://www.populous3.info/releases/poptb-server/PopServer-Linux-Release-x64-4708.zip): SHA256 `66504ec244d94ed5e7dea85fd6e5bfdca23533a0a0ab3ae8577c83197d710bd1`.
- `pop3-server`: 193,312 bytes, ELF x86-64, SHA256 `ccac6d8413f8a22ab9c2f0f8fb2d59b8bb50bdef56cfb9c49b91e2cb66753533`.
- Retains `.symtab` with 559 entries, including 381 named defined symbols. These counts include compiler and library symbols, not just application functions. No `.debug*`, `.zdebug*`, or `.gnu_debug*` sections were present.
- Source-file symbols include `main.cpp`, `FederationClient.cpp`, `LobbyDirectory.cpp`, and `LobbySession.cpp`; named functions include `LobbyDirectory::handleJoin` and `LobbySession::onJoinerReadable`.
- The accompanying README describes a lobby directory, federation announcer, and UDP packet relay. It is not a headless gameplay simulation. These symbols can help study the modern lobby protocol, but cannot label the original 1998 combat, terrain, or AI routines.

Retain the download outside the repository. No architecture change follows from this lead, and its modern protocol must not be assumed to match the original release.

### Modern Windows game: PDB locators, no packaged PDB

Inspected the [official build 4752 installer](https://www.populous3.info/releases/poptb/pop3-build-4752.exe), SHA256 `49b8266275dfacc051c0f5b6b0f8a7fe34468a0d9360d2021a0d4861b31054a2`, using the existing Binary Refinery `xtinno` extractor and `pefile`; no executable was run. Its 2,008 listed members contain no `.pdb`, `.dbg`, or `.sym` file. The `.map` match is the game's `data/uk.map`, not a linker symbol map.

Unlike our original executable, both modern game executables contain RSDS CodeView records:

| Binary | SHA256 | PDB GUID / age | Embedded build path |
| --- | --- | --- | --- |
| `pop3.exe` (24,035,840 bytes) | `ee4ced53aeb233d1b1ec2430bc1983694bdea2f995fecaf485f185f8f4cf546c` | `354e6174-dd73-468f-ae8c-61ad67423cb1` / 1 | `D:\Builds\poptb_release\Source\ReleaseSW\pop3.pdb` |
| `pop3_x64.exe` (43,162,112 bytes) | `504a766beba180df11f7160d03ce91a99231092fdde4e4c7ef946547c0e4ffd0` | `026a2925-2dca-45ca-98d0-6b4ab7b41943` / 1 | `D:\Builds\poptb_release\Source\x64\ReleaseSW\pop3.pdb` |

These identifiers would allow an exact match if the maintainers publish symbols. An embedded PDB path is not the PDB itself or a download URL. Modern-build symbols could assist cross-version function matching, but their addresses and behavior must not be applied directly to the supplied original executable.

Repeat the installer inventory with the existing extractor:

```sh
xtinno -l < /path/to/pop3-build-4752.exe
```
