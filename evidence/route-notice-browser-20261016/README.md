# PR497 final browser evidence

Product head is frozen at **a0bcf7dfa3dbf2491cfb9fb3c01d138cca005cd9**.
This branch adds evidence only. The baseline probe head is
**dd109c8cf68a6bfad1e6f50b58b67b2093f8efc8**; its `app/page.tsx` is byte-identical
to main base f85a8105fd77c71547fe5cd01594d3467c47b098 (SHA-256
6ff8a8e39d65c96bd298a30765c378b9336a7f44efa067290ce53dd6222c40dc).

## Final results

All four final managed-profile runs passed with stable source, unchanged dependency
metadata, zero runtime/console errors and verified cleanup:

| Run | Result | Elapsed |
| --- | --- | --- |
| Baseline modal lifetime | Expected bug reproduced for both prior pause policies: hidden notice expired while world/scene/canvas and turn/time stayed fixed | 21.3 s |
| Candidate modal lifetime | Notice and animation identity survived 3.4-second menu holds, Quit Level cancellation, selector Escape return, reopen and final close | 26.5 s |
| Baseline stale completion | Retained actual Home callback cleared a same-serial notice after public Restart Level | 20.2 s |
| Candidate stale completion | Retained callback preserved the replacement world's notice after public Restart Level | 20.5 s |

Candidate final expiry matched the remaining animation duration:

| Prior world policy | Remaining at final close | Observed expiry | Same animation |
| --- | --- | --- | --- |
| Running | 1733.319 ms | 1763.700 ms | Yes |
| Paused | 1700.018 ms | 1727.800 ms | Yes |

The paused world remained frozen after closing the menu while its ordinary
presentation timer resumed. The running world resumed simulation. The checks reject
replacing or restarting the animation and require expiry within 250 ms of the
measured remaining duration, rather than merely within another three-second window.

The corrected callback also binds the notice object itself. Fifteen focused tests
passed, including the actual requestTutorial producer reusing serial1 after completion.
All four cases in the reviewer's separate supplied probe passed when replayed against
the corrected source. That replay supplements, rather than replaces, independent review.
New JS lint, formatting and standard lint passed. Whole-Home ESLint retains the same
pre-existing effect error at line138; the earlier baseline comparison remains in the
original component evidence. No rules were disabled.

## Scope and warnings

Browser scenarios use actual Home, CSS, store and scene with public New Game,
recommendation No, Mission1 and Skip introduction. Notice publication is a controlled
presentation fixture. The restart probe explicitly retains and invokes the actual
React completion handler; it does not claim naturally delivered duplicate browser
events. Natural route-failure producers, native three-second timing, original
executables, Vinext/Cloudflare/RSC hosting and hardware performance are not certified.
Gameplay notification production, campaign and AI are unchanged.

Final Chrome: 155.0.8059.80, executable SHA-256
5f423d624250e67f2ae453400d485e7547a533a2f872232c54bb551a79bf552d.
Node24.18.0 on macOS arm64. Final launch uses the standard Playwright-managed fresh
profile, `chromiumSandbox: true`, and excludes `--enable-unsafe-swiftshader`.
The exact runner sources and launch options are included. Build cap120 seconds,
browser cap180 seconds, and each cleanup phase cap10 seconds.

Each final run records existing Three warnings:
`THREE.WebGLRenderer: Texture marked for update but no image data found.`
There are two in each final run except baseline replacement, which has three.
They are retained, not filtered or described as zero warnings.

## Retained unsuccessful and superseded attempts

Nine browser attempts are indexed. Two early successful runs precede the review
correction and stronger duration assertions; they are superseded evidence. The first
replacement probe saved its observation and screenshot but stalled in cleanup after
Chrome exited. Only its owned runner was terminated; outer command exit143 is retained
and the unfinished inner receipt is not promoted to success. Two further attempts
failed the explicit browser cleanup timeout, even though their observations completed.

An empty-page diagnostic closed promptly under standard managed-profile launch
arguments. The final four runs then completed with that configuration. Earlier
`ignoreDefaultArgs: true` and isolated-profile attempts retain their original labels
and runner sources. No failed cleanup run is counted among the four final passes.

## Integrity and cleanup

The [artifact index](review-bundle/receipts/work/orchestration/route-notice-publication/artifact-index.json)
records original local byte hashes separately from redacted publication byte hashes.
Private source roots, home and temporary-directory paths were replaced with markers.
Published redacted receipts do **not** retain their original byte hashes. The bundle
manifest hashes the sanitized files supplied to the bundle tool. No browser profile,
cookie, account state, browser history, build bundle or node_modules is published.

The [portable bundle](review-bundle/README.md) verified 17 source entries and 53
receipt/script entries against the creation command's caller-supplied identities.
Its tested diff SHA-256 is
791c61916f079684a2112a6f95c57336e4dfe181cf0dac320b4851024641ad50;
manifest SHA-256 is
03d2df2a7725110196c71a5ff6a8479a239a55ab5830b9aaaa1e70c5db6d4aba.
[Screenshot hashes](screenshots.json) bind eight final images to their exact heads.

[Cleanup proof](review-bundle/receipts/work/orchestration/route-notice-publication/lane-cleanup.json)
at 2026-10-16 17:01:42 UTC confirms all four final cleanup results, no listener on
port5198 and no owned runner process. The Mac browser lane was released then.
No more browser run was performed for this publication. Full hosted CI and final
independent review remain with the parent; no PR was marked ready or merged here.
