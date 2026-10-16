# Selector profile-to-launch regression

Refs [issue #17](https://github.com/JohnDeved/populous-new-dawn/issues/17).
One test-only regression; no campaign, AI, application or resource-policy changes.

## Coverage gap

At base `7e4806f25a7d202e67491186f1e62c648e379dab`,
`scripts/check-browser-world-selector.mjs` already writes a supported completion
profile, navigates to a fresh document and checks Mission 3 availability, completed
glyphs and replay labels. It never launches that restored recommendation.
`tests/campaign-profile-recovery.test.mjs` covers independent profile restoration
alongside valid and invalid checkpoints, but stops at the store API. The selector
availability tests separately exercise pure campaign helpers.

The missing connection is fresh Home restoration with **both** a completion
profile `[1, 2]` and an older Mission 1 checkpoint, followed by the selector's
public **Start Mission 3** handler. The new test executes the actual Home startup
effect, its selector props, the actual selector component and Home's actual
`startMission`/`beginLoad` handlers with the real game store. It checks completed
labels, the selected/enabled recommendation, mission 3 at turn zero rather than
the saved turn 217, and unchanged profile/checkpoint records. A subsequent fresh
store still restores the original independent records without auto-loading.

## Evidence and limits

Tested code: `c64a43af27523ffd394948c24065c92012f9b8b9`.
Test SHA-256: `5708262220bf46db35f3ff872a86a2690ab3dc6baa168808544e14987b981ca4`.
The [portable review bundle](review-bundle/README.md) includes the exact diff,
source identity, commands, raw output and original/published receipt hashes.
Its verifier passed for the pinned head, source and both receipt identities.
Fresh independent source review accepted that code head without findings and
confirmed the route and synthetic-boundary limits below.

- **Passed:** 22 focused tests across the new route, selector availability,
  profile recovery and profile union; affected-test ESLint; application diff check.
- **Synthetic boundaries:** existing IndexedDB fixture, React hooks, child
  artwork and presentation setters. The public selector button's event handler
  executes directly; no browser pointer, focus, layout or persistence claim.
- **Not run:** browser, full suite/build. Browser scope and lane remain subject
  to parent coordination. The test does not traverse New Game/recommendation UI
  or simulate closing/reopening a browser process.
- Seeded completion is fixture input, not naturally earned victory or campaign
  progression. Broader issue #17 acceptance stays open. This does not repeat
  #492's paused-world return or #499's loss/restart coverage.

No behavior discrepancy was demonstrated and no product fix was made.
