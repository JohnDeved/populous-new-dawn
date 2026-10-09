# Mission 2 camp inspection: source and focused result

Verdict: **ACCEPT the bounded implementation and focused result** at
`b34e79e341a1ef754a812a1adedf67ad1319941a`. Type/quality, ordinary browser evidence
and final standard checks remain separate pending gates. Reviewed 2026-10-09 UTC.

The controlling baseline admission is SHA-256
`2252161b2a8a306ec1ccb7c270a2757c8966139bb306f3176cee9494ee64ced8`; its exact
failure-first result review is
`56e5bb0b32d14fdc4983f79f10ee8a279cc8ac50163f4c656403073ef81ff491`.
The implementation delta from accepted baseline `849aec41` has five app files,
the maintained check manifest, and two test files. No simulation, clock, Page,
World schema, imported data or native executable bytes change.

## Source conclusion

The shared completed-building eligibility extends manual records to living local
camps without an occupancy/activity restriction. First-display and queued real
right-button requests share the existing controller opportunity and revalidation.
Manual record creation/reuse, selected/held input and Scene disposal consistently
use the generalized building API. Existing automatic polling remains Hut-only;
the new camp producer is manual.

The painter preserves independent camp activity-0x80/dismantling-0x8000 and DOM
control ownership. Record expiry removes only its own retention when an active
camp panel remains. Activity ending leaves pointer/focus retention usable; leaving
both owners allows ordinary hiding. Existing training simulation and command
handlers are unchanged. This preserves the current browser adapter without
claiming the separately excluded native automatic lifecycle.

Building reservation IDs are deduplicated. Admission computes the additional
owner and reservation charge, so an already visible camp can transfer at 32 panel
owners/160 secondary entries without consuming a duplicate count. A genuinely new
owner still fails beyond those caps; existing retirement-before-failure and reuse
behavior remain. Physical native allocator equivalence is not claimed.

Explicit feedback remains after each admitted allocation attempt, including count
failure, with no release/stale/blocked feedback. The existing marker-coordinate
adapter and shared tooltip clock/panel-ownership limits are preserved.

All thirteen Hut test bodies differ only by the corresponding API renames. The
three initial camp tests are retained byte-for-byte, followed by four new caller
tests. They cover manual/activity coexistence and expiry, zero-delta full-capacity
transfer, failure feedback and stale/blocked input, and actual store migration plus
Scene disposal. Supplied activity and inventory occupancy are explicitly controlled
inputs; they do not establish natural training or native physical capacity.

## Exact focused result

Receipt:
`populous-recovery-20261009b/work/orchestration/camp-inspection-green-01/receipt.json`

SHA-256: `ff5ec15f10ecc8867ebf25e323cfb38125676685fc73a9dac371f8433876af05`.

The coordinator ran the five named files (`camp-inspection`,
`hut-tooltip-controller`, `building-menu`, `secondary-hut-smoke`,
`temple-scene-lifecycle`) under the bounded maintained command receipt. The run
started 18:01:03.336Z and finished 18:01:16.118Z on 2026-10-09, with exit 0 and no
signal. Actual result: **36/36 PASS**, zero failed/cancelled/skipped/todo.

Independent read-only validation matched source/sourceAfter, all pinned current
inputs, raw streams and embedded receipt streams. Stdout SHA-256 is
`29673f68d96d2cecf6e7d4cb7d5c36fdcf9b446ce407af9663a23f4a0ad76842`;
stderr is empty (SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).
The supplied texture-failure diagnostics belong to passing lifecycle cases.

## Reviewed changed-file hashes

| File | SHA-256 |
| --- | --- |
| `app/building-panels.ts` | `fcd3aba5c900bf04ecfe3bee0cbf831438d3fab1293fac5e569e30152e0e9bfe` |
| `app/object-panels.ts` | `5d55387ad91524c10dbbed441c88cfb258e28bab507a633b6f3e12de8d0fb5da` |
| `app/scene-input-runtime.ts` | `00d9a6f533d763bac87bbac1a12c4da3816df67798b2b57a987d563b3e0dcba0` |
| `app/scene-secondary-effects.ts` | `b0548a878c34f2a8d8f895a58cc64b6f7b724443f002fc7345a6d7663863b1ad` |
| `app/scene-tooltip-runtime.ts` | `b2a53279069a5fccf2b3760c81672390720045c4bd0970d7cd61bc86a1d4b261` |
| `engineering/checks.json` | `033470f9edfa506a4849fbf25cca4412b562f2cb1a5b8e914caff562c7cdd0da` |
| `tests/camp-inspection.test.mjs` | `c187b37f1a95c8fa6a8a4cdcb14eabb8a750b5ae0b88c9a7b7280faec8ef46fa` |
| `tests/hut-tooltip-controller.test.mjs` | `5f415355adda57a860671b8fd32a14af9a30e3631b977c41d5cae3e5494890cb` |

No test, application, browser, dependency or native execution was performed by
this reviewer. Ordinary-clock construction/inspection/control/persistence evidence
and final standard checks are still required before whole-slice acceptance.
