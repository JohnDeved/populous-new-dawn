# Worship progress/list panels: the automatic activity producer

Research-only continuation of #72, inspected main `5a0c8152e421b5082b97c0e235fb878f76fd0726`.
No application, CSS, panel implementation, world-turn, asset, importer or provenance
file changed. This note does not infer worship behavior from Hut menus.

## Finding and separation from PR116

**The first missing browser producer is automatic worship-activity activation and
retention, not the panel painter or the hover-transit delay.** Original worship
sampling calls `00509290`, which can create the contextual panel without a
right-click and marks it for activity-based retention. Current `ObjectPanels`
opens only through inspection/focus paths and has no corresponding activity owner.

Worker7's [draft PR116](https://github.com/JohnDeved/populous-new-dawn/pull/116),
inspected at `be0d7b7922ba009d325dd9fb1ea712d58d42d6f2`, reserves Shrine-only pointer
ownership, edge clamping, mode-3 placeholder wiring and an authored checker. Its
retained research already distinguishes exact-slot rosters from reward counts and
separates finite-head/Vault disappearance from panel hiding. Those findings are
reused, not reimplemented here. No change to that PR, its hover timing, its checker,
or its three owned paths is part of this evidence task.

The distinct additional chain is:

```text
004fb270 worship sampling
  -> 00509290 activity request
     -> 005092e0 local-player activity predicate
     -> 00504060 find/create contextual record + class-10/model-3 UI object
     -> record+2 = automatic hold; inspected-object flags3 |= 0x00800000
00504920 presentation update
  -> for automatic records in phase 1, recheck 005092e0
  -> retain while active; clear activity flag and begin expiry when inactive
```

This is **not** evidence that plain mouse hover should create a panel. Automatic
prayer activation and explicit inspection are separate original entry paths.

## Identity, proof level and retained checks

Canonical D3D executable SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The retained Ghidra 12.1.3 exports were checked against `decomp/exports.json`.
Pseudocode names/types are inferred, not recovered source.

A bounded, read-only Capstone 5.0.7 decode checked five already-identified routine
windows, plus the instruction-boundary tail of the same `005092e0` window. No
original instruction was executed, no Ghidra session was acquired, no broad
binary scan ran, and no sprites were decoded or regenerated. Decisive original
instruction sites are retained here so the key result does not depend solely on
decompiler variable names:

| Native address | Observed instruction / significance |
| --- | --- |
| `004fb58a` | `call 00509290`: timed-head activity request, after the count scan. |
| `004fb8e4` | `call 00509290`: type-4 Vault request, before that visit rewrites the player's count. |
| `00509299` | Calls `005092e0`; `005092a1` tests **AL** for activity. |
| `005092a5` | Tests object byte `+0x16 & 0x80`, the already-active flag at flags3 bit 23. |
| `005092b1` | Calls `00504060` with the object and an output record index. |
| `005092cc` | ORs object dword `+0x14` with `0x00800000`. |
| `005092d3` | Writes 1 to `00895fbb + index*0x9e`, i.e. contextual record `+2`. |
| `005093a5`, `0050941f` | Vault/scenery predicates read the **low byte** of trigger `+0x86 + 2*playerTribe`; this is not a list-length query. |
| `005049a5` | Calls the same activity predicate during phase-1 automatic retention. |
| `005049b1`, `005049b5` | On inactive result, zero remaining duration and clear object flags3 bit 23. |

Local reproducibility receipts are under
`work/orchestration/worker2-72-evidence/`: `input-fingerprints.json`,
`static-windows.json`, `static-count-tail.json` and the final check receipts.
These are local evidence, not files assumed to be available to a GitHub reader.

The existing [worship-panel comparator](../../scripts/check-native-worship-panel.py)
and `tests/fixtures/worship-panel.json` retain 260 draw cases, the 50-slot geometry,
64 head-input cases, and the documented 1,739,264-pixel source-art comparison.
They are **reused, not rerun**. In particular,
[the admission comparator](../../scripts/check-native-worship-admission.py) and
[Vault comparator](../../scripts/check-native-vault.py) explicitly intercept
`00509290`; their successful count/work checks do not prove automatic panel
creation. The person-panel lifetime comparator initializes record `+2` to zero
and explicitly excludes automatic activity retention. This explains the coverage
gap without invalidating the existing painter, input or work results.

