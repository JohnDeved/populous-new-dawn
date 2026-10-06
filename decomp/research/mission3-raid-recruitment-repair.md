# Mission3 recruitment-origin correction and three-case replay preflight

[Issue228](https://github.com/JohnDeved/populous-new-dawn/issues/228) owns this
recruitment-only correction. Independent review accepted the controlled
[Shaman fallback](mission3-raid-recruitment-witness.md) and
[established-base value](mission3-raid-recruitment-established-witness.md) witnesses.
The new native replay is prepared, **not executed**; natural/checkpoint and standard
acceptance still follow the exact-source review. Normal Git publication is blocked.

## Runtime boundary

Only Mission3's type20 `select` callback changes. It uses
`constructionBase !== undefined` to select the retained native base-present
owner, preserving cell0; otherwise it uses the existing current living Shaman's
native even-packed cell. Other missions retain the callback's original destination.
Actual selector/flags7, world construction, selected-ID handling and flags3 copyback
remain intact. Shared `staging`/`input.staging`, all four later movement consumers,
`computerSelectionWorld`'s base/radius mapping and `app/computer.ts` are unchanged.
No general staging, radius, later-phase, or natural-identity claim is made.

## Failure-first and focused after evidence

`tests/mission3-raid-recruitment.test.mjs` runs the actual adapter against the three
complete retained native comparison records. The adapter also retains all ten task
records and all seven supplied Unit/LivePerson records before/after; internal
whole-world preservation assertions remain active. A separate portable-only edge
guard sets a valid established cell0. It adds no native case or native claim.

On **0ccced7804d192cd809bb815d0fe03a7ca762a3c**, with runtime unchanged, the control
passed and the Shaman, distinct-base and zero-cell cases failed. The source-bound
`portable-before` receipt and complete records retain those expected failures.
The raw failure stream has six whitespace-only diagnostic lines; preserve those
bytes. Maintained source passes diff checks; a whole-artifact whitespace check
reports these six raw lines.

On the formatted callback fix **c9aa91f6311a69b8b3b95b70c3435ad19743de8e**, all four
tests passed in3.37seconds with unchanged source/input identities and empty outer
stderr. `portable-after` retains the full records and receipt. These are focused
portable regressions against previously observed original results, not a new
native execution or natural gameplay acceptance. Source formatting was applied
only to the changed callback call; its sole additional change wrapped arguments.

## Native replay freeze

[`repair-preflight.json`](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/repair-preflight.json)
binds the changed source and all prior256 input paths, plus the three-origin
fixture and regression test. Including the new manifest itself, the next receipt
has **259 explicit inputs**. The only changed prior hashes are runtime callback,
native case-mode driver and portable observation driver. Earlier manifests,
fixtures, failed comparison receipts and streams remain unchanged.

Run `--all-origins` to select exactly the existing common-origin, no-base and
established-base-distinct cases in that order. Task/person/coordinate/presentation,
turn2047, slot/cursor0, empty orders and RNG fields are unchanged. The parent and
child bound the case count to3 and continue one request/native pair at a time.
Stop at the first declared output mismatch or any failure. No radius case or
portable zero-cell variant enters native replay.

Native entry/stop remain **004cb400 / before004cb6da**, with the real selector
and eligibility leaves, nine unpopped arguments, EAX result and complete native
bytes. The portable wrapper still asserts unchanged controller movement staging
and all roster/base/radius inputs. It records the actual recruitment destination,
now checked through the original comparison rather than an assertion demanding
the old incorrect script-defense origin. Its sentinel is after source flags3
copyback and before count/membership/person preparation. Comparison fields remain
selector/count/IDs/ranks/all flags3/task/RNG; unequal base/radius inputs remain
recorded separately. No assertion of original output or preservation is weakened.

All memory, time, instruction, trace, write and process bounds are unchanged:
16MiB TCG setter/readback,1GiB native address-space,256KiB scratch,30-second CPU,
60-second alarm,1,000,000 microseconds/2,000,000 instructions per call,128 trace
entries; one parked Node process with256MiB old-space,20-second deadline,
64KiB response,16KiB stderr and2-second shutdown. Maximum original calls is3.

Only after the short exact-source review and separate CPU4 grant, wrap this in
a fresh command receipt such as `work/orchestration/mission3-raid-recruitment-origin/native-after.json`:

```
timeout --signal=TERM --kill-after=5s 65s env PYTHONDONTWRITEBYTECODE=1 \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python \
  scripts/check-native-mission3-raid-recruitment.py \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe \
  --node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node \
  --manifest references/verification/mission3-raid-recruitment-origin-2026-10-06/repair-preflight.json \
  --all-origins
```

Natural raid/checkpoint and relevant standard/quality checks are pending; no full
browser run is part of this slice. The existing verified dependency tree was
receipted-renamed into this worktree with matching root/installed lock hashes;
its source now retains the exact lock-only stub. No install, copy or symlink was
used. Work remains local, **unpushed and not reset-durable**. Issue227 is unchanged.
