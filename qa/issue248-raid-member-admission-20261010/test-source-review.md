# Issue248 raid membership: independent test-source review

Verdict: **ACCEPT** the exact test-only source at `b6a74587a428faea1e08ff46f5b3bb0361be6c53`, based on unchanged runtime `4754e12d3590bde18656416514871b033de164be`. This is acceptance for one controlled failure-first run, not runtime implementation readiness or evidence of campaign impact.

## Reviewed identity

- Worktree: `/workspace/scratch/69fd8163d94e/issue248-raid-member-tests-20261010`
- Branch: `test/issue248-raid-member-admission-20261010`
- Full base-to-head diff SHA256: `5df24d2e011e55c647ad46f65c4773212c8ac04263dffc7e4698bce65bdb96c8`
- `tests/raid-member-admission.test.mjs`: `95420d98dceb5a149f11b730ea9aa82ad7d6d01cf1d08778ec72e6dfc5205c18`
- `qa/issue248-raid-member-admission-20261010/proposal.md`: `197ec212118c3fed5414eefda917454a21141edbfff5a39835a41de7a602b8de`
- `qa/issue248-raid-member-admission-20261010/preflight.json`: `cad9279a9e506a91077be83a4fc99303b84da1da1b26ef59aa4b730efde1f8dd`
- Accepted static report: `01d618aebc971d04688e60c560f4e0f91535ab338e1f445e1825146a18f60cbe`; static review: `86a050ce922167808cb566ffedc8de1c00c08a50b5b64e181b6e6832f6078854`.

Independently verified clean exact HEAD, the three-file allowlist above, all 16 preflight source hashes, the 15 unchanged base blobs, and `git diff --check`. Existing dependency symlink resolves to the stationary canonical directory, device27/inode538212. Both historical phase6 JSON fixtures and their existing test remain byte-identical to the bound base. No test or native execution was performed by this review.

## Supported test contract

All seven supplied cases invoke `withCampaignTribe(w, 2, () => stepComputerTasks(w, 2))`, with the actual selector, controller and select-action state initializer. They require the real dispatcher to complete slot2 and advance to3; the wrapper restores the active AI and tribe. The fixture supplies a dispatch turn, sole active type20 task, an existing selection lock, no Shaman fallback, and no state23/model4/model7 prelude participant.

Two positive admission cases expect the completed nonzero phase3 admission scan to write owner3 to the full current registered state14 set, including a prior selected person, an unlisted person previously assigned99, the final fallback after its state transition, and a registered owner hidden behind a stale native alias. Three admission controls cover incomplete quota processing, zero final count, and a returned ID whose real state initializer refuses state14 due to mask0x100000. Their expected membership values stay unchanged.

The positive phase23 case expects matching owner3 release across listed and unlisted registered people, with foreign and other-tribe owners preserved. The seventh case protects a foreign registered person even when its stale native alias claims owner3. Known person7f0xa5 becomes0xa4; absent7f remains absent. Existing person0x2000 avoids assuming task+0x31 bit0 during admission; unconditional retirement clears0x2000 while preserving0x200. Retirement checks also protect the supplied order pool and RNG state.

The test captures a real controller projection gap, without substituting task.members for the original person ownership. Assertions that current phase3 reaches phase4 and that current zero-count work retires are fixture-path checks, not proof of the missing native task+0x31 representation or every original retirement path.

## Correction incorporated before acceptance

The unrun initial revision `e9b9187ecbd59d4a6ee57f13ed9fc1de7ad0fa2d` left a state10 native-only negative control invisible to `unitAnimationSource`; the selection adapter therefore synthesized idle17 from its empty path. Its exclusion depended on stable candidate order. The accepted revision supplies that control's retained entry owner, checks the actual adapter source and state10, and verifies the complete eligible set contains only the intended fallback. The guard uses a separate adapter projection; selector changes to that projection do not replace or mock the actual dispatcher execution. The newly bound `app/unit-animation-source.ts` hash documents this prerequisite.

## One authorized run and limits

The parent's authorization permits exactly one invocation:

`taskset -c 4 timeout --signal=TERM --kill-after=5s 55s node --test tests/raid-member-admission.test.mjs`

Expected outcome: three failures at the explicitly labeled missing-ownership assertions and four passing controls. A source-bound receipt must preserve output, command, exact commit, source hashes and dependency identity before/after. Import/setup failures, an earlier fixture assertion, timeout or another failure is not the intended red and does not authorize an automatic rerun.

All five runtime gates remain open: representation of task+0x31, unknown7f upper bits, assignment/array/reassignment and retirement agreement, fresh versus retained registered owners, and legacy-zero checkpoint versus new-continuity behavior. This acceptance does not permit a production patch, campaign sweep, native/emulator/browser execution, full gates, dependency work or publication. M1–3 impact remains unproved; these are supplied controller-boundary cases, not a campaign witness.
