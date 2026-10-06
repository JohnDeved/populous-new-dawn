# Actual-port startup smoke review

**ACCEPT one CPU4 smoke** at exact clean head
`4656907be4bc2d97bff4cbf161963be1fe89ada4`, subject to the coordinator grant and
the exact CLI/caps in `port-smoke-preflight.md`. This approves only startup/output
shape validation of the retained 16 fixtures. It does not approve a native rerun,
full comparison, browser execution, resource expansion or retry.

Reviewed only the invocation/smoke delta against
`7526bc3da98958aaa71bf148bb62fede4fdd2583`. Removing `--jitless` enables the real
Node TypeScript import path; no alternate transpiler or dependency tree is added.
The direct-child guardian is unchanged, independently verified source hash
`8e6f0554629cadde243e742406b76a56b5c1fdc65743606f8dcffe398adfa461`.
Moving node_limits to module scope retains its hard 8 GiB address-space and
15/20-second CPU limits. Existing heap, child timeout, TERM/KILL/wait4, log/RSS,
parent, file and outer timeout limits remain active.

The smoke binds the clean source preflight, full application closure, probe
sources, actual tool identities and exact retained fixtures before/after. It
requires one actual export-hook exposure, the original caller hash, all 16 named
case outputs in order and bounded sequential visit records. It never compares
those outputs with native expected values, and reports passed-startup-only.
Input/import/resource/shape failure ends the attempt with retained evidence.

Independently verified: source-preflight-04 passed at the clean exact head with
matching before/after source and raw stdout hashes; port.mjs, cases.json and
host-check.py are unchanged from 7526bc3d; fixture SHA-256 is
`9ad6cabf2ddd1dbc7305816b6b795a9c62ca606a83218c3857f90d2d3a39561d`; retained
native.json is `977f01bd263bc7c49de959e8738c5538d7e14c637146b324a32dbfbf1fd0ba1a`.
`git diff --check 7526bc3d..4656907b` passed. No execution occurred during review.
