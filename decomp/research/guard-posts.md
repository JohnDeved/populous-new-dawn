# Player Guard Posts, follower assignment and N release

Issue [#1010](https://github.com/JohnDeved/populous-new-dawn/issues/1010), base main
`c394751805cc5fbbdb885cc78853b1afab0c86df`. Static, read-only evidence from the original
`d3dpoptb.exe` (SHA-256 `3a5065c7…dfbe4f`, `decomp/tools.json`): Ghidra 12.1.3 exports
(private copy of the shared project; three tracked exports re-exported byte-identical)
plus Capstone 5.0.7 disassembly. No original execution, emulation, fixture recording,
browser run or parity claim. Pseudocode names/types are inferred.

Supersedes the open gaps of the unmerged notes on
`research/guard-post-context-20261113` (head
[`408070f3`](https://github.com/JohnDeved/populous-new-dawn/commit/408070f3a1fab5624ebe350576de90ab6d56f70c)):
the missing bodies `004b98f0`, `004ba640`, `004ba9b0`, `004ba5d0`, `00502eb0`,
`00503080`, `005030c0` are now exported and byte-checked. Correction to that branch:
`0043e8e0` case `0x62` skips **selected** people in its scatter loop (`+0x7a` is the
selection byte, not `loc_1_x`).

Probe: `python3 -I scripts/check-static-guard-posts.py "$POPULOUS_EXE"` verifies 7
binding records, 5 tribe-command jump targets and 83 reviewed instruction tuples
(`passed`, exit 0; wrong executable rejected, exit 1).

New exports (hashes in `decomp/exports.json`): `0043d6e0`, `00443b40`, `004999d0`,
`004b98f0`, `004ba5d0`, `004ba640`, `004ba9b0`, `004ee1e0`, `00502eb0`, `00503080`,
`005030c0`, `00503230`.

## 1. Identity

- World object: secondary-pool (`alloc_unit_2`) class 10 / model 16, owned by
  `player_tribe_num`. Help/menu entry is building-menu model 17 (`0x11`); help topic
  1004 illustrates building model 17, and `rules.buildingObjects[17] = 7`. The
  initializer `00500a30` case `0x10` calls `unit_set_object(obj, 2, 7)`: the mesh is
  bank-2 object 7, already identity-pinned in `app/original-help-previews.json`
  (`identities["2"]["7"]`, 20 faces / 27 points). Tooltip 848 and `unlockedGuardPost`
  (help bit 17) are existing metadata.
- Initializer (`00500a30` case 0x10): state 15, position snapped to the cell centre
  (`(c & 0xfe00) + 0x100`), inserted into the cell chain, sunlight/light item
  `(3,4,0)`, object flag `0x80`, age word `+0x70` = 0, count `0089c65d += 1`, then
  `005030c0`.
- It is a **marker only**. Follower orders store the cell, never the post id, so
  removing a post does not cancel or retarget guards. Hovered posts are treated as
  "no object" by other cursor targets (`004ac2a7`, `004ad4ed`).

## 2. Inputs and producers

| Input (default record) | Action → effect |
| --- | --- |
| Building-panel button `0049d9b0` (9 records from `005cc465`, stride `0x42`) | select type; unless Shift latch `0098e908 & 0x400`, `set_tribe_command(player, 0x7a)` → `tribe+0xc5c = 0` (chain reset, `00441600`) |
| Left release `005d649c` → `0x77`; Ctrl/Alt+left `005d64a8/b4` → `0x78` | `process_cmd` menu-model-17 branch (below) |
| Shift+right release `005d64e4` → `0x7a`, predicate `004ff360` | mode 0/12 and hovered object is 10/16 → local `004ef180` (no tribe command) |
| Right release (any modifiers, earlier record `005d64c0`) / Escape → `0x7c`, predicate `004ff3c0` (mode 7) | `004b9150`, `004ba5d0` (preview delete), leave mode. So Shift+right removal works outside placement mode only |
| Context left-click on a post | `00437010` finds 10/16 in the cursor cell → context `0x801000`; `00437750` picks command 11; `004380f0` requires `0x1000 && 0x800000`. Ctrl+Alt on bare ground sets the same bits when `004b98f0(cell,·,1)` passes (#1003) |
| N `005d6208` → `0x62` | `set_tribe_command(player, 0x68)` → `0043d6e0` |
| G `005d6220` → `0xc1` | `set_tribe_command(player, 0x82, 004999d0())` → `00443b40` Shaman guard (command 30; unrelated to posts, see `shaman-guard-input.md`) |
| Panel sibling callback `0049da00` → `0040abe0(17)` | camera cycle to own posts: next post, else nearest post with non-zero age (event binding not decoded) |

`process_cmd` `0x77/0x78` with menu model `0x11` (`004acbe2`):

1. `004b98f0(cell, tribe, 0)` true → sound `0x24`, `set_tribe_command(player, 0x62,
   menu, cell)` (`0x0e + 0x54`), then delete the preview (`004b9150`, `004ba5d0`).
   Plain `0x77` also leaves placement mode; `0x78` (Ctrl or Alt) stays in mode
   (`004acc7d cmp ebx,0x78`).
2. Else if `004ba640(cell)` (a non-preview post on the cell) → delete **every**
   non-preview 10/16 on that cell locally; mode stays.
3. Else reject: `0049a060`, sound `0x25`.

## 3. Placement predicate `004b98f0(cell, tribe, allowExisting)`

Returns AL=1 when all hold (tribe argument unused):
`0x518200(cell centre, 0) == 0` (browser `restingCellCollision`: no building flag
`0x200`, no flag 4, land category bit 1, all four quarter-cell walk bits), the cell
building index `& 0x3ff == 0`, and no blocking object in the cell chain: scenery
(class 5) other than model 17, or — only when `allowExisting == 0` — a 10/16 post.
The preview pointer `008922d8` is always skipped. No owner, distance, terrain-height,
wood or count rule exists here.

## 4. Tribe command `0x62` (`00440822`)

Runs on every machine for the issuing tribe:

1. If `004b98f0(cell, tribe, 1)`: `004ba9b0(tribe, 1, 0, cell)`.
2. Every **unselected** same-tribe class-1 person in the post cell whose state has
   descriptor bit 8 (`005a6f79`) and lacks `flags2 & 0x100000` enters state 43
   (scatter, see `player-scatter.md`) with previous state saved.
3. Only when `tribe == player_tribe_num` and `004b98f0(cell, tribe, 0)`: allocate the
   post if `004edae0(10,16)` (secondary count `<= 156`). Posts therefore exist only on
   the owner's machine ("invisible to the Enemy").

## 5. Follower assignment `004ba9b0(tribe, 1, 0, cell)`

Shared with plan placement (`004b9190`, mode 0 → command 6). Requires `tribe+0x931 != 0`
(inferred selected count) and chain index `tribe+0xc5c < 8`. For each **selected**
(`+0x7a & 0x80`) person in the tribe list, with **no model/state filter** (Shaman
included):

- chain index 0: `00436ca0` clear queue, `flags2 |= 0x10` (deferred re-init),
  cursor `+0xa6 = 0`;
- one shared record per call (`00436c20` + `00438730`): command 11, `a = cell`,
  extents bytes `6,6`; allocation failure skips that person, the next retries;
- `00436d00(person, id, slot = chain index)` then `0043b010`, which converts a run of
  ≥2 command-11 slots into command 25 (patrol, descriptor `0x8000` keeps it in the
  circular queue).

Then `tribe+0xc5c += 1`. Thus: one post = guard (11); Ctrl/Alt placement of further
posts without a panel reset = patrol loop (25) over up to 8 posts.

## 6. Guard, patrol, N and lifetime

- Command 11 body is `00519f10` (area guard; browser `stepGuardOrder`). Command 25 body
  is movement (`00432590` case 0x16); on arrival it zeroes `+0x70` of the first 10/16
  in the target cell (`0043292e`). Command 11 never refreshes a post.
- N (`0043d6e0`): for **every** state-10 person of the tribe (no selection test) whose
  current order is 11 or 25, find the first later slot whose order is non-null, not
  cancelled (`flags & 1`) and not 11/25; if found, remove slots `0..found-1`
  (`004364d0`), set cursor = found, restart (`00432df0`, `004d4f40`). No later order →
  unchanged.
- Post update (state 15, `00502eb0`): refresh height; cosmetic RNG `0089bc72` jitter
  ±32; when divisor `0089ce61 != 0` and `(+0x2e & (divisor-1)) == 0` and
  `004edae0(7,3)` (count `<= 140`), allocate smoke effect 7/3 at z+110 with lifetime
  `+0x5f = 4 + rand%32`; advance animation frame `004f0f60`; start object sound `0xc0`
  (mode `0x40`) unless byte `+0x10` bit `0x10` (inferred: sound active) is set; age `+0x70 += 1`. Remove (`004ef180`, never the
  preview) when the pre-increment age `> 3000` or the cell category has flags `& 0x3e`.
- Count/divisor (`005030c0`, also `00503230` after load without eviction): count all
  10/16 (preview included) → divisor 2 (<13), 4 (<22), 8 (<33), else 0 (no smoke). At
  ≥64 evict the oldest by age; if all ages are 0, the farthest from the new post.

## 7. Removal and preview

`004ef180` class10/16 → `00503080`: count−1, `004ee1e0` (unlink cell, free secondary
record immediately, release light item), recount via `005030c0`, stop sound `0xc0`.
Preview (`004b8f50`, mode 7): separate pointer `008922d8`, same 10/16, object flag
`0x80` cleared; deleted by `004ba5d0`. Bulk wipe `00477b90` (caller not traced).

## 8. Persistence

Secondary records (`00930ab8..00937a98`), the order pool (`00938830`) and tribe structs
(`0089d1c8`, including `+0xc5c`) lie inside the `0089d178` / `0xd1964` snapshot saved
by `00442cd0`; load (`00443260`) rebuilds lists (`004ee300`), runs `004ecac0` (counts
posts with non-zero age into a tribe field) and `00503230`. The preview pointer
`008922d8` is outside the block, so a preview present at save time would reload as an
ordinary post; the port should not persist the preview.

## 9. Browser difference (main `c3947518`)

- `guardShaman` (`app/live-command.ts`, `app/shaman-guard.ts`) is the correct G →
  `0x82` → command 30 Shaman guard. It is **not** a Guard Post feature; keep it.
- No post object, placement kind, panel entry, chain index, `0x62`/`0x68`/`0x7a`
  producer, N binding or post renderer exists.
- `app/command-context.ts` names bit `0x1000` `Flatten` and `0x800000`
  `FlattenValid`; natively they are the post/guard-area context and its validity. They
  are never set, so command 11 is unreachable from player input.
- `person-order-update.ts` case 25 already zeroes a 10/16 `timer`, but the live
  `stepLiveOrderQueue` supplies `cellObjects: unsupported` and `world-turn.ts` routes
  neither model 25 to a live owner (movement list `3,6,7,16,22,27,30,33`, combat list
  `11,15,19,21`). AI two-marker guards (`appendLiveGuardOrders`) also normalize to 25
  and share this gap.
- `secondary-effects.ts` owns the 160-slot secondary pool (hut smoke, order marker);
  posts and their smoke belong there.

## Implementation plan

Each step is one PR with focused tests; one writer per branch.

1. **Context bits and patrol owner** (`app/command-context.ts`, `app/world-turn.ts`,
   `app/live-movement.ts`): rename `Flatten/FlattenValid` to the guard-post meaning,
   route current model 25 through the movement owner with a `cellObjects` adapter over
   the post store. Tests: context choice 11 for post bits; two-post patrol cycles and
   refreshes age; AI secondary-marker patrol no longer throws. Coordinate with #1003.
2. **Post store and lifecycle** (new `app/guard-posts.ts` on `secondary-effects.ts`):
   allocate/remove with `004edae0` reserve 4, cell-centre snap, 64-post eviction,
   divisor, age expiry 3000, terrain `& 0x3e` expiry, smoke 7/3 with cosmetic RNG,
   preview kept outside saves. Tests from the constants above (eviction order,
   divisor thresholds, expiry boundary 3000/3001, preview exclusion).
3. **Placement producer** (`app/world-types.ts` kind `guardPost`, `app/world-rules.ts`,
   `app/page.tsx` panel item 21 gated by `unlockedGuardPost`, `app/scene-input-runtime.ts`):
   predicate `004b98f0` on `restingCellCollision`; click = place/assign/exit, Ctrl/Alt
   = stay; click on existing post removes; Shift+right on hovered post removes;
   right/Escape cancels; sounds `0x24/0x25`. No wood, not in `BUILDINGS` timber flow.
4. **Tribe command `0x62` and chain** (`app/live-command.ts`, `app/person-orders.ts`):
   per-tribe `guardChain` (`+0xc5c`) reset on panel selection without Shift;
   `004ba9b0` assignment (selected only, Shaman included, shared record, slot = chain,
   clear on chain 0, `normalizePersonRoute`); scatter unselected same-tribe people on
   the cell (reuse `app/person-scatter.ts`). Tests: 1 post → 11; 3 posts → 25 loop;
   9th post not assigned; exhaustion retry; Shaman accepted.
5. **N release** (`app/page.tsx` keyboard, `app/live-command.ts`): tribe-wide
   `0043d6e0`; tests with queued tree order after guard, cancelled slots, no-op case.
6. **Renderer** (`app/scene*.ts`, `app/model-resources.ts`): bank-2 object 7 with the
   player's posts only, light item, smoke, preview ghost; sound `0xc0` via the existing
   sound owner.
7. **Save/Load**: add posts, chain index and divisor to the current checkpoint format
   (`app/checkpoint-format.ts`, bump `CHECKPOINT_VERSION`); reject older saves per the
   development save contract. Tests: save/load continuation of guard, patrol and age.

Rendered acceptance (real campaign level with Guard Post unlocked, ordinary input):
place a post, select Braves, click it (they circle and fight an approaching enemy);
Ctrl-click three posts (patrol loops); queue a tree after a Ctrl-guard and press N;
Shift+right-click removal leaves guards in place; Save/Load mid-patrol; G Shaman guard
and ordinary building placement unchanged. Gates: `pnpm run check`, `pnpm run build`,
rendered browser check, this probe.

## Browser implementation (#1010)

Steps 1–7 above are ported. Browser divergence: a fixed-slot attach (`00436d00`) that
lands on an occupied slot releases the old record first; native overwrites it and leaks
the reference, which would violate the browser's checkpoint ownership invariant. Owners: `app/guard-posts.ts` (store, `00502eb0` visit,
`005030c0` eviction/divisor, removal), `app/live-command.ts` (`004b98f0`, tribe command
`0x62`, `004ba9b0`, click/Shift+right producers, `0x7a` chain reset),
`app/scene-input-runtime.ts`, `app/page.tsx` (ninth panel button), `app/scene-entities.ts`
(mesh and preview) and checkpoint v4 (`World.guardPostChain` plus the secondary pool).
`scripts/import-guard-post.py` imports bank-2 object 7 (scale 300, identical in bank 6,
record hash equal to the help-preview pin) and the panel icon. The retained
`005cc458` bytes give, per 0x42 record, the normal icon at `+0x25` and the menu model
at `+0x37`; record 8 is HFX 1036 / model 17.

Not ported: the fire-face animation (`004f0f60`), sunlight item `(3,4,0)`, sound `0xc0`,
the class-7/model-3 smoke body and sprite (`0050bf60` sets animation `0x13a`; records
are allocated with the cosmetic-RNG draws but not drawn), the camera-cycle callback
`0049da00`, counting the preview (`005030c0` counts every 10/16, so a visible preview
also counts toward the divisor and the 64-post eviction, and can itself be evicted), the
native toroidal distance
approximation used for all-zero-age eviction, and post hover tooltips. Hovered-post
lookup uses the pointed ground cell, not the object picker.

## Open questions

- Visit cadence of class-10 secondary updates (turns per age tick) and the meaning of
  `+0x2e` used by the smoke gate.
- Exact event (left/right/hover) for panel callbacks `0049d9b0/0049da00/0049da20`, and
  whether a keyboard path into menu mode 7 skips the `0x7a` reset.
- `tribe+0x931` semantics (inferred selected count) and the `004ecac0` tribe counter.
- Command 11 extents from the context path come from `00895e04/05[slot]`; their default
  values were not traced (placement uses fixed `0x606`).
- Sound `0xc0` sample identity and mode `0x40`; light parameters `(3,4,0)`.
- Caller of the bulk wipe `00477b90`.
