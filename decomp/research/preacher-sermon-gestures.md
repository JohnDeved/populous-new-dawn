# Preacher sermon gestures and original artwork

This issue214 slice restores the reachable on-foot sermon gesture producer and
its missing artwork. It does not close issue214 or establish whole-sermon,
full audio, original OS-game or hardware parity.

## Changed live boundary

`stepLivePreaching` passes the actual World.cosmeticRandom reference and player
tribe into the existing command17 handler, also shared by commands31/32. State10,
physics/routes, normal order ownership and fight/flight precedence are unchanged.
Command17 has ordinary idle and computer-order producers;31 has the occupied
Tower producer. Consumer support for32 does not prove its ordinary producer.

Original0043a4d0 selects objects95/97 with f1=1/f2=0, including assignment16 on loop
entry. The new stationary substate3 branch runs only after timer increment while
it remains below840. At counter modulo16 zero, an inactive gesture consumes one
cosmetic draw: residues0/1 select objects99/98, sources184/176, descriptor14.
Birth sets status bit1 and f1=1/f2=0. Active completion requires f1=0 and the final
source frame; it clears bit1 and selects97 without a new birth reset. The existing
logical updater owns advancement, including return168 frame0→1.

The existing simulation RNG, acquisition synchronization, global clocks, save
format and mixer RNG are preserved. Arrival fallthrough, turning-at840, phase4
entry flag and odd-counter command32 completion remain explicit residuals.
The added gesture decision/completion itself does not run at840.

On a successful birth, assignment64 from before acquisition requests cue51 or189
according to the actual player tribe. The live callback reuses the owned-person
sound pattern: flags4 bit16 plus the unit ID/position. The eight WAVs already
exist; AUDIO_CUES now preloads both families. Enqueued requests and disabled/
missing-buffer owner cleanup are verified separately from audible output and
native sound-engine allocation/RNG equivalence.

## Native source and candidate replay

The accepted original run used source
`19c88e1ceabbfe28ed8524410aaf2b1dfaf6bd3d`, frozen manifest
`125acb5330e5487c7c5bd6438c13c2ec975ecb9d04538560ee9898d885b4a3b7`, and executable
SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Its independent review accepted **27 cases / 63 controller-updater pairs**, with
state/queue/scheduling/loaded counts and named audio/acquisition/world leaves
supplied. It did not execute the original world loop, renderer or OS game.
Research and complete baseline artifacts remain unchanged at research560fc1dd.

The candidate-only replay uses the identical accepted input and native rows:

```sh
python -B scripts/check-preacher-gesture-replay.py /path/to/accepted/run-01 \
  --output work/orchestration/preacher-gesture-fix/replay-02
```

The checker pins native/input/manifest hashes, binds candidate import sources
before/after, retains all four phases and every raw256-byte supplied record,
compares request ordering/snapshots, and keeps complete raw event differences.
Audio is request-only here; the live callback's flags4 write is not masked out.
The precise residuals are the three timer839→840 cells' phase-entry flag, the
turning cell's assignment/mode/simulation word, and the odd-command32 return/
release. All residual case/phase/field/values are checked exactly. Native no-op
reveal/registration events in the supplied positive-listener cell and labelled
lower-setter intent are retained as adapter boundaries, not extra gameplay bugs.
No native expectations were rewritten and no original instructions were rerun.

## Narrow asset append

The existing units-only importer appends exactly140 VFRA frames and48 source
pieces: **5256 frames / 4170 pieces**, preserving all prior metadata and indices.
Blue/red Preacher signatures add source176/184 directional families with original
mirrors and VELE layers. All48 uncropped pieces fit the accepted32px rule: eight
subslots in the two empty old tail cells, then40 across ten cells in one new64px
row. Atlas dimensions are exactly **2048×8192**. Existing firing rectangles remain
fixed. The importer copies the old pixel area and writes only appended pieces;
repeat import is byte-identical and guards exact output counts/dimensions.

```sh
python -B scripts/import-original.py /path/to/game --units-only
python -B scripts/check-preacher-gesture-assets.py /path/to/game
```

The independent checker pins accepted169b baseline blobs and original inputs,
checks every new RGBA rectangle against retained decoded hashes, rejects overlap,
verifies every directional source/frame/layer mapping, and compares all old-area
bytes outside the exact newly assigned rectangles. New-row pixels outside those
rectangles must remain zero. There is no whole-image tolerance, crop or repack.
Full importer mode was not run; both modes call the same bounded append function.
Texture upload at8192 remains part of the separately coordinated rendered check.

## Portable checks and retained receipts

`tests/preacher-gestures.test.mjs` exercises the real live adapter and logical clock
from explicitly supplied phase/seed fixtures: both families and returns, active
checkpoint continuation, shared cosmetic identity, phase resets, pause, flight/
encounter ownership, normal movement supersession, player-aware owned requests,
late acquisition and preload/disabled/missing-buffer cleanup. Shared31/32 inputs
are controller fixtures, not ordinary producer witnesses. Completion uses
advanceGame; direct tick remains simulation-only.

The initial test-only checkpoint4795ee90 failed all12 new checks on the unchanged
169b application. At13a8625c,19/20 focused checks passed; the positive-listener
fixture had skipped initialization without supplying range3. That fixture was
corrected without weakening its assertions. The committed asset checkpoint
f4df0c95 passed59 focused tests, exact asset preservation and importer idempotence.
The first mutating import exited0; its generic receipt correctly says invalidated
because the three authorized generated outputs changed. That receipt is not used
as a passing gate. Subsequent committed, read-only checks have passing receipts.

Raw receipts are in `work/orchestration/preacher-gesture-fix/`; later checker/test
refinements and final source identities are bound in their own receipts. The
ordinary baseline at9a54c932/application169b is independently accepted. Candidate
natural gesture pixels, genuine Save/Load/supersession, full check/build and
TypeScript quality gates remain separately coordinated acceptance requirements.
The implementation changes no parity ledger. Local Git bundles and raw evidence
are unpushed and not reset-durable while normal Git publication is unavailable.
