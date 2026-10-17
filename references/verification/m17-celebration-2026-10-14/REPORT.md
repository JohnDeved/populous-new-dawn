# M17 victory celebration point projectiles

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/verification/m17-celebration-2026-10-14), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Base: f2e97561be4e186db1d24a1c161a8f4958ea9180.
Initial tested runtime: ede773bf7e848ba57fb9a1903001a582d6d97b37.
Final factored runtime: 584d40aebd4a18bb2adb37a0788697acc3f0406c.

## Actual failure and causal repair
The ordinary stronger-force M17 retry naturally won at turn 6784. Result-camera
processing then threw at 6792 in the unimplemented Firewarrior celebration
projectile callback. The original failed receipt and partial terminal are retained;
no continuation uses that partly advanced state. The separate earlier observer
failure (assuming an arena effect persisted after victory) is also retained.

Native 004e0af0 calls 0051fbf0 with a null actor and explicit sky point. The new
point-only path creates two actual effects, uses the current person's heading,
side offsets and supportHeight +16, preserves exact sky destination, records the
native cooldown, emits trails, retires upon arrival and plays the secondary
arrival sound without actor damage. The ordinary actor-target adapter is unchanged.
Static original sources were only read/disassembled, never run or emulated.

## Historical inputs and baseline
The committed won-terminal fixture SHA256 is
446756fc1241f1a0a52f2a87f096788321e6022b15ec48d4c4e181c191dc0538.
Player replay uses the original arena-resolved terminal bytes
 aab90067763aa6966192bb333133b28682f3cb6d5b98120d5ca95cfe4eea5434.
Both are actual turn-6784 worlds; byte identity between them is not asserted.
The baseline expected-throw diagnostic imported the player's original 3de90382
actual-clock driver/runtime; app/public/dependency contents equal merged base f2.
Its receipt is an expected-failure assertion pass, not successful camera completion.

## Independent ordinary continuation
From the genuine won-6784 checkpoint, the independent exact-ede replay reaches
actual camera settlement at 6799, input mask zero. First point shots 15420/15421
and real trails appear; both shots have retired by 6879, with 36 unique point shots
observed across celebrating survivors. Full clock Save/Load twins, every live
person pose and all registered cell chains agree throughout. Synthetic profile
17, fresh restore and public store destination 18 pass at 6879.

The campaign lineage is explicit: fresh public restart on merged 5fad3dbc;
source switch at genuine 5355 for the independently reviewed route-cell fix;
source switch at genuine won 6784 for this celebration fix. This repair does not
retroactively turn the earlier lost attempt into a win.

## Tests and gates
Final exact584d full check passed: 408 test files, 2627/2627 tests, TypeScript,
parity and orchestration checks. Source/test hashes verified in coverage.json.
Production build, changed ESLint, formatting, normalized baseline Oxlint and
Fallow health passed. The build retains existing tool warnings; no failure.
The supplied geometry tests cover zero/nonzero
support height, two sides, exact destination, flags3 Bloodlust cooldown, two launch
sounds/one arrival sound, no actor/building damage or stock/mana debit, long wrapped
flight beyond 16 visits, retirement and serialized twins. The genuine checkpoint
test covers 80 animation-clock visits with complete migrated-world twins.
Initial supplied-fixture migration comparison exposed unnormalized added-building
footprints; the supplied case uses a serialized twin and the genuine case retains
migration coverage. A new cooldown assertion initially assumed 12; native constant
shift 3 gives 3, corrected with the failed 33/34 focused receipt preserved. No
existing test expectations were changed.

## Scope
CPU actual-clock gameplay and synthetic persistence, not rendered victory/Continue
or browser-storage acceptance. Native allocation failure/order, illumination,
nearby friendly reaction flags, LOS, tower/vehicle-specific launch effects and full
class8 rendering remain unqualified. The existing nativeDistance uses integer
Euclidean approximation. Original complete AI/Armageddon controller parity remains
held. No hardware performance claim is made.

## Final review and recovery history
The initial ede revision introduced one real additional Oxlint dependency-cycle
error: live-people imported firewarrior, raising diagnostics from 1408 to 1409.
Independent review required a narrow extraction. The final point module receives
the existing effect/sound hooks; its caller supplies the same nativePosition.
It imports only leaf helpers and types. Ordinary actor-target code remains unchanged.
Exact normalized diagnostics now match the baseline: 1408 to 1408, zero added or
removed. No rule or warning was suppressed. A transient new interface-style
error during factoring was repaired before freezing the final source.

The baseline comparator initially found zero files because its nested work path
was ignored; the same baseline source was moved to a sibling directory and given
explicit configuration. Failed comparison attempts remain in the packet.
Two earlier whole-check attempts have no terminal result after environment
interruptions. Both unknown receipts and logs remain unchanged. The separately
owned recovery-check was explicitly interrupted by Ctrl-C with terminal exit130
after review identified the source change needed; its partial run is not counted
as an aggregate pass. The final frozen-check starts from revised584d.

The independent player replay repeated the genuine won6784 continuation on
584d, with a uniquely named final-qualified-584d receipt. It again settles the
camera at6799 and completes all point-shot/trail/retirement, strict native
cell/live-pose, twins, synthetic profile17, fresh restore and public18 checks
at6879. Earlier receipts remain preserved.
