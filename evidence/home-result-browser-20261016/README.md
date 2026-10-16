# PR #499 actual-Home loss lifecycle evidence

**Passed**, first and only browser attempt. Tested source: `80f3e78c3409376b3a35f764e6499a96508f9023`; no product or scenario edits during this run. This evidence commit adds publication files only.

The actual Home/store/scene loaded through the existing production Vite fixture. Public UI starts Mission 1 and pauses it; the fixture explicitly seeds only a lost status and finished result camera. Public Select Level -> Back, Select Level -> Escape and Restart then execute the shipped handlers.

Both selector returns retain the same paused lost world, live scene and canvas. Restart replaces world and scene with an unpaused playing Mission 1; the old scene is disposed and its terrain load aborted, its canvas detached, and the new scene owns the new world without modal suspension. Result labels and all ten explicitly unavailable statistics are checked. No statistics or campaign outcome producers changed.

## Exact run

- Source head: `80f3e78c3409376b3a35f764e6499a96508f9023`.
- Source files bound before/after: 5629; all unchanged.
- Dependency entries: 21318; regular-file size/mtime/content SHA256 and symlink target identities unchanged.
- Dependency identity SHA256: `4bb209ed39b449808b91edfcff823e79734e3575f3d5939d92ceb3de58925f53`. `dependencies.json` retains the entries; the digest uses compact JavaScript JSON serialization, not the pretty-printed file bytes.
- Runner original SHA256: `f05e276410897f599941c4609b7064569f9d224fb1504bc209ff91f49ffccf95`. Adapted from #497's verified managed runner, retaining its launch options. Added content/symlink dependency binding, a handled scenario deadline and error checking after final cleanup; no scenario assertions relaxed.
- Browser: Chrome 155.0.8059.80; headless, sandbox enabled, Playwright-managed temporary profile; default unsafe SwiftShader argument excluded. Viewport 960x720, DPR1. No hardware-performance claim.
- Start/end: 2026-10-16T17:18:11.448Z / 2026-10-16T17:18:36.208Z.
- Browser receipt original SHA256: `f36d1cafe1290d26c44d6e10502c54e10fb0f16dfa47f3a52d410570db90d5da`.
- Exact-source command receipt: passed, exit0; build exit0; scenario passed; source/dependencies unchanged; cleanup verified.
- Runtime/console errors through final cleanup: none. Three existing `THREE.WebGLRenderer: Texture marked for update but no image data found.` warnings retained.
- Lane released at 17:19:09 UTC: no port5198 listener or owned runner remained. See lane-cleanup.json.

## Captures

[Paused loss result](lost-result.png) shows the result panel and working browser controls. [After Restart](restarted-after-loss.png) shows the replacement Mission1 scene. These are the seeded fixture and its public-UI transition, not naturally earned defeat or before/after product changes. Both screenshots were visually inspected.

## Limits and reproduction

No natural defeat, native lifecycle/timing, statistics production, persisted progress, full campaign, Vinext/Cloudflare hosting or broad viewport acceptance is claimed. This run does not replace #496's isolated heading/font-state matrix. No full local suite or merge ran. Parent retains independent review and hosted full gates.

To reproduce after coordinating the browser lane: checkout the exact tested head, install matching dependencies, place the published runner at an ignored repository-local path, and run it with Node from the checkout, passing a fresh output directory. The runner uses the existing official Chrome path and existing Home builder; it launches no original game executable. Published runner text has no private-path substitutions; manifest.json separately maps original and public hashes for every artifact. Source-root/home strings in receipts and build logs are redacted; source and input hashes remain intact. Browser profiles and compiled bundles are excluded; bundle file hashes remain in the receipt.
