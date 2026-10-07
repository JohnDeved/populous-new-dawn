# PR254 merge and provider verification

[PR254](https://github.com/JohnDeved/populous-new-dawn/pull/254) merged at05:07:09Z on2026-10-07 as
`a8e85a64376fbabe24b85e46ff02da8ba0a43676`. GitHub's merge tree
`0233947f76a06de666f549a284dca28a736dbf76` exactly matches the locally tested
`d323ccae2b42b460dadc0cb07f6368f967aa21b7` tree. Parents are accepted
`e3a7a06a4250457502288d5b4c4e4ad8f3b40b53` and the tested head.

[Cloudflare provider check112641413025](https://github.com/JohnDeved/populous-new-dawn/runs/112641413025) reports completed/success
at05:08:48Z, bound to that exact merge. Build
`31d0dab7-b15c-4da0-a2b3-d8ffb2ed0062`; version
`debe6db1-d99f-4532-a0b7-9907f18869c2`. This is provider-reported success,
not a new production gameplay or browser test.

Issue252 independently reads closed/completed at05:07:10Z, and the main ref
reads the same merge commit. This closes the startup root-height issue only;
it does not claim broad animation completion.

[Final independent ACCEPT](https://github.com/JohnDeved/populous-new-dawn/blob/9f53db3de30e5eca1844bb73a82d0da93bcdf55e/references/verification/startup-burst-height-final-gates-2026-10-07/attempt-02/result-review.json) and
[raw final gates](https://github.com/JohnDeved/populous-new-dawn/tree/9f53db3de30e5eca1844bb73a82d0da93bcdf55e/references/verification/startup-burst-height-final-gates-2026-10-07/attempt-02) retain all1,392 passing tests,
required format/ESLint/check/build passes, exact unchanged startup diagnostics and
owned cleanup. Oxlint's six inherited errors/32 warnings and Fallow-unused findings
remain failed/advisory; they are not relabelled passed.

[Accepted ordinary comparison](https://github.com/JohnDeved/populous-new-dawn/blob/410b793802a849b563ee710705f3504eaa87b53b/references/verification/startup-burst-height-ordinary-2026-10-07/ordinary-pair-review.json) includes genuine
presented turn39 burst images: [before](https://github.com/JohnDeved/populous-new-dawn/blob/410b793802a849b563ee710705f3504eaa87b53b/references/verification/startup-burst-height-ordinary-2026-10-07/baseline-attempt-01/mission-1-startup-burst.png) and
[after](https://github.com/JohnDeved/populous-new-dawn/blob/410b793802a849b563ee710705f3504eaa87b53b/references/verification/startup-burst-height-ordinary-2026-10-07/candidate-isolated-attempt-02/mission-1-startup-burst.png). The440 matched samples cover all256 Mission1
particles with equal nonheight fields. Native one-arrival/raw-terrain/disabled-audio/
two-supply limits remain in the linked original proof; no whole-startup or old-stone
parity claim is added.

[Exact readback](readback.json), [GitHub merge data](github-git-commit.json) and
[provider check-run data](github-check-runs.json) preserve the evidence. This note
used read-only GitHub and immutable Git-tree reads. No further package gate,
browser/native run or old-quarantined-resource access occurred. The interrupted
old attempt/loan remains unknown and untouched. The independent new dependency
copy stays idle in place; any later transfer requires its own receipt.
