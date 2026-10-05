# Mission 3 Vault HFX implementation: source preflight

**ACCEPT for source preflight; no blocking source defect found.** This is not final
rendered or merge acceptance. Required standard, quality and rendered evidence
remains outstanding as described below.

- Base: `71b3860e7025a9534d56248c194aa18610b5df4d`.
- Reviewed clean head: `ef62e48f07834cddcb543969a7afab5c77a84f4a`.
- Full binary diff SHA-256:
  `fd628083e0a3aec38e8363ca937e1e58575c5064e188c52cbac98463cbf83bf0`.
- Inventory: all 21 changed files, including the dedicated PNG and metadata.
- Native basis: unchanged probe SHA-256 `48ca690c78230073b0f1a69ee203d252ed768bb2efcc11ba44ff434b067b530d`,
  independently accepted in `../vault-world-proof-48ca690c/review.md`.
- This reviewer ran no browser, native CPU replay, full check/build, Ghidra,
  importer mutation, dependency change or tracked-file edit during this preflight.

## Live integration and eligibility

The normal chain is `createWorld(3)` → initialize the authored Shrine cursor →
`makeShrine`/`updateShrinesFrame` → `makeVaultWorldPresentation`/
`drawVaultWorldPresentation`. The source predicate requires Mission 3, Vault kind,
mode 4, Temple reward and the canonical authored coordinates. Other worlds and
other reward families retain the previous path. Wrapped gift coordinates are
compared modulo 256 before selecting this same source.

Ordinary command 33 completion still reaches the existing `createGift`. Its narrow
initializer changes existing presentation fields to the occupied Vault socket,
Temple HFX 1079 and a new independent draw-43 glow. It adds no Gift schema, object
ID, allocation model, clock or RNG owner. The optional Shrine cursor is the only
new saved state field. The new world-initialization hook is limited to initializing
that state; startup/campaign behavior is otherwise unchanged.

The gift’s existing timer and phase owners in `world-turn.ts` are untouched. Source
deactivation hides its marker/glow and stops their cursor. Gift phase zero hides
the complete gift group and stops both its cursor and display latch, independently
of the marker’s retained state. The existing object lifetime and payout remain
82 visits. No building-screen controller, HUD acquisition route or payout logic
was added. New and restored gifts continue to share their effect identity through
the existing structured-clone checkpoint path.

Creation and migration initialize missing marker cursors without changing turn,
knowledge or IDs. Existing valid gift presentation/cursor state is preserved.
Legacy gifts recover only presentation while retaining phase/countdown/identity.
The source owns two independent animation objects. The marker’s `displayedFrame`
and existing gift `sprite.frame` latch the previous cursor before advancement;
the renderer reads these latches. This preserves first-visible HFX 1417 even when
creation and animation fall on the same boundary. There is no change to the shared
24 Hz adapter and no conclusion about issue 214’s absolute native cadence.

## Renderer and source assets

The new scene helper selects explicit rectangles from the HFX atlas, bypassing
`animatePerson` and VFRA/HSPR lookup. The body uses opaque positive-run pixels with
alpha-test for RLE skips. The separate glow uses AL/nibble alpha and its own material.
The source-owned fixed bank-p diffuse tint is baked into encoded RGB; the texture
uses the existing nearest-filtered sprite path. This is a source mapping, not proof
of original device quantization/blending.

I traced the sprite UV transform through `render-view.ts`, the scene update caller,
and the existing painter. The body uses the default -300 bucket bias; the glow’s
parent metadata supplies +16 consistently to size calculation and painter sorting.
The retained original `0046f080` export supports the latter as signed morph 1 << 4
when flags3 bit 0x400 is set. Glow height remains 80 native units below the body.
Integer half-width anchoring and existing scaled-sprite projection are used without
altering the global renderer. Mission 3 preloads/retries the dedicated required
texture before constructing consumers, following the existing readiness contract.

I independently decoded exactly HFX 1079 and 1417–1430 directly from hash-pinned
PSFB RLE bytes, without calling the proposed importer or its shared decoder. I
reconstructed PAL positive-run opacity, AL high-nibble color/low-nibble alpha and
the bank-p RGB tint, checked every frame hash, assembled all atlas bytes and compared
them to the committed PNG. All 15 frames and the entire atlas matched; atlas RGBA
SHA-256 is `4a48fd5fc3803a2cbda70817d2b82a3bd0f6d2e68455af152e0c77605b46d70f`.
All six existing HUD/effects/person metadata/image files also matched base exactly.

### Exact glow color and alpha tie-out

This conclusion does not rely on the asset checker calling its own importer.
`decode-atlas.py` is a separate direct PSFB decoder; its successful run is retained
in `independent-decode.json` and `decode-stdout.log`. No importer/shared decoder is
imported. Original texture-palette ownership is tied to the independently accepted
`decomp/research/worship-acquisition-body-raster.md` decoder boundary and these
canonical EXE instructions, also checked directly:

