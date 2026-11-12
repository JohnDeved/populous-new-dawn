# Inactive group-exit observer proposal

Base:71ab09edc233c1108ec67386658e61cd5f71db92. Local draft was lost before execution in a workspace reset. These reconstructed remote bytes are a new untested identity. No active runner imports this module; supervise.mjs and workflow are unchanged.

processGroupPresent probes only process.kill(-pgid,0), never TERM/KILL. ESRCH means the group was absent at that observation. EPERM and all other errors are unverified, not absent. observeGroupExit accepts only a finite positive bounded allowance, rejects late success/backward clocks, limits poll count and bounds each asynchronous pause. A hung synchronous injected probe still requires an external owner; real process.kill is synchronous. JS timers cannot prove OS scheduling bounds.

Only the process owner may supply the group ID for its still-owned spawned group. This observer does not establish ownership, prevent PID/group reuse, detect descendants escaped into another group/session, kill processes, or replace supervisor cleanup. It returns an in-memory original error for unverified results; a durable receipt writer must safely serialize that separately, and must require status=absent rather than mere Promise fulfillment. An actual kernel-backed group observation test is still needed before integration/cleanup claims.

Eleven supplied-boundary tests cover zero-signal addressing, invalid IDs, ESRCH/EPERM, immediate/eventual absence, deadlines/late result, clock faults, finite polls, and hung-pause late settlement. They are unexecuted. No browser/build/process spawning or group signalling was performed during source preparation.
