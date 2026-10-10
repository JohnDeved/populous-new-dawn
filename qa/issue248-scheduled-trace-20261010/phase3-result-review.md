# Independent completed phase 3 membership-input review

Verdict: **ACCEPT the bounded port observation at turn6485**, exact executed source `cf6b03f34bf6ffc9e9d6f59b9a033ea90c679e32`. The single mission capture and separately admitted offline projection both passed. The full registered class1/tribe2 state14 cohort contains three Warriors and one Preacher, all with current `computerAssignment=0` and absent `nativeFlags7f`. This does not accept an admission implementation, native parity, universal activation, specialist maintenance or issue closure. The earlier phase3/phase16 failed attempts retain their original verdicts.

## Actual caller and timing

One authored `createWorld(6)` used default seed1, initial194 units/zero buildings, active tribes `[true,false,true,true]`, and ordinary tick(1/12). Production code, AI/task inputs and opponents were unchanged. The first Chumara type20 allocation occurred at turn6475, slot2, requested4, target/origin12858, entity291, quotas `[0,80,30,0,0,0]`.

Three actual scheduled phase3 visits were captured as scalar metadata. Each controller and consumed callback delegated once; full live-world guards passed at every observation:

| Turn | Actual select call | Returned IDs / real actions | Result after controller and dispatcher |
| --- | --- | --- | --- |
| 6479 | select(3,3,47244) | [377,378,540], three select actions | selected3, remaining2, phase3 |
| 6482 | select(4,1,47244) | [455], one select action | selected4, remaining3, phase3 |
| 6485 | select(-1,0,47244) | [], no actions | selected4, remaining6, active phase4 |

The decisive raw capture is turn6485, immediately after the actual final dispatcher batch (empty on this final fallback visit) and task cursor advancement, before later gameplay. Earlier visits had already applied the three Warrior actions and the Preacher action. Callback-return, controller-return and post-dispatch task metadata remain separate. The enclosing tick then finished normally at turn6486; terminal tick state is not substituted for the turn6485 cohort. No further tick ran.

Task member order is `[377,378,540,455]`. Current registry state14 order is `[377,378,455,540]`; their order is not interchangeable and registry order is not a native-chain witness. Selection owner remains2 and dispatcher cursor advances2→3. No native task+0x31, route+0x26, native visit counter or chain ordering was synthesized.

## Complete registered cohort

The captured registry contains eleven class1/tribe2 people, in this Map order. All fields and owner matches below were independently checked against the retained raw world, not merely trusted from the projector output.

| Registry key | Model | State | computerAssignment | Distinct assignment field | Registered owner alias | Listed in task |
| ---: | ---: | ---: | ---: | ---: | --- | --- |
| 16 | 7 | 19 | 0 | 1 | native | no |
| 347 | 3 | 19 | 99 | 281 | native | no |
| 377 | 3 | 14 | 0 | 281 | native | yes |
| 378 | 3 | 14 | 0 | 281 | native | yes |
| 455 | 4 | 14 | 0 | 272 | native | yes |
| 482 | 4 | 10 | 0 | 272 | native | no |
| 540 | 3 | 14 | 0 | 281 | native | yes |
| 541 | 3 | 19 | 0 | 281 | native | no |
| 560 | 4 | 10 | 0 | 272 | native | no |
| 567 | 2 | 19 | 0 | 1 | native | no |
| 11 | 2 | 10 | 0 | 272 | entry | no |

The state14 subset is Warriors377/378/540 (model3, hp90 each) and Preacher455 (model4, hp55). All four are registered by identity to their native alias, have matching key/person/unit IDs and team yellow, and are outside buildings. No same-tribe registered state14 person is unlisted, dead, unmatched or represented by a stale alias in this capture. The observer's enumeration did not filter out those possibilities; the controlled tests separately retain them when supplied.

For all four state14 people, flags2=1090654336, substate0, vehicle0, immediateCommand0 and commandCursor0. Warriors have previousState19, flags3=262144 and flags4=671088896; Preacher455 has previousState10, flags3=264192 and flags4=536871168. All seventeen recorded person fields are present in all eleven registered rows. Raw unit `nativeFlags7f` is absent in every row and remains unknown, never zero-filled. The raw fields `assignment` and `computerAssignment` must not be conflated in reports.