- `0042a381` copies the AL filename template to `008928b3`; `0042a3aa` maps bank 25
  to `p`, and the successful palette-open path at `0042a469` stores that suffix at
  `008928bc`, the AL filename's ninth character. The PAL suffix is stored at
  `0042a433`. See `native-bank-selection.txt`.
- `004b68c2..004b68d3` passes AL at `0087f000` and the actual `pal0_mem` pointer
  into `00476570`; `004b68ee` stores its palette struct at `0087cbcc`. See
  `native-sprite-palette-init.txt`.
- `00476702..00476719` derives `AL[(value|15)<<8]` and addresses that PAL entry.
  `0047671c..0047672d` computes `(value&15)*255/15` for alpha. This is the original
  palette-slot-1 constructor, before device-specific bitmask quantization; see
  the prior proof's `palette-construction.txt` and retained `00476570.c`.
- `00476a9b..00476abe` tests queue bit 2 and selects palette struct `+4`, slot 1;
  the ordinary branch at `00476ae5` selects slot 0. The real probe queues bit 2
  for this glow. `00476dbd..00476dd2` loads each positive RLE byte, indexes that
  selected palette and writes its color; negative runs advance without a source
  texel. See `native-rle-expansion.txt` and the prior proof's `palette-uploader.txt`.
- Real `00516270` independently selects diffuse `[247,235,201]` from
  `PAL[AL[0x2f82]]`, index 106. The accepted D3D sprite consumer combines texture
  RGB and this diffuse RGB. The dedicated atlas bakes the normalized encoded-RGB
  product with nearest-byte rounding, preserving low-nibble opacity. It does not
  claim the original device's bitmask quantization or final blended framebuffer.

The multicolored source is expected under that decoder. HFX 1417's positive RLE
runs use five high-nibble groups. Bank-p AL maps them as follows (before/after
diffuse multiplication):

| High nibble | PAL index | Raw RGB | Baked RGB | Positive-run pixels |
| --- | --- | --- | --- | --- |
| 0 | 138 | 255,75,22 | 247,69,17 | 89 |
| 1 | 154 | 223,155,31 | 216,143,24 | 367 |
| 2 | 106 | 247,235,201 | 239,217,158 | 212 |
| 3 | 228 | 47,171,99 | 46,158,78 | 188 |
| 5 | 31 | 225,212,73 | 218,195,58 | 977 |

Opacity remains the sixteen values 0,17,...,255 selected by the low nibble.
`independent-decode.json` retains every source-byte frequency and all sixteen
color groups. This accepts the canonical RGBA expansion/mapping; final native
device pixels remain explicitly unclaimed.

The importer reads pinned EXE/header/level/PAL/AL/HFX inputs and derives the Temple
descriptor and draw-43 count/step. It owns exactly its new JSON/PNG pair in
`generated-files.json`. Existing installs are compared before writes; partial,
wrong-pixel and wrong-metadata installs are refused. The checker covers clean
reproduction, both idempotent modes, these refusal paths, and prior-asset byte
preservation. Its receipt’s output and preserved hashes match the reviewed tree.
No shared atlas, hosting configuration, fixtures or parity ledger changed.

## Verification and remaining gates

Verified source-bound receipts under `work/orchestration/vault-hfx/`:

- `ef62e48-focused.json`: passed, exit 0, 15 tests. It covers new Vault tests,
  existing Vault appearance, Shaman cadence and ordinary acquisition regression.
- `ef62e48-typecheck.json`: passed, exit 0.

Both receipts have matching before/after clean head and raw stdout/stderr hashes.
`assets-candidate-1.json` is an earlier asset receipt, not presented as an exact-head
whole-source gate. Its installed/preserved hashes were reverified independently
against this head as above. `git diff --check` and the source/asset assertions passed.
`source-asset-review.json` retains the complete changed-source fingerprints,
verified command receipts, diff identity and independent pixel result.

Maintained TypeScript is small and domain-focused. It reuses the existing animation,
socket, projection, texture readiness and checkpoint paths. No unnecessary clock,
pool machinery or decompiler-style state was introduced. The initial new-helper
type/interface lint finding was repaired; final new-helper lint log is empty.
The earlier whole-changed-file Oxlint log contains legacy findings and is not a
passing gate. Full source-bound `format:check`, `lint`, `lint:standard` receipts and
available Fallow advisory findings still need review; legacy failures must remain
explicit rather than be represented as passing. No modifying format was run here.

Final acceptance still needs the standard `npm run check` and `npm run build`,
plus comparable rendered Mission 3 evidence through normal shipped controls.
The browser evidence must show the actual HFX body/glow texture, first display and
advancement, pause/checkpoint continuation, independent marker-to-gift transition,
phase-six hide, unchanged payout, and relevant camera/resize behavior. Test-injected
objects or metadata alone cannot replace rendered normal-path evidence. None of
the current source/pixel checks proves a native full-raster match, calibrated
wall-clock cadence, class-2 screen sequence or hardware performance.

No substantive repair is requested on `ef62e48` from this source preflight. Any
substantive later source repair requires review of the exact delta and affected
evidence before final acceptance.
