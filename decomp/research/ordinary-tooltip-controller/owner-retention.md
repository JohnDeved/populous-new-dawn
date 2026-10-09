# Ordinary tooltip owner retention and leave/re-entry

Source-only addendum to issue19 at research HEAD `e19faec0ecfdbd796dd78b17e1ecf85a8bf63f58`. Runtime implementation remains held for design/review of the complete admitted M1 slice. This pass resolves the five-word cleanup question; it does not reopen frontend sampling, the known Hut controller, inspection phases, or Encyclopaedia parsing.

## Finite conclusion

There is no implicit owner reset in the ordinary no-handler interval. In an eligible visit, `004af340` can return without invoking a tooltip helper at `004af43e`; the caller then invokes only `0044b070` before `0044b090`. The former writes only scroll/hold fields `0068c6b7/0068c6b3`. If object owner `0098db48` or cell owner `0098db44` was nonzero at dispatcher entry, it is still nonzero at cleanup, which returns before clearing category/key/D/text. This is a closed instruction path, not an inference from a missing literal reference.

The neighboring indirect candidates are now bounded and do not supply a hidden owner clear. A physical browser canvas leave is not by itself proof that the native dispatcher selected its no-handler path: a valid ordinary cell or HUD control is an actual alternate owner. The port must represent that routing explicitly.

## Five-word transitions and timing

| Word | Exact producer/reset | Ordinary consumer implication |
| --- | --- | --- |
| HUD `0098db0c` | `0044b138` clears it on each `0044b130` visit; later branches publish the control ID. At `0044b507–54c`, a positive ID can invoke `0044d470`. | Recomputed when HUD processing runs. HUD runs before forced handling; a hidden/textless HUD controller can still change shared category/key/D/T. A skipped HUD visit is not a synthetic zero. |
| Object `0098db48` | `0044d0c0` clears it before enable/null checks. Enabled, nonnull input copies object word+0x24 at `0044d0f2`, before name lookup. These are its only direct write references. | An unnamed object still owns this word. An invoked disabled/null helper leaves it zero. A dispatcher path that never calls the helper leaves its previous value, including when another kind of tooltip is selected. |
| Cell `0098db44` | `0044d2a0` clears it before enable check, then copies the packed coordinate at `0044d2c4` when enabled, before the name result. These are its only direct write references. | Blank cells still own their numeric coordinate. Packed coordinate `0000` is numerically zero and cannot alone block cleanup. A skipped cell helper does not clear a previous cell. |
| Status `0098db2c` | `00522570` clears it before normal `draw_mode==0` landscape painting; retained `00504bc0` publishes status string IDs during painting. Exact additional helper `005231e0` also clears it at `005231f6`. | `draw_main` handles ordinary input before the later `draw_1` paint. Thus normal input can consume the preceding paint's status value. Do not reset it at input entry. Skipped/other paint paths are not proved to perform the normal clear. |
| Message `0098db40` | `004314c0` clears it at `00431504`, then can assign entry index+1 at `00431882`. `draw_main` calls this refresh before `004aa4e0`. Selected message helper `0044cf90` clears it at `0044cf9c`, repopulating it at `0044cfb5` only when enabled. | Refreshed in that actual pre-input owner, and can be cleared by disabled message processing. No message hit is distinct from an old object/cell word being nonzero. |

`0044b090` tests all five words and clears controller category/key/D/text/forced fields only if every word is zero. It does not clear these owner words or T. Explicit `0044b100`, forced acquire/expiry, and category/key transitions can reset/replace controller fields independently of these owner words. The retained input dispatcher has explicit `0044b100` calls in native cases79/7a/7c; no physical-event identity is newly claimed for those cases. The candidate inventory also records two other reset calls without broadening their unrelated caller closure.

Ordinary object/cell calls are confined in the direct call inventory to dispatcher sites `004af3fc/004af41f` and `004af3c4/004af433`. Cleanup has the one direct call `004aa58e`. These aligned calls were already retained. The separate `005231e0` caller candidate is `0041ebf7`; this pass does not turn that additional reset into an assumed per-frame event.

## Exact leave/re-entry cases

1. Named Hut → true no-handler visit(s) → same Hut: if HUD processing selects no changing controller, no independent reset happens, and an object/cell owner remains nonzero, category/key/D/text survive. No-handler visits add no dwell and request no new draw. Re-entry runs the same-target branch at its retained D; it does not perform named acquisition again. Existing draw-latch consumption remains the renderer's separate responsibility.
2. Named Hut → valid blank ordinary cell → Hut: the cell helper changes category/key and clears text while preserving D on its unnamed acquisition; later blank-cell repeats can cache T and advance D. Re-entering the named Hut changes category/key, so its named acquisition resets D=0. This is not the no-handler case.
3. Named Hut → unnamed object → Hut: the unnamed object's ID is copied into object owner and shared key/category; text clears without a D reset. The named Hut on return resets D=0 because its key differs.
4. Named Hut → active HUD control/message/status → Hut: honor that controller's actual category/key/D/T transition. The prior object/cell owner may remain nonzero, but it does not preserve the previous shared category/key against a new controller.
5. Forced handling: HUD still runs first; a handled forced expiry visit still suppresses world/scroll/cleanup. Forced clearing of controller fields does not mean owner words were cleared. Re-entry must use the resulting shared state, not restore a saved object-hover state.
6. All-five-zero cleanup: reset occurs exactly at `0044b090`; a following named Hut visit is acquisition. Disabled/null object processing and disabled cell processing clear only their own word, so neither alone guarantees all-five-zero.

