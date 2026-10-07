# Lean runtime integration and final gates

The maintained successor is PR #255, based on accepted main `e3a7a06a4250457502288d5b4c4e4ad8f3b40b53`. Independent source review accepted the 27-path allowlist at `2f0c50379d89f603f4e51de006169ae04c9d2380`; historical diagnostic/native inventories remain on evidence branches.

Gate01 stopped at the required Oxfmt check on `app/computer-runtime.ts`. No ESLint, Fallow, aggregate check or build ran in that attempt. Its terminal receipt retains unchanged source/tools/dependencies, restored Fallow marker and empty owned process group.

A separately authorized formatter changed five line-break groups. Oxfmt succeeded, but the first observer compared TypeScript printer strings and failed because the printer retained layout. That failed receipt is preserved. A read-only structural AST and 7,372-token comparison matched exactly, with zero parse diagnostics; independent review also accepted the actual diff. Commit `de0fb63fbcaaf2e0c16a355988bc022ee6313ae7` contains only that formatting change. The formatter borrowed no directory: donor inode 1978923 and its full inventory stayed identical.

The fresh gate02 packet binds that exact commit, the unchanged serial quality/check/build envelope and normal Fallow verification with original marker restoration. Its launch metadata here is preparation evidence; it does not claim a gate result. Final aggregate and ordinary browser acceptance remain pending. Historical full-check failures and component proof limits remain recorded.
