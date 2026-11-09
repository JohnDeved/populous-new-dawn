# Follower animation source lookup

Refs #144. The shipped `GameScene.animate` calls `updateUnitsFrame`, which selects
the current animation family after render-team/disguise handling and forwards its
directions through the actual `GameScene.animatePerson` wrapper. Each follower
with a native source previously created an `Object.values` result Array and
searched the family in insertion order. A weakly owned, first-source index now
reuses that lookup for the exact imported family object. Shaman direct lookup and
the entire remaining render/resource body are unchanged.

The maintained `original-units.json` has fifteen families, 322 states and 53
duplicate source occurrences. The first duplicate wins: follower source104 keeps
`chop` before the later `strike` alias, including the original direction and frame
Array identities. Undefined sources still bypass native lookup; unknown and NaN
sources retain fallback state/idle, age and once behavior. Native `f2` forwarding,
selected-family identity, sprite output and signature/resource ownership remain
compatible.

The WeakMap key is the exact imported family object. Its value holds only a finite
source index and the original direction Arrays, with no World, Scene or texture
references and no strong list of keys. Each render selects the current family
afresh. Shipped World/Scene replacement and texture retry do not replace the
static JSON table; there is no maintained animation-table hot-reload API. The
scope excludes in-place source-key mutation, arbitrary getters and replacement
APIs. Weak ownership does not establish measured collection or memory savings.

Seven new actual-caller cases cover a naturally commanded construction worker,
every imported follower source, first-duplicate/reference identity, undefined and
unknown/NaN fallback, Shaman direct paths, native frame phases, disguise/team/model
transitions, shared atlas/resource teardown, current/legacy checkpoints, repeated
frames, empty/refill and independent Scenes. Full World, terrain and both RNG
owners are compared. Existing unit mesh, selection and builder tests are unchanged.

Fresh paired command at tested head `26d2a88d2b8416d429b8583eb2fb9a84151e67bb`
and pristine main `5112600b19f34e9ecf709c1c044d4f3605bfa6b5`:

```sh
node --test tests/animation-source-render-view.test.mjs tests/unit-mesh-reconciliation.test.mjs tests/selected-id-reconciliation.test.mjs tests/builder-animation-reconciliation.test.mjs
```

The unchanged twenty-five cases produced **25 passed / 0 failed** on the candidate
and **23 passed / 2 failed** on pristine main. Its two distinct failures are the
warmed direction-candidate visit and `Object.values` result Array assertions;
every semantic case passes on both sides. Controlled maintained-person snapshots
use source104 and the actual full unit-frame caller, with one identical warm frame
and three measured frames per population. Imported tables and sources are never
mutated. The two diagnostics preserve all nine rows each.

| Followers | Candidate/baseline direction visits per frame | Candidate direct hits per frame | Candidate/baseline result Arrays per frame |
| --------- | --------------------------------------------- | ------------------------------- | ------------------------------------------ |
| 128       | 0 / 640                                       | 128                             | 0 / 128                                    |
| 512       | 0 / 2560                                      | 512                             | 0 / 512                                    |
| 1024      | 0 / 5120                                      | 1024                            | 0 / 1024                                   |

All 351 focused inputs are bound before and after both runs; 350 match across the
pair. All 336 pristine app files and 1506 materialized maintained baseline files
match exact main Git bytes. Reversing only the reviewed index/type/call changes
recovers the entire production file.

Initial Oxfmt **failed** only on the new test's formatting. Its original bytes and
receipt remain preserved; a formatting-only test repair precedes the paired run.
Fresh Oxfmt and both ESLint checks **passed**. Strict Oxlint remains **failed** on
both sides with the same six warnings and one error. The separate full comparator
**passed**, retaining severity/rule/help/message text and multiplicity while
normalizing only numeric source locations.

Author full check/build: **not run**; root owns exact published-head gates. Cold
index construction, other allocations, backing storage, GC, timing, browser,
hardware performance, native clocks, deployment and whole-issue #144 acceptance
are **not proved** here. Detailed receipts and portable evidence remain **local
only** under the current disclosure hold.
