# Frontend Quit fallback shadow repair

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/quit-fallback-shadow), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Refs #16/#457. Product candidate f6cdab7a, based on merged main0b94142b.
Original menu1 question/choice rows and glyph shadow composition come from
`decomp/research/frontend-quit-menu` and `frontend-menu-composition.md`.

The Quit question shadow now follows questionReady; Yes/No/Back shadows follow
artReady. HTML fallback has different metrics, so retaining native glyph shadows
caused ghost letters. All-ready row order/coordinates remain identical. Tutorial,
main and options behavior are unchanged. This is fallback compatibility, not a
new native rendering/persistence claim.

Captured-production-callback tests cover all four readiness combinations for
Tutorial and Quit, preserving exact rows (Quit4/3/1/0; Tutorial8/3/5/0).
Five recommendation/draw tests plus six existing frontend Quit tests passed.
The first test command included a nonexistent test pattern; only the five actual
tests ran. The six existing Quit tests were then run explicitly; no eleven-test
single-run claim is made. No full local suite/typecheck was run.

Real OriginalMainMenu component QA passed at640×480 with all fonts available,
question font blocked, choice font blocked, and both blocked. Each checks Back
initial focus, Escape restoring Quit, No returning, and unavailable browser Yes.
Source/dependency fingerprints remained identical and cleanup was verified.
The fixture uses real production assets/CSS/helper and controlled callbacks,
without loading Home or a mission scene. Screenshot inspection confirms repaired
Quit question/choice shadows. When choice fonts fail, an existing separate title
fallback/native logo-shadow mismatch remains visible and is outside this slice.
No claim of globally pixel-clean fallback rendering or native execution is made.
