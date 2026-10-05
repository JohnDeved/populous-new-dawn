# Ordinary M1/M2 acquisition adapter

Refs issues 30 and 210. This implementation connects the accepted
[handoff](worship-grant-handoff.md), [presentation](worship-grant-presentation.md),
[replacement](worship-grant-replacement.md), [request-order](worship-grant-request-order.md)
and [clone producer](worship-grant-source-order.md) contracts to ordinary Mission 1
Lightning/Bridge and Mission 2 Tornado. This note is not browser acceptance or
completion of issue 30.

## Ownership

Authored mode-0/class-11 provenance is retained with the source head, reward and
link slot. Gift creation stores completion turn and a stable browser serial.
Only tagged phase-zero local gifts produce requests. Same-turn native clone order
is derived from descending authored-head visitation and ascending link slots;
only the request queue reverses that order. The existing payout loop remains its
owner. M1's conditional simultaneous pair hands off Lightning then Bridge.

The UI controller clamps only its valid pending gift to one; the next gift turn
alone grants stock and the separate gift counter. Tagged ordinary payouts stop
creating the unsupported generic birth effect. Vault spell gifts, mana, knowledge
and unknown legacy gifts do not gain eligibility. Legacy heads recover only an
unambiguous authored identity; existing old gifts never retroactively replay.

`page.tsx` owns synchronous automatic Spells selection and model-keyed button
refs. Its rare `flushSync` call runs from the scene task, before the handoff
returns. It preserves ordinary selected spell/build mode and runs again at the
native arrival event. It never awaits React/RAF or pauses world time. Missing
geometry consumes the request once, records a scene QA diagnostic and leaves the
ordinary countdown progressing; it does not create or later replay a controller.
Normal shipped acceptance must not take this exceptional path.

The origin cache belongs to the last completed scene render of the raised reward
body. It retains actual validity and that render's viewport, using the existing
normal/overview projection and correct Three-height conversion. Invalid, absent
and strict-edge anchors use the measured viewport center. The handoff freezes
all logical origin/center/target geometry; resize/HUD scale/DPR changes only the
separate draw mapping. Measured HUD-local target coordinates permit display
rebinding when Spells is temporarily unmounted. The independent older pulse keeps
its own target binding after replacement.

## Clock and presentation

`game-clock.ts` interleaves world, existing 24-Hz animation and nominal UI visits.
At ties the world turn and synchronous handoff drain precede animation, then UI.
The source-derived integer periods preserve pre-visit deadline sampling and
post-visit limiter selection: idle default 25 ms; activation can select 16 ms;
steady acquisition 50 ms; release returns to 25 ms for the independent pulse tail.
Configured normal 12..60 and bit2/bit1 limiter precedence are explicit inputs,
without introducing recorded mode or claiming measured original FPS.

Acquisition pause is user pause or land bit2. It retains the native pending-step
and initial cosmetic draw before the pause gate, the later sprite-frame stage,
and independent pulse work. Unrelated pause gates are preserved: user pause stops
world/24-Hz work; land bit2 only skips the existing turn body. Hidden pages skip UI
visits and retain residual time, with the existing visibility reset discarding
hidden backlog.

Logical commands retain the exact native integer visits. Uncapped drawing
interpolates positions for stable companion slots and the body between those
visits, with no RNG, simulation writes or extra particle generations. Native
frame/palette selection, trails, pulse, retirement and controller transitions stay
visit-owned. New/replaced bindings and zero-angle/nonzero-angle body anchor changes
do not interpolate across incompatible owners. Visible pause samples the current
owned position. This is a modern presentation adapter, not an assertion that
original GPU frames interpolate.

Cosmetic RNG remains shared with existing rendered Lightning. Native-command and
particle equality requires identical ordered intervening cosmetic consumers.
Authoritative body motion, arrival and lifecycle have no cosmetic RNG input;
whole-world or companion-identity equality across refresh rates with concurrent
Lightning is not claimed. The adapter's direct work never consumes gameplay RNG.

## Artwork and checkpoints

The [body raster source contract](worship-acquisition-body-raster.md) binds HFX0,
ordinary PAL pixels, crop offsets and the native rotation branches. Only source
frames 1059/1060/1068 are appended below the existing HUD atlas. All prior pixels
and rectangles are retained. AL particles/pulse reuse the existing sparkle atlas;
ghost trails reuse ordinary-pal blastTrail frames 318–321 at 85/255 opacity.
Final GPU/device behavior remains outside the accepted command proof.

World checkpoints retain both singletons, independent pulse, full particle and
trail state, reference geometry, request queue, clock residual and previous/current
commands for interpolation. Scene caches, canvas, tinted images and listeners are
transient and disposed with the scene. Restore binds display geometry without cue,
initializer, RNG or reward replay.

## Acceptance status

Portable native-receipt controller comparisons cover the accepted 17/10/3-case
sources; the separate eight-case original traversal proof covers the bounded
ready-gift composition. Runtime tests cover elapsed schedules, provenance and
negative variants, conditional same-turn priority, next-turn payout, cap/bit8,
pause/hidden, missing geometry, checkpoint continuation and immutable layout.
Original body imports have exact-pixel, crop, idempotence and corruption checks.

Fresh integrated source review, ordinary shipped M1/M2 browser acquisition,
actual pixel/geometry/tab checks, restart/resize/display-scale/save boundaries,
standard check/build, quality and focused performance gates remain required.
No issue closure, parity credit, whole-scheduler equivalence, original GPU pixel
claim or hardware FPS claim follows from the portable checks.
