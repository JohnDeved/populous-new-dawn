# Current-UI portrait rendered acceptance: source proposal

This is a scenario definition, not a browser receipt. No screenshot, native
execution, framebuffer equivalence, full-suite result or fresh runtime result is
established by adding these files.

## Source identity and limited reconciliation

Base: existing Draft PR732 commit
`672d6a4d19f43a78a7cd2d7b4daefca777635289`, tree
`58496b983dfb0db38d3e1e330e05efa54b8b9333`.

The scenario derives from PR706 commit
`d214e3d20aaf6d226c1e0eb946fd8a160c5a1e00`, path
`scripts/local-render/shaman-portrait.mjs`, SHA256
`3b7037cb5fa03161dae99b556f720c23dff261235c98032bf8bb7ec3e9119c86`.
That donor cannot be executed unchanged against current UI: its lines 40–41
require a removed Pause button and unguarded Escape; lines 121–128 assume a HUD
combobox. This proposal changes the acceptance route, not production behavior.

The independent pixel oracle `scripts/local-render/shaman-portrait-pixels.mjs`
remains byte-identical, SHA256
`ad7dd31331944b4eb95634108b7e91a4ab030f1a65d5d04d5e4f2c45ee78b57e`.
The native descriptor remains unchanged. Existing mounted-control tests and the
published 332 focused tests plus 30 syntax checks remain their own source-bound
receipts; they do not execute this later scenario or certify its rendered output.

## Two different kinds of evidence

1. Ordinary on-foot Mission 1 controls: explicitly request the harness's native
   campaign route, not its default diagnostic mission picker/availability setup.
   Await the existing action-specific portrait readiness observer while the
   world is running, retaining its canonical flags4 0x880 and gameFlags 32 gates;
   record its samples before pausing. Do not substitute generic H readiness.
   Pause with the existing observed public Space helper, then clear targeting
   and the cohort with the existing guarded Escape helper. Empty state emits no
   Escape. A real open message is a blocker, not permission to acknowledge,
   delete, hide or collapse it. Select a brave through its mounted control.
   Preserve all eight repeated primary/modifier checks, the Enter/Space keyboard
   check, four secondary/modifier focus checks, unchanged left-focus position,
   additive group, canonical source commands/orders, RNG, turn, pause and sounds.
   Also require the portrait to remain reachable within the 1280×720 viewport.
   No World mutation, forced stepping, clock override or private selection is
   used in this phase. The canonical command observer imports the real
   `/app/hud-person-source.ts`; an unavailable import fails rather than weakening
   command coverage.
2. Separately supplied presentation fixtures, only after those controls pass:
   alive → HP zero → absent → returned, at integer 1× and 2× scale, each with
   normal/hover and black/sand background. These 32 comparisons retain the
   independent frame alpha 85/255 and opaque-interior oracle, including exact
   requested integer scale. Public Menu → Options → Browser compatibility and
   help uses the existing cyclic HUD row, then returns through Back to Options,
   Back and Continue Game. It must restore its preexisting pause. The fixture
   does not prove natural death/reincarnation timing, occupied-vehicle behavior,
   native rendering cadence, transport semantics or hardware performance.

The supplied HP/unit membership and inline background are restored on success
and on a failure while the same World/Scene owner and time budget remain valid.
A lost/aborted owner does not authorize late cleanup gameplay actions; its
context belongs to harness teardown. The first failure is never replaced by a
cleanup error. The dedicated browser context retains the public HUD preference
and viewport changes until teardown; these are not external-profile restoration
claims. This scenario must not run against a user's persistent profile.

## Bounded ownership and cancellation

One total scenario deadline and abort signal covers the scenario's awaits.
Every delegated page/locator action has pre/post checks for the pinned
Scene, Store and World identities (including a replacement Store returning the
same World), playing Mission 1, connected renderer, input mask, pause,
modal/overview/fullscreen/foreign-menu ownership and unchanged campaign records.
Only the explicit Options round-trip may own the native modal. The adapter
retains Playwright Locator identity and guards its real `_expect` attribute wait;
it does not replace the native row with a synthetic CSS-only assertion.

The unchanged portrait-readiness, pause, cohort-clear, Options and pixel helpers receive this
bounded adapter. Consequently a late await cannot launch another click, focus,
Escape, RAF request, screenshot, fixture change or successful report write.
An already-dispatched browser operation is not cancellable by a Promise race
and may settle after rejection; an in-flight screenshot may finish writing.
No stronger remote-cancellation guarantee is claimed. Passive Space observation
has its existing in-page expiry; reference disposal performs no gameplay action.
The owning harness must close the failed context and account for any partial
artifacts before reporting terminal cleanup.

`openMission` is a harness closure bound to its original raw page. The scenario
bounds its own wait and guards immediately on return, but cannot retroactively
wrap that closure's internal actions. Its existing harness lifecycle/abort and
context teardown remain a separate prerequisite. A mocked late entry test proves
only that this scenario does not bind or act afterwards. No harness repair or
broader lifecycle cancellation claim is included here.

## Source/mock checks and prerequisites for any future run

`tests/shaman-portrait-scenario.test.mjs` exercises actual shared input/Options
helpers against isolated mocks, including the actual Playwright attribute
matcher, both initial pause values, targeting then group cancellation, empty
clear, failed pause/clear, popup races, World/Scene replacement, ownership
changes, including same-World/different-Store replacement, stalled
entry/readiness/input/Options/RAF/hover/screenshot/decode stages, deadline
and abort, late oracle continuation and primary-error-preserving cleanup. A
strict source adapter tests the complete scenario counts with explicitly mocked
pixel results. It cannot produce rendered evidence. Source assertions bind the
unchanged independent oracle hash and the actual helper fingerprint imports.

Before execution, independently review the exact candidate and a bounded input,
source/import, dependency, artifact-output and owner plan. Do not run a browser,
syntax check or these tests merely because the draft exists. Future browser
admission must identify a real build, expose the actual source-bound read-only
observer hooks, use a fresh owned context and provide explicit process/resource
limits, abort handling and terminal evidence. Review popup ownership and compact
reachability rather than masking real panels.

There is already successful hosted production compilation for exact base
`672d6a4d`: Cloudflare workflow run `39910945247`, attempt 1, frozen pnpm 11.25.0,
`PND_CLOUDFLARE=1 pnpm run build` / vinext build. Artifact `12482603383` is
104136593 bytes with SHA256
`73b8399bdf46eec94e6decce561615c987f87056bded0825012ca8f1d2714893`.
That compilation need not be repeated merely to close the same build gate.
Artifact reuse for this scenario is conditional: the local-render harness needs
its observation bindings and the canonical TS module URL. A production artifact
cannot be assumed to expose these or to equal a differently configured Home
fixture. Downloading, extracting, serving, modifying or browser-testing that
artifact has not been admitted by this source proposal. Full-suite/typecheck,
updated-main synthetic merge, rendered acceptance and deployment remain separate.
