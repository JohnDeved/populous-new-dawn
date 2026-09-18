# Mission 6 first Matak land connection

## Scope

This note resolves the first completion blocker found by issue #101 without replaying the browser acceptance or running new native code. The retained verified executable, generated exports, imported Mission 6 script, existing native checks, and current browser sources are sufficient.

Observed browser absence and original mechanism are kept separate: the issue101 browser receipt proves only that current fresh Mission 6 still has zero bridges/effects and no Blue→Matak path when the authored first Matak ATTACK becomes active. The chain below establishes why the original ATTACK is expected to create that first connection.

## Positive original basis

Mission 6 Matak uses `cpscr015.dat` (SHA-256 `01dcc425abaf6bf9680e1d62cede2d5c3a0de9739631d69516d810bc424b8e60`). Its first raid is the block already documented in `mission6.md`: variable 20 must be zero, Matak mana must exceed variable 32, population must exceed 22, Warrior count must exceed five, and the recurrence is turn `622 + 1024n`.

The mana threshold is bridge-specific evidence, not inference from the browser gap. Campaign internal reads `1051` and `1060` are spell-cost reads for models `3` and `12`; on the imported rules they are Lightning `80000` and Land Bridge `70000`. Script 15 sums them into variable 32 = `150000` before the raid gate.

The passing raid resolves opcode 1059 ATTACK to:

`[1118, 5, 1071, 0, 128, 12, 3, 2, 1078, 0, 0, 16, -1]`

The three spell operands are therefore model `12` Land Bridge, model `3` Lightning and model `2` Blast. This is independently visible through the browser's already-recovered internal reads: `1195 -> 12`, `1186 -> 3`, `1185 -> 2`.

## ATTACK parser -> native task spell bytes

Native opcode 1059 dispatch is `0048cc60` case `0x1f -> 0048fc50`. `0048fc50` parses the 13 ATTACK operands and calls `004e5fd0`, the type-20 task allocator. Static stack mapping shows parsed ATTACK args 5, 6 and 7 are passed as allocator parameters 7, 8 and 9.

`004e5fd0` allocates task records at tribe `+0x36 + index*0x52`. It stores allocator params 7/8/9 at task-relative bytes `+0x1f/+0x20/+0x21` (`esi+0x55/+0x56/+0x57` in the disassembly). For the first Matak raid those bytes are exactly `[12,3,2]`.

This is separate from the eight generic computer spell entries at tribe `+0x4ce`. Native AI initialization `00461d70` explicitly zeroes those eight model bytes, and Mission 6 Matak has only one opcode1108 entry write: Lightning/model3. The first bridge is therefore **not** a hidden/default model12 generic spell entry.

Opcode1093 is also not the bridge producer. Native dispatcher case `0x41` calls `00492090`; that leaf resolves up to four marker-entry operands, finds people at those cells, and routes them through ordinary person movement. It contains no spell allocation, stock grant or terrain mutation.

## Type-20 phase 6 -> Matak Shaman task caster

Native type-20 ATTACK consumer is `004cb400`. Its phase jump table at `004ccac4` maps phase 6 to `004cb8b7`. That branch calls `004d14f0` with the tribe/task.

`004d14f0` is the task-local Shaman/spell path missing from the browser ATTACK controller. For a live person model7 Shaman it calls `004f4f60(task+0x1f, shaman)`. `004f4f60` scans the three task spell bytes in order, skips only 0, 6 and 19, applies the native per-model AI-use limit when enabled, and returns the first permitted model. The first Mission 6 Matak candidate is therefore model12 Land Bridge. After a successful cast `004f4ff0` clears that model from the three-byte task list, so later phase-6 visits fall through to Lightning then Blast when eligible.

