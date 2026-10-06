# Unchanged Mission6 scenario after the accepted adapter correction

Source3007dd9f, one fixed-step diagnostic, CPU4, 120s TERM + 10s KILL limit.
The original maintained scenario and read-only observer are byte-identical to
prior diagnostic source (scenario316220d9, observer8d3a09a3). The supplied
conversion branch remains explicit. This is not ordinary UI gameplay.

The run FAILED the unchanged final active-task assertion, actual0 versus1.
All preceding acquisition, mixed-raid, order and supplied-conversion assertions
passed. It finished8760 ticks and500 supplied preaching calls. The owned group25
was empty at23:31:55.188570 UTC after33.186 seconds, with source/input hashes stable.
No retry occurred and no expectation was changed.

The corrected path shows three separate phase6 transitions:

- At7423, elapsed407→408 and phase6→18. Three registered Warriors are state19
  (state flag8), speed0, with no current order; Preacher398 is state10, speed0,
  current17. This is all-settled admission.
- At8243, elapsed349→351 and phase6→14. Warriors remain state19/speed0; the
  registered Preacher is state10/speed0 with immediate32. This is all-settled
  admission retaining immediate-over-queue ownership.
- At8320→8321, elapsed0→1801 and phase6→23. Warriors386/415/445 remain registered
  state10/current3 with speeds68/67/61, so all-settled is false. Registered
  fight-owned Preacher398 is state29/speed0, immediate125/model32 and queued123/3.
  The full-member combat timeout established by004d14f0 explains this transition.
  All four member IDs and task flags1 remain at the abort.

At8324, a separate phase23 visit clears flags/members. No active Chumara type20
count exceeds1 and the task does not reactivate through8760. All four original
raiders remain alive (Warriors90HP each, Preacher28.6HP). The final snapshot's
active1 assumption therefore does not express this supported timeout contract.

The observer logs post-tick snapshots, not individual JavaScript memory writes.
`phase-transitions.json` retains exact source-line numbers and preceding/current
raw fields. Task work observes the prior completed object turn in world-turn.ts.
The phase6 contract is independently native-backed under the declared semantic
membership projection. The later cleanup is a separate source/port boundary;
these data do not establish full original raid lifetime or the mixed19 adapter.

A replacement maintained assertion must positively observe the combat timeout,
retain member/order ownership at abort, require subsequent separate retirement,
and check no duplicate/no reactivation through the same bounded continuation.
That replacement remains subject to review and coordinator authorization.
