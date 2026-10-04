# Mission 3 naturally acquired Blue Preacher conversion

## Finding and scope

The bounded acquisition/conversion path already works on main
`0b0719f270649f688a07b791a8ff831ed0c91a46`. This verification changes no runtime,
imported data, or parity credit. It covers the natural Blue direction missing from
`tests/preacher-conversion.test.mjs`'s injected helper scenarios and from
`mission3-preaching-message.md`'s natural Yellow-to-Blue listener/warning proof.
The earlier full Mission 2–3 campaign route recorded zero Blue conversions; its
victories are not evidence of this lifecycle. PND-11 remains open.

`naturalPreacherJourney` starts fresh Mission 3, allows the original opening,
commands the Shaman to the authored Vault, returns her home, builds a Temple with
existing Braves, and commands an existing Brave to train. The resulting Blue
Preacher receives one ground command to `(-39,-110)`, near the authored Yellow
Brave at `(-43,-107)`. The test never adds actors, relocates them, forces victim
eligibility, sets conversion timers or tribe flags, supplies mana, or stamps an
outcome. A first exploratory command directly into the denser enemy settlement
ended in ordinary combat death; that was not classified as a conversion defect.

## Native correspondence, not new native execution

Existing retained pseudocode establishes the relevant lifecycle:

- `0043a4d0.c` (SHA-256 `468e8230bd5ccf922c0237163fbf5e92fa00948b0d1fd98ac46b7e0a35d33188`)
  owns the shared sermon commands, listener scan and release stages.
- `004d83b0.c` (SHA-256 `9154eae2ae3f0c09f89b9da37704c5b73add53365e0bca5e345a3c63ba40bbaf`)
  validates the linked living sermon, decrements the victim timer, retries using
  native RNG, allocates the same person model for the preacher's tribe, and marks
  the replacement with flags `+0x10/0x40000` and `+0x14/0x1000000`.

The live owners are `app/preacher-conversion.ts` and the acquisition/release/
replacement functions in `app/live-movement.ts`. Imported person model 2 (Brave)
is eligible through descriptor flag 32. Model 4 (Preacher) is not an eligible
victim; its immunity must not be removed to manufacture evidence. Tests explicitly
reject the tribe's forced-conversion flag 64 and special load flag `0x4000000`.
No original executable was run for this verification-only change. This is not a
new proof of whole native sermon timing, listener gesture/orbit visuals, all victim
models, or campaign-wide parity.

## Reproducible checks

- `node --test tests/mission3-natural-preacher.test.mjs`
- With installed official sandboxed Chrome Headless Shell selected through
  `POPULOUS_BROWSER`: `node scripts/check-browser-mission3-natural-preacher.mjs --port 4356 --output work/orchestration/mission3-preacher/browser --timeout 180000`

The Node checks verify:

1. Vault → built Temple → actual Blue training → authored Yellow Brave in state 23
   → a different Blue Brave ID with both native flags. The shared read-only
   conversion observer requires adjacent-turn ownership, and these new checks
   require singleton pairing;
   death or disappearance alone cannot pass.
2. `migrateCheckpoint(structuredClone(world))` at natural state 23 preserves every
   subsequent unit, order-pool and RNG state through the replacement event.
3. A normal movement order cancels the sermon and clears listener ownership/flags,
   leaving the original Yellow Brave alive.
4. Forty seconds of resumed `advanceGame` at 30/60/120/144 Hz and an irregular
   schedule produces identical units, order pools, RNG, animation counts and
   conversion events. These are elapsed-time simulation tests, not hardware FPS.

The rendered checker starts from the public Mission 3 selector. Acquisition uses
ordinary model commands and suspended-RAF fixed turns. It then uses the shipped
Save checkpoint control, reads back state 23 from IndexedDB, cancels the sermon,
reloads the entire page, and uses the shipped Load Game control. Only the resumed
sermon runs on the actual normal-speed requestAnimationFrame clock. Its observer
preserves the scene's existing after-turn callback and watches every turn.

The first successful rendered run, source `c4e47046940ff5eda87a35f8a8dc9a5cf7344983`,
recorded Vault reward at 1327, Temple completion at 1820, trained Preacher 3164 at 2036,
and authored victim 53 listening at 2526 with timer 98. Fresh-page load was observed
at 2543 with timer 81 and the same owner. Replacement 3188 appeared at 2832 after
24.028 seconds of observed real RAF; the old victim was absent and the new Blue
Brave contributed 255 pixels. Cancellation returned the victim to state 10, owner 0,
and cleared both listener flags at 2526. These exact turns are evidence, not
hard-coded success conditions in the checker.

Raw receipts, failed attempts, logs and screenshots are retained under
`work/orchestration/mission3-preacher/`. The first browser attempt failed because
a verification assertion named `require` triggered Vite's CommonJS transform;
renaming that local helper fixed the checker without changing gameplay. Captures
show natural sermon, cancellation and replacement states, not a before/after
runtime change. Environment: sandboxed Chrome Headless Shell 154, 1440×1000,
ANGLE/SwiftShader. No browser errors or context loss occurred in the passed run.
Software-renderer pixels do not establish native-image equivalence or hardware
performance. Full mouse-driven acquisition and a fresh real-clock campaign are
outside this bounded proof.

## Planner disposition

The plan against base `0b0719f` reports the four new evidence/tooling paths as
unmapped and conservatively selects `npm run check`; none is silently omitted.
That aggregate passed all 941 tests, typecheck, parity and orchestration at
`8ebe75442acf3903a958f3f5206fe390c89839cf`. The explicitly added manual acceptance
is the rendered command above. Its acquisition, cancellation, checkpoint, real-RAF
and software-pixel scopes are separate from the aggregate. A production build is
carried only after verifying identical application, public assets, worker, package
and build/config objects against its source-bound passed receipt. No new native
execution, maintained-TypeScript edit, hardware benchmark or parity recording is
required or claimed by this verification-only diff.
