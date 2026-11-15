# Technical limits and next integration boundaries

The original Windows runtime uses numeric guest addresses, direct pointer escapes,
thread-local CPU state, synchronous call stacks and platform shims. These fixtures
model only selected boundaries; none is a runnable original-game runtime.

## Memory

The JavaScript sparse model uses private backing. The shared-page experiment uses
an explicit synchronized page table and arena. The C adapter is single-owner and
is not thread-safe. These representations cannot be mixed without a shared ABI.
High dispatch tokens are not ordinary memory addresses. Direct pointer consumers
need bounded spans, lifetime rules and explicit fault handling. Atomic host copies
and ordered byte-move fault behavior are distinct contracts.

## Threads and calls

The deterministic generator scheduler is an ordering model, not a way to suspend
arbitrary compiled C stacks. Browser pthreads require shared WASM memory, a worker
pool, thread-local state and cross-origin isolation. The synthetic tests use local
server COOP/COEP headers only. JSPI is a separate optional runtime-capability probe.
The integer guest-call model does not establish original CPU structure compatibility,
x87 semantics, asynchronous fault recovery or complete Windows calling conventions.

## Frame output

Indexed palette conversion and pitched RGBA copy tests use invented color patterns.
The threaded C frame is four by four pixels and is copied after thread completion,
not while another thread mutates its memory. Exact bytes do not prove original
rendering, game timing, input behavior or save compatibility.

## Next steps

Keep original binaries and translated game output outside this source checkpoint.
A future original-code experiment needs explicit source/input identities, a bounded
entry point, controlled imports, memory/time limits and a reproducible result. First
connect memory and platform contracts without dropping bounds or source ownership.
Use identical scenes, cameras, state and input sequences for any eventual comparison
with New Dawn. Track completion in issue #1020; synthetic tests do not close it.
