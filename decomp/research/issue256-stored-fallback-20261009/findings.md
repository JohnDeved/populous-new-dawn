# Issue 256: loaded fallback ownership, Missions 1–3

Source-only assessment on `47680b8fd124aab50b0528eea77a81cacb556060`.
No game, model, test, browser, emulator or decompiler was executed. GNU objdump
2.44 decoded the canonical PE as data; input SHA-256 remained
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The accompanying manifest binds exact commands, ranges, bytes and tool identity.
Retained Ghidra exports are explanatory pseudocode, not original source.

## Useful result

The retained load contract supplies a concrete immutable fallback for the authored
M1–3 computer tribes. A new saved AI field is unnecessary for that bounded
projection: the existing mission number and active tribe identify the unique loaded
Shaman record. This is the same source owner already used by accepted issue 228
for M3 recruitment. It can be proposed for the separate type-20 staging input.

The current mismatch is real at the caller: `app/computer-runtime.ts:1743` uses
`constructionBase ?? (defence-enabled ? defencePosition : living-Shaman-cell-or-0)`.
Original `004f6020` uses stored `+0x5a2` whenever `+0x5b4` is zero. Existing
`tests/raid-staging.test.mjs` deliberately retains the former fallback; its M2
absent-base/enabled-defense fixture expects `0x8232`, while the loaded owner is
`0x8062`. That fixture is controlled caller evidence, not an ordinary episode.

Confidence is high for the reset/load writer, reader, authored projection and
portable checkpoint ownership below. This pass does **not** prove all possible
native memory-copy/reset/save histories. The distinction matters: there is no
new claim of original binary-save compatibility or a universal immutable field.
Independent review must accept the bounded authored-campaign projection before
any model differential or implementation.

## Original writer and reset contract

- `00461d70:461d71–461d90` zeroes `0x164` dwords starting at tribe `+0x36`,
  then a word and byte: offsets `0x36..0x5c8` inclusive. This includes both bytes
  of `+0x5a2`. Its later `+0x59e` dword sentinel ends at `+0x5a1`; it does not
  overwrite the fallback. `461dba` explicitly clears the established-base flag
  `+0x5b4`. Retained helper `004d1420` only resets `+0x52e/+0x53a/+0x532/+0x536`;
  `004f52c0` changes a flag at `+0x596`.
- `0042b660:42b685–42b6a6` calls that initializer for a non-player tribe in
  the ordinary land mode. `0042b7f0:42b8d2–42b904` traverses active tribes and
  calls `0042b660`. `0042b590:42b5cb` calls this reset before `42b638` invokes
  `0042b230` (the level loader). The retained `00410d00` and `0042c790` exports
  also show level-loading wrappers resetting before their load path.
- `00484a10` reads authored records in order, allocates each accepted record,
  and calls `00485b00` at `48502d` only after successful allocation. The next
  record advances by `0x37` at `485039`. This is a load postprocessor, not the
  ordinary person movement initializer.
- `00485b00:485b60–485b7e` takes only the class-1/model-7 branch, reads the
  loaded person's coordinate words `+0x3d/+0x3f`, shifts each by eight and masks
  each byte even. `485b82–485ba1` stores the resulting word at
  `0x89d76a + signedTribe * 0xc65`, exactly tribe base `0x89d1c8 + 0x5a2`.
  With multiple accepted Shamans the last processed record would win; with none,
  the initialized zero survives. Neither exceptional case is projected here.
- `004f6020:4f6024–4f603c` tests `+0x5b4`, returns `+0x5a2` when unset and
  `+0x36a` otherwise. It reads no live person or defense state.

The manifest records a finite byte search in both executable sections for the
field displacement, adjacent potentially overlapping displacements and absolute
tribe field addresses, plus direct-call candidates. Exact `+0x5a2` hits are
the four known readers (`004c7370`, `004f3280`, `004f55d0`, `004f6020`) and a
false hit at `4dcdb7`, the relative displacement of `jmp 4dd35d`. The absolute
field hit is the load writer at `485b9a`. No second direct scalar writer was
found. This search cannot exclude alias-based or bulk-memory writes. The seven
call candidates for the whole-tribe reset remain recorded; only the named
level-loading paths above are claimed closed. Broader reset/save interpretation
is not silently included in this result.

