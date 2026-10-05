# Reviewed Erosion shrine activation evidence

This sparse evidence branch contains the independently accepted bounded native
and port activation-order proof, bound to source commit
`10f168733815921070621842d8c025f35715a56d`. It contains no game implementation.

- [Finding and complete scope](findings.md)
- [Independent ACCEPT review](review.md)
- [Passing native receipt](attempt02.json), [port receipt](port01.json), and
  [preserved first-attempt fixture failure](attempt01.json)
- [Source/input fingerprints](source-input-manifest.json),
  [receipt integrity audit](receipt-audit.json), and [file manifest](manifest.json)

Native head activation runs Erosion once immediately, then the cached-next
scheduler visits it again only on the next traversal. The current port's actual
authored shrine creates remaining64 and first processes it on the next turn.
Under identical supplied terrain and seed, corresponding controller calls match
all terrain heights, RNG, and terrain notification cells.

The native proof supplies normal-mode level_flags0, RNG seed0x12345678, a free
object pool and worship completion after reset. It executes only the relevant
authored two-object graph; common intercepted leaves and unrelated scheduler
calls are explicitly listed in the native receipt and findings. The port proof
uses a declared stripped world. This does not establish ordinary original-game
play, complete mixed-class cadence, rendering or audio playback, and does not
identify the cause of broad animation issue214. Refs #8.

Only explicitly allowlisted text sources, bounded disassembly, normalized
state/delta observations, receipts and review are published. Original EXE/DAT,
the private raw-input extract `authored-input.json` mentioned in the local
findings/review, tool assets, profiles and unrelated files are excluded. The
review independently checked that local extract against the hashed supplied
game; reproduction requires those separately supplied game inputs.

To reproduce, check out the stated source commit and copy these files to
`work/orchestration/erosion-activation-proof/`. Follow the exact commands and
resource bounds in findings.md with the separately configured verified game and
Python tools. The sparse evidence branch itself is not a runnable game checkout.

Proof sources, raw receipts and review are byte-identical to accepted local
artifacts. `publication-inputs.json` preserves those original SHA256 values.
`manifest.json` binds every published file except itself; transport verification
also checks its independently retained SHA256 and the immutable commit.
