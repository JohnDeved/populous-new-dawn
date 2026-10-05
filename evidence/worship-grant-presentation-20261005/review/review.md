# Independent presentation extension review

Decision: ACCEPT frozen 7ab7c3ebff125cb3f3a5e23b6da596c7cc95e487 as bounded native draw-command/lifecycle evidence. No blocking finding. This is not live issue-30 acceptance, original elapsed-time proof, or pixel equivalence.

Full four-file diff reviewed against parent 5f32560 (451 additions). Tracked tree was clean at the frozen HEAD. Prior accepted a647586 handoff and 543fbec pacing findings remain prerequisites. Repository engineering/native-evidence guidance applies unchanged. TypeScript quality, full build, browser and hardware checks are not applicable to this proof-only extension; git diff --check passed. No source edits, publication, shared ports, Ghidra, package installation or full suite run by reviewer.

## Validation

- Probe source SHA256 a9caf4219317b76a4a13009101b0f353e27f179de34a145de198c9ee19dd98b7 and worker result SHA256 5b74c5df88dcdc81b71b343b3eb7a06c6637454be48482ef4fec5e9ca9d0b97d match handoff and exact retained source.
- One independent original-byte run at frozen HEAD passed all 10 cases, exit 0, 5.682 seconds wall under a 20-second timeout. Every case/row/event equals the retained attempt-3 result. Command, raw output and private native receipt are beside this review in independent-command.json and native/probe-result.json.
- Verified original companion dispatch/count cap, type-7 initialization, type-8 ten-per-visit retirement, pending-phase-before-pause ordering, signed palette selector and draw-phase frame increment from executable instructions. Original gameplay RNG 0089d178 remains 0xaabbccdd while cosmetic RNG 0089bc72 advances. Mid-pause freezes motion/count/RNG but still submits sprites and changes their frame byte.
- Verified real 00516270 consumes pointer+0x2f82, maps that byte through the loaded palette, converts RGB and stores the selection. Selectors -2/-1 remain valid because consumed bytes are in the original AL buffer. All AL/palette/HFX input hashes, immutable loaded bytes, 244 configured constants, search table and five read-only PE regions are guarded. No native-code patch was made.
- Confirmed native 0047e070 uses ECX plus seven stack arguments and ret 0x1c. Parsed every captured raw spell argument word; decoded values match recorded fields, bank 009910e8 and flags zero. Native conversion is float 1/32, angle factor 0.0030679609375. All six compositions have 30 body submissions and 30 full-screen clip/restore pairs. The recorded ECX is zero because texture-context global 005ce0bc is uninitialized in this CPU fixture; bank 009910e8 is an opaque native address. The queue/clip hooks disclose that pixels, blending and texture sampling are not executed, so this proves emitted argument construction and ABI, not a usable native renderer context.
- Both retained failed attempts are correctly explained by exact source diffs: invalid AL-base-pointer assertion, then incorrect 1/256 scale assumption. Corrected checks follow original consumed addresses/constants and add validation; native behavior was not changed to obtain a pass.

## Scope and next boundary

Four companion cases finish in 24 normal or 27 paused visits. Six spell compositions finish in 34 visits, each with 11,500 sprite submissions. In all six, companion retires at 24, spell/limiter bit4 at 31, and the separate pulse at 34. Uniform 20-Hz timing is therefore unsupported, even before outer-loop deadline/other-limiter qualification.

Constructor byte ranges support singleton replacement: spell clears 129 bytes at 0098c5a8; companion clears its separate block beginning 00988a88. The pulse at 00988a68 is outside both. Neither constructor mutates the older reward timer or queues another flight. This remains static evidence; repeated handoff and actual world callback order have no dynamic case in this matrix.

Minimum adapter work: explicitly define elapsed pacing across initial activation, limiter overlap/release and pulse tail; source/HUD resize ownership; pause and checkpoint state; then add replacement before/after arrival and replacement while an old pulse survives. Preserve old gift fallback and sole world-turn payout, with deterministic cosmetic state separate from gameplay RNG. Define/test the real world scheduler's callback order instead of inventing flight queues. Reuse existing object-order evidence if it resolves this boundary.

A useful pause detail beyond the note: the initial pending companion phase consumes one cosmetic RNG update at 00482356..0048238c before the pause test (seed 1 becomes 1275068418). Later paused calls freeze that state. The adapter must preserve this order or document a deliberate compatibility correction. Final original blend/pixel behavior and browser rendered acceptance remain separate from this accepted command proof.
