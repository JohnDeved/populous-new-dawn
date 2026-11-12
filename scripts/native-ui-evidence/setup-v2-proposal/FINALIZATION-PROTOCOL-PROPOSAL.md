# Inactive finalization protocol core

Base72d96148fb83c1606c7bffe3bdf67dc3d18e228b conceptually reviewed design. This first implementation is a PURE state gate, not a coordinator, metadata worker, writer, IPC authenticator, real descriptor keeper or process owner. It launches nothing and touches no filesystem. Actual runtime glue must establish private endpoints, source/handle identity, executable FD ownership and trustworthy outer completion before passing events to it.

The gate tracks distinct actor bindings, unique run/channel/phase nonces, phase sequence and deadlines against one start time, expected before/after full hash closure and stable descriptor identity claim, cases-verified (not passed), parent/metadata reap before candidate commit, writer reap before terminal manifest, and an independently bound candidate/outer-service outcome. Candidate ACK alone never passes. Failed protocol remains failed.

Cleanup produces INTENTS only, never signals. All live handles share one cleanup deadline and TERM/KILL progression; exited handles are excluded, attempts are not renewed, and reserve exhaustion remains unverified. Runtime owner must validate eligibility again immediately before any real action and must not pass these numeric identifiers directly to an unsafe signal API.

Supplied tests cover late/replayed/wrong-role/nonce/identity responses, descriptor/hash mismatch, worker loss, bootstrap/global deadlines, writer failure after candidate ACK, unvalidated/mismatched candidate or unsuccessful outer outcome, shared cleanup and retired actors. They remain unexecuted pending independent source review.

This module is not cryptographic authentication or an OS ownership proof. Descriptor token fields model a claim from the same trusted actor, not an actual retained FD; worker implementation must enforce the design. A ready-for-outer-owner manifest is not authoritative success. acceptOuterOutcome assumes the caller independently verified the candidate and external outcome, not attacker-supplied booleans. No before/after hash worker, bounded receipt writer, IPC transport or metadata-only qualification has been implemented.

Failed kernel evidence remains immutable atfcd661a3. No kernel retry, real process/FD/filesystem operation, deadline change, workflow activation or production integration. Next gate: independent source review, then separately admitted supplied tests only.
