# Followers nearby mode: bounded static producer binding

Source checkout: `92907866646e418747dd2bda44236d9949835bc5`, clean tracked tree.
Assessment date: 2026-10-10 UTC. Issue: #60.

## Result

The original HFX875 control is conclusively a global/nearby follower-mode
control. The binding does not depend on the old issue comment's “Commandee” label:

`root 005cd0be (ID1)` → `child list 005caea0` → `descriptor 005cb1b8`
→ runtime left callback `004a1680` → command producer `00479cf0`
→ tribe command `0x5f` → `0043e8e0`, branch `004404e2`
→ set/clear tribe `+0x93d` bit `0x80`.

The current browser has the consumers but no ordinary input producer. Its HFX875
button invokes Planet overview. The lower task/transport table already exists;
it must not be implemented again. Persistent class/Total displays also need to
use the nearby matrix and alternate font when this mode is selected.

No app changes, execution/emulation of original code, dependency use, browser
work, tests, importers, new issues, PR changes, or publication occurred. New writes
are confined to this ignored packet. Objdump only decoded supplied executable
bytes. This is static evidence, not an executed native or rendered acceptance.

## Input identity and method

- Input: `/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe`
- Size: 2,275,840 bytes.
- SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Tool: `/usr/bin/objdump`, GNU Binutils for Debian 2.44.
- Data reader: Python standard library `pathlib`, `struct`, `hashlib`, `json`;
  PE section table used for VA-to-file offsets. No imported target code.
- Existing `decomp/exports.json`, the scoped research notes, maintained original
  consumers and original HUD probe source were read first.
- Disassembly command shape: `objdump -d -Mintel --start-address=0xSTART
  --stop-address=0xEND <input> > <this packet>/<named window>.asm`.
  Window addresses are present in each filename and output header. Embedded jump
  tables are decoded as data by the accompanying JSON, not treated as the bogus
  instructions objdump prints after routine returns.
- `source-correspondence.json` binds reused tracked inputs and packet files.

## Descriptor, construction and adjacent controls

Raw descriptor fields are retained in `adjacent-controls.json` and
`descriptor-inspection.json`; root pointers are in `callback-candidates-roots.json`.

| Native item | Descriptor | Identifying fields |
| --- | --- | --- |
| Shaman portrait | `005caee2` | HFX664; (33,114,30,35); left `004a0f00`; right `004a1010`; model7; renderer `0049fe70` |
| Shaman health | `005caf24` | (64,126,10,22); renderer `004a0050`; no left/right action |
| Spells / Buildings / Followers tabs | `005caf66`, `005cafa8`, `005cafea` | HFX678/676/680; type5; left `0049d140` |
| Three tribe controls in each display variant | `005cb02c..005cb176` | x78, y114/126/138; left `0049d540`; variant renderers `0049d3e0`/`0049d2a0` |
| Nearby control | `005cb1b8` | type3; (6,122,24,18); HFX875; left `004a1680`; right0; hover callback0; refresh `004a16f0`; renderer `004a1a30`; tooltip758; mode byte0 |
| Total follower strip | `005cb1fa` | (0,153,15,36); left `004a1090`; right `004a1120`; renderer `004a0800` |

The root ID1 record `005cd0be` supplies the same `005caea0` children for both
native display modes. The 66-byte descriptor sequence includes `005cb1b8`.
The existing `0044c650.c` constructor follows the list and its mode-byte gates;
this descriptor has no suppressing mode bit.

Child constructor `0044ca80` copies descriptor `+0x0d/+0x11/+0x15` into runtime
left/right/hover callback fields `+0x2b/+0x2f/+0x33` (`0044caed..0044cb01`).
It copies refresh `+0x3b` into runtime `+0x67` (`0044cb9d..0044cba0`).
At `0044cc12..0044cc1c` it initializes runtime present/enabled/visible fields to1.
No follower count, class knowledge or vehicle condition is involved here.

The earlier first data window stopped before the real descriptor, so its
`hfx875LiteralHits: []` is a bounded negative result, not a contradiction.
The extended existing-HUD window locates literal875 at `005cb1dd`, descriptor+37.

## Input dispatch and guards

The constructor-bound callback fields identify generic input owner `0044b130`.
`input-entry-boundary-0044b100-0044b170.asm` establishes its actual entry.
The larger input listing begins mid-instruction at `0044b150`; ignore its first
two bytes and use the entry-boundary listing for `0044b130..0044b152`.

For the ordinary mouse path:

- Generic input refreshes the child through `+0x67`, clears press state outside
  its hit rectangle, and resolves the current hit control. Global UI flag4 skips
  normal hit targeting (`0044b361..0044b3e3`).
- Input mode byte `0089c6e7 == 0x11` takes the special path instead of ordinary
  control activation (`0044b54f`). Its semantic label is not inferred here.
- Press owner `0044bf50` rejects a disabled control at runtime `+8 == 0`.
  Type3 dispatch resolves through `0044c46e` to `0044c08f`, which arms the press
  field with1. It does not invoke the callback on this press branch.
