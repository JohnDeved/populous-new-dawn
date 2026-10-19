# M1 building acquisition implementation

This implements the M1-only scope accepted at
[47a8ba13](https://github.com/JohnDeved/populous-new-dawn/blob/47a8ba13f5c798625f4c956fc6b7b6a68f50c576/decomp/research/building-acquisition-screen/m1-product-scope.md).
The independently reviewed
[5fedc5f6 CPU reference](https://github.com/JohnDeved/populous-new-dawn/blob/5fedc5f6ae08c6b8223d6b989717cfff334f649c/decomp/research/building-acquisition-screen/composed-reference.md)
is source-derived; it does not execute the original or establish original GPU pixels.
No canonical original binary bytes are included here.

## Owners and current proof

- Creation verifies Mission 1's actual record 1 → record 2 link and reward slot,
  mode 4, class 2/model 7, source shrine identity and local recipient. The distinct
  building tag cannot invoke the ordinary-spell arrival clamp or suppress the
  building payout effect. Legacy gifts are never retagged.
- The existing object caller queues once at its sixth subsequent visit. The
  independent visit 82 grants knowledge. The shared cue/HUD bridge selects
  Buildings synchronously and measures the disabled camp card. Building cues
  0xcc then 0xcb precede that handoff (004819c6..004819fe); spell cue 0x71
  stays separate. Existing sound-439/sound-436 samples join the bounded preload
  list so these numeric events are audible through the existing audio owner.
  The unpaused first phase-4 visit reselects Buildings
  (00483d0b..00483d3d). Its later companion-handle check is not a panel event
  and never shortens the building gift timer. Pausing that pending entry consumes
  it without replaying selection on resume.
- Building controller and CPU face feedback run on existing logical UI visits.
  Spell and building singletons remain separate; companion, pulse and cosmetic
  RNG are shared in pulse → companion → building → spell order. Rendering reads
  saved commands. Existing game-clock and deadline arithmetic are unchanged.
- Full state survives checkpoint migration/restore without initialization, cue,
  request or RNG replay; missing legacy building state defaults to null. A new
  world clears it. Draw cache identity includes acquisition family and gift ID.

The initial red test on main `9751eee2` entered the real `stepVaultWork →
createGift` completion caller. It created gift 39 at phase 6/timer 82. The sixth
actual `tick` produced an empty queue, where `[39]` was required. This is a caller
regression, not a missing-module assertion. The second red assertion identified
missing legacy-null migration.

Focused checks now cover that caller, negative source/local-recipient/M3/legacy
cases, independent 6/82 ownership, active JSON checkpoint continuation and restart,
plus all nine applicable M1 sequences from the accepted source reference. Every
UI row compares all face-state and transformed/projected vertex hashes, selected
face order, shared RNG, companion/pulse and overlapping spell commands. Normal
M1 retires at UI visit 126 with pulse tail 129; paused cases preserve the accepted
pending/feedback ordering. Existing executed-original spell/companion fixture
checks remain separate and pass unchanged.

`tests/fixtures/building-acquisition-source.json` is a derived M1 subset of the
accepted result, carrying its exact source URL/hash. It is not a newly executed
native fixture. Raw source-bound receipts are under local ignored
`work/orchestration/m1-building-acquisition/`: `red.tap`, `focused-01.json` and
`focused-01.tap`. The first combined focused run passed 41 tests in 5.601 seconds
on CPU 4. Its JSON records every changed source/input SHA and the exact command.

## Remaining gates

The combined source includes the modes 6/7 collector/drawer and scene composition.
It interpolates original face corners before winding/UV reversal, preserving gift
identity. Resize remaps trajectory anchors while HUD scale alone sizes geometry;
this deliberate desktop compatibility behavior preserves model proportions.
Source outcode rejection uses the current shell after mapping; full GPU clipping
uses that same shell. CPU face feedback remains in frozen logical coordinates.
The drawer owns one pooled mesh/material and texture wrapper, reuses the atlas
image, and is disposed with the existing overlay. Source clamps differ: whole
shade is 1..63, per-face shade is 0..63 (004738d4..004738e3).

Required subsequent gates are independent source review, combined stationary
format/lint/type/Three checks, standard check/build, the fresh ordinary M1 public
Bridge/guard/Vault route and interrupted/resized/save/restart observations, plus
a bounded acquisition workload check. Component fixtures do not replace that
ordinary route. No browser, original execution, GPU identity or parity percentage
claim is made by this checkpoint.

Issue #23 remains open. M3 class-2 screen handoff is disabled pending its real
shared ANIBL phase and scoped bank-p sprite/tint contract. Existing asset bytes,
world renderer, picker and global clock are outside this slice.

Later phase cues 0xce/0xcd and original stop-audio behavior are outside the accepted
CPU reference and this start-cue correction. Complete original audio parity is
not claimed.