The payment/permission chain is already recovered elsewhere:
- `004c29a0` / `spellPaymentType`: existing one-off stock can make a cast free, but stock is **not required**. If payment is not stock-funded, `004d14f0` requires tribe mana to meet the model cost. This matches the script's 150000 Bridge+Lightning gate.
- `004c2d80`: Shaman cast-state eligibility.
- `004f2100` / `computerSpellAllowed`: per-model AI usage limit.
- `004f3040` / `computerSpellInRange`: native cell-range check.
- `004f4680` / `chooseSpellTarget`: model12 is in the unconditional positional cases and returns the supplied center unchanged.
- `004f4de0`: allocates/spends the model12 spell. The existing browser `beginCast` already owns the equivalent payment, cooldown, cast counter and Land Bridge projectile/effect lifecycle.

## Model 12 endpoints

The original task caster does not hardcode Mission 6 bridge coordinates. `004d14f0` derives the source from the live Matak Shaman. It forms a packed target center from the Shaman's current native cell; when the Shaman is in native states 25 or 29 it substitutes the type-20 task target at task `+0x10`. It then applies `004f3040` range validation and passes that center to `004f4680`. Because model12 returns the input center unchanged, `004f4de0` receives that exact dynamic destination.

Thus the original Land Bridge endpoints are **live Matak Shaman source -> phase-6 ATTACK target center**, subject to the normal model12 range/terrain validation. They are not a fixed pair that the browser should inject. The existing retained topology note that a normal bridge between the closest initial components makes the route connected is supporting geometry, not the producer definition.

## First unsupported browser binding

The browser loses the original mechanism at the ATTACK task boundary, before terrain or Land Bridge code:

1. `app/campaign-command-runtime.ts` already recognizes the exact Mission6 Matak ATTACK and even validates raw args 5/6/7 as internals `1195/1186/1185`, but its `requestAttack(...)` call does not pass their resolved `[12,3,2]` values.
2. `app/computer.ts::ComputerTask` has no task spell-list field, and `requestAttack` cannot retain the native task `+0x1f..+0x21` payload.
3. `app/computer.ts::stepAttackTask` phase 6 only checks group settlement/fallback. It has no native-equivalent task-Shaman spell action.
4. `app/computer-runtime.ts` therefore never invokes a task-local Shaman cast. Its existing `stepComputerSpells` path is the separate `004d0860` generic/emergency caster and must not be widened by merely appending model12.

The first unsupported binding is **opcode1059 ATTACK spell-payload retention into the type-20 task**, followed immediately by the missing **phase-6 task-Shaman spell consumer**. The Land Bridge terrain/effect implementation itself is downstream and already live.

## Smallest repair reservation

Reserve only, after CEO coordination:

- `app/campaign-command-runtime.ts` — pass resolved ATTACK args 5/6/7 to `requestAttack` while retaining current exact-vector validation.
- `app/computer.ts` — add a three-model task spell list, initialize/snapshot it in `requestAttack`, and expose a phase-6 task-spell callback/action before the existing settlement/fallback work. Do not rewrite other task phases.
- `app/computer-runtime.ts` — implement the live Matak Shaman callback using the existing spell primitives: first-permitted task model, stock-or-mana payment rule, Shaman eligibility, usage limit, native range, `chooseSpellTarget`, existing `beginCast`, and clear the consumed task spell only after allocation.
- focused additions to `tests/mission6.test.mjs` for task `[12,3,2]`, phase-6 model12 selection/consumption, mana/usage/range refusal, and dynamic task-target destination.

`app/computer-spells.ts`, Land Bridge terrain/effect code, mission scripts, level data, stocks, markers and generated outputs need no speculative change for this repair.

## Normal acceptance after repair

Resume the existing `scripts/check-browser-mission6-natural-victory.mjs` from a fresh shipped Mission6 selector start; do not seed or inject a bridge. At the authored first Matak raid:

1. prove the allocated browser type-20 task retained spell models `[12,3,2]`;
2. prove the rendered/simulated Matak Shaman reaches phase-6 task casting and allocates model12 through ordinary AI with sufficient natural mana;
3. prove the Land Bridge source is the live Matak Shaman and destination comes from the live task target/range path, not a checker coordinate;
4. wait for the bridge effect to complete and prove Blue->Matak pathfinding becomes nonzero;
5. continue the same no-injection natural acceptance through both tribe defeats, generic Mission6 victory, persisted completion and shipped Continue to Mission7.

No new native execution is required to authorize this narrow repair.
