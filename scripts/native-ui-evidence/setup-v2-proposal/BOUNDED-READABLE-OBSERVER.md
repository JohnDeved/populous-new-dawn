# Inactive readable observation adapter

Eight supplied EventEmitter tests are authored and unrun. The adapter uses the accepted bounded recorder; it attaches listeners only, with no child launch, signal, stream destruction, filesystem access or runtime admission. It is not wired into any active runner.

Attach to an owned, not-yet-flowing binary readable before its lifecycle starts. Error/end/close listeners are attached before data. No setEncoding strings are supported. A caller must enforce this ownership/startup contract; the adapter does not infer past events or validate native stream provenance. Custom synchronous event methods and clocks are trusted supplied boundaries, not sandboxed code.

completion is only a notification of close or local retirement, NOT a success verdict. end alone never settles it. error or recorder failure immediately resolves failure with the first reason, including falsy values, so the owner can start cleanup without waiting for close. After a timeout, completion reports retired and sticky teardownRequired remains true even if the stream later closes. There is no claim of IO cancellation, child cleanup or hard whole-process deadline.

snapshot combines the recorder's byte/accounting state with explicit closed/retired/teardownRequired flags. Recorder status complete alone cannot imply a closed stream or accepted worker outcome. Late events are deliberately still observed after close until explicit owner disposal; they may invalidate an earlier snapshot. The authoritative owner must re-read all snapshots after its process/stream/writer/global terminal barrier. It must reject any failure, retirement or outstanding teardown and retain failure notification handling until then.

disposeAfterClose refuses to detach before close. At the final owned lifecycle barrier the caller may detach these listeners, provided it has established no further emitter activity (or taken responsibility for subsequent error events itself). Timeout does not auto-detach or destroy: the outer owner must handle unresolved streams and its own global cleanup budget. The adapter cannot bound callback count, source chunk allocation, duplicate-event storms or a stalled scheduler; caps bound retained byte storage, not arbitrary event-producer CPU.

The local allowance is 1..5000 ms. A close checks monotonic elapsed time as well as the timer, so a delayed timer cannot make an overdue close succeed. An external owner still must bound setup/attachment and all cleanup/receipt I/O. This adapter is not the missing whole-invocation owner and does not satisfy runtime-manifest, actual-FD metadata or kernel-retry gates.

Review requirements before execution: exact source plus recorder closure, supplied error/overflow/timeout/late-event semantics and owner-release contract. Supplied tests cannot establish real Node pipe draining or process lifecycle readiness. No actual stream exercise is authorized by this source proposal.