- Held left/right type3 dispatches both resolve to `0044b61d`, so the held path
  does not repeatedly call the action (`dispatch-and-art.json`).
- A matching release with an armed press calls `0044c4a0`. Type3 resolves through
  `0044c568` to `0044c4fe`: xor state byte+0x2a with1, mask to1, and call the
  supplied callback when nonzero, then clear press state. Refresh supplies0 or
  0x80 from the authoritative tribe flag, so either mode reaches the callback.
- The control has no right callback, linked window or additional descriptor
  action. Do not invent a right-click action or modifier-specific toggle.

Callback `004a1680` has **no local** level-lock, overview, drag, Shift or Ctrl
branches. It does not directly mutate the tribe flag. It plays its mode cue, then
requests `00479cf0(player, 0x5f, value, 0)`:

| Current bit0x80 | Cue via `0048a050(0,cue,1)` | Requested value |
| --- | --- | --- |
| clear/global | `0x6e` | 1 |
| set/nearby | `0x6f` | 0 |

Command producer `00479cf0` first rejects global byte `0089c662 & 8` (the
DWORD at `0089c661` therefore has bit0x800). Command0x5f is outside its special
0x0c..0x52 dispatch range and uses the default empty-slot rule. It writes the
tribe's 15-byte command slot only when slot+0x0c is zero. Data+4 is the requested
mode and data+8 is zero. A mode cue can therefore occur before an occupied-slot
request is discarded. Do not claim that every callback necessarily changes mode.

The command dispatcher is decoded independently in `writer-target.json`:
`0x5f-0x0c` indexes byte `00442443` (=42), whose target at
`004422c0 + 42*4` is `004404e2`. Nonzero command+4 ORs0x80 into tribe+0x93d;
zero ANDs0xffffff7f. This agrees with retained `0043e8e0.c:987`.

These are the guards inside the traced input/control/command chain. Outer game
event scheduling and all alternate input modes are not asserted equivalent.
An existing keyboard action `004aab80.c`, case0x97, independently submits the
same command; its physical key binding was not recovered, so no key is proposed.

## Feedback and owner lifetime

Refresh `004a16f0` reads the current player's tribe flag and copies exactly
`flags & 0x80` to control+0x2a. Reopening or rebuilding a control therefore reads
the gameplay owner; the control's transient Boolean does not own the mode.

Renderer `004a1a30` uses frame families `005cabf0/005cac08/005cac20`. Its icon
calculation at `004a1ad8..004a1ae4` is base875 plus2 when control+0x2a is nonzero,
plus1 when either press field is nonzero:

- Global normal / pressed: HFX875 / HFX876.
- Nearby normal / pressed: HFX877 / HFX878.

Only875 is currently imported in `app/original-hud.json`. Adding876–878 and the
appropriate evidenced frame consumer would be an explicitly narrow generated-art
change. This pass neither imports pixels nor claims executed pixel equivalence.
Tooltip ID758 is proved; its exact localized text is not recovered here. The
adjacent `language/lang00.dat` is absent at the supplied EXE path, and the current
imported tooltip subset does not contain758. “Commandee” remains the historical
label, not evidence required for the functional binding.

Mode ownership is per tribe at+0x93d, not a class unlock, transport presence bit,
tab-local latch or global saved preference. The count rebuild `004ecac0` preserves
bit0x80 while using it, and control refresh mirrors it. Existing recorded-state
research establishes a raw loaded game-state range `0089d178..<0096eadc`, which
contains this field. That is **not** proof of the ordinary user-save call path or
fresh-level/default policy; those two native lifecycle details remain unclaimed.

Current browser ownership is already suitable: `createTribeCasting(false)` sets
flags0; `world-state.ts:154` creates new tribes; `game-store.ts:442–455` clones the
whole world for save/reload; restart/new mission creates a fresh world. The existing
checkpoint preserves castingTribes flags without a new save schema. Preserve
other flag bits. This describes current browser behavior, not newly executed proof.

Sound cues0x6e/0x6f use the original audio producer, whose retained export includes
conditional audio allocation and RNG. The bit-writing command itself touches only
that flag. Do not describe the complete original callback as unconditionally RNG
neutral merely because the bit writer is.

## Implemented / missing mapping at assessed head

| Contract | State |
| --- | --- |
| Persistent Total and five class controls, correct order/art, visible-disabled zero classes | Shipped; `hud-population.ts`, `page.tsx:1010–1039`; merged #167/#175 |
| Selected / Idle / Housed / Busy, 24 controls, native classification/counts/modifiers/focus | Shipped through `page.tsx` → `FollowerTasks` → `chooseFollowers` → task runtime; merged #182 |
| Boat/Balloon final12 controls and passenger panel | Shipped; merged #185/#187; do not duplicate |
| Native nearby task/transport counts and alternate task fonts | Present in `hud-tasks.ts`, `hud-transports.ts`, `follower-tasks-view.tsx` |
| Nearby selection/focus consumers | Present in `selection-runtime.ts:152`, `scene-input-runtime.ts:572–659`, task/transport runtimes |
| Ordinary mode activation and original mode feedback | Missing; HFX875 currently invokes overview (`page.tsx:967–973`), no production bit0x80 input writer, three additional icons absent |
| Persistent-strip nearby numbers/font | Missing; `page.tsx:1021–1035` always supplies global population/class counts and no alternate font |
| Full original-panel equivalence | Unclaimed; existing #60 acceptance remains open, including known original portrait binding/outer event boundaries |

