# Mission 3 callback closure: bounded static result

Issue 29; base `5cfe86425b954a0cf5b4907998706bb5b6ba1f88`. No original instructions, browser, installer or OS API were executed. This follow-up reused a private copy of the persisted Ghidra project, exported three requested functions and four directly reachable single-player leaves with `-noanalysis`, and read two descriptor words from the canonical executable. No whole-project analysis, product edit or fixture recording.

## Resolved source frontier

1. **The two authored buildings do not create the conditional class-6/model-9 child through `00403610`.** Model1 descriptor word at `005a72b2` and model18 word at `005a77be` are both zero. The condition tests this signed `+0x3e` word before its RNG draw. None of the 341 original balance descriptors targets or overlaps either word. This excludes the path for these model descriptors; it does not generally prove `004fc330` is harmless. Its newly exported body still invokes state initialization, but that body is irrelevant to this excluded path.
2. **Post-load `00503230` does not allocate people or change their seed/order.** Its complete body traverses the existing primary list, counts class10/model16 objects, and writes two count/threshold globals. It contains no calls and does not relink the list.
3. **The ordinary single-player branch of `0042ca00` does not allocate people or change the class-1 seed/order.** Its complete body and four directly reachable leaves `00408e30`, `004c2c60`, `004c2fc0`, `0041b520` copy/reset spell/building availability, presentation selection, and bounded per-tribe statistics. The multiplayer branch is excluded by the ordinary single-player flag assumption, not promoted to a general branch proof. The statistics leaf calls imported `timeGetTime`; its return is stored only to a timestamp. We did not execute that call. A future unmodified initialization emulation must stop at this OS boundary under current no-OS execution rules; source classification here supplies no guessed return.

The fresh export project has raw Ghidra names rather than imported community types. `callback-facts.tsv` retains each function body extent, instructions, bytes and references. All **367 instruction byte records** were independently compared to the canonical PE bytes by `verify-static.py`; `static-verification.json` records the result, descriptor words and balance non-overlap. Ghidra's standard exporter also verified every original loaded section before exporting.

## What the source still does not establish

### Early Hut birth

`004049d0` initializes applicable birth work to cost−54. `00404c80` updates on counter&3==0, adds `(occupants+1)*2` while capacity permits, and attempts class1/model2 allocation at its threshold/pending gate.

Under zero occupancy throughout, unchanged cost, enabled capacity, no earlier pending flag or other timer writes, reaching the threshold takes **27 eligible updates**. Mapping that to visits 105–108 (108 from counter 0) additionally assumes exactly one applicable building visit per ordinary counter increment and no extra secondary invocation. `004ec6f0` can separately dispatch class2 records from `guard_control_units` without incrementing the counter, so an actual pass/turn bound requires that list membership too. None of these assumptions is silently supplied for Mission3. This is useful arithmetic, not a proved birth turn or a no-early-birth result.

### Both startup waves

Allocator prepend plus cached-next primary traversal implies that two retained waves born during one primary pass have their first primary-list visits in reverse allocation order on the following pass, provided neither root is relinked or retired and no other dispatcher visits it earlier. If Chumara creates before Blue during that pass, the newer Blue root visits first; command-attachment tribe order alone does not establish that premise.

`00433a10` state1 waits for its 12-visit timer **and** flags2 bit0x80000 to clear. State2 allocation additionally requires `0043bb60` readiness and allocator success. `0050c780` retires a new wave when its tribe busy flag is already set. Therefore the nominal timer does not establish both waves' actual creation/first-visit phases, their ordered cell conversions or their contributions to the shared person seed. Browser turns17/20/21 remain browser observations. The prior conditional original witness proves next-pass newborn scheduling, not exact Mission3 startup history.

## Decision and precise remaining discriminator

The three requested static callback uncertainties are resolved in the stated single-player/model scope; they should not be re-researched or retained as missing-body blockers. **No exact Mission3 seed or safe product repair is accepted yet.** Direct authored count 52 is still not a substitute for an ordered successful class1 allocation ledger.

A remaining discriminator must establish actual post-load person seed/pool/list state, Blue Hut timer/counter/cost/occupancy/secondary membership, both Shaman readiness flags and command phases, and both wave creation/conversion ordering. The outcome needed is one ordered list of successful class1 allocations and first visits through the selected conversions, with no hidden allocations or guessed counters. This pass does not prove that all other loader/model callbacks have already been closed or that every omitted original phase is inert.

