# M14 ordinary rendered linked-head acquisition

> Historical PNG captures are [preserved unchanged at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/verification/m14-linked-head-browser-2026-10-14). They are no longer tracked in the current checkout; the source-bound findings, image names and any recorded hashes below remain historical evidence.

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/verification/m14-linked-head-browser-2026-10-14), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

## Accepted bounded result

Actual sandboxed official Chrome Headless Shell 154.0.8037.92, ANGLE Vulkan SwiftShader, 1440×1000. Scenario `scripts/local-render/mission14-linked-head.mjs` executed on exact QA source `3cb8647df588a177f12428e8806ab48770cb1e6e`, based on main `9c2cf2ef41163c7f73bc986ce0003dd667d2fcdd`. Runtime, tests and dependencies were unchanged. The raw receipt retains exact source before/after fingerprints and browser launch options. Run: 2026-10-14 10:30:57.856–10:35:14.678 UTC.

Fresh public All missions → Mission 14 startup, ordinary HUD Shift-select Braves, minimap camera input and actual trusted head click. Original Braves 50–55 walked to authored head47(-61,-53), worshipped, and earned both linked gifts with real RAF progression. No actor/resource/terrain/stock edits, supplied CPU checkpoint, direct ticks or suspended RAF.

Observed milestones (polling observations, not exact transition timings):

- First state observed turn620: original six Braves at home, Shaman258 alive, headuses0, both shots/giftCounts0.
- Trusted command27 dispatch: before800, accepted807, all six selected recipients. Live input observer restored.
- First sampled six-person worship with positive work: turn1439; screenshot shows six-person head panel.
- First sampled used head:2203, shots0 and two pending linked gifts, each remaining75.
- Both earned shots/giftCounts first sampled2284; final HUD screenshot bracket2284–2331, final state2331. Six original Braves each50HP; original Shaman100HP. Both visible HUD buttons have one shot.

Independent reviewer inspected the source/helpers, raw evidence and actual PNGs. See `independent-review.md` and final publication review.

## Retained limitation and discovered defect

The first run passed; there are no discarded attempts for this scenario. Browser warnings (software fallback deprecation, ReadPixels stalls, texture-update warnings) are retained in `run/receipt.json`; errors were empty. The unsafe opt-in suggested by Chromium's warning was not used. Sandbox remained enabled; only remote-debugging-pipe was passed.

[run/head-commanded.png](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/verification/m14-linked-head-browser-2026-10-14/run/head-commanded.png) also records a real UI defect: “One follower is enough” despite authored required6. The acquisition succeeds, but this is not blanket UI correctness. A separate runtime repair owns that issue; this packet preserves the original pixels and bytes.

This establishes the short authored acquisition route and rendered HUD control. It does not establish full M14 completion, Angel acquisition, sea traversal, browser persistence, original-game parity or hardware-GPU performance. It supplements rather than reclassifies the older supplied-state browser reward script and separate CPU campaign route.

## Gates

Current candidate focused gate receipt is retained under `gates/`. Parent and independent reviewer approved scoped checks because app/tests/harness/dependency inputs remain exactly unchanged. Current syntax, diff, TypeScript, affected harness/input tests, parity and orchestration checks are reported from their actual receipt.

Full `npm run check` and production build were **not rerun for this M14 candidate**. Historical #433 source6b36565f full check failed2603/2605; isolated foreground failed8/9, isolated queue passed20/20; historical build passed. Those results remain under `../m10-boat-browser-2026-10-14/gates/`. They are context only and are not presented as a new candidate run or a green aggregate.

## Repeat

Use the verified official browser recovery instructions in `engineering/cloud-render-recovery.md`; do not add security-weakening flags. Example from a checkout with its installed dependencies:

```
node scripts/local-render/harness.mjs --game-root "$PWD" \
  --browser /absolute/verified/chrome-headless-shell --port 4395 --mission 14 \
  --scenario "$PWD/scripts/local-render/mission14-linked-head.mjs" \
  --output "$PWD/work/m14-head-fresh" --timeout 660000
```

Choose an unused port/output and serialize with heavy simulation/performance/full-suite work. This scenario uses a fresh ephemeral browser context; no private profile or storage is included in the packet. The scenario's600-second budget includes startup, with a45-second advancing-clock watchdog. Wall duration is not a performance claim.