## Native request, creation and control records

[004fb270](../generated/004fb270.c), enabled trigger modes **0, 3 and 5**, samples on
`object.counter & 3 == 0`. In the **nonzero-target** branch it resolves/caches the
visible worship body at trigger `+0x92`, falling back to a valid same-coarse-cell
head object. After counting it requests `00509290(body)` when that body exists.
The zero-target area-trigger branch does not make this request. Do not generalize
the automatic path to every trigger mode or every object named a Totem.

Type **4** separately finds the player's Shaman in state 10 with current command
33, resolves the associated building, and calls `00509290(building)` **before**
rewriting the player's eligibility count and adjusting work. A browser adapter
must not silently move that request after the count update and claim exact Vault
sample ordering. Unforced work completion is also not the Vault task's terminal
completion signal.

[005092e0](../generated/005092e0.c) resolves the first class-6/model-6 trigger in the
inspected body's coarse-cell chain for class-5 scenery or class-2/model-18 Vaults.
It returns the low byte of the local player's cached count at `+0x86 + 2*tribe`.
The class-6 branch reads that field directly. Other building/person cases are not
used here to infer worship semantics. A positive global/winning count or a nearby
person is not a substitute for this player-specific predicate.

[00504060](../generated/00504060.c) reuses a record for the same object, or finds
an unused entry in the **32-record**, `0x9e`-byte table beginning `00895fb9`.
Creation is gated by `00451370(2)==0`, level-flags bit `0x20` clear, and successful
class-10/model-3 allocation. `00451370` reads a configuration word's `0x100` bit;
this trace does not guess a user-facing name for that configuration. Allocation
failure means no request success and no activity flag latch.

| Record field | Role established by retained creation/update code |
| --- | --- |
| `+0`, `+1` | Active flag and presentation phase; new phase is -1. |
| `+2` | Automatic activity-retention flag, set by `00509290`. |
| `+6`, `+8` | Remaining stage duration; native height offset. |
| `+0x0a`, `+0x0c` | Allocated UI object's ID; inspected world object's ID. |
| `+0x12`, `+0x14` | Measured panel width/height. |
| `+0x18`, `+0x1c`, `+0x20` | Entry, hold and exit durations. |

The allocated UI object stores its **panel kind at `+0x70`**. Explicit branches
choose kind **3** for class-5/model-9 worship scenery and kind **13** for
class-2/model-18 Vaults. These panel kinds are not world geometry model IDs.
Default durations are 3/20/3; the class-2 creation branch uses a 16-visit hold,
therefore do not describe Vaults as universally sharing the scenery's 20 visits.
This is a source distinction, **not a reservation to alter PR116 timing**.

The same-class replacement rule explicitly excludes model-9 scenery; opening a
person panel need not destroy the existing worship panel. Automatic creation
starts the normal entry phase; it is not the immediate phase-1 focus path used by
[00504590](../generated/00504590.c).

## Progress and praying-list producers are different

The kind-3/kind-13 branch of [00504bc0](../generated/00504bc0.c) locates the colocated
class-6/model-6 trigger and reads these fields:

| Trigger offset | Read by the panel |
| --- | --- |
| `+0x68` | Trigger mode, including Shaman-only placeholder cases. |
| `+0x6d & 1` | Enabled versus recharge state. |
| `+0x6d & 0x10` | Additional first-row Shaman-placeholder discriminator. |
| `+0x86 + 2*playerTribe` | Signed-short count controlling how many positions attempt person lookup. |
| `+0x8e` | Required count, controlling geometry and enabled progress denominator. |
| `+0x90`, `+0x94` | Recharge countdown and recharge maximum/growth. |
| `+0x96`, `+0x9a` | Work and target, 32-bit fields. |

Enabled maximum is `target * required * required`; value is `work`.
Disabled/recharging maximum is `growth`; value is `growth - cooldown` **only when
cooldown is nonzero**, otherwise zero. A zero maximum omits the bar. The bar is a
six-pixel framed vertical column; value is lower-clamped before the integer fill
calculation. This is not an elapsed-seconds bar or a person-count fraction.
Vault's normal required count is one, while its work owner advances toward target.