Nearby browser checks explicitly inject the flag, e.g.
`scripts/check-browser-follower-tasks.mjs:223–232` and
`scripts/check-browser-follower-transports.mjs:637–641`. They establish consumer
behavior, not ordinary UI reachability. Current open PRs contain no competing
Followers-nearby implementation. Existing #60 is the correct delivery owner.

The highest-impact finite slice is ordinary nearby/global follower control,
including its persistent count feedback. Its scope is the proved control producer,
mode artwork/audio, and persistent count wiring; existing task/transport selection
engines remain the consumers. No general HUD rewrite or new class-unlock logic is
justified. Planet overview remains reachable by its existing Enter binding; any
other alternate affordance is a product compatibility choice, not native evidence.

## Ordinary Mission1 episode

1. Start authored Mission1, wait for normal input readiness, open Followers and
   note the global Total/Brave and task counts. Use live authored people only.
2. Activate nearby with the proved control. Pan the real camera away from home
   far enough that some or all home Braves lie outside the native radius. Observe
   lower task counts and persistent counts change together; class enablement still
   follows global class existence and nearby digits use their alternate font.
3. With existing selections cleared by ordinary controls, use Idle-Brave single,
   Shift and right-focus. Only eligible nearby Braves can be newly selected/focused;
   a view with no eligible Braves supplies an unambiguous empty-subset case.
4. Return to global and repeat at the same camera location: global counts recover
   and distant eligible Braves can be reached. This distinguishes mode behavior
   without spawning people, writing mode flags or relocating units artificially.
5. Return home and give normal building work/occupancy orders to witness categories
   refresh, then save/reload with mode selected and reopen Followers. Confirm the
   browser's intended checkpoint/new-mission lifecycle separately from unproved
   original user-save equivalence. Reuse established DPR/responsive checks.

The raw-camera vs camera-cell-center boundary and reserved/Shaman asymmetries stay
with existing source-backed fixtures; do not turn the ordinary episode into a
synthetic exact-radius setup. No new runtime result or timing forecast is claimed.

## Remaining boundaries and exact next work

The binding prerequisite is now resolved. No further broad native inventory is
needed before a bounded implementation proposal. Full original save/default-policy
equivalence, physical keyboard0x97 binding, outer game-event scheduling, exact
localized tooltip758, source RGBA import and executed/rendered acceptance remain
distinct claims. The first three should not be silently invented from this packet.

The implementation prerequisites are finite:

| Prerequisite | Proved owner | Remaining implementation or limit |
| --- | --- | --- |
| Command dispatch | Native `00479cf0` pending slot → `0043e8e0` command0x5f; browser `scene-input-runtime.ts::chooseFollowers` and `game-store.ts::change` use existing immediate world actions | No generic queued UI tribe-command dispatcher or command0x5f case was found in the current port. `world.ai.pendingCommands` belongs to AI, not this control. Preserve the port's current command contract for the bounded UI slice; exact native pending-slot scheduling is not a prerequisite to invent a new queue. |
| Press/release guards | Static constructor, `0044b130`, type3 dispatch, `0044bf50`, `0044c4a0`; the browser's existing scene input gates are visible in `chooseFollowers` | Wire one ordinary activation, maintain cancellation and disabled/modal/current-world ownership under the existing port contract, and verify repeated/held input. Full original outer scheduling remains explicitly unproved. |
| Three additional original frames | HFX876,877,878 bound by renderer arithmetic; bank/palette hashes already in `original-hud.json` | Narrow source-RGBA import and generated ownership preservation required. No atlas regeneration in this pass. Locate the already-approved HFX/palette inputs; the supplied EXE-only directory does not itself establish their local availability. |
| Persistent counts/font | Original `004a0510`/`004a0800`, both matrices/fonts in retained native population probe; existing `followerNumber` supports alternate font | Wire nearby count values to persistent class/Total controls while retaining global existence/enablement and global housing capacity meter. The task table already has its own wired nearby consumers. |
| Modern checkpoint behavior | Whole-world clone save/load in `game-store.ts`, `castingTribes.flags` in world, fresh `createTribeCasting(false)` | Exercise actual save/reload, fresh page, restart and mission change under the port's existing contract. No save schema or original full save-codec recovery is required for this slice. |

Ordinary acceptance should establish the restored mode/count behavior and the
port's existing command/checkpoint semantics. It must not claim exact original
queue timing, original save-file compatibility or physical list-allocation parity.

New static discovery also found `0044b890` is tab/group-list management, not this
control's input dispatcher. Its exploratory listing is retained with that correction.
The exact dispatcher is `0044b130`, identified from constructor-owned callback
loads, and its type3 press/release targets are bound by raw jump-table bytes.
