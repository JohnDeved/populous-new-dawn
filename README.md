# Reviewed publication recovery evidence

This archive retains source-bound receipts, raw logs, runners and selected screenshots for the restored PR172–174 integration. It also retains the subsequent PR175/176 publication records and the bounded production-browser limitations.

`tested-sources.bundle` preserves the local tested commits, including b2368eb and the checker-only final 1dc6a79. Its prerequisite commits are already in the public repository history. Fetch the bundle into a clone of JohnDeved/populous-new-dawn to recover the exact gate sources.

- Historical accepted combined tree: 3342696913fc3ba1cdd9b44e7eb2a19528ba45a8.
- Restored full-gate head: b2368ebf64400e9ee3057300fabbe6611422d7ca, with that exact tree.
- Final reviewed local head: 1dc6a794419d9bee7174d7effbfa676699e122e0.
- Published main merge: 155e591760f5c60325bb7bf47eb8cc5f7021ab04.
- Final shared tree: b6b8df777dbb962f370a47e69b173deb4027abee.

Only the real-clock checkpoint checker changed after the full gates: it captures the exact public Load replacement before ordinary gameplay advances. The passing ignored observation scenario is byte-identical to the final committed checker. All runtime/build/native inputs are unchanged. The manifest preserves exact source identities rather than relabelling earlier receipts.

Verification passed 882 tests, production build, 13 native probes, 1,312 export checks, four rendered scenarios and 32 final scoped tests. Global formatting, ESLint, Oxlint and unused-code checks remain non-green due disclosed legacy findings. Original failed export invocation and delayed-load comparison receipts are retained. Review the native methods and software-renderer limits before drawing broader conclusions.

Receipt artifact paths retain their original executor locations. Their raw logs are also stored at the corresponding relative paths within this archive, and embedded log hashes allow relocation checks. Canonical original-game bytes are identified only by hashes; no original executable/game-data files, dependencies, caches, credentials or private conversation notes are included.

Production deployment success is separately bound to the exact GitHub commit and Cloudflare version. Direct external Headless Shell navigation and the supported cloud browser both had environment limitations, documented under production-smoke; they are not reported as a live 3D-playability pass.
