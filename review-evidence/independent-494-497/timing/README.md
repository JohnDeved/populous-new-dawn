# Hosted timing observation: PR #494

Read-only comparison; no local performance run. Exact case names, unrounded seconds, raw-log hashes and group file-list hashes are in receipt.json. parse.mjs regenerates it from GitHub CLI log output.

| PR | Hosted run | PR head | Tested merge |
|---|---|---|---|
| #493 | [38928986066](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38928986066/job/117067789028) | 225c45a31dd5e9088fa28f1adc80c6208ff19101 | 93592e4726dcf681ec6931c3790647e47da3ffa7 |
| #494 | [38932314789](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38932314789/job/117079534784) | 2627823e2d81ae1f3651488d270ac71bbbc814c6 | fe2938e6c69442fe494e2db79a5030a08d4f7c4d |

| Case, seconds | #489 | #490 | #493 | #494 |
|---|---:|---:|---:|---:|
| Changed fresh plain person |18.36|23.35|24.04|14.38|
| Changed historical plain person |15.64|21.36|22.27|9.76|
| Unchanged fresh Balloon tower |21.06|25.91|26.77|24.82|
| Unchanged historical Balloon tower |18.42|23.83|23.29|24.03|
| Unchanged M18 sermon |28.93|36.53|36.95|40.69|
| Unchanged M6 raid timeout |27.52|36.95|37.37|36.09|
| Unchanged M16 checkpoint |18.45|23.32|24.03|23.46|
| Test-runner wall total |725.33|895.93|919.45|864.67|

Neighbor controls: [#489 run 38911100612](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38911100612), [#490 run 38914211820](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38914211820). Their suites differ; treat their totals only as context.

#493 to #494 observations: fresh case -40.2%; historical case -56.2%; total -54.78 seconds (-6.0%). Selected unchanged cases ranged from -7.3% to +10.1%. Group file lists match exactly (364 files at concurrency 2, 80 at concurrency 1). Both use Node 24.19.0, runner 2.337.0 and Ubuntu 24.04 image 20261012.334.1. The plain-person test file was unchanged through the three preceding runs; #494 changes it and evidence plus the resource fingerprint, with no production change.

These are observations from one run per revision, not a controlled causal estimate. Host CPU/load, scheduling, JIT and GC were not controlled. Do not attribute the entire suite reduction to #494 or subtract summed case savings from parallel wall time. The target reduction exceeds the selected controls in this comparison, but repeated matched trials would be needed to quantify causal effects.

Reproduce (requires GitHub log access; downloads only):

```sh
for run in 38911100612 38914211820 38928986066 38932314789; do
  gh run view "$run" --repo JohnDeved/populous-new-dawn --log > "$run.log"
done
node parse.mjs 38911100612.log 38914211820.log 38928986066.log 38932314789.log > reproduced.json
```

Compare parsed measurements and file-list hashes with receipt.json. GitHub CLI formatting/version differences can change raw log hashes; retained receipt hashes identify the original downloads. No raw logs are duplicated here.
