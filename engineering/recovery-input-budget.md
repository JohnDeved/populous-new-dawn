# Recovery introduction input budget

This is an explicit functional-contract migration, not a claim of faster input or a performance pass.

## Provenance

Commit `38072269e` introduced 2500 ms as a timeout on the retired public Skip button click. It did not measure a response-time SLA. Later `a74aa78e` bounded native state observation, Space delivery and verification together, and `985f2cfe` added real campaign-popup preparation inside that same allowance. Those stricter historical failures remain failures, not retroactively accepted results.

Hosted candidate `dbb9cd8c`, run `39678644125`, observed a valid public summary click taking 1754 ms: selector resolution, visibility/stability, scroll, trusted click and navigation completion all consumed time, without a logged obstruction or retry. The profile's full preparation exhausted 2500 ms at final owner observation. The pause job finished preparation in 1449 ms but expired during observed Space delivery. The trace does not isolate main-thread work from scheduling/transport costs.

## Opt-in setup callers

Only the profile's direct Load/new-mission entry and the hosted pause recovery's mission entry opt in when their runner supplies its existing absolute browser deadline. Other callers, including Mission10 and late-introduction readiness callbacks, keep the shared 2500 ms default unchanged. Local invocations without an outer deadline retain that default too.

Each opted-in action has one absolute deadline: the smaller of the existing public UI allowance and the remaining outer browser time. The profile allowance is 15000 ms (`freshPage` already uses that timeout). Pause uses at most the primary page's existing 25000 ms allowance, including its separate high-DPI contexts whose existing timeout is larger. This is not an additional allowance of setup time plus 2500 ms.

Initial preparation still observes owners, clicks each actual public summary, waits for its body to hide, verifies retained serial/open state, focuses the real world viewport and reobserves late owners. After this completes, a response deadline starts **before** fresh native-state observation, passive Space witness installation, trusted Space delivery and final verification. It is at most 2500 ms and is clipped to the already-running absolute action deadline. A positively witnessed popup rejection can repeat preparation only inside this same response deadline; it never resets either deadline.

Outer abort/deadline, setup expiry, response expiry, stale/native-completion races and original delivery errors remain observable failures. No pending operation may dispatch late Space after cancellation/expiry. Natural completion still sends no extra key, and accepted native input must preserve pause state. All original overall scenario/browser caps, gameplay turns, queues, stock and rendering assertions remain unchanged. Phase timestamps identify where the bounded action spent time. A response exceeding 2500 ms is still a failure.
