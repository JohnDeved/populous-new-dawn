# Class-10/model-1 formation retirement and list ordering

## Decision

The lifecycle prerequisite is source-bound and observed in the same eight-Brave/Temple fixture. The original retires formation 1831 at turn 26 and releases its slot at end 28; formation 1830 retires at 31 and releases at end 33. Newly dead groups remain linked in the tribe list until the end-turn rebuild, but recruitment explicitly skips class-zero records. They are removed from the primary allocation list immediately.

A browser repair needs distinct allocation order and current tribe recruitment/processing order. It must not reverse an array blindly each turn or sort by numeric ID. Native deferred storage need not be ported into the browser's current monotonically identified, unlimited allocator unless a live consumer depends on that storage/capacity/reuse behavior. This evidence does not promote native pool-cap/reuse parity.

## Exact native contract

- `004ed8a0` allocates the current selected free-pool head, preserves the record's fixed ID, clears/reinitializes its remaining bytes, and prepends it to primary `00890324` using `+0` (previous) and `+4` (next). See `004ed965..004edaad` in `ordering-static.txt` and existing `decomp/generated/004ed8a0.c`. The byte at `+0x2e` is the class counter, **not an allocation ordinal**; both new formation records have counter zero in this fixture.
- Class-10/model-1 initialization `00500a30` sets state 1, prepends `+8` into its tribe's formation list at tribe `+0x88d`, and makes its original RNG draw for timer `(draw & 31)+32`. The native object's model at `+0x2b` is 1; the recruiting person's model copied to `+0x2d` is 2 here. Existing browser `MarchingFormation.model` represents the latter.
- `004ec7c5..004ec7e6` processes tribes 0 through 3 and their current `+8` chain, caching next before the call and skipping class zero. This happens before person traversal. New person-created groups recruit in the same turn but cannot receive that turn's already-completed formation controller visit.
- `004ec898..004ec8c2` walks primary newest-first with next cached before the per-object call. Objects prepended by that call are not retroactively visited. A live state causes its counter increment before `004ed700`; retirement from the earlier formation phase removes the group from this traversal.
- `00501000` calls `004edcf0` when member pruning reaches zero (`005011ff`) or the singleton cleanup drops the last member (`005016c8`). Both branches occur in this fixture. The native symbolic name `update_after_unit_alloc` is misleading: this body retires the object.
- `004edcf0..004ede07` optionally removes cell linkage when flags2 has `0x20000`, writes class zero, sets flags2 bit 1, unlinks primary `+0/+4`, prepends deferred `00890328`, and writes counter 3. It **never updates `+8` or any tribe head**. Its sunlight branch is conditional on flags2 `0x04000000`. Both actual formation entries have flags2 zero, so neither optional branch executes; no omitted leaf was supplied.
- `00501ab0` traverses the current tribe `+8` chain and explicitly requires class nonzero before testing person-model, proximity, angle and free-slot eligibility. Dead-but-linked groups are observable in the chain but ineligible for recruitment.
- `004ec942` calls `004ecac0`, after primary and secondary object traversal. That routine clears tribe heads, then traverses primary through `+4`, admits active initialized class-10/model-1 objects, and prepends each to tribe `+8` (`004ed25e..004ed287`). Thus tribe order after rebuild is the reverse of the **current live primary allocation list**, i.e. oldest-to-newest surviving allocation in this uninterrupted run. New groups prepend to that tribe order during the following person phase. Stable allocation-order metadata is a browser representation of this relation, not a recovered native ordinal field.
- `004ec94c..004ec98d` then processes deferred records, caching next and decrementing the counter. At zero it clears flags2 bit 1 and calls `00401b40`. That function unlinks deferred and prepends the record to free-low if ID <640, else free-high. The caller decrements allocation counts only after this release. For a group retired before this tail at T: end T=2, T+1=1, T+2=0/free. The slot is unavailable to earlier person allocations in T+2; an eligible later allocation after release can consume it.

Numeric IDs are therefore not chronological: freed IDs are reused from a free-list head. Reuse is **source-derived, not exercised** in this 48-turn window. Other classes' allocation policies and full native save/load ordering remain outside scope. Existing `004ee300` reconstructs lists from physical pool records when explicitly called; do not use uninterrupted-runtime allocation chronology to claim a native save/load contract.

