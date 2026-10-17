# Mission 6 refused-spell and blocked-route raid recovery

Static input: retained `D3DPopTB.exe`, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No original executable execution was used for this change.

## Actual failure and source control flow

A fresh Mission 6 opening earns Convert at turn 566 and recruits real followers
by 580. The authored first Matak attack starts at 6767 and reaches phase 6 at
6778 with four Warriors and its real Shaman. Bridge is allowed and affordable,
but its target is out of range. The previous browser callback returned whenever
spell bytes remained, suppressing elapsed time and settlement indefinitely.

Native `4d14f0` adds the active task count (`462750`) to elapsed before any spell
work. Refused and successful casts both reach the member settlement tail. A
settled group or elapsed strictly greater than 1800 takes the stored fallback.
Remaining spell bytes do not prevent either transition. The existing bounded
member-settlement implementation is reused without duplicating its side effects.

Restoring that ordering reveals the next ordinary frontier: the raid moves into
phase 10, issues a shared movement order, and cannot find a land route. All five
members become state 33, substate 2, animation mode 5 at 6942. The former phase
10 adapter neither advanced its clock nor released these blocked members.

Native `4cbbc4` increments elapsed, then visits each assigned member in order:
forced combat/flight states select phase 15; `4f39f0` release takes precedence over
proximity; a retained near member selects regroup. The release calls
`4f2440(0)`, clears orders, resets motion/default state, centers the idle anchor,
and clears its anchor flags. An entirely released or absent group selects phase
23. The final strict elapsed > 1800 timeout selects phase 11 without inventing a
new regroup coordinate. This change composes those branches with the existing
validated release leaf. Unsupported release fields remain held and cannot fall
through to proximity.

## Ownership boundary and retained adapters

Native recruitment completion at `4cb7e4..4cb7ff` assigns every selected state-14
person's byte +af to taskIndex+1 via `4f2440`. The browser still uses its admitted
`task.members` list; this change does not claim native assignment publication or
whole-object-list traversal parity. The unchanged spell callback also retains its
global tribe-Shaman lookup rather than enforcing task membership; the actual
Shaman in this ordinary acceptance is independently proved to be an admitted
member. Exact registered person identity and the
existing bounded release validation are preserved.

The existing proximity radius/selection adapter, native whole-group state-19 and
leader-anchor reset after proximity, nearby enemy retarget scan, and unsupported
release contexts remain separate. Pure ordering tests deliberately retain that
proximity adapter; they do not claim native later members remain unchanged.
Phase-10 spell casting is not invented: the native branch contains no direct
call to the phase-6 task caster.

## Ordinary acceptance and campaign frontier

Fresh corrected replay follows the same earned route. Phase 6 reaches fallback
18 at 6886, then 7/9/10 on the next three turns. The shared movement record 183
has five actual owners. At 6943 all five release, references retire to zero, and
phase 23 retires the task at 6944. Through 7089 the original Warriors and Shaman
remain alive, identical, and registered, with no retained old movement reference.
Public Save/Load continuation is raw whole-world equal.

The original failed Bridge assertion remains retained. This proves failed-raid
recovery, **not** a Matak land connection, Mission 6 victory, or rendered browser
acceptance. The ordinary campaign continues by qualifying the authored player
Land Raise route. Browser rendering remains blocked by the independently observed
WebGL initialization failure.

Supplied controls cover cast/settlement order, payload retention, strict timeout,
empty-member cleanup, registered ownership, shared-reference retirement,
unsupported release holds, and forced/release/proximity traversal order. Final
committed focused and standard check/build gates remain pending.
