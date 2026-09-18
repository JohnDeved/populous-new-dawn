# Spell HUD visibility producer

Issue #78 source checkpoint. This extends `spell-hud-icons.md` and reuses the retained
`work/orchestration/hud-icon-audit` evidence; it does not repeat the 20-descriptor or 54-crop audit.

## Native refresh states

The spell control renderer is `0049daf0`. Its control fields distinguish presentation
before stock/casting logic:

- `control+0x10 == 0`: control is not drawn.
- `control+0x4f == 0`: populated spell artwork is absent.
- `control+0x5a == 4`: draw the dedicated HFX entry at `hfx_0_addr+0x2100` and return.
  Eight-byte HFX entries make this HFX0 frame **1056**.
- `control+8 == 0`: the ordinary populated-control path uses the inactive descriptor icon.
- otherwise normal ready/hover/inactive selection is chosen; stock and charge-disabled state
  are read separately.

The packed spell controls point to refresh callback `0049e800`. That callback resets each
slot to empty/disabled, maps its slot through `004c2fe0` to a spell model, then applies:

1. `004c3110(model)`; a nonzero result populates and enables the normal spell control,
   with the return byte copied to `control+0x5a`.
2. only when that returns zero, `004c31e0(model)`; return 4 populates a disabled control
   whose renderer takes the dedicated question-mark branch.

This is the missing original state producer. Visibility is not a single header-mask test.

## Owned/stock predicate: 004c3110

For the normal campaign path (game flag `0x20` clear), `004c3110`:

1. reads the current player's tribe and its `tribe+0xc22` **spellOwner**;
2. reads the low-nibble stock for that owner/model at `0x96071e + owner*56 + model`;
3. tests the owner's permanent spell mask at `0x96070a + owner*56`.

The result is:

- neither permanent bit nor stock: **0** (not normally visible);
- stock present: **3** (normal populated spell control);
- permanent bit with zero stock: **1**, except the already-recovered tribe flag-8
  special case also returns 3.

`00486160` proves the level HDR's first 56-byte player-things record is copied directly
into native `array_56b_4`. Therefore the shipped Mission 1 permanent spell bits are real
native player state, not a browser-only interpretation.

## Undiscovered producer: 0042cbc0 -> 004c31e0

Raw static disassembly identifies `0042cbc0`, called during level initialization from
`0042b4bd`. With its normal argument 0 it clears `0x96aa82`, walks the live allocated
unit list, and selects class-6/model-2 reward-source units. For each source whose
postprocessed `unit+0x7c == 11`, it ORs `1 << unit+0x74` into `0x96aa82`.

`00485b00` maps those fields directly from authored reward settings:

- `unit+0x7c = settings[0]`;
- `unit+0x74 = settings[1]`.

So `0x96aa82` is the **current live level's spell-reward source mask**:
class-6/model-2 sources with `settings[0] == 11`, keyed by their authored spell model.
It is not cumulative campaign history and is independent of stock/permanent ownership.

`004c31e0(model)` returns 4 iff that live reward-source mask contains the model. Since
`0049e800` consults it only after `004c3110` returned zero, ownership/stock always
wins over the undiscovered placeholder.

## Casting permission is separate

The click callback `0049e650` separately rejects the alternate game flag and calls
`004c2ca0`. `004c2ca0` rejects descriptor mode 2 unless the corresponding game-state
permission bit is set. The browser already carries the equivalent mode-2 gate as
`manaWorld.gameFlags & 256` in `mana.ts`.

Therefore a spell can be native-visible because its permanent bit exists while still
being non-castable. Visibility must not be filtered by cast permission.

## Mission comparisons

Applying only the proven predicates to current browser state gives:

- fresh Mission 1: one stocked/permanent normal spell; two current-level reward-source
  models are undiscovered placeholders; three descriptor-mode-2 models are permanent
  but visible/non-castable; every other shipped spell is hidden.
- Mission 1 restart: identical, because restart reconstructs the same authored HDR and
  current-level reward sources.
- Mission 1 checkpoint clone/restore state: identical before gameplay mutation because
  permanent mask, stock, level and live shrine/source lifecycle are checkpointed.
- Mission 16 as a later-mission discriminator: owned header spells remain normal,
  the one current reward-source model not already owned is undiscovered, and its
  overlapping reward source for an already-owned model remains the real owned icon.
  The same descriptor-mode-2 permission rule applies without naming any special spell.

The comparison derives descriptor-mode-2 models from `original-rules.json`; it does not
hardcode Armageddon, Bloodlust, or Teleport.

For browser implementation, the current live `World.shrines` lifecycle is the closest
owned representation of those reward sources: active spell rewards/reward arrays can
form the undiscovered mask. Ownership/stock must be checked first. Once worship consumes
a one-use source, the shrine becomes inactive; if its awarded stock is later exhausted,
the consumed source must not turn back into a question mark.

## Exact implementation blocker

The required native question-mark HFX frame is not currently imported:

- renderer address: `hfx_0_addr + 0x2100`;
- HFX0 frame index: **1056**;
- verified shipped frame: **20 x 23** pixels;
- decoded RGBA SHA-256:
  `2bcbf3fe1f260915ea712059866e6024c33e11b96ec4d8b84c6a1895d39611b4`;
- `scripts/import-hud.py` does not include frame 1056 in its owned ID list;
- `app/original-hud.json` therefore has no frame 1056 rectangle.

Issue #78 explicitly excludes atlas/icon changes. A faithful HUD filter cannot be landed
without this asset: showing the real spell icon leaks discovery, hiding the control loses
the native question-mark state, and a text/Unicode substitute would repeat the disproved
fallback pattern documented by the icon audit.

The smallest next action is for the HUD asset/import owner to add exact HFX0 frame 1056
through `scripts/import-hud.py`. After that lands, #78 can implement one narrow
spell-visibility helper and page filter using the predicates above, disable interaction
when casting permission is false, and cover fresh/restart/checkpoint/later-mission
lifecycle without reward, mana, stock, RNG or save mutation.
