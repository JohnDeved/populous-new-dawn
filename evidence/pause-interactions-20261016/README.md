# Pause interaction acceptance, 16 October 2026

Refs #16 and #457. These are **baseline QA results**, not tests of the later tutorial-recommendation candidate.

## Exact source and execution

Tested source: `673b89ad4d53821a592b80ccc87cf6fc6048fc58`.
A separate source snapshot was verified against 373 app/helper/package SHA-256 inputs and 738 public asset Git blobs. Shared public assets were checked before and after; installed dependency metadata remained unchanged. Source, runner, scenario, browser and dependency fingerprints are in the raw receipts.

Actual production Home, GameScene, store, CSS and assets were mounted through the established plain React/Vite fixture. Vinext/Cloudflare/RSC hosting was excluded. Each episode used a fresh sandboxed Chrome context, one navigation, 640×480 and DPR1. Renderer was ANGLE/SwiftShader software Vulkan. No native executable was run; no hardware FPS, full native pixel parity, deployment, or high-resolution acceptance is claimed.

## Results

- **PASS, pending-save/storage failure**, 11:02:08–11:02:34 UTC. A test-owned exception on the real IndexedDB `checkpoints/latest` put preserves the in-session checkpoint. Holding the real store save return demonstrates a disabled single-flight Save through Escape to root and reopening Save Game. Releasing it displays the exact session-only notice; Load checkpoint is available. Final Continue retains the originally paused world and releases modal suspension. Injected methods were restored in `finally` and restoration verified.
- **PASS, Quit Level Yes**, 11:02:47–11:03:07 UTC. The confirmation defaults to No. Yes returns to world selection, detaches the old battlefield canvas and leaves its world stopped. Opening the explicit Browser controls panel and selecting Back returns to the main menu without reopening the pause dialog.
- **Retained failed first Quit episode**, 11:00:54–11:01:39 UTC. Quit Yes, selector return, battlefield detachment and stopped-world assertions passed. The final Back lookup timed out because Browser controls was collapsed. The corrected scenario opens that actual public panel. This initial episode remains failed, with its original script, receipt, log and screenshot preserved.

Both passing episodes had zero page errors, identical source after execution, no dependency metadata changes, and verified browser/context/server cleanup. Existing software-WebGL fallback/GPU-stall and missing-texture-data console warnings are retained, not hidden or classified as new product defects.

## Scope boundaries

The save UI is explicitly the browser single-checkpoint adaptation, not original multi-slot save compatibility. Selector Browser controls is also an explicit browser adaptation. Existing evidence already covered ordinary running/already-paused menu ownership, confirmation cancellation, restart, Tutorial Quit Game, durable checkpoint replacement, and broad layout/font fallback. These two passes close only the previously recorded Quit Level Yes and pending-save/storage-failure rendered gaps.

Not exercised here: leaving the entire menu while save remains pending, remounting it and saving again, a thrown clone/save failure, session-only checkpoint loading into a replacement rendered scene, or another mission start after quitting.

## Read-only pending-save exit assessment

The store captures its cloned checkpoint before awaiting storage. After the await, the menu only updates component-local notice/saving state; there is no delayed pause/world write. Continue restores captured pause for the same world, while quit/load clears the old session. Therefore no stale-world mutation path was identified in this source review. However, single-flight protection belongs to the mounted menu instance. Closing and reopening the entire menu can create a new guard while an earlier persistence request is pending; the cross-mount behavior remains unverified. No product defect or complete asynchronous-exit safety claim is made.

## Evidence

`raw-evidence.tar.gz` contains all three receipts/logs, original and corrected scenarios, shared setup, source contract, preparation receipt, fixture metadata and native-size runner. Its internal `SHA256SUMS` covers every other archived member.

- `quit-level-selector.png`: corrected passing episode at world selection.
- `session-only-checkpoint.png`: passing storage-failure episode, truthful notice visible.
- `SHA256SUMS`: publication payload checksums (excluding itself).
