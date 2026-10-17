# Hosted pilot result: baseline qualification failed; candidate comparison skipped

Draft PR487, frozen head ae73280a0c092774a6b02518535a1370b755f52b.
Run: https://github.com/JohnDeved/populous-new-dawn/actions/runs/38904158157

The workflow completed successfully and uploaded its evidence. The research outcome is inconclusive, not a performance success. Exactly four baseline processes ran; none of the four planned ABBA processes or two candidate processes ran. No retry or additional host search occurred.

The four baseline median times were 2.667833, 2.6233505, 2.689972 and 2.615929 ms. Median max/min spread was 2.8305%, within the predeclared 5% guard. The corresponding p95 values were 3.290882, 3.097596, 3.091803 and 3.102910 ms: 6.4389% max/min spread, outside the guard. Warmup-window median ratios also failed in runs 2 and 4: 1.072088851 and 1.051301051 versus the permitted maximum 1.05. The decision logic therefore skipped all comparison processes, as designed.

All four runs exited zero with empty stderr. Their source/dependency fingerprints, original seven archived checks and new 256-phase output oracle matched. Runtime was Node 24.19.0 with npm 11.9.0 on standard Ubuntu 24.04 image 20261012.334.1. The runner exposed four logical CPUs and reported AMD EPYC 9V45; this does not establish dedicated physical cores or a particular CPU entitlement. Full raw metadata is retained rather than inferred.

No conclusion about candidate speed, FPS, smoothness or causally attributed regression is possible because the candidate never ran. This single host observation also does not prove all standard hosted runners are unsuitable; it establishes that this one bounded pilot did not meet its predeclared repeatability guardrails. Do not loosen thresholds after observing these results or rerun merely to seek acceptance. Candidate PR486 remains an unshipped allocation-reuse experiment.

Local review recomputed all timing summaries and stability gates and verified exact source/config/runner hashes, matching phase oracles, empty stderr and explicit skipped statuses. Independent review also verified the exact launched workflow and all seven script/config/document files, all 335 baseline Git blobs, every raw timing summary, all output oracles and the qualification decision. Artifacts contain all 128 warmup and 256 measured samples per baseline process, source/dependency hashes, safe host metadata, failure/skip receipts and install logs. The measured workflow head remained frozen throughout execution. This later evidence-only checkpoint archives that completed run; the opened-only pilot does not rerun on this push.
