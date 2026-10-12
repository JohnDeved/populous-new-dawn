# Mission 6 raid staging origin

Refs #256 and #8. The bounded change extends the existing Missions 1–3
absent-base type-20 staging projection to Mission 6 only.

## Retained source and authored ownership

The [accepted stored-origin writer audit](https://github.com/JohnDeved/populous-new-dawn/blob/ef5d26329ac0f6b011746d556afdf655d6563013/decomp/research/issue256-stored-fallback-20261009/findings.md)
establishes reset-before-load, the class-1/model-7 load writer and the
stored-fallback reader. Its finite writer search and bulk-memory/reset/save
history limitations still apply. No new original execution was performed.

Retained Ghidra exports bind EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`:
- `00485b00.c`, SHA256 `346a7d08813529a5f716e7641c6580c30b8853070e6c3759b64e8e1ecd899099`:
  each successfully loaded Shaman writes its packed even native cell to its
  tribe's stored origin. Last accepted Shaman wins when several exist.
- `004f6020.c`, SHA256 `21ada6683311b6a0b0a5f6030306ccee1262a8b7a6be0e630d5698a9c34fa8eb`:
  established-base flag chooses stored base; otherwise it reads the loaded-origin
  word, without a live-Shaman or defence-position lookup.

Mission 6 source SHA256 is
`264d69d98965465325a4b0e6ec1b1f9145d2a407e68ca9472e6a76a60a1a8a62`.
Each computer tribe has exactly one authored Shaman: Chumara object18 at
(-115,39), cell0xd094; Matak object11 at(-47,-123), cell0x72d8.
The maintained test checks uniqueness, source identity and actual coordinate
conversion. Thus existing mission/tribe identity supplies the same bounded
immutable owner as the earlier-mission policy.

## Ordinary observed fault and correction

On main752af01, unmodified createWorld(6) followed by ordinary ticks creates
Chumara's first raid. At turn6479 phase3 recruits using defence0xb88c.
At turn6491 phase5 produces a move to0xb88c for members377/378/540/455,
with constructionBase absent. The source-owned loaded origin is0xd094.
The observer forwards the actual controller and its effects; no actors,
tasks, spells, stocks, terrain or clocks are staged.

The one-entry runtime change makes Mission6 use the same immutable source.
It preserves explicit constructionBase, including0, all other missions,
phase9 target movement, phase12 regroup, selection algorithms, orders and RNG.
It does not change defence-position writes or other AI base consumers.

## Save policy and tests

Existing serialized constructionBase wins. For absent-base supported modern
and legacy port saves, future type-20 staging now derives the loaded origin from
preserved mission/tribe identity, even if the live Shaman moved, died or vanished.
This intentionally corrects subsequent staging in old saves; it does not replay
startup, introduce a field/schema, reconstruct original binary saves, or claim
arbitrary malformed-world recovery.

The controlled real-caller suite covers both tribes, moved/dead/missing Shamans,
modern and supported legacy ownership, explicit saved base0, returns,
and independent outbound/regroup coordinates. The ordinary Mission6 regression
forwards the actual controller through phase5 and checks both move action and
the real command3 orders, including their existing +128 coordinate centering.
The baseline failures and the initial new-test centering mistake remain retained
locally. Simulation checks do not certify rendered input, a complete original
raid trajectory, or universal native save/reset histories.

## Maintained later combat witness

The first aggregate exposed one old trajectory-specific expectation: the mixed
raid test expected immediate sermon32 at the later phase6 abort. With corrected
staging, its deterministic Preacher398 instead reaches registered fight state25
at turn8333 with immediate attack21, flags32 and queued move3; all three peers
remain moving. The [accepted original abort predicate](https://github.com/JohnDeved/populous-new-dawn/blob/925d9ea6fe994ab9e53db92193635ded89a91910/references/verification/raid-phase6-settlement-2026-10-06/fix-source-review/review.md)
sets elapsed1801 for admitted states25/29 independently of the sermon test.
Independent review approved the exact32-to21 expectation correction, with all
existing identity, command preservation, timeout, retirement and513-turn budget
assertions retained. The failed original aggregate and diagnostic are preserved;
this does not change or re-certify sermon production itself.
