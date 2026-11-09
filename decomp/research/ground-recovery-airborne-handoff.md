# Failed ground recovery handoff

Native 004e6d00 clears persistent horizontal velocity, clamps only negative
signed vertical velocity to zero, computes ground velocity through004e93f0 and
applies the physics-row limits. If a nonturning blocked step cannot recover via
004e9720 and004e7880 reports unsupported ground,004e7193 sets flags2 bit0x80000.
It then takes the common position/route tail. Airborne physics runs on the next
person visit, without a new order, state, teleport or second same-visit update.

The complete shared person-physics helper already implements this branch. The
lighter moveLivePerson adapter previously discarded recovery failure. This patch
composes the same conditional handoff with the existing live impulse owner and
retains the newly calculated capped ground velocity instead of stale combat
impulse fields. The current collision/physics walk-mask-zero adapter is retained.
Other ground visits retain their prior persistent-velocity behavior.

Focused controls are explicitly supplied motion states on authored M22 terrain:
all22 blocked probes, supported failure, successful alternate recovery, turning,
zero speed, signed vertical input and cap, exact owner/registry, unchanged
handoff-visit clock/position, and public checkpoint through subsequent physics.
The ordinary staffing-composed campaign witness is validated separately. No
occupied-vehicle motion, general clock rewrite or native rendered parity is claimed.
