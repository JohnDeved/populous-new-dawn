# Pause save notice scope

Base: c9e3cbc8003be7c9b3fc489d794297679476d2b9.

A pending Save could finish after Escape and Load Game navigation and display its
save success/session-only/failure notice in the Load panel. The one-line fix renders
the save-owned notice only in Save Game. It does not cancel saves or alter storage,
pause policy, focus, or the existing pending-operation single-flight guard.

The actual TSX component is transpiled and rendered with persistent hook slots;
its shipped handlers and returned JSX are exercised with controlled promises.
Effects, DOM focus, browser pixels and persistence are outside this focused test.
Three outcome variants verify Load isolation; three controls verify reopening Save
before completion retains its correct notice and prevents duplicate saves.

Receipts contain raw stdout/stderr and exact before/after input fingerprints:
- baseline.json and candidate.json: initial harness failures caused by missing
  TypeScript esModuleInterop for default CSS imports. Preserved, not passing proof.
- baseline-fixed-harness.json: correct harness on unchanged product, 3 expected
  Load-notice failures and 3 passing pending-Save controls.
- fixed.json: 6 new cases plus 3 existing pause ownership cases pass, zero skips.

Resource review: new test remains conservatively serial (TypeScript compiler import
and transpilation); no globals, subprocesses, writes, sockets or scene startup.
Only productionSha256 is refreshed for the render-condition change; existing file
classification is preserved. Required check/build remain hosted acceptance gates.
No browser run or screenshot pair was produced for this component-state regression.
