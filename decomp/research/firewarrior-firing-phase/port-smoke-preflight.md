# Exact retained-fixture port startup check

Prepared only; a new coordinator grant is required. This is one actual-port
startup check, not a native rerun, resume framework or native/port equivalence
claim. Application/artwork and all cases remain unchanged.

The granted native-01 at 7526bc3da98958aaa71bf148bb62fede4fdd2583 completed 16
native cases / 60 controller calls / 18,104 instructions without guard failure.
Its direct Node child then exited1 with ERR_WEBASSEMBLY_NOT_SUPPORTED before
executing any port case: --jitless disables the WebAssembly required by Node24's
native TypeScript loader. Its failed exit2 receipt, native results, partial logs
and confirmed child reaping remain intact. There is no comparison.json result.

This correction removes --jitless only. The existing direct-child guardian
run_port_child is byte-identical. Its existing node_limits body moves to module
scope so this dedicated smoke uses the same reviewed address/CPU limits. The port
module, native case definitions and retained supplied fixture bytes are unchanged.
Native source/phase code and the emulator write/instruction bounds are unchanged.

## Fixed inputs and actual module execution

Input is exactly the retained file:

work/orchestration/firewarrior-firing-phase-20261006/native-01/supplied-fixtures.json

SHA-256: 9ad6cabf2ddd1dbc7305816b6b795a9c62ca606a83218c3857f90d2d3a39561d.

The sibling native.json remains SHA-256
977f01bd263bc7c49de959e8738c5538d7e14c637146b324a32dbfbf1fd0ba1a.
The smoke reads the supplied fixtures and never regenerates either file.

port-smoke.py imports only probe.py's stdlib definitions. It does not import
Unicorn or construct a CPU. It validates a freshly passed clean-head source
preflight receipt, every application import in that receipt, every probe-source
hash, Python/Node identity and the fixture hash. It records the full source/tool/
fixture/argv manifest before launching one child:

node --max-old-space-size=128 decomp/research/firewarrior-firing-phase/port.mjs

The actual argv uses the verified absolute Node binary and port module paths.
port.mjs loads the real TypeScript import graph and its previously reviewed
export-only hook. Exactly the 16 fixture names, in their declared order, must
produce bounded visit records; one caller exposure and the original caller hash
must match. No replacement expected outputs, extra case or source patch is used.

The result checks startup and complete output shape only, not equivalence with
the retained native results. It stops on input/import/resource/shape failure.
There is no retry, fallback transpiler, npm package, copied dependency tree,
new fixture or native rerun in this command.

## Unchanged bounds and retained evidence

- CPU4 only, one foreground Python process, at most one direct Node child.
- Python soft512 MiB/hard8 GiB address limit; CPU30s/35s, alarm45s, file8 MiB.
- Node hard8 GiB address limit, 128 MiB heap, CPU15s/20s, 20s child timeout,
  thread pool1. The existing guardian streams logs to files and records exact
  direct-child wait4 exit/RSS; timeout receives TERM then KILL with the same bounds.
- Outer55s TERM / 3s KILL grace, no browser/server/network/ports or native CPU.
- Fresh output only. Preserve manifest, source/input hashes before/after, raw
  stdout/stderr, child-process evidence and terminal failure/success. A passed
  result is labeled passed-startup-only and does not compare native outcomes.
- Any drift invalidates the smoke. No retry or enlarged resource limit without
  a separate instruction.

After sourcing ../prerequisites/env.sh, the proposed real CLI is:

```sh
timeout --signal=TERM --kill-after=3s 55s taskset -c 4 \
  python decomp/research/firewarrior-firing-phase/port-smoke.py \
  --preflight-receipt work/orchestration/firewarrior-firing-phase-20261006/source-preflight-04.json \
  --output work/orchestration/firewarrior-firing-phase-20261006/port-smoke-01
```

The outer existing command-receipt.mjs must explicitly bind the retained fixture,
source-preflight receipt, smoke/port/probe/cases source, receipt helper, Python and
Node binaries. The smoke manifest binds the full 216-file application closure and
remaining probe source before/after. Only after this startup check passes may the
parent separately grant the finite full comparison; that permission is not implied.
