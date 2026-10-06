# Actual bounded firing result review

**ACCEPT the frozen owned-projection result** at
`2ea28387a340d4d7d5f365ae27ed9ac75c51dc93`.
The retained actual native and actual private-port records satisfy the previously
frozen sixteen-case policy. This does not accept whole-record equivalence,
whole-command/elapsed-gameplay equivalence, browser visuals, or release completion.

The full comparison remains **failed**, exit1, with172 diagnostic differences.
Its original receipt, terminal record, full differences and first mismatch are
preserved. The separate owned projection is **passed**, exit0, with zero
differences and four explicitly partial capped cases. These statuses must remain
separate in the handoff and published evidence.

## Source and receipt audit

Source-preflight, native and owned-projection receipts reside under
work/orchestration/firewarrior-firing-fix-20261006/. All three bind the exact HEAD
above, an empty tracked-diff hash, and identical before/after source/input records.
The preflight passed and its216 application-closure hashes match current files.
Every explicit input hash in each receipt was independently checked, as were
raw stdout/stderr artifact bytes, embedded output and their hashes. Native/port
execution was not repeated by this reviewer.

Receipt identities:

- source-preflight-01.json: passed/0,
  SHA256667433030cf6c7a903d6ac88eb5457fce0551c363c62ab2610c96abbbab9499a.
- native-01.json: failed/1 because of full-record diagnostic differences,
  SHA256e7efa5d993fa6bd9ed8d15eaa7b30dd90e1ddcd82c3a5a3dd6d48893f4167289.
- owned-projection-01.json: passed/0,
  SHA256e919414f5cabec209a008b8912be41eeaf93ed9e60ef14df9e2f3f5a150c7f23.

Raw native.json is byte-identical to the expanded immutable baseline, SHA256
977f01bd263bc7c49de959e8738c5538d7e14c637146b324a32dbfbf1fd0ba1a.
supplied-fixtures.json likewise matches the unchanged baseline exactly, SHA256
9ad6cabf2ddd1dbc7305816b6b795a9c62ca606a83218c3857f90d2d3a39561d.
The policy hash remains
5ea3bf389c59cb4ecbf98b19f98566939103e14ce49301b7fb64b330289d0128.
Actual port stdout hashes to
77569345ad974ba39ef3a9e44635c2b71b2684b3d261d4e1b5639538f226dbbc;
it reports one exposure and the unchanged exact runtime caller hash.

## Actual state/visit review

All sixteen names, order, fixtures and initial normalized comparison records
match. Every per-case fixture/case file and all60 per-visit native files agree
with their aggregate raw records. Each native visit has completed status and its
full before/after state/events. Both sides retain60 controller invocations:
48 paired active visits and12 paired completion visits. Visit counts, indices and
every completion Boolean match, including each terminal call.

The person and building cases agree on the repaired boundaries:

- Entry from both prior walk/frame3 and idle/frame4 selects source56/draw13,
  resets f1=1/f2=0, consumes the changed-target bit, preserves the complete
  assignment word correctly at0x200, tracks projectile4, and initializes/decrements
  firing duration to4 on the entry invocation. The pending upper-setter bit0x80
  in the idle-entry assignment is cleared by the real shared setter.
- The complete entry cases progress through firing timers4,3,2,1, then
  phase40/timer0/assignment0x210. The next active visit initializes recovery,
  keeps source56, resets frames, holds render flags0x182, clears pending0x10
  and leaves timer5. Recovery decreases through1 before both bodies complete
  on invocation11. This is a controller-visit observation, not elapsed time.
- The supplied phase44/timer1 recovery boundary retains its prior frame at the
  transition and performs the reset/hold on the following visit. Its complete
  case has7 calls; direct wait-entry-present has6, matching both sides.
- Missing-projectile wait entry completes on its first call on both sides.
  Cooldown entry yields phase45/timers31 then30; timer expiry and cleared cooldown
  complete on the same single invocation on both sides.

The four capped partial observations remain person-entry-idle-frame4,
person-cooldown-entry and their building counterparts. Their unchanged caps are
1 and2 respectively; neither side claims lifecycle completion there.

Independent comparison of every policy-owned active field and owned flags2 bit
found no difference. Independently recomputing the original full comparison
reproduced all172 rows in their exact order and the retained first mismatch:
88 active diagnostic differences and84 terminal residual differences. Facing,
other flags and native-versus-port terminal cleanup remain visible; they were not
deleted, rewritten or converted into an equivalence claim.

## Projectile and execution evidence

Each of the four fresh entry cases has exactly one two-projectile launch. The
port retains IDs3/4 with source1, target2 and impact=false/true. Native raw
projectile records independently contain IDs3/4, class8/model6/state6, source1
at+0x88, target2 at+0x8a and impact byte0/1 at+0x7c, consistent with the retained
real initializer export. There are exactly eight observed native allocation
events across the batch. Recovery/cooldown port effects remain unchanged from
their initial supplied fixtures; no extra launch is present.

The original controller executed60 calls/18,104 instructions. The same guarded
probe/mapper/supplied leaves and write policy were retained. No visit contains a
forbidden-write event; no instruction/resource/setup/failure-preservation error
occurred. The native run's failed status records comparison differences only.
The child completed with exit0 and reaped=true, no cleanup error, exact retained
stdout hash and empty stderr. Child maximum RSS was145,136KiB; Python maximum RSS
was50,156KiB. These are execution receipts, not performance claims.

The intermediate native.json label native-complete-port-not-run is the immutable
snapshot written before the subsequent port batch; the child, full comparison
and terminal receipt establish that the port later ran. Do not present that
intermediate label as an unexecuted or failed native attempt.

Reviewer checks were read-only Python record/hash audits, exit0 in approximately
1.21s, plus source inspection of the existing native launch/initializer offsets.
HEAD and tracked status remained unchanged. Only this ignored review was written.
No additional native, port, browser, package or full-suite execution occurred.

Accepted claim: for these fixed sixteen supplied cases, the scoped active
selector/reset/hold/timer/assignment behavior and body-completion visit boundary
match the original instructions under the frozen ownership policy. Ordinary
acquisition/rendering, all animation visits, outer cleanup/facing, other combat
worlds and full gameplay equivalence remain outside this result.
