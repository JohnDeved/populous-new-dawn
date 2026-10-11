# Two conditioned original pre-loader results

Issue #29; research only. Two serial original runs at source HEAD
`7bc4c8c53a0a36070d86153653720a9d5a849171` passed independent post-run review.
They extend the actual loader prefix through terrain masks, command initialization
and tribe reset, stopping at `0042b638` before the loader call.

## Accepted result

Each case verifies 101 known memory fields, eight bit predicates, exact known-mask
coverage of all 262,144 terrain bytes, both prior checkpoints and its final
CPU/stack contract. No new instruction semantics or presentation omissions were
added. All 100 author and five independent synthetic tests pass.

- Land bit `0x08` clear: 307,361 original instructions; 361,667 source-derived
  observer events. Two genuine script comparisons and 120 unknown-table DWORD
  reads occur. Nonplayer control-kind bytes become 1.
- Land bit `0x08` set: 305,667 original instructions; 356,519 source-derived
  observer events. Those comparisons and table reads do not occur. Nonplayer
  control-kind bytes remain 2.

The reviewer independently derives both event schedules and uses the frozen pure
replay helper with independently constructed contracts. All masks and selected
values pass, with every branch-specific effect retained. Matching selected RNG
and class counters do not establish whole-state or later allocation equivalence.
The original processes exited zero and all five driver hashes stayed unchanged.

Raw result SHA256 values:

- Clear: `e2b325146a78d54061b55e129240fcf7fbebf0f64949756f228739ee447aa6ca`
- Set: `32de84de613be26a5209eac10ddf0a30795435b67a94da1544405824046ec39b`

## Real script input and explicit conditions

Mission 3's header selects CPSCR012 for both nonplayer tribes. The original script
loader runs before this prefix. The recovered file and exact intervening store
spans establish the selected six bytes in each script block under successful
canonical-file transport. The genuine equality branch preserves the actual
following words, rather than supplying the different fallback values or omitting
the branch. File/OS routines are not executed or given fabricated returns.

The two land-bit alternatives remain labeled conditions; neither is asserted as
the actual campaign history. Player 0, identity tribe IDs and the selected mode-bit
lifetimes remain explicit source-bound entry conditions. Tribe count and root
arguments come from the canonical header. Other flag bits and unconsumed script
data stay unknown. Prior conditions remain: canonical sampled trig values, normal
return from the three camera omissions, and scoped live palette-allocation
renaming. No whole flag word or unrelated memory is silently initialized to zero.

Observer order is not a full CPU-retirement trace. Writes retain known masks;
selected values and CPU state are checked separately. No installer, PE startup,
OS/import bridge, network, bank load, allocator, authored-object constructor,
post-load callback or gameplay runs here.

The actual Mission 3 allocation seed and training fix remain unproved. Next is a
grouped source/input audit of the remaining loader, bank and animation preparation
toward the first constructor, including genuine presentation/timing boundaries.
The rejected product candidates and unchanged Mission 2 acceptance remain in force.
This investigation has not changed product code or merged to main.

## Durable evidence

`retained-proof.tar.gz` contains frozen drivers, the prior rejected metadata-only
snapshot, corrected preflights, source contracts, source exports, synthetic tests,
process receipts, both losslessly compressed raw results and independent reviews.
`manifest.json` binds every member and the archive. Decompress each
`preloader-result.json.gz` beside itself to recover the exact raw JSON expected by
the historical review scripts; their raw hashes are retained in the manifest.

The scripts preserve original paths and input-hash checks. Reproduction elsewhere
needs explicit path adaptation and separately supplied canonical assets. Previous
checkpoint artifacts and the frozen replay helper are in the
[sunlight evidence](../mission3-sunlight-prefix-2026-10-11/README.md). No whole
original executable or assets are redistributed here. Historical source maps and
preflights are preserved; the corrected `02` contract and held/released verdicts
identify what was actually admitted.

Full product check/build/render gates are not applicable to these evidence-only
files. Publication uses structural checks, diff validation and independent review;
these research results do not grant shipping acceptance or broader execution.