## Authored and portable-save ownership

`source-bindings.json` records all six authored Shaman records in M1–3. Each
active computer tribe has exactly one:

| Mission | Tribe | Authored object | Browser position | Stored cell |
| --- | --- | --- | --- | --- |
| 1 | Red / 1 | 37 | `(1, -37)` | `0x1c08` |
| 2 | Matak / 3 | 22 | `(91, 119)` | `0x8062` |
| 3 | Chumara / 2 | 46 | `(-45, -105)` | `0x60da` |

The importer reads signed fixed-point coordinate words and preserves their exact
values in browser units. `missionPosition` (`app/mission-data.ts:117`) retrieves
the authored model-7 record by tribe; `campaignPosition` chooses the saved mission.
The existing M3 recruitment branch converts that same source to the native even
cell. First-versus-last record selection agrees for these unique records.

Portable Save clones the World (`app/game-store.ts:433`); Load clones and migrates
it (`:444`). Migration retains mission identity, establishes legacy AI/tribe
ownership (`:149–158`) and does not rerun level startup (`:146`). The proposed
derived fallback therefore needs no mutable saved field, schema bump, default
from a living actor, reincarnation-site substitution or invented zero. This is
compatible with supported old port checkpoints for these authored missions,
including moved/dead/absent live Shamans. It does not assert recovery from arbitrary
malformed Worlds, altered levels, duplicate authored Shamans or original save files.
Preserve the current absent/present `constructionBase` semantics, including zero.

## Smallest proposed change and actual-caller proof

Limit a possible repair to M1–3 type-20 staging's **absent-base** branch. Derive
the fallback from the existing immutable authored owner, as M3 recruitment already
does. Preserve established-base precedence, other missions, M3 recruitment,
selection-world radius/base inputs, phases 9/12, orders, task ownership and RNG.
Do not bundle guard returns, Convert phase 0, construction origin or defense
completion. No implementation is present in this packet.

The smallest next differential reuses the maintained `raid-staging.test.mjs`
actual dispatcher/controller observation seam. First retain the M2 phase-5
failure: absent base, enabled authored defense `0x8232`, expected loaded `0x8062`.
Then cover defense on/off, moved and missing live Shaman, direct versus
`migrateCheckpoint(structuredClone(world))`, and M1/M3 unique loaded cells. Retain
the existing present-base/cell-zero, recruitment, phases 16/17, phases 9/12,
unchanged RNG and unmodified order-pool assertions. Observe exact produced move
target and phase, not a replacement helper. Tests are proposed, not run.

## Ordinary route assessment and stopping condition

The retained M2 natural raid route is `tests/mission2-raid.test.mjs`; the M3
route is `tests/early-mission-ai.test.mjs:35`. Both use ordinary construction,
training and campaign gates. They do not record a distinct-coordinate absent-base
visit. Current Tower phase 3 writes `constructionBase` in M2/M3
(`app/computer-runtime.ts:987–995`), so neither historical witness can be credited
for this fallback. Destruction after that point does not erase the established
base. Preventing establishment until an ordinary raid remains an unproved route.

M1 has no ordinary construction producer (`app/computer-runtime.ts:798` excludes
level 1), but its initial enabled defense `(8,28)` equals loaded `0x1c08`.
Its later opcode-1038 OFF branch follows an enemy Blast-count query; that route
belongs to the separately held enemy-Blast work and is not adopted here.
An ordinary distinct-coordinate M1–3 witness remains missing. The old
`check-browser-computer-attack.mjs` directly stages task/actor fields and cannot
substitute for one.

Stop this pass at the frozen source contract and review gate. The next authorized
decision is whether the bounded immutable projection is sufficient for the
targeted actual-caller differential above, while retaining the explicit ordinary
and full-native-history limits. If universal original save/reset ownership is
required instead, that is the remaining source boundary; this packet does not
declare it proved merely because the direct scalar writer scan is negative.