If a larger native initialization/early-startup observation is proposed, define its exact source segments and field suppliers first, including the now-explicit `timeGetTime` boundary. It would materially expand the eight-follower fixture; no expanded execution was attempted here. A source-derived segmented setup may avoid OS calls only with an explicit equivalence argument, rather than silently stubbing them. Remaining work is engineering composition proof, not missing user files or a denied permission.

## Receipts and limits

- Canonical EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Ghidra 12.1.3, Temurin JDK 21.0.12.1; copied the 39 MiB persisted pilot project privately. The original project was not modified.
- Initial three-function export: exit 0, 7.88 seconds. Four-leaf attempt 1 failed before project opening because a task-local XDG config path was omitted; retained log/receipt. Same export with task-local XDG paths: exit 0, 5.99 seconds. Independent instruction-facts export: exit 0, 7.16 seconds. These are runtime receipts, not performance comparisons.
- `exports/*.c`, `export-receipt.json`, `leaf-export-receipt.json`, `leaf-export-02-receipt.json`, `facts-receipt.json`, logs, `callback-facts.tsv`, `scripts/CallbackFacts.java`, `verify-static.py`, `static-verification.json`, and retained source hashes form the portable evidence.
- Original function bodies are pseudocode, not recovered source. The three initial exports and four leaves are research artifacts; existing generated-file ownership/manifest is not silently rewritten.
- No product checks/build, native replay, ordinary rendered rerun, merge or deployment. Existing blocked candidates remain unchanged.

## Proposed next dynamic trace, not executed

The smallest next run is **a turn-zero constructor ledger**, not a full Mission3 startup replay. Supply the hash-verified 2,000 raw record slots (109 nonempty objects, including all 52 people), header/terrain/object-bank data and explicitly bound load/reset/pool inputs. Execute the original eligible-record branch `00484edc..00485038` in ascending file order with real `004ed8a0`, `004ed580`, reachable model/state constructors and `00485b00`; then original trigger postprocessors `004851e0`, `004866a0`, `004edf50` and the loader's conditional class7/model89 pass. Preserve real allocation failures and nested allocations. Stop after the constructor/postprocess ledger, before the wider `0042b230` post-load sequence and before any gameplay turn. Log every successful class1 allocation with caller, seed before/after, record identity and primary-list order; retain all other allocations as possible pool/order dependencies.

This proposal must first bind the segmented loader entry registers/globals, record chunk/index semantics and required normal initialized arrays from retained source. It must not inject a seed of52, bypass an unknown model constructor, or treat synthetic pool/RNG defaults as authentic Mission3 initialization. Any unsupported OS/API call or unproved decisive input stops the attempt. The proposal deliberately avoids executing `0041b520/timeGetTime`; it does not stub that call. If a reachable constructor itself crosses an unsupported OS boundary, stop and report it.

The full 109-record world materially expands the approved synthetic eight-follower fixture. Although the eventual comparison still tracks eight followers, this stage has more original entity families and initialization dependencies. Its exact segmented boundary and authority require review before execution. It is not claimed already authorized or runnable from the present source result.

Only after a constructor ledger succeeds should a second, separately bounded proposal cover both actual Shamans' command18 visits (`00432590/00433a10`), wave `0050c780/0050c840`, converter `004d7fd0`, first person visits `004d32b0`, and required logical-animation/terrain/list phases. A suitable stopping condition would be the first eight Blue replacement first-visits, or 32 primary passes with an explicit incomplete result. All original entities and competing births remain in the world. Supplied animation clocks or omitted readiness phases cannot silently decide its outcome. That second stage is a proposal boundary, not an announced next run.

## Independent disposition

Independent review ACCEPTS the exact static callback closure and conditional arithmetic/order claims with the stated limits. The proposed turn-zero constructor trace is accepted only as a bounded plan, not as runnable, authorized or proof of an exact seed. No product repair is accepted. The portable archive contains all seven fresh exports and byte-bound receipts; it excludes the executable, project database and task-local tool configuration.

Boundary-review correction: the proposed final loader scan is class7/model89, verified from original compare instructions; the earlier class10 label was wrong. See the corrected allocation ledger for exact bytes.
