# Unexecuted owned-group kernel probe

Base:4ff93ec9adea26f2bc513181eb4bc36724eae900. This began as a source-only proposal; one separately admitted narrow run is recorded below. The admission marker is not permission to run again. The exported function requires an explicit admission marker, but that marker is not authorization: serialized resource preflight and independent source review must occur before an externally bounded invocation. No active supervisor or workflow imports it.

Purpose: exercise the accepted observer against exactly one directly spawned Linux child group. The child runs fixed inline Node source with no imports or descendants, reports readiness, accepts EXIT on its private stdin, and has its own2-second exit timer. Parent verifies /proc PID/PPID/process-group/session/starttime while the child is alive, observes group presence via signal0, requests normal exit, waits for direct child close, then requires observer status=absent.

Budgets: readiness1s, normal exit1s, group observation250ms, fallback child-close1s; raw stdout/stderr16KiB each; child heap32MiB. An external controller must also bound the parent and preserve its stdout/stderr and output directory. Hashing the parent Node executable is additional setup/receipt work and needs allowance. The parent can SIGKILL only its own unreaped direct ChildProcess on failure; it never sends TERM/KILL to a process group. Any fallback kill makes the run fail. It writes source/hash/phase/exit/observation/cleanup/raw-stream receipts to a fresh exclusive output directory, never reuses an old one.

Claim boundary: observed absence for this one owned group after normal direct-child exit only. No descendant escape, arbitrary group ownership, PID reuse immunity, browser context, production supervisor integration or general cleanup proof. A reused group can make the probe fail; this script does not claim to solve PID reuse. Context/process teardown activation remains gated.

At the initial proposal stage, source had not been syntax-checked, tested or executed. Independent review must inspect timeout/early-close/spawn-error paths, limits and receipt preservation before an admitted run. Existing12 supplied observer tests are separate prior evidence, not tests of this probe.

## One admitted normal-exit result

Exact source ebbca5294eb8337e57c709d271d8f6032ba880ec ran once after independent source review and root-authorized serialized preflight. Controller exit0 in1.01718154s, no intervention; probe source/observer/Node hashes unchanged. Owned PID/PGRP/SID16, PPID9, recorded starttime38930; normal direct-child exit0 with no signal and no kill requested. The observer found that group absent on one signal-zero probe. Raw child stdout was exactly READY16 with the separating space and newline (9bytes); other streams were empty. Full controller/probe/child-source/raw-stream evidence: evidence/group-kernel-01.json.

Independent result review accepted evidence commit42799c1047b218032548a875b8cebbdb2faccb14 after recomputing both exact-source hashes and all four raw-stream lengths/hashes. Historical Node executable hash consistency is recorded but was not independently rehashed by the reviewer. No rerun.

This accepts only the one directly owned child normal-exit observation. No forced-kill path, descendant escape, PID reuse immunity, browser cleanup, active supervisor integration or general process cleanup claim. Shared diagnostic workflow remains disabled.
