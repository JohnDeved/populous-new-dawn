# Mission 18 sky: palette-gated names and image-load failure

**Observed:** September 16, 2026, 23:43–23:55 Europe/Berlin. **Published:** September 17, 2026, from `5f5b829a6b7db17799840dcf29892a7c9cbb6933`. This resolves the static filename/open/failure portion of [PND01 CR-SKY](../../engineering/single-player-feasibility.md#103-bank-g-conditional-fallback-recovered-actual-mission-18-output-unproved), not original runtime state, rendered pixels or complete Mission 18 gameplay. No native execution/emulation or graphics capture produced these findings.

## Input and method

The supplied base-game executable is `ceo-release/native-run/d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Addresses below are virtual addresses in that executable. The read-only analysis used Capstone **5.0.7**, Python **3.9.6** with `-B`, and a standard-library PE32 section/import mapper; no `pefile`, emulation or new Ghidra export was required. Direct call instructions bound CEO's leads to the existing callers: `0042a51c → 0042a140` (`init_file_names`) and `004b610e → 004b5f40` (`load_sprite_or_image`).

The supplied `levels/levl2018.hdr` is 616 bytes, SHA-256 `6ede1c60604d8f0e4f8c959ece873506e8a5882b93c93df12a000061483232c4`; its landscape byte 96 is **16**. `data/pal0-g.dat` is readable, **1,024 bytes**, SHA-256 `63abc7be002f6ebe763a39f921e8b7442fe2839150e8ca7a05c0084440e982ac`. The retained full installer index places it in **Component0**. Indexed `sky0-g.dat` and D3D g1/g2 layers are also supplied; **neither `dsky0-gb.png` nor default `dsky0-0b.png` is present in the canonical tree or that package index**. This publication reuses those observations; no extraction was repeated. Host readability does not observe a Windows file-open result or another installation's files.

## 1. Filename selection requires a successful palette open

[The landscape loader](../generated/0042a500.c) calls `0042a140` on a bank change. The routine first copies bank-0 defaults. For nonzero bank values it adds `0x30` below 10 or `0x57` otherwise: **16 maps to `g`**. It substitutes the candidate into a local palette path, resolves it and opens it. Only return **0** from `00526280` at `0042a402` permits the global character writes at `0042a41b..0042a469`.

| Resource / literal VA | Default | After successful bank-16 palette open |
| --- | --- | --- |
| Indexed sky / `0059c898` | `data/sky0-0.dat` | `data/sky0-g.dat` |
| Layer 1 / `0059c880` | `data/d3d/DSky0-01.png` | `data/d3d/DSky0-g1.png` |
| Layer 2 / `0059c868` | `data/d3d/Dsky0-02.png` | `data/d3d/Dsky0-g2.png` |
| Backdrop / `0059c850` | `data/d3d/Dsky0-0b.png` | `data/d3d/Dsky0-gb.png` |
| Palette / `0059c840` | `data/pal0-0.dat` | `data/pal0-g.dat` |

`00526280 → 00526300` translates caller flags `0x80000001` into read access, share-read and **OPEN_EXISTING** (3), then calls imported `CreateFileA` through `00d0c760`. Its handle mapping returns **-1** for an invalid handle and **0** for a valid one; the success branch closes the handle through `00526370`. This is an **open-only gate**, not a palette size/color decoder.

If opening fails, `0042a40c` skips substitution: the reset bank-0 defaults remain, **not the previous level's names**. For that nonzero requested bank, `0042a473` still records its byte at `00895dcd`. Actual path, sharing and permission state remain runtime conditions; a supplied palette alone does not guarantee selection of g names.

## 2. Alternate root, not alternate image

Resolver `005001b0` preserves drive-qualified input. Otherwise it constructs the configured install-root candidate from `0089cc14/0089cc15` and the unchanged resource name. `00526480` tests the candidate with `GetFileAttributesA`: existence selects it; failure follows `0050024c → 00500282` and copies the **original resource path**.

This choice occurs **before opening**. It is not a retry after an existing candidate fails to open or decode, and does not replace `gb` with `g1`, `g2`, another bank or `.dat`. The lower `00525e00` expands relative paths with the cached engine base at `005e05e8`; if empty, `00525d00 → 005261b0` derives it from the executable portion of `GetCommandLineA` and `00525ca0` stores its trailing separator. That base must not be described as unconditionally the process working directory. Its actual value and later setters were not observed.

## 3. Image leaf and failure propagation

`004309b0` resolves the path once, then passes global `0089cd23` and a **null container argument** to header/info stage `00528d00` (`00430a36`) and, after success/allocation, data stage `00528e50` (`00430a78`). Both receive the same filename. Either stage returning -1 makes the leaf return **-1**; second-stage failure also frees the image buffer. Normal leaf completion returns **0** at `00430ab1`.

The null argument takes `0052e250`'s ordinary-directory branch (`0052e2d3 → 0052e3b4`), not its separate non-null container branch. Last-separator/substring operations retain the original directory and basename. Directory-provider construction `0054e540 / 00556320` installs vtable `00592d78`; its slot `+4` is `00556640`. The open path is:

```text
0052e250 → 0054e430 → 00556640 → 005598a0 → 00526300 → CreateFileA
file/open error → image stage -1 → 004309b0 -1 → 004b5f40 0
fresh 004b60d0 initialization → sky_type = 1
```

`004b5f68` branches on a nonzero leaf result to wrapper return **0** at `004b60ba`; its normal conversion/upload path returns **1** at `004b60ac`. These opposite success conventions matter. An unsuccessful file open returns before the image decoder, so there is **no replacement-image retry on this missing-file path**. Success-path decoder methods `005282f0 / 00528460` were identified but not fully analyzed; neither their complete behavior nor graphics-allocation success is established by the wrapper's normal return.

[Sky initialization](../generated/004b60d0.c) first checks its already-initialized flag. On a fresh entry, wrapper failure **or** zero `ui + 0xd14` selects type 1 at `004b6191`. The g1/g2 loads are on the other branch after backdrop success, **not fallback candidates**. Retained [draw_sky](../generated/00524a30.c) and [lens/material handling](../generated/00517630.c) distinguish palette clear and special-lens behavior for type 1; a selected type is not proof of a rendered color or frame.

## Remaining acceptance boundary

The filename generator, open-return polarity and ordinary missing-image path are no longer unidentified consumers. For a particular Mission 18 installation, the outstanding proof is **actual install-prefix/engine-base values and palette/backdrop open outcomes**, then **initialized/UI/palette/lens/caller state and rendered output**. No actual original-process API result or screenshot was observed. If an alternate root supplies an image, complete successful decoder/graphics behavior becomes relevant to that case; it cannot rescue a failed file open in the path proved here.

Do not repeat package extraction, copy a different bank or invent a backdrop. CEO owns evidence/acceptance and any separate native/display authorization; main owns renderer integration. U08 and other frontend/content-role questions are not resolved by this note.

## Retained proof and reuse

The unchanged research receipt at **`work/orchestration/pnd01-sky-followup/proof-verified/evidence.json`** reports **410 static assertions** on research head `9e611126d333017f1a49c61dd78be557b1d98da7`, completed September 16 at 23:52:44 Berlin (exit 0). Its SHA-256 is `67f43246fbb7ab7269f0e00cb4fc508eaa3c139a6689af0306b288992f03b5a2`. This publication performs only affected documentation/reference checks; it does not relabel that receipt as a new runtime proof.

Useful byte-window fingerprints (exclusive end; windows include cleanup/padding where recorded):

| Window | SHA-256 |
| --- | --- |
| `0042a140..<0042a480` — names | `59ab27a77717e6f53048b6ea0b186ee40a97ee5ef0427e1d5506284afa7b7768` |
| `004b5f40..<004b60c5` — wrapper | `c49cd3d83cf6b4b7de5db450581bc98c33a890b5548fcfdfa815046264b4e065` |
| `004309b0..<00430add` — image leaf | `0d4f1b8e37009bb3a333b217c16c40feea1982368903f19ba58fd6ef3b208d1b` |

The same ignored research directory retains `pe_reader.py` (SHA-256 `45f0d5eef1dda73a0393bf7d6bdf1aa19f01703adc95db9a0d8eae92e11e44bf`), `analyze_sky.py` (`189ed4578f7aeb0dc5c1bd5aa1e7064bf182d6dc735a5286d4395fabaaa66903`), the CEO address handoff, inputs and bounded listings. The analyzer is guarded to its **research head and protected-file snapshot**: it is not a current-head gameplay check and must not be run here merely to reproduce documentation. The addresses, conditions and fingerprints above retain the useful result without copying scratch logs or claiming rendered parity.