The set is a complete **registered** class1/tribe2 population at this boundary, not all tribe units or a reconstructed native person chain. Warrior347's distinct nonzero computerAssignment99 and Brave11's entry owner remain in the evidence. This mixed-model completion rules out treating the observed input as Warrior-only. It still does not authorize a generalized admission patch or resolve specialist maintenance.

## Source, receipts and independent verification

Mission source is clean exact `cf6b03f34bf6ffc9e9d6f59b9a033ea90c679e32`; all333 app files remain byte-identical to base `4754e12d3590bde18656416514871b033de164be`. Independent post-run checks found no mismatch in any app hash, twelve named sources or eleven QA/package/dependency inputs. Stationary dependency target remains device27/inode538212. The original-body runtime wrapper hash matches the reviewed source.

Manifest `a213cb6c18e50b170a5e8caf0dc0ca31d30ce33a7aa212e9f80df66187e7a894` and launcher `c5c7dd28d48b2831aa86484b656d69160d405f4bb999707709559450fb8b1b64` bind the exact admitted CPU4 command. Mission started `09:27:04.704852+00:00`, ended `09:27:25.152973+00:00`, exit0, about20.45 seconds. Its before/after guards passed, no cap/timeout fired, and owned foreground child wait returned. Summary has stop reason completed-positive, phase3Visits3, completionTurn6485, terminal turn6486, no failure, unchanged production and clean status.

The separately admitted CPU4/20s offline command ended `09:28:09.357536+00:00`, exit0, 0.211202 seconds. Its exact capture/JSONL/summary/mission-receipt inputs remained unchanged, source guards passed and its foreground child returned. No model/runtime import, replay, browser, server or detached worker was part of projection.

An independent read-only built-in-only Node comparison deserialized the retained capture and checked all seventeen person fields, absent-field lists, task inclusion, registry key matches, every matching unit field, raw flag presence/value, all six alias candidates and authoritative identity against the compact output. All11 registered rows,11 matching unit rows and11 retained alias rows matched. State14/unlisted/unmatched derived lists matched. It did not import the observer, projector or game; it completed in0.028 seconds and confirmed unchanged capture hash. Mission and offline receipt/log/input hashes and sizes were checked separately.

## Artifact identity

All paths below are in `/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-packet-20261010/`. The raw capture stays local.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| phase3-capture-command-receipt.json | 2300 | eb6fcf3efb86751cb785866965c43c5dd886f6e99ff6e700e4adb70324e3bea1 |
| phase3-capture-offline-receipt.json | 1713 | f0ad316ee4fba2d6005e6a075e55101e55a4ddf1b758644a36731d59934ce9be |
| phase3-capture-run.jsonl | 50859 | f6f263d25178ab7835081ab3cdf7701e6c8e852df766dc51284306a0c5f96f85 |
| phase3-capture-run.summary.json | 25132 | d361dffe90eee54d66359df661dd2e4c137a13b18630cf21225c74aea4880cd9 |
| phase3-capture-run.completion.bin | 1400432 | 79368e7a9253dc13d3e163ae6e73a9ced7bad690172f509d2f98a806778ec236 |
| phase3-capture-run.cohort.json | 22444 | ca5ed62c80a414923ceefcfd1454a72526eb9383d9335ab3659f5af8c21d7372 |
| phase3-capture-stdout.log | 25133 | 505583837b663e3162da4f87b0f99b1c579468f62900b1d1612654ae03e7f0cf |
| phase3-capture-stderr.log | 284 | b2b330fd2a558b0e35ba16b0d022d979b1f7d74c6512237172ce4aec79a39a03 |
| phase3-capture-offline-stdout.log | 356 | 5c1ceeaf0313e0b5815eb761ad9a1fdceffba96537a34cfbc04341b2b5c230c8 |
| phase3-capture-offline-stderr.log | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |

Total retained raw evidence/receipt/log bytes are1,528,653, within the68MiB combined allowance. Exactly one completion world exists; no rejection pair was produced in this attempt.

This accepted result answers one scheduled port input question. It does not prove original typed backing identity, native chain composition, missing task fields, flag upper bits, universal assignment/release behavior, native specialist/prelude work, Mission1–3 impact or parity. Earlier failed captures remain failed and retain their zero-visit or accepted-prefix distinctions. No additional gameplay execution is needed for this bounded result.