[00429ad0](../generated/00429ad0.c) builds **50** standing offsets.
[0043c600](../generated/0043c600.c) rotates them by the body's quadrant around its
coarse-cell center, walks the cell chain, and returns the first same-tribe
class-1 person at the exact position with zero signed-short speed. It does not
require an assigned worship task. That iterator supplies the panel identities;
the four per-tribe reward counts are produced by a different `004fb270` area scan.
An off-slot worshipper can contribute progress while an idle exact-slot person
supplies a displayed icon. Do not repair this distinction with proximity lists or
`u.work === head.id` filters.

Rows use HFX75's 16x23 glyph metrics: 28 pixels per row and 17 per column. Positive
required counts below eight use one row; counts at least eight round up to two
rows of `ceil(required/2)` columns. The frame adds four horizontal pixels, the
optional progress column adds six, and total width rounds up to eight pixels.
An odd two-row required count therefore has a padded drawable slot. The native
loops are bounded by that geometry and the cached count; do not assume that the
browser's `min(required, followers)` cap proves every over-capacity/odd-row case.
The retained draw fixtures cover counts 0, 1 and required, not all surplus counts.

Actual people use HFX `73 + native person model`; selected people add HFX53 from
the person's `+0x7a & 0x80`. A lookup failure **within** the counted positions
uses faded HFX75. Unused enabled first-row slots use HFX80 for flag/mode Shaman
cases (mode 3, 4 or 5, or `+0x6d & 0x10`), otherwise HFX75; the separate second-row
placeholder branch uses Brave artwork. Unused recharging slots draw the paired
silhouettes. HFX52 is the 16x34 pointing tail. The native measured height omits the
second row; the existing browser painter allocates its actual 90-pixel extent
instead of clipping it to the reported 62 pixels. No replacement artwork is needed.

## Hover, selection, anchoring and disappearance

The interactive draw pass publishes a hit record only for a real resolved person:
`00895fb0` hit flag, `00895fb3` inspected-object ID, and `00895fb5` roster cursor.
The first row checks player ownership; head iteration itself selects the player's
people. Glyph hover adds its own background/pressed tint. Empty silhouettes do
not provide an invented selectable person. This hit production is separate from
whether panel background artwork receives browser pointer events.

[0047b460](../generated/0047b460.c) and the retained 64 input cases establish for
ordinary head lists: left input `0xf0` emits command **42** with flags **6** and
person ID; Shift emits command **113** with selection direction and head ID.
The direction follows the clicked person's selection bit, preserving unrelated
selection. Right input `0xf1` plays cue **106**, focuses the person's native
position and opens that person's inspection panel. Modal/occupied command-buffer
conditions retain the command buffer. Vault drawing uses the player Shaman's
state-10/command-33 lookup; the ordinary head input proof does **not** establish
safe Vault slot input. Keep the existing informational Vault slot boundary.

The explicit inspection route is input action `0x72` in `004aab80` -> `0047ae00`
-> [0047b1d0](../generated/0047b1d0.c) -> `00504060`. The retained person-panel
comparator checks the right-button binding. Model-9 scenery requires a colocated
trigger and target at least one on this route. Current inspection accepts all
Shrine records; that is not proof of original zero-target inspectability.

[00509000](../generated/00509000.c) sets static scenery height from the actual
object-record signed height word divided by two (model45: 656 native units;
mode3 object8: 534). [005090f0](../generated/005090f0.c) attaches the UI object to
the inspected object position plus that offset. Vaults are buildings: their anchor
uses **their own building descriptor's `+0x33` attachment socket**, with original
building-coordinate/terrain fallback, not the scenery model-height path and not
a guessed Hut-capacity socket. Current `ObjectPanels` uses model panelHeight for
all Shrine records, so complete Vault building-anchor parity remains separate.

[00504920](../generated/00504920.c) rechecks activity only for automatic records in
phase 1. Nonzero activity refreshes the configured hold; zero clears the object's
latched activity bit and remaining hold, allowing the existing exit stage. This
is different from waiting for a browser hover timeout. [00504660](../generated/00504660.c)
removes invalid-object records and model-9 scenery in state 12. A disabled or
completed worship trigger is not by itself a general 'hide the panel' flag.
Final head deletion and Vault sinking/removal remain authoritative world-lifecycle
owners. Full original fog, occlusion and offscreen raster eligibility are not
newly established by this trace.

