# Resource-order ownership regressions (#833)

Tests-only checkpoint on main e307c6d4238aa32acb44293b2bc9d2842ff7ef4d. Production code unchanged.

Three actual-module regressions cover command7 selector0/1/2 propagation and shared-record final release; full eight-slot queue immediate-order fallback without replacing queued records; and exhausted fixed-pool immutability with no callbacks. Actual writer, allocator, eligibility, append/attach/remove paths are imported. Routing/harvesting preparation and external effects are explicitly supplied, so this is not a repair or acceptance of Ctrl-log input, bounded native search, harvesting, native parity or browser gameplay.

A single coordinator-admitted direct Node module run passed3/3 with spec output, zero fail/cancel/skip/todo, exit0, empty stderr and clean supervisor. Wall0.2993s; sampled child peak59,621,376 bytes; these are this bounded run's measurements, not sustained memory-resolution evidence. The retained guard expectation says TAP; actual reporter was spec and all named cases were independently accepted without rerun.

Source/test and execution/resource reviews accepted the exact candidate. Four production dependencies were fetched from exact main and Git-blob/SHA256 verified. Five source/test pins remained unchanged after execution. The command used pinned Node, read-only source permission, no filesystem-write permission,128MiB V8 heap,15s monitored deadline,256MiB sampled RSS limit,1MiB per-stream cap and owned-process cleanup. No build, full check, browser, deployment or merge performed locally. Required aggregate CI is separate.

Workflow lesson applied: use already-qualified direct node:test execution rather than the known restricted-discovery failure; preserve a coherent test checkpoint early, and distinguish supplied-boundary regressions from the still-open real Ctrl-log issue. No measured engineering-productivity benefit claimed. Refs #833; do not close it.
