# Mission3 pre-table defense response

## Scope and provenance

This continues [issue165](https://github.com/JohnDeved/populous-new-dawn/issues/165)
from accepted draft174, `3dd1a1e0285dc97389816303b0e3e1bc2c72639b`.
It extends the [Missions1/2 response scanner](early-mission-response-task.md)
with the complete reachable Mission3 type8 consumer. Other native producer bodies,
whole original AI allocation timing and complete Mission1–3 parity remain separate.

Original executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Original CPSCR012 SHA256:
`d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`.

Eight new exports were produced from a fresh original-byte Ghidra12.1.3 project
with official Temurin21.0.12.1, without community metadata: `004c5f70`, `004f2440`,
`0041b180`, `004f5950`, `004f2460`, `0043b540`, `004f39f0`, and `004f2520`.
The wrapper verified file-backed section hashes, all requested outputs and project
save. Their content hashes are registered in `decomp/exports.json`; the registry's
historical metadata description is not provenance for this fresh-project batch.

No Windows process or whole executable is launched. Native proofs execute isolated
original instructions with explicit world inputs. Animation presentation is a
supplied leaf in selected-person lifecycle cases. Synthetic land/list inputs are
not proof of original world-list creation order, full native gameplay, or raster output.

## Complete authored bounds

CPSCR012 contains exactly one reference and SET for each of attribute15=1,
attribute31=0 and attribute46=1. Its single state8 command enables the state.
There is no marker override1066/1067. These are complete-program invariants, not
an assumption that startup values never change.

Attribute31=0 excludes type9's idle type11/type15 branch. Attribute46=1 excludes
the area summary's optional automatic-Preacher-training side effect. State8 and
attribute15 permit one active defense. The level has no Spy people or Spy Hut,
no Spy Hut permission, and no Spy Hut acquisition reward. The actual Vault reward
is Temple. The live integration stays guarded to Missions1–3; it does not silently
enable generic later missions or pretend to implement their Spy/idle branches.

## Native allocation and controller observations

`004c5cf0` phase3 obtains a free slot, checks state8/count, writes the candidate
entity/cell into a type8 record and calls `004f4030(ai,task,cell,4,1)`. A zero total
frees that new task immediately. The existing `summarizeSpellEnemies` port supplies
this assessment, including own Preacher/Firewarrior availability adjustments.

The type8 dispatcher is `004623e0` → `004c5f70`:

- Before phase3, missing/dead target forces phase7. A cancellation bit with a
  still-valid target is ignored there. From phase3 onward cancellation forces7,
  while the initial target's death alone no longer terminates the area response.
  `00461f90` also sets the early-phase cancellation bit before a different task's
  dispatch; this cannot be postponed until the defense receives its own visit.
- Phase0 copies the target cell into the response center, enables one fighting
  recenter and fallback, then enters phase2 in the same call. Allocation itself
  preserves recycled scratch. Phase2 acquires normal selection ownership,
  resets selected count, evaluates the original conditional Blast, clears the
  selection cursor and enters3. Do not introduce a command-delay countdown.
- Phase3 scans Brave, Warrior, Firewarrior, Preacher requirements in order,
  selecting one nonzero category per visit through `004f8490` flags0x47 and a
  maximum100. It enters state14 unless blocked by flags2 bit0x100000, and sets
  person+0xaf to slot+1. The original **adds** selected Firewarriors to their
  remaining requirement; preserve that instruction rather than correcting it.
  Unfilled requirements may retry as Firewarriors/Warriors. No force exits through7.
- A nonempty force enters4 and sets commandDelay20. Phase4 advances directly to5.
  Phase5 runs real standability; a successful search emits movement3 to selected
  Preachers and restores that model first. The adjusted standability scratch cell
  is not used as the command destination. Then it emits area order19 payload0x0808,
  releases selection, commits to remaining selected people, restores them and
  enters6. Preachers are not given an invented immediate preaching order.
- Phase6 collects targets around the current center, preserves person ownership
  and counts active assigned members. The first assigned fighting person recenters
  once and retargets assigned people. Native state33/substate3, or substate2 with
  animationMode>4, releases that member's assignment/orders/motion through the
  normal state gate. Idle members prefer a collected person, otherwise the first
  building's native inside point. Retarget `0043b540` allocates order19 with0x0404
  before replacing old orders; exhaustion leaves those orders intact.
- With no targets, still-assigned people get allocation-safe return3 to the
  original construction base or Shaman cell, with uncentered even coordinates.
  No members, cancellation, or completed return transitions to7. Phase7 clears
  matching task assignments/flag effects, invokes normal selection/person cleanup
  and frees the slot. It cannot clear another task's selection lock.

`004f2440`/`004f2520` clear person+0x7f bit0; clearing ownership also clears flags3
bit0x2000. The browser already retains +0x7f as `Unit.nativeFlags7f` and +0xaf as
`LivePerson.computerAssignment`; no alternate ownership table is introduced.

## Target collection and duplicate suppression

`004f5950` visits the center first, then **223** spiral positions for radius7.
The final position223 is excluded. Person/building caps are independent10-entry
lists and retain traversal order. People reject wild/Angel, state23, flags2
0x10000, flags4 0x1000, allied ownership and completed matching disguise. Buildings
use alliance/class checks; do not incorrectly reuse all person filters.

`004f3f20` suppresses a new type9 candidate at squared wrapped cell-distance
**less than26** from an active type8 center. Distance25 rejects,26 accepts. This
is separate from the scanner's territory filter and from the summary square.

## Runtime and checkpoint integration

`app/computer-defense.ts` owns allocation, bounded controller phases, duplicate
distance and ordered target collection. `app/computer-runtime.ts` binds current
world people, actual native person ownership, existing area-summary/selection
helpers, genuine group orders, spell allocation, movement, fighting retarget and
cleanup. Existing native cell chains are retained; remaining browser-only objects
use their world-list order. Exact original whole-world list composition remains
an adapter boundary, as in the preceding scanner work.

Response center/recenter/cursor/fallback and existing task quotas/selected count
are checkpoint state. Older Mission3 saves contain no type8 tasks. No startup or
authored acquisition is replayed; new task scratch initializes only at its normal
native phase, preserving a recycled defense center until then. This is behavioral
state, not a claim of bitwise equivalence for every unrelated task's scratch overlay.

The initial natural regression failed on exact draft174 at turn62 because its
first producer opportunity allocated construction without type9. It now allocates
the real pre-table task and leaves the ordinary producer opportunity intact.

Two ordinary gameplay routes complement controlled native cases:

1. Move the actual Blue Shaman toward the Chumara Tower. Detection creates a real
   type8 with no eligible force, executes its native fallback visits, cleans up,
   and repeats at later producer opportunities. In-flight checkpoint continuation
   preserves the whole AI, order pool and RNG.
2. Complete original startup, claim the Temple Vault, return the Shaman home,
   construct a Temple, train a Blue Preacher and move it to the Chumara border.
   The genuinely trained Chumara Preacher is selected by type8, receives the
   original movement command and moves in the live world. State14-through-orders
   checkpoints preserve AI, people, order pool and RNG. No people, structures,
   territory, task outcomes or population are injected in these natural tests.

## Reproduction and acceptance boundaries

```
python scripts/check-native-mission3-defense-task.py /path/to/d3dpoptb.exe --compare
node --test tests/mission3-defense-task.test.mjs tests/ai-response-task.test.mjs
node scripts/check-browser-mission3-defense-task.mjs --game-root . --port 4194 \
  --browser /path/to/official/chrome-headless-shell --output work/orchestration/defense-render
```

The original probe preserves raw phases, flags, assignments, selected counts,
quotas, target scans, order records and RNG. Native state initialization and order
startup consume RNG even though the defense controller has no inline random draw.
Standability bitmap alone does not initialize the original route graph: both
native walkmaps, AI player type and search limits are required for a comparable
flat-world route. A failed route can enter33 and consume another RNG draw; that
input boundary must not be repaired by hardcoding the successful browser state.

The browser checker uses public Mission3 entry, then ordinary model commands and
diagnostic fixed turns/camera focus. It captures actual defender mesh pixels and
movement, with diagnostic checkpoint continuation. A `--scenario before` run
requires the verified candidate turn through `PND_DEFENSE_CAPTURE_TURN`, preserving
comparable camera/turn and an honest exact-base image. Software/headless WebGL
does not prove hardware FPS, realtime timing or original-game frame matching.

Standard check/build, affected native probes, rendered execution and fresh
independent review must pass on the final source before acceptance. The presence
of a checker or this note is not itself a passed gate. No parity credit,
deployment, new credentials, paid services or GitHub Actions are included.
