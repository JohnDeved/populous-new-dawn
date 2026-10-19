# Terrain height notifications and detached flight owners

Base: `f83de76560b0b597d7ebd06aeb91546e5a35f531`.

The existing spatial notifier in `decomp/generated/0044f2f0.c` marks the
visited object's flags2 bit 4. The existing resting consumer in
`decomp/generated/004d73e0.c` uses this interruption outside the goal cell to
return to the previous state. See [airborne resting dispatch](airborne-resting-dispatch.md)
for original executable identity, dispatch ordering and static evidence limits.
This change runs no original executable code or emulation.

The browser height notifier already marks native and builder person owners, but
omitted `u.flight`. `stepLiveImpulse` selects `u.flight` as the actual physical
owner; `stepLivePhysics` dispatches its resting controller before clearing 0x2004.
When the native alias is null or distinct, marking it cannot notify that owner.
Mark the flight owner as well, retaining both existing writes and all existing
positive-HP/outside-building eligibility, spatial indexing and radius behavior.
Shared aliases receive the same idempotent bit operation.

`tests/terrain-flight-height.test.mjs` calls the actual height notifier and then
`stepLiveImpulse` with registered, positive-HP airborne persons. It covers null,
stale and shared native aliases; duplicate notifications; outside-radius,
inside-building and zero-HP exclusions; native/builder-only recipients; and the
inside-goal no-transition branch. Outside-goal cases check one transition to the
previous state, one preparation/reaction/physics visit, interruption consumption,
retained cell identity, and a second visit without a repeated interruption.
Three tests fail before the one-line fix and all eight pass afterward.

These are supplied branch controls. They do not establish a natural campaign
producer of detached resting flight ownership. Existing public Blast and Save/Load
coverage exercises the shared-owner path only. No UI/rendering code changes;
no rendered-pixel, hardware performance or original-executable parity claim.
The Mission 19 canonical turn 32099 and signed-life anomaly remain untouched;
this is not an HP eligibility fix or a claim to resolve that separate blocker.
