# Inactive finalization protocol core

Base72d96148fb83c1606c7bffe3bdf67dc3d18e228b conceptually reviewed design. This first implementation is a PURE state gate, not a coordinator, metadata worker, writer, IPC authenticator, real descriptor keeper or process owner. It launches nothing and touches no filesystem. Actual runtime glue must establish private endpoints, source/handle identity, executable FD ownership and trustworthy outer completion before passing events to it.

The gate tracks distinct actor bindings, unique run/channel/phase nonces, phase sequence and deadlines against one start time, expected before/after full hash closure and stable descriptor identity claim, cases-verified (not passed), parent/metadata reap before candidate commit, writer reap before terminal manifest, and an independently bound candidate/outer-service outcome. Candidate ACK alone never passes. Failed protocol remains failed.

Cleanup produces INTENTS only, never signals. All live handles share one cleanup deadline and TERM/KILL progression; exited handles are excluded, attempts are not renewed, and reserve exhaustion remains unverified. Runtime owner must validate eligibility again immediately before any real action and must not pass these numeric identifiers directly to an unsafe signal API.

Supplied tests cover late/replayed/wrong-role/nonce/identity responses, descriptor/hash mismatch, worker loss, bootstrap/global deadlines, writer failure after candidate ACK, unvalidated/mismatched candidate or unsuccessful outer outcome, shared cleanup and retired actors. They were initially unexecuted; see the accepted bounded result below.

This module is not cryptographic authentication or an OS ownership proof. Descriptor token fields model a claim from the same trusted actor, not an actual retained FD; worker implementation must enforce the design. A ready-for-outer-owner manifest is not authoritative success. acceptOuterOutcome assumes the caller independently verified the candidate and external outcome, not attacker-supplied booleans. No before/after hash worker, bounded receipt writer, IPC transport or metadata-only qualification has been implemented.

Failed kernel evidence remains immutable atfcd661a3. No kernel retry, real process/FD/filesystem operation, deadline change, workflow activation or production integration. Next gate: independent source review, then separately admitted supplied tests only.

## Source-review repairs (unexecuted)

The core now pins before/after combined metadata phase ceilings at7000ms each (source2s plus executable5s), kernel cases at10000ms and commit at2000ms. Caller capMs cannot expand those or the shared remaining work allowance. The combined before/after gate does not enforce the internal2s/5s subdivision; trusted metadata runtime must separately enforce those reviewed substage ceilings. Boundary and one-ms-over controls cover all four phases.

Mandatory hash identities are coordinator, watchdog, harness, supervisor, observer, metadataWorker, receiptWriter, protocol and node. All must be present in the admitted expected closure and every hash response. Parent/metadata/writer actor source pins must match their corresponding closure entries. Additional admitted dependency/runtime inputs are allowed up to the bounded32-entry map, and before/after equality includes those extras. These mandatory names are necessary, not an automatic dependency resolver: trusted admission must supply the complete transitive input/runtime closure, including any interpreters or non-builtin dependencies. The pure gate cannot discover missing unlisted dependencies. Tests reject one-key maps, each mandatory omission, actor/closure mismatch and response omissions.

The resulting52 supplied cases subsequently passed under the corrected syntax identity; see below. No metadata qualification or kernel retry.

## Accepted pure supplied result

Corrected source068eb33bc9a78a9f4157cd22e8cb56fa730f77f4 passed52/52 under Node24.22.1, exit0 in0.164698862s, two input hashes unchanged, empty stderr, no controller intervention. Evidence: evidence/finalization-protocol-supplied-01.json at0d1439b4ae5bebf6389a24d2eee7e6098b0a6be8. Independent review matched both exact-source hashes and both raw-stream hashes/lengths without rerun. Source correction replaced five escaped-newline artifacts; prior syntax evidence is preserved separately.

This accepts pure supplied protocol behavior only. Real IPC/private-endpoint authentication, retained FD ownership, bounded workers/writer, transitive closure, internal2s/5s metadata subcaps, metadata-only qualification and kernel retry remain open. Failed kernel evidence stays failed. No active workflow change.
