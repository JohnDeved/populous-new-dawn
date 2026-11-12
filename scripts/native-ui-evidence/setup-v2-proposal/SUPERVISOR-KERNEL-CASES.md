# Unexecuted observed-supervisor kernel cases

Basef9fc9f7060200b4a862326336932d249cbc1c9d7. Source-only harness, not run authorization; explicit marker only prevents accidental invocation. No active supervisor/workflow imports it.

Separate source review and resource admission plus an external10-second parent timeout are required. Two sequential fixed Node commands, no imports or descendants: normal console line with cap2s; empty2-second timer with cap100ms, expecting direct ChildProcess SIGTERM and failed deadline receipt. Pilot child heap64MiB, combined raw log64KiB, escalation100ms, group observation250ms. No destructive numeric-group signalling. A fallback SIGKILL would fail this harness's expected SIGTERM assertion. External controller must preserve parent raw logs and output if internal close/observation stalls. Child code self-expires after2s if its parent fails.

Assertions require observed absent group, no signal errors, unchanged harness/supervisor/observer/Node hashes, exact normal output and empty timeout output. Record each case before work and after result; final receipt errors preserve primary rejection, with outer logs as fallback.

This is not the earlier standalone observer probe: it would exercise the actual inactive supervisor default spawn/direct-child-signal/read-only-group-observer path. No claim for forced KILL, retained descendants, group reuse immunity, escaped descendants, browser cleanup, production safety or activation. The100ms timeout may fire before the child program starts, so it proves cancellation of the directly spawned process, not application-level readiness. All existing broader gates remain open. Nothing executed yet.