## Observed fixture

- Turn 25 allocates 1831 then 1830. Same-turn primary and tribe prefixes are `[1830,1831]`. After the original rebuild tribe order becomes `[1831,1830]`.
- Turn 26 header retires 1831 through return address `00501204`. Its primary predecessor 1830 now links directly to 1832. Tribe chain remains `1831(class0) → 1830(class10)` through the person phase; recruitment entries for people 1834–1839 see that chain. Rebuild removes the dead head. End-turn deferred counters are 2,1,0 on 26,27,28; free-high head becomes 1831 on 28.
- Turn 31 header retires 1830 through `005016cd`; primary head becomes person1832, while tribe head still references dead1830 until rebuild. Release on 33 prepends it ahead of already-free1831.
- No further formation allocation occurs. Native slot reuse remains unobserved.

## Smallest browser acceptance contract

1. Actual recruitment caller: initialize native timer/RNG exactly once for each successful newly allocated group; preserve same-turn prepend visibility and exclude newly created groups from that turn's completed controller phase.
2. At the native end-turn phase, derive per-tribe processing/recruitment order from surviving allocation chronology. Cover two initial allocations plus a later allocation while survivors exist; repeat a turn with no allocation to rule out repeated reversal. Use deliberately nonmonotonic IDs in a source-contract test, not as a claim of observed reuse.
3. Retire head and middle groups without dropping their successor. Class-zero groups must never recruit or process. Retention until rebuild is native; an earlier browser projection is acceptable only where all actual readers have the same active-record behavior. Do not add a native-sized pool/deferred queue merely to imitate private storage.
4. Save and restore whatever new allocation chronology is introduced, together with current phase/order where applicable. Legacy migration must use the old browser's demonstrated array invariant or an explicitly limited compatibility rule, never guessed native-ID sorting. New-format round trips and continued-turn ordering need tests. This trace does not recover historical allocation chronology from an arbitrary old save.
5. Re-run the frozen eight-person comparison and inspect all mapped person/group/RNG visits, not just the five admissions. Standard unchanged gates and ordinary rendered entry remain parent/implementation acceptance responsibilities.

## Reproduction, fingerprints and limits

Source HEAD `96a465d1b3dfb7ff7aae34865088308dc26d4783`; tracked worktree clean before/after. Canonical original executable SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Python/Unicorn 2.1.4/Capstone 5.0.7 and complete source hashes are in `audit.json`. Reused frozen `../native/attempt08/driver.py`; the retained `driver-observation.diff` contains only read-only hooks, snapshots, output/provenance changes. No guest writes or supplied returns were added.

Commands (repository root):

    PYTHONDONTWRITEBYTECODE=1 python3 work/orchestration/training-native-20261010/retirement/prepare_trace.py
    PYTHONDONTWRITEBYTECODE=1 work/orchestration/training-native-20261010/native/venv/bin/python work/orchestration/training-native-20261010/retirement/driver.py trace01
    PYTHONDONTWRITEBYTECODE=1 python3 work/orchestration/training-native-20261010/retirement/audit.py

Execution and audit passed, exit 0. Use a fresh run name to reproduce; existing evidence is never overwritten by the driver. `trace01/lifecycle.json` retains entry/return/boundary records. `trace01/result.json` retains complete baseline-shaped results. Every original timeline, person visit, admission, event, terrain trace and final state equals frozen attempt08 exactly; initial, allocated and runtime-global files are byte-identical. `audit.py` asserts those comparisons plus every lifecycle fact above. Full original startup, imports, OS/network bridge, renderer, installer, animation scheduling, new native families and further native scenarios were not run. Original attempt08 limitations remain unchanged.

Only the assigned ignored retirement directory was written. No product edit, generated export, tracked fixture recording, heavy gate or parity claim. Native lane released. Suggested durable destination: a concise `decomp/research/formation-retirement-lifecycle.md` linked from the existing training-composition evidence, plus compact raw instruction/audit receipts with the candidate.
