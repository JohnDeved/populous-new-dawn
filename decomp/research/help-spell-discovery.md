# Inactive Help spell-knowledge reader

Refs #741 / draft #744. This is a read-only player-0 adapter, not Help activation.
The accepted building checkpoint `17ec96b1` and article/scrollbar checkpoint
`4ef9f187` retain their separate evidence. No World, save, casting, HUD or
charging behavior changes here.

## Exact native field mapping

Canonical `d3dpoptb.exe` SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

Help predicate `004250f0` calls `004c29a0` and asks whether its return is positive.
For the current signed player byte at `0089c6f0`, ordinary availability is the
permanent bit at `0096070a + player * 56`, OR the low nibble of the stock byte at
`0096071e + player * 56 + model`. With game flag `0089d17c & 0x20`, the stock
nibble AND definition byte `005a80fe + model * 62` must be nonzero; a permanent
bit by itself no longer suffices. Owner flags only distinguish positive return
values 1 and 3. Charging-disabled state does not affect this boolean.

`scripts/inspect-executable.py` maps that definition byte to
`original-rules.spellCharging[model].alternateLimit`, not `mode` (the WORD at
`005a80d0 + model * 62`). All 22 imported alternate-limit bytes were compared
directly against the retained PE as data. Only models 10, 12 and 15 are nonzero,
each with value 5. No original code was executed or shared asset regenerated.
The external `native-help-building-discovery-evidence-20261022/spell-field-mapping.json`
SHA256 is `8988b8fff88d92d6a9410f8e3c8542ddc6db7fb0eb51ad5b133b2742a9002007`.
The predicate spans remain in `native-help-rendering-evidence-20261022`.

## Current browser owners, not manufactured snapshots

- `manaWorld.playerTribe` selects the current player directly. Help does not use
  the HUD's `manaTribes[player].spellOwner` alias.
- `manaWorld.spells[0].available` is the current player-0 permanent mask.
- `World.shots[spell.id]` is the current player-0 stock, mapped by the existing
  `SPELLS` model/id records. One-off reward payout increments this dictionary.
  `world-turn.ts` copies between it and the mana stock array only for permanently
  available spells; `beginCast` also synchronizes the selected stock before
  debit. Reading the stock mirror alone can miss one-off gifts, and reading Help
  must not perform that synchronization.
- `manaWorld.gameFlags`, not `manaWorld.levelFlags`, owns `0089d17c`. Existing
  source-bound native probes explicitly map the two fields to distinct addresses.
- `alternateLimit` is read from the already imported, source-bound definition.

`readHelpSpellKnowledge` admits all 20 imported spell predicate models for player
0. Other native players are explicitly unsupported because they have no distinct
owned `World.shots` dictionary. Non-Help model bits are also unsupported. Invalid
players/models, missing current state, non-byte stocks/definitions and values
outside the signed-or-unsigned DWORD representation fail rather than silently
becoming unknown knowledge. Low-nibble semantics are preserved after validation.

The scalar `helpSpellLinkAvailable` shares the already accepted pure predicate;
the original `HelpDiscovery` fixture API still delegates to it. Its historical
`levelFlags` property name is documented as the native game-flags byte so future
collectors cannot mistake it for `manaWorld.levelFlags`. The new reader needs no
dummy building bits, fabricated stock array, owner flags or HUD visibility.

## Validation and remaining boundary

Narrow regressions cover all imported models, one-off versus permanent stock,
stale/absent mana mirrors, direct-player versus HUD aliasing, the alternate-limit
branch, nibble/DWORD boundaries, absent or malformed state and no writes. Source
and execution review are required before this successor is considered accepted.

This remains inactive. Fifty Help topics are unconditional, twenty are spell
gated, and eighteen are building gated. The accepted building reader covers
sixteen of the latter; current Hut 1 and Guard Post 17 owners are still missing.
No initial profile fallback, full discovery completion, live ownership or native
rendered parity is claimed by this reader.
