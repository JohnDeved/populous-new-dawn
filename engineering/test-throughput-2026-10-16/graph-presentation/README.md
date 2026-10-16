# Graph presentation regression

Independently reviewed test-only addition, batched into staged replay draft PR490. Executes the actual FpsGraph.update method with minimal output sinks, no browser constructor or replaced globals. Covers startup spike retention, averages recovering before peak expiry, automatic scale, graph points and the 120 FPS budget guide before/after ring expiry. No production behavior changes, zoom or performance claim.

Focused result: 11/11 passed, exit 0, 215.089ms total; new case 1.915ms. All receipt hashes match the applied files. Existing fast in-process resource classification retained. The focused.tap file contains Node's default spec reporter output.
