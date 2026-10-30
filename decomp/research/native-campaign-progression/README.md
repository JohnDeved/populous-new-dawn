# Native campaign progression contract

This is a bounded, **unwired prerequisite**, not a delivered campaign selector or
profile migration. `app/native-campaign-progression.ts` models the native selector
entry boundary. Its tests use manually traced assembly oracles. **The native
routine was not executed**, and these tests are not native differential evidence.

## Input identity and reproducibility

Original `d3dpoptb.exe` SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The file was independently rehashed before these listings were captured.
[provenance.json](provenance.json) records the GNU objdump version, every bounded
command, and each listing's SHA-256. No Ghidra project, installer, native program,
or asset importer was run. The displayed input filename and trailing line whitespace
are normalized; instruction bytes and addresses are unchanged.
The test verifies the retained listing hashes, not a native execution result.

## State, completion, and selection are different

- Mission IDs are one-based, 1 through 25. Each mission record is 164 bytes.
  Its flag byte is at `0089a365 + 0xa4 * mission`, equivalently
  `0089a409 + 0xa4 * (mission - 1)`.
- Mask `0x01` means completed. Mask `0x04` means available. Selection eligibility
  is `(flags & 0x05) != 0`, so completed-only worlds remain replayable even when
  the available bit is clear. Other bits must survive.
- [selectability.asm](selectability.asm), `0047ed20`, tests the low byte's mask 5.
  `0047ed40` calls `00485e40(mission - 1)`; the latter returns 3 for completed,
  otherwise 0. That return value is **not a stored progress state**.
- `00412960` never writes completion. One earlier producer at `0041903e` marks
  runtime flags and calls `004860c0(current mission - 1)` at `0041904e`. The latter
  copies those flags into the mission record. See
  [victory-premark.asm](victory-premark.asm) and
  [completion-snapshot.asm](completion-snapshot.asm). This is not a claim that
  this is the only completion producer, nor that every game result is eligible.
- The progression routine reads the victory bit at `0089c664 & 2`. For victory,
  it obtains the mission from the currently selected body, not a mission argument:
  body base `005f13bc`, selected index `005f13b0`, stride `0x34`, mission offset
  `0x28`. Its integer argument only controls the non-victory intro movie.
- It writes recommendation anchor `005f13ac`, **not current selection** `005f13b0`.
  Selector setup later copies the anchor to selection (`00412206`–`0041220d` in
  [selector-anchor.asm](selector-anchor.asm)). The model returns a recommendation
  write, not an instruction to immediately launch or select a mission.

## Initial profile

[new-profile-clear.asm](new-profile-clear.asm), `00426b60`, clears `0x1398` bytes
of profile memory. [first-unlock.asm](first-unlock.asm), `004c34b7`, ORs mask 4
into Mission 1. New-game selector setup chooses Mission 1. The bounded initial
model is therefore no completed missions, only Mission 1 available, and anchor 1.
`createNativeCampaignFlags()` creates the flags; a normal return entry recommends 1.

## Progression branches

See [progression.asm](progression.asm) and the data bytes in
[dispatch.txt](dispatch.txt). `C(m)` below means that mission's completion bit.
Every ordinary branch finishes with the common tail; all availability writes OR
mask 4 and never clear any existing flag.

1. **Victory in Missions 1–15** (`004129f7`): search from the current mission + 1
   through 16 for the first incomplete mission. Recommend and mark it available.
   If it is 16, additionally mark **all of 16, 17, 18, 19** available at
   `00412a73`–`00412a88`. If no incomplete mission was found through 16, redispatch
   into the 16–19 branch; do not invent a global current + 1 unlock.
2. **Victory in 16–19** (`00412aae`): scan from 16 regardless of the selected
   mission. Mark each visited mission available **before** testing completion,
   stopping and recommending the first incomplete one. Later unvisited worlds
   are not marked by this scan. If all four are complete, enter the 20–21 branch.
3. **20–21 branch** (`00412b36`): find the first incomplete of 20 and 21. Mission 20
   requires `C(16) && C(17)`; Mission 21 requires `C(18) && C(19)`. A missing
   prerequisite returns to the 16–19 scan. A qualifying candidate is recommended;
   its available bit is supplied by the common tail, not this branch. When both
   20 and 21 are complete, enter the next branch starting at 22.
4. **22–24 branch** (`00412bfd`): scan from the branch's current mission, inclusive,
   through 25. Recommend and make available the first incomplete, or 25 if all
   are complete. Normal premarked victories yield 22 → 23 → 24 → 25. An inconsistent
   snapshot with uncompleted 22 can recommend 22 again; the selector does not
   manufacture the missing completion bit.