## Family coverage and current browser comparison

| Family | Original producer/panel | Current main and boundary |
| --- | --- | --- |
| Ordinary timed Stone Head | Coupled class6/model6 trigger and class5/model9 body; nonzero-target mode0 invokes automatic request after sampling; kind3. | Painter, exact-slot roster, manual open/select/focus and sampled work exist. Automatic request/retention is absent. |
| Timed Totem | Same trigger/body/panel kind3; presentation model149 does not create a new UI kind. Requires the authored timed-mode/nonzero-target conditions. | Same generic Shrine panel owner. Do not generalize to zero-target, counter or other trigger modes. Model149/cadence remains #21. |
| Mode-3 Obelisk | Same kind3; mode3 counts/admission Shaman only and object8 is presentation identity. | Mode/admission exist. Main's placeholder input is Vault-only; PR116 owns adding mode3. Automatic producer remains distinct. |
| Vault of Knowledge | Type4 trigger and class2/model18 building; kind13, command33 lookup; automatic call has the pre-count ordering above. | Work/status and informational glyph exist. Auto creation, native building anchor, exact eligibility/count ordering and terminal lifecycle are not established by manual panel evidence. |

Current [ObjectPanels](../../app/object-panels.ts) allocates one `.person-panel`
per accepted ID, creates `head.required` potential buttons, feeds `work/target/
growth/cooldown` to [worshipPanel](../../app/worship-panel.ts), and displays
`min(required, followers)` identities. [liveWorshippers/selectWorshippers](../../app/live-worship.ts)
reuse exact standing cells; group selection deliberately visits all 50 positions.
The painter is not missing. The Followers tab's class-selection/count controls
are a different surface; reuse [its research](followers-tab.md), not its roster
as the worship-list producer.

Every current `ObjectPanels.open` caller is an inspection/focus path. `update()`
returns early when no panels exist, and its retention reason is inspected object,
DOM hover or focus; it has neither an automatic-record flag nor a call from
worship sampling. `world-turn.ts:839-895` updates the fields but emits no equivalent
of `00509290`. That is the first missing edge.

There is also a data boundary: native activation/drawing select **playerTribe**
from four cached counts. Browser `Shrine.followers` usually holds that player's
count, but mana/rewardMana branches store a selected reward recipient's count.
Blindly using `followers > 0` for all Shrine kinds would misreport hostile-only
activity. Vault eligibility also retains a documented proximity/occupancy adapter.
Neither issue should be hidden inside a UI Boolean.

## Minimum future reservation, without overlapping Worker7

After CEO coordinates/integrates PR116, reserve a **new, separate** Shrine activity
producer block in `app/object-panels.ts` (or a small dedicated read-only panel-state
helper consumed there), plus focused tests and an authored browser checker. Begin
with positive-target, player-count-backed ordinary mode0 heads only. Use the
existing painter, identifiers and panel lifetime; distinguish automatic retention
from manual inspection and preserve the configured duration values. Cover automatic
creation with no pointer inspection, retained progress/list as the pointer leaves,
activity stopping/restarting, and absence of duplicate panels. The input must come
from the actual completed worship sampling, not render-loop time or a guessed
nearby-person count.

Do not reserve page/CSS, hover-transit timing, assets, imports, mode migration,
world rewards or finite-object removal for that minimal slice. It must not bypass
PR116 or alter its timing assertions. If exact producer-phase handoff cannot be
represented by current presentation inputs, return to CEO for a narrowly scoped
activity notification at the sampling boundary rather than editing world-turn
under this research reservation.

Before broadening to all families, separately prove/preserve per-player sampled
counts (not reward-winner count), Vault pre-count call/eligibility and building
anchor, zero-target/manual-opening policy, and surplus odd-row cases. Vault slot
input and finite-head/Vault removal require their own existing runtime owners.
No proposed reservation here authorizes those changes.

## Limits and stopping result

The missing automatic producer is source-identified and corroborated by exact
original instructions. This is useful distinct research beyond the retained
hover-gap note, not a completed UI repair. No fresh native invocation, authored
browser acceptance, fullcheck/build, asset import or parity recording ran. Existing
comparison counts are historical evidence with their interceptions stated above.
The next implementation must add the absent activity-to-panel edge and prove it
through normal gameplay while respecting the explicit family/data boundaries.
