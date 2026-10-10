# Issue248: failure-first raid membership caller regression

This test-only checkpoint is based on exact main
`4754e12d3590bde18656416514871b033de164be`. No production file changes.

Accepted static contract: local packet
`issue248-raid-member-lifetime-static-20261010/findings.md`, SHA256
`01d618aebc971d04688e60c560f4e0f91535ab338e1f445e1825146a18f60cbe`.
Independent static review: SHA256
`86a050ce922167808cb566ffedc8de1c00c08a50b5b64e181b6e6832f6078854`.
Native assignment producer: `004cb7b2–004cb813 → 004f2440`.
Native retirement: `004cca6b–004cca75 → 004f2520`.

## Controlled source boundary

Seven supplied cases call `withCampaignTribe(w,2,()=>stepComputerTasks(w,2))`.
They do not mock the selector/controller or invoke an assignment helper. The actual
dispatcher must advance slot2 to3, and the campaign wrapper must restore its owner.
The cases test a controller boundary; they are not ordinary campaign witnesses.

The successful phase3 cases cover the prior selection, another current state14
person absent from selected IDs, the final fallback action, and registered-owner
identity with stale native aliases. Negative cases cover unfinished quota work,
count-zero completion, and a selected person whose0x100000 flag prevents state14.
Phase23 covers listed and unlisted matching owners, foreign ownership, other tribes,
and a stale matching alias whose actual registered owner is foreign.

The supplied person0x2000 mask is already set, so either value of unrepresented
task+0x31 bit0 preserves it on admission. Known7f values0xa5 must become0xa4;
an absent7f field remains absent in the retirement case. No upper bits are invented.
The retirement's clear0x2000 assertion follows the leaf unconditionally and does
not need a task flag. Quota selection and phase23 avoid order dispatch/cleanup,
target collection, native route reconstruction, and world-history inference.

## Source-read fixture prerequisites

- `createWorldState(6)` supplies authored land/tables and a tribe2 AI without
  advancing a campaign. The test clears collections and supplies only its people.
- `addUnit` plus `createLivePerson` supplies full ordinary class1/model3 fields;
  tests explicitly register that same object and provide controller state.
- Turn0/tribe2 is a dispatch turn; task slot2 is the sole active task. The selection
  lock already belongs to slot2. Construction base0 prevents a Shaman fallback.
- State-table mask8 is clear for states14/10 and set for17. No housing/patrol/order
  or marked-person alternative is supplied; only the designated state17 fallback
  can be selected. The state10 negative control retains an entry owner so the
  actual selection adapter sees state10; a precondition checks that owner/state
  and the adapter's complete eligible set. An empty-path native-only state10 owner
  would otherwise be projected as idle17. The state14 initializer preserves0x2200
  and the assignment field.
- No state23 person or Preacher/Shaman is present. The original assist prelude is
  therefore outside these supplied cases.
- Nodev24.19.0 supports direct TypeScript imports. Dependencies resolve through a
  symlink to the existing stationary directory, device27/inode538212. No install,
  copying or movement is permitted. All source/fixture hashes are in preflight.json.

Historical phase6 fixture JSONs and tests remain unchanged. Their raw assignment0
and supplied-array admission are not reinterpreted. This test does not decide the
runtime task+0x31 representation, partial7f knowledge, array/reassignment policy,
fresh-owner reconstruction or legacy-save migration.

## Reviewed execution plan

After independent acceptance of this exact test source, execute once:

`taskset -c 4 timeout --signal=TERM --kill-after=5s 55s node --test tests/raid-member-admission.test.mjs`

This gives55 seconds before TERM and a maximum60-second process lifetime. Use a
fresh source-bound foreground receipt, retaining stdout/stderr, exact commit,
before/after source hashes and dependency identity. Expected result on unchanged
production is **three failing ownership assertions and four passing controls**.
Import errors, setup failures, timeout, or a failure before the labeled ownership
assertions are not the intended red. Do not automatically rerun after such a result.

No runtime implementation, original execution/emulation, browser, long campaign,
full check/build, publication or parity credit is authorized by this checkpoint.
