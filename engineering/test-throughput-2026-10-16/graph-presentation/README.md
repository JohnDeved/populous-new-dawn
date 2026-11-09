# Graph presentation regression

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/engineering/test-throughput-2026-10-16/graph-presentation), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Independently reviewed test-only addition, batched into staged replay draft PR490. Executes the actual FpsGraph.update method with minimal output sinks, no browser constructor or replaced globals. Covers startup spike retention, averages recovering before peak expiry, automatic scale, graph points and the 120 FPS budget guide before/after ring expiry. No production behavior changes, zoom or performance claim.

Focused result: 11/11 passed, exit 0, 215.089ms total; new case 1.915ms. All receipt hashes match the applied files. Existing fast in-process resource classification retained. The focused.tap file contains Node's default spec reporter output.