These cases specify visits and state transitions, not elapsed seconds. The accepted sampled frontend counter/cache owner remains controlling, with no fixed12/24/40Hz substitution.

## Adjacent indirect writes: resolved bounds

The data scan retains all69 unaligned little-endian32 candidates in `.text` for `[0098da00,0098dc00)` and finds none in other initialized PE sections. Candidates are not automatically instructions or pointers; exact writer contexts and prior accepted controllers classify the relevant hits.

- `0049daf0` initializes its row counter to1 and runs through5. Its indirect byte stores cover only `db10`, `db15–16`, `db1a–1c`, `db1f–22`, `db24–28`; the following five-byte increment also stops at `db28`. Its dword destinations `db30/db34/db38/db3c` occupy `[0098db30,0098db40)`. Complete reset `0049dad0` touches those same four dwords.
- The nearby `db0b+5*count` cursor in retained `0049daf0` is read only; its bytes, not its address, are passed to the sprite renderer. Its count bound is irrelevant to excluding an owner write.
- `0042bfa0` initializes EDI=`0098db50`, ECX=`0x100`, EAX=0 for the forward `rep stosd` at `0042bfcc`: `[0098db50,0098df50)`. Its escaped `db50` pointer reaches retained `004a32d0`, whose fixed positive offsets are `3f8–3fa/3fc–3fe`, also above the owner words. This is unrelated palette storage.
- No direct owner address-taking escape or stored initialized pointer in that neighboring range was found. The conclusion is the ordinary recovered ownership contract, not a claim about arbitrary memory corruption, unrelated UI paths, or every restart/checkpoint write.

Two discovery windows are preserved but superseded: the first array window starts inside an instruction; its replacement begins at the established `0049daf0` entry and includes the loop initializer. The first palette window ends inside the next call; the replacement ends exactly at `0042bfce` after `rep stosd`. No conclusion uses those partial instruction fragments.

## Consolidated classification and next acceptance boundary

Change only the living consolidated table's Leave/cleanup row from a missing-producer question (B) to proved native behavior awaiting port design (A), as recorded in the [provenance manifest](owner-retention-provenance.json). Frontend sample/cache, known Hut acquisition, forced composition and inspection records were already A. Hidden HUD/cell mapping is mostly A; exact category7 helpers and building-cell model/table binding remain specific B questions only if the admitted history reaches those branches. Other known input predicates need a port admission mapping; a disputed normal-path valid-cell/flag/mode transition must name its exact producer rather than treating every mode writer as unknown. There is no demonstrated missing external input (C).

The smallest candidate remains the complete ordinary authored M1 Hut name+inspection episode with actual startup history, HUD/blank-cell transitions, forced handling and inspection renewal/release. This addendum supplies its no-handler versus blank-cell leave expectations. Current `scene-input-runtime.ts:440–447` clears pointer/pick state on canvas leave, while `renderTooltip:648` still creates immediate temporary tooltip state. Those browser states are not the five native owners. The implementation design must map actual DOM handoffs and frontend opportunities; it cannot clear native history merely because a canvas event says leave. No new spatial framework or generic event framework is needed by this source result.

Source evidence only; no game/emulator/Ghidra/browser/test execution, runtime edit, fixed-time claim, or parity credit. Approved inert EXE stayed unchanged at SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Exact byte ranges, commands, tool identity, scans and source pins are embedded in the [provenance manifest](owner-retention-provenance.json). Aligned byte windows are preserved in [the static excerpts](owner-retention.asm.txt); earlier controller/caller proof remains in [controllers](controllers.asm.txt) and [clock/caller excerpts](clock-and-caller.asm.txt). The [consolidated prerequisites](window2-control-closure.md#one-consolidated-m1-contract-boundary) contain the accepted one-row classification update.

Independent review **ACCEPTED this finite source closure and the exact consolidated cleanup-row update; runtime remains HOLD**. Accepted finding SHA256: `2ba4c26cd10c5b3d0fe5ad731eb9547d18419311c428868d1c0eb27930e9fe3c`; review SHA256: `2ac612f80a7ee1d1937c11a59ec98f8acb3887e0ae73be88b6f08c90a0f78ad0`. The review verified all15 source pins,16 artifacts,306 new byte lines,69 neighboring address candidates, zero initialized noncode candidates and11 direct-call candidates.
