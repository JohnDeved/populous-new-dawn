# Inactive observed-supervisor pilot

Base2381ecf6f3554add543d11bb8d5828877650f6c4. The existing active supervise.mjs remains unchanged. This new separate pilot gates status=passed on groupCleanup.status=absent after final owned-group signalling. It does not treat successful signal delivery or child close as observed group disappearance.

Fixed pilot bounds: command allowance1..5000ms, child heap64MiB, raw combined log64KiB, TERM-to-KILL100ms, post-close observation250ms. A parent controller must still bound the entire function, including a child that never emits close or synchronous runtime failure. This is not a production replacement for the existing longer build/browser limits.

Original command timeout/nonzero exit/console overflow/signal failures remain failed even when group absence is later observed. Child spawn failure without a group rejects the original error; live child error retires via the owned-close route. Observation rejection and unverified outcomes are failed receipts. Supplied dependency injection is for tests, not a candidate-configurable runtime capability.

Eleven unexecuted supplied-owner tests use EventEmitter/streams and fake signalling/observation. They do not spawn or signal OS processes. They cover no premature pass, unresolved/rejected cleanup, original command failure, signal EPERM/ESRCH, log overflow, live/spawn error, timeout/late zero exit and escalation. Source has not been executed or syntax checked.

No real forced-kill or descendant cleanup proof, PID/group reuse immunity, browser cleanup or activation claim. Existing observer evidence covers12 supplied cases and one separately admitted direct-child normal exit only. Keep workflow fail-closed. Next gate is independent source review, then separately admitted supplied tests; actual pilot kernel use requires its own reviewed controller and resource admission.
