# Source addendum: 4ea7e56 and interpolation boundary

**ACCEPT source preflight through `4ea7e56fc4b42fa91c1bb49d5f894237b67cbda2`.** The earlier browser/full-gate limits remain unchanged.

Independently compared `c15edac605fc52d4ebf60ebb8f75e7c903f39d4d` to this head. Every tracked input under `app/` and `public/`, plus `package.json`, `package-lock.json` and `tsconfig.json`, is identical. The only changes are the read-only fixture auditor, its project-map reference, and a documentation correction explicitly saying four of seventeen handoff cases are reduced into the portable fixture. This is verified correspondence, not acceptance inherited from a summary. Receipt: `correspondence-4ea7e56.json`.

Read the complete 181-line auditor. It pins raw receipt/probe/executable/asset/search/read-only-region identities, verifies redundant native raster argument bytes, reconstructs all reduced fields and command digests, pins the unchanged fixture bytes, and compares the entire reconstructed fixture. It performs no application imports, native execution, fixture writes or browser work. Independently ran it against the retained 17/10/3 native source receipts: passed. Output: `fixture-auditor-4ea7e56.json`.

The intended draw interpolation boundary was also inspected explicitly in the unchanged production source:

- `previousDrawCommands` and `clock.lastVisit` retain the previous native UI submission. The overlay computes a bounded elapsed fraction from persisted current/next deadlines.
- Stable companion particle slots interpolate positions; the body interpolates position, scale and the shortest angular delta. Trails, pulse, native sprite frames/palettes, controller steps and retirement remain discrete and UI-visit-owned.
- Reference-geometry identity prevents interpolation across replaced controller owners. A zero-angle/nonzero-angle pivot-branch change bypasses body interpolation. Visible pause samples current native position.
- Interpolation changes only output positions/scale/rotation. It does not mutate reference geometry, World/controller state, timer/clamp/payout, clocks or RNG.

This source check does not establish rendered high-refresh smoothness, an independent full raster oracle, or hardware performance. Those require the planned browser evidence. No browser, server, package or broad check was run here.
