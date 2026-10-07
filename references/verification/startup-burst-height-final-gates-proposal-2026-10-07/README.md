# PR254 final current-main gates proposal

**Source preparation only; no quality/test/build command launched.** Exact clean
8f50dda2 on accepted main e3a7a06a, using the already verified independent dependency
copy27/1209759. The original loan/stub/caches/unknown receipts remain quarantined.

Reuse the accepted gate ordering: scoped format, ESLint and Oxlint; advisory Fallow
health/dupes/unused; required npm run check; required npm run build. Fallow exit1
stays failed/advisory findings; exit2 is a tool failure. Required failures stop the
sequence and leave later stages not-run. Scoped caps30/60/30s, Fallow60s each,
check900s and build900s; outer2140+10s and host2153s fallback. CPU5–7, unique output/
TMP,1024MiB Node heaps, no new browser/native execution or dependency installation.

The ordinary independent-copy host is reused. It retains owned PID/start/session/
namespace information, actual terminal cleanup, before/after complete source/tool/
packet/copy-receipt hashes and full dependency inventory. There is no loan/return.
The Fallow verification marker starts absent. Ordinary package verification may
create it; retain the generated file as evidence, validate package/path/binary SHA
and mtimes with the previously accepted marker checker, then restore absence before
inventory equality. --no-cache applies to analysis and does not forge verification.

The read-only orchestration plan ran with exit0 and executesChecks=false. Its
conservative selected/missing-environment entries and seven unknown paths remain
visible. [Check scope](check-scope.json) maps them to aggregate portable coverage,
accepted composed native proof and accepted ordinary pair, and explicitly explains
unaffected broader subsystem selections. It does not label unrun checks passed.

Exact [host](host-gates.py), [runner](run-gates.mjs) and [packet](gate-packet.json)
require independent preflight and a separate resource grant. No source/test edits,
assertion weakening, repeat execution or original-quarantine mutation is authorized
by this proposal. Final combined-source correspondence remains explicit while
PR255 is unaccepted.
