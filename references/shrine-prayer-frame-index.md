# Ordered shrine-prayer frame index

Refs #144. `GameScene.animate` advances simulation before `updateUnitsFrame`.
The terminal prayer branch of `unitAnimation` previously searched every shrine
for each person reaching that branch. A Scene-owned weak index now groups all
current shrine references by ID before the unit frame, retaining their order and
the original strict ID/active/distance/kind/Vault-phase predicate.

The index clears and rebuilds every call. Every duplicate remains: a later near,
active record can qualify after an earlier record fails. Active state, pose, kind
and the person's Vault phase are read live at each query. Cached NaN queries still
miss strict equality; other strict aliases retain their existing behavior. Model
visibility does not filter prayer eligibility. Omitted fifth arguments retain the
live World lookup, including the presentation caller in `animateLiveObjects`;
explicit empty or missing buckets remain authoritative. Earlier animation returns
and the actual render/resource body are unchanged.

The WeakMap holds no strong Scene key list. Bucket references last until the next
clear or Scene collection. Normal World restoration creates a new Scene; the
current-frame rebuild also handles diagnostic World/list replacement in one Scene.
Each rebuild still creates a bucket Array for every encountered ID. Reusing the
Map does not make the frame allocation-free. Shipped synchronous unit draw paths
do not mutate shrine membership or IDs. Arbitrary membership/ID-mutating getters,
draw observers and reentry are excluded. Live property changes are retained; tests
sample each person's state at its actual draw instead of recomputing earlier
samples against the final edited World.

Command27, the native worship controller, command33, the Vault controller,
navigation, reward, animation clock and storage owners are unchanged. The genuine
M3 Vault outside goal is four units from its native center; the existing unwrapped
fallback helper need not return `pray` there. Natural coverage preserves its true
goal, default state, native direction references and `f2`. Separately supplied
near-Vault states exercise the existing fallback radius without changing it.

Seven new cases reuse maintained actual Scene/UnitMotion fixtures, opening helper,
live-worship and Vault journey routes. They cover those natural owners, live
duplicate qualifiers, explicit-map/default authority, strict aliases,
current/legacy replacement, independent Scenes, empty/refill, actual resource
ownership and controlled unique-ID query counts. Full expected World, terrain,
both RNG owners and numeric frame clocks remain compared.

The same five-file command ran at `c26afb1a` and pristine main `79d7f992`, with
353 input files and 351 unchanged paired inputs. Candidate: **29 passed**.
Pristine: **27 passed, 2 failed**. The failures separately establish the new
explicit fifth-map contract and the former full-list query cost. No tests were
cancelled, skipped or marked todo. Cloning and default semantic reference queries
remain outside the measured actual unit-frame interval.

| Unique population | Candidate hit reads | Pristine hit reads | Candidate miss reads | Pristine miss reads |
| ----------------- | ------------------- | ------------------ | -------------------- | ------------------- |
| 64                | 128                 | 2,080              | 64                   | 4,096               |
| 256               | 512                 | 32,896             | 256                  | 65,536              |
| 1,024             | 2,048               | 524,800            | 1,024                | 1,048,576           |

All three measured repeated frames match each row. These are controlled cloned
person/shrine populations, not a native population-cap claim. Unique-ID lookup
cost is linear in shrines plus people; ordered matching duplicate buckets retain
a quadratic worst case.

Fresh scoped Oxfmt and both ESLint checks **passed**. Strict Oxlint **failed on
both sides**, with the same 16 inherited diagnostics (13 warnings, 3 errors).
Full evidence comparison **passed**, retaining severity, rule, message, help and
multiplicity and normalizing only numeric source line/column locations. Initial
quality attempts are retained: the sparse diagnostic literal failed ESLint and
the direct default property read added one strict warning. Narrow syntax repairs
preserved the exact hole0/head1/later2 layout, single default getter read and every
assertion; both sides were rerun with the same repaired test.

Root owns exact published-head full check/build, which are **not run** at this
author checkpoint. Cold/index allocation, bucket backing storage, GC, timing,
browser/hardware performance, native-law acceptance, deployment and whole-issue
completion are **not proved**. Detailed review artifacts remain **local only**
under the current disclosure hold.
