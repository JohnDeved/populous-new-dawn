# Mission3 retained loaded-Shaman cell: two-case before preflight

Frozen preflight; the [executed before witness](mission3-raid-loaded-cell-witness.md) is retained separately.
Runtime bytes remain exactly **1d41c72c**. The reviewer confirmed
that AI+0x5a2 is initialized0 by00461d70 and filled with loaded model7 even
coordinates by0048502d→00485b00 at00485b9a. Its004f6020 reader is independent of
live pointer+0x89d; no current-position or absent-clear writer is proved. Existing
three comparison passes remain valid only for coincident loaded/current cells.
The prior1301-test fullcheck passed on1d41; build/quality and new gates were held.

## Exactly two predeclared cases

`tests/fixtures/mission3-raid-recruitment-loaded-cell.json` preserves the previous
no-base task, six Braves and their list order, selection lock, turn2047, cursor0,
RNG, script defense point0x64fc and radius11. Native loaded cell remains0x60da,
base flag is clear and native base radius0. No radius case is included.

- `loaded-cell-shaman-moved`: keep seventh person307 and AI+0x89d=0x02000600;
  change only its active coordinates to0x8100,0x8100, packed0x8080, with matching
  browser(-135,119). Stored AI+0x5a2 remains0x60da. Source prediction: original
  IDs301,302,303/ranks2,2,4; current callback305,301,304/ranks118,120,122.
- `loaded-cell-shaman-absent`: remove307 from both supplied lists/world units,
  leave its unit-table entry0 and AI+0x89d0, and terminate person306's next link.
  The six Braves and stored0x60da remain. Source prediction: original IDs301,302,303
  with2,2,4; current callback origin0, IDs303,302,304 with130,132,134.

These are unexecuted predictions. No native movement, death, world loading or
reincarnation simulation is claimed. Full task/person before/after records remain
retained. Native stored Shaman cell/pointer and portable current/absent Shaman
cell are explicit distinct inputs; their inequality is not hidden by the output
projection or asserted as equality. Roster/command input equality still applies.

## Native and portable boundaries

Entry is004cb400; stop is before004cb6da, with actual selector leaves and unpopped
arguments. Task/person/stack write guards and complete byte assertions are
unchanged. The portable callback still stops after source flags3 copyback and
before membership/count/person preparation. Movement staging and selection-world
base/radius/current-Shaman mapping are unchanged.

The **lifecycle-only** `--loaded-cell` mode retains both named output differences
in order, then returns exit1/mismatch. It aborts immediately on any setup, input,
write, bound, import, mock or shutdown failure. Every other mode keeps first-
difference stopping. There is no automatic retry, other case or later phase.

Process/TCG/memory/time bounds are unchanged: one native process, one parked Node
peer,16MiB TCG readback,1GiB native address-space,256KiB scratch,30-second CPU,
60-second alarm,65-second outer timeout plus5-second grace,1,000,000 microseconds/
2,000,000 instructions per call,128 observed entries,256MiB Node old-space,
20-second deadline,64KiB response,16KiB stderr and2-second peer shutdown.
At most two original calls and seven people per case execute.

`tests/mission3-raid-loaded-cell.test.mjs` is also prepared, not run. It covers
both direct supplied states and controlled checkpoint round trips through actual
createWorld/migrateCheckpoint before calling the same real adapter. It preserves
the shipped level identity and moved/missing actor state, with no gameplay ticks.
It is a portable regression, separate from the two native cases; the native
fixture does not enable checkpoint initialization.

## Freeze, run and corrected scope

[loaded-cell-preflight.json](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/loaded-cell-preflight.json)
binds every prior259 input path with unchanged runtime and updated driver hashes,
new fixture/test and the expanded218-file portable import graph. There are no
external npm imports. Use all named source/tool files plus this manifest in the
fresh receipt. The older proof manifests/receipts remain unchanged.

After exact-source review and CPU4 grant only:

```
timeout --signal=TERM --kill-after=5s 65s env PYTHONDONTWRITEBYTECODE=1 \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python \
  scripts/check-native-mission3-raid-recruitment.py \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe \
  --node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node \
  --manifest references/verification/mission3-raid-recruitment-origin-2026-10-06/loaded-cell-preflight.json \
  --loaded-cell
```

Suggested new receipt: work/orchestration/mission3-raid-recruitment-origin/loaded-cell-before.json.
No original call or runtime repair has occurred in this preparation.

After the actual witness is reviewed, the accepted smallest correction is only
Mission3's recruitment fallback: retain constructionBase when!==undefined,
including0; otherwise pack the immutable authored missionPosition/campaignPosition
model7 record for the callback tribe, regardless of live actor presence/movement.
Mission3 owner2 has one record46 (-45,-105), packing0x60da. Existing module data
has no runtime writer and checkpoints retain level, so no new save field or
startup replay is required. Reincarnation sites and death positions remain
separate owners. Shared movement staging, radius mapping and other missions stay
untouched. Issue228 and all artifacts remain local/unpushed; local bundles are
not reset-durable. No further fullcheck/build precedes corrected final freeze.
