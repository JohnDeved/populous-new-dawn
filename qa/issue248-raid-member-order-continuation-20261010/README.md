# Raid ownership across ordinary order cleanup: expected red

**FAILED as intended: one ownership assertion failed; two controls passed.** The separately reviewed test completed in 1.1602 seconds on CPU4, exit1. Every setup, cleanup, hostile-target eligibility, response-allocation/attachment and clone guard passed before the labeled assertion. This adds a distinct failure to PR309's earlier [three-red/four-control result](../issue248-raid-member-admission-20261010/README.md); that test and receipt were not changed or rerun. Production remains exact `4754e12d3590bde18656416514871b033de164be`. This draft remains expected-red and is not ready to merge.

## What the actual callers show

The supplied class1/model3/tribe2 person owns assignment3 and an uncancelled command19 at state10/substate1. It has no `assignment0x20`, no associated order object, no `workTarget` (+0x89), no other queue entries or immediate order, and no route/alternate owner. Its raid array records owner3.

- `cancelLiveBuildingAttack` clears the command and drops the sole native alias. The registry still holds assignment3, but the explicit raw-native selection query sees busy0.
- `syncLivePersonCells` removes the registered object. Assignment and ownership bit0x2000 are absent from the registry; the array still records owner3.
- `startLiveCombatResponse` succeeds and registers a new response person with assignment0 and ownership bit0. It has one automatic command21 reference. Clone/query readback preserves this mismatch: assignment0/busy0, array owner3.
- The retained entry-owner3 control and retained foreign-owner4 control preserve the same registered person, assignment, ownership bit, known7f byte and matching roster through all callers and clone/query readback.

The final failure label is `missing raid ownership continuation: ordinary order cancellation must retain the registered person`. Known7f remains164 in all cases. Both simulation and cosmetic RNG remain unchanged. No import, setup, allocation, control or timeout failure occurred.

## Source contract retained with this evidence

The [accepted cleanup report](cleanup-source.md) and [independent byte/source review](cleanup-review.md) establish that this ordinary `00436ca0 → 004364d0` closure preserves person identity and +0xaf. Target reservation and order reference cleanup are separate. The report also resolves a valid distinct target branch; this port test explicitly supplies +0x89=0 and skips target mutation. No unresolved executed leaf remains in that finite original case.

The five existing exports are immutable and hash-pinned in the [exact registry](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/exports.json):

- [00436ca0](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/generated/00436ca0.c), SHA256 `1f9230efa60fe8029321ddab04755b8d073e5d8a8f53c87b90fbd9d6c2e854e6`
- [004364d0](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/generated/004364d0.c), SHA256 `694cf0f4dfbfe3ec7ada8b812b360d227443c43e44910bcd5a0dc0187a852553`
- [004da1d0](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/generated/004da1d0.c), SHA256 `e80a2a24b40c424b9d6867a26c2a8aad383695b703e80c26c9b01184113916a0`
- [0051ff40](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/generated/0051ff40.c), SHA256 `c125d6352116011a69e7bc5341dd0c032286b5f90ccc0553d0718054bb2c5829`
- [00501be0](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/generated/00501be0.c), SHA256 `8d73cfd000427bf623ca938d9f22c9bb5b6cc7a91a55826604e437336e12d822`

Original EXE SHA256 is `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, size2275840. Only existing exports and data-only instruction inspection were used. The broader [published admission/retirement contract](https://github.com/JohnDeved/populous-new-dawn/blob/15470e43c06cebb5bc03db4707b449a6e69f9c1b/decomp/research/raid-phase16-target-persistence.md) remains separate.

## Reproduction and scope

Tested source: `20f22f5908eddab2cf8b164c5d2a119b5dd4bbc5`. [Test](../../tests/raid-member-order-continuation.test.mjs), [proposal](proposal.md), [26-input preflight](preflight.json), [source acceptance](test-source-review.md), [result acceptance](test-result-review.md), and [failed receipt projection](receipt.json) retain the exact command and raw artifact identities:

`taskset -c 4 timeout --signal=TERM --kill-after=5s 55s node --test tests/raid-member-order-continuation.test.mjs`

One run only, after independent source acceptance. Source and stationary dependency identity were unchanged. Raw receipt SHA256 `ed75dac07d7e3c01aceef749b204ea81af26dfc9906498e9ac7f5af86ac68ae9`; stdout SHA256 `fd2a6a6fe69b6983648b17f2cbc6427cdf91283f84d09707840fe5e8913b8262`; stderr empty.

The next implementation decision can use this finite retention boundary rather than choosing retirement as a policy. Runtime edits remain held pending accepted scope. General task+0x31 behavior, unknown7f bits, array/reassignment agreement, other fresh-owner paths and legacy-save migration remain open. Explicit raw-native query mode and mechanical structured-clone readback do not establish every selection caller or original save parity. These supplied cases do not establish a natural campaign witness, Mission1–3 impact, or a full native allocator/combat-response lifecycle. No campaign, native, emulator, browser, installation, broad gate or gameplay-parity run was performed.