5. **Initial victory in 24** (`004129b4`): request `FMV\\outro.tgq` before ordinary
   dispatch. Merely reaching 24 through another branch does not request this movie.
6. **Initial victory in 25** (`004129d1`): clear `005fc9f4`, OR `0089c665` with
   `0x80000`, request state 12, and return early. It writes no recommendation and
   no campaign flags, and skips the common pair-unlock tail. State 12 is terminal
   relative to this selector routine; this research does not label it "credits".
7. **Non-victory entry** (`00412ce0`): when the integer argument is zero, request
   `FMV\\pop3mask.tgq` first. Scan from 1 through 25 for the first incomplete,
   or choose 25 if all complete. Recommend and mark only that mission available,
   then execute the common tail. This path does not reconstruct fork history.
8. **Common tail** (`00412da8`): independently mark 20 available if `C(16) && C(17)`
   and 21 available if `C(18) && C(19)`. Clear `005fc9f4` and request state 10,
   the selector destination.

[movie-paths.txt](movie-paths.txt) retains the original path strings used above.

## Pure TypeScript boundary and defensive policy

`transitionNativeCampaign(flags, entry)` accepts exactly 25 flag bytes after the
caller's completion snapshot. The input array is never changed. It returns a new
array, recommendation write, result state 10 or 12, and optional movie request.
`recommendation: null` means **no write; retain the existing anchor**, not clear it.
Movies are descriptions only; no file is read or played. Repeated entries are
flag-state fixed points; dispatching movie effects and deduplicating result events
remain the future caller's responsibility.

The model does not reproduce body-table lookup, corrupt body fallback, runtime
global writes, gameplay victory conditions, or profile serialization. It does not
determine whether the player legitimately reached the supplied selected mission.
For example, a valid but currently unavailable Mission 22 input follows the native
branch without being awarded completion. This must never be mistaken for browser
launch or result authorization.

Runtime rejection of noninteger/out-of-range mission IDs, malformed byte arrays,
unknown entry kinds, and nonboolean intro requests is a deliberate TypeScript
safety boundary, **not a claimed native validation feature**. Native selected-body
access is unchecked; an out-of-range mission dispatch falls through with the old
anchor. The browser model does not emulate unsafe/corrupt native memory inputs.

External caller gates are separate. For example, [caller-gates.asm](caller-gates.asm),
`004585e5`–`0045862a`, diverts `0089c661 & 8` to another routine and `0089d17c & 1`
to state 7 before otherwise calling `00412960(1)`. Exact semantic names for all
those mode bits and every alternative caller are outside this bounded contract.

## Static oracle coverage

`tests/native-campaign-progression.test.mjs` checks explicit hand-traced outcomes,
not expectations calculated by another copy of the implementation:

- Fresh profile and every possible flag byte's three distinct status queries.
- Ordinary opening wins, skipped completed worlds, replay, and opening fallthrough.
- All 16 completion combinations in the 16–19 fork, for each selected fork world.
- Both legal fork orders, including completing 20 before 18/19 and 21 before 16/17.
- Independent pair unlocks, missing prerequisites, and 20+21 → 22 → 23 → 24 → 25.
- Recommendation/availability separation: winning 17 unlocks 20 but recommends 18.
- Repeated entries, unrelated-bit preservation, frozen inputs, malformed data,
  unavailable selected inputs, unpremarked completion diagnostics, movie requests,
  and terminal 25 versus non-victory all-complete fallback.

## Why this must remain unwired

At base `be44bc76f21429c472978c3dcb8893e565b6a4fb`:

- `app/game-store.ts` persists only a union of completed mission IDs. Its current
  profile does not contain native availability history.
- `app/world-selector-data.ts` has a three-world opening approximation;
  `app/world-selector.tsx` also offers a separate invented "All missions" route.
- `app/page.tsx` offers and launches `world.outcome.level + 1` after victory.

The model changes none of those paths, profile versions, supported mission lists,
or save/checkpoint behavior. Its 25-mission domain does **not** expose unsupported
browser Missions 24 or 25. No live/UI/playability/parity credit is claimed.

Concrete migration ambiguity: with completed missions 1–15 but no availability
history, non-victory native entry makes only 16 available. Natural victory in 15
makes 16–19 available. A completed-only profile cannot distinguish those histories.
Do not claim it has losslessly recovered native availability. A separately reviewed
profile policy, launch eligibility/cheat boundary, supported-mission filter, public
test entry design, integrated continuation, and rendered acceptance are required
before replacing the live selector or result action. Independent review and the
normal full check/build gate remain required for this prerequisite as well.
