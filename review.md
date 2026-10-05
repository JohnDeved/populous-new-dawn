# Independent review

ACCEPT for the bounded supplied-state activation-order finding at
`10f168733815921070621842d8c025f35715a56d`. No blocking findings.

Reviewed `findings.md`, all three complete native probe sources, both native
receipts, the port source/receipt, source and input fingerprints, frozen
disassemblies, and relevant original loader, allocator, copier, head, class
dispatch, scheduler and sound exports alongside the maintained port callers.
This review did not execute native code, Node, a browser, a build, package
installation or Ghidra, and did not change tracked files.

## Evidence checked

- Raw DAT row101 is class6/model6 and has the sole link token104; raw row103 is
  class7/model23 at unsigned `(63744,35072)`. Frozen authored row/height bytes
  exactly equal the supplied DAT. Port source data selects these same objects.
- Every source-manifest and invocation-input hash matches, using the retained
  attempt01 source for its historical probe hash. Attempt02 differs from
  attempt01 only in supplied level_flags32 becoming0. The preserved failure is
  the initial-reset assertion, with no activation receipt or widened budget.
- Independently decoded all 15 full object snapshots and reconstructed every
  native terrain hash from initial heights plus changed-height vectors. The
  reported flags, state, counter, position, remaining value and terrain digests
  agree. Checked 1,475 frozen assembly byte rows against the hashed PE image.
- Native initialization produces state24/remaining64; real template suspension
  produces state0; the copier restores allocation-owned state24/counter1 and
  flags while retaining the template bit. The head directly dispatches the
  clone at `004fbb82`, returning to `004fbb87`, and remaining becomes63 with
  46 changed heights. State24 dispatch has no template-bit exclusion.
- The scheduler loads the successor at `004ec8aa` before dispatching. Allocation
  prepends the clone. The event receipt contains exactly one clone dispatch
  during activation and one on the next traversal, returning to `004ec8bb`;
  the latter yields remaining62/counter2 and 65 heights changed from input.
- Port live shrine creation occurs after the existing-effect loop and calls
  only the creator. Its supplied-world receipt has remaining64/63/62 on turns
  1/2/3. The first two per-call RNG, center and complete terrain hashes match
  native; terrain callback cells also agree after native low16 normalization.

## Limits retained

Acceptance covers this two-object native composition and declared stripped port
world, including all recorded interceptions. It gives no ordinary-play, complete
startup, mixed-class cadence, renderer, audio-playback or production-change
approval. The sound interceptor deliberately does not maintain the owned-sound
bit, so its repeated requests cannot establish native sound cadence.

For durable integration, preserve these boundaries and add the Node version to
the reproduction metadata; the current versions file lists only Python,
Unicorn and Capstone. This metadata omission does not change the observed
ordering conclusion. Source-bound TypeScript quality is non-applicable because
there are no maintained TypeScript changes.
