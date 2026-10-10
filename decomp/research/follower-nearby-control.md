# Ordinary nearby Followers control

This issue #60 slice restores the HFX875 control as **Nearby followers**. The
committed tribe flag 0x80 drives its pressed state, four original frames, persistent
Total/class readouts and alternate fonts, plus the already-shipped task/transport
counts and selection/focus. Enter continues to open Planet overview.

The immutable reviewed native packet and implementation contract are in
[source commit 28d97dd1](https://github.com/JohnDeved/populous-new-dawn/tree/28d97dd17d959df59aeddab26007351ef3773db3/decomp/research/follower-nearby-source),
especially [contract revision 2](https://github.com/JohnDeved/populous-new-dawn/blob/28d97dd17d959df59aeddab26007351ef3773db3/decomp/research/follower-nearby-source/implementation-contract-v2.md)
(SHA256 `e2d9e598e257c2a8e415520455e12ea0fb50f27669b1f1ef6ebbad044f1b7330`).
That source-only PR is evidence, not a runtime dependency or a completed issue #60.

## Runtime policy

The Page arms on primary press and requests mode only on matching inside release.
Leave, cancellation, blur, Escape, blocked HUD state and lifecycle changes cancel
the press. Ctrl-primary does not double-submit through contextmenu/click. Enter and
Space provide a modern completed-key activation; native physical key 0x97 and
localized tooltip 758 text remain unbound.

One transient Scene-owned desired value is retained until an elapsed 12 Hz
opportunity immediately before `advanceGame`. Two releases before consumption
request the same directional cue twice and retain the first desired value. A
separate held press survives an earlier successful commit and can then reverse it.
The committed flag remains the only count/selection/display owner. The write
preserves every other tribe flag bit.

The opportunity cadence is an explicit port policy, independent of render rate,
simulation pause/speed, and animation/worship clocks. Request arrival uses
`performance.now()` and RAF's common time origin; no catch-up opportunity before
arrival can consume it. Native outer timing and shared ring contention are not
implemented. Current store bindings reject old Scene work before React disposal.

Pending input and elapsed phase are outside World/checkpoints. Save clones only
committed mode and never flushes pending input; ordinary menu opening cancels
synchronously before Save. Load restores saved committed mode with a fresh Scene;
Restart/new mission use their existing global default. This describes modern
checkpoint behavior, not original save-file equivalence.

Persistent counts use the same eligible `hudTaskPeople` projection and raw camera
as task counts. Global totals retain class enablement; displayed totals use strict
toroidal radius `<0x2400000`. Total sums models 2..6 once, excluding Shaman and task
overlay duplication. The housing meter stays global. Existing snapped-selection
centers and Shaman/reserved/vehicle asymmetries remain unchanged.

## Canonical artwork

`scripts/import-follower-nearby.py` reuses the accepted ordinary-palette decoder
and non-repacking append helper. It adds only 876–878, verifies existing 875, and
rejects partial or mismatched installs. `--check` is read-only. Input identities:

- HFX:`681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf`
- Palette:`6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53`

All four frames are 19×16. Decoded RGBA hashes for 875/876/877/878 respectively:

- `f7079766bbad34ee8c6cf17bca7aaf3451cb9444f29f552a4fd16f24d594af9c`
- `f58a199ab488eccbb14765ea573f70fef205c6f9b776c7c9d9a4af4decb6f63a`
- `9522098cc4f7c39e513026a2239a34fb9951da401bf39b55164b4b27cac600e6`
- `36af3ae85d1407b0481c9c6513d09b0684ede349f0c176e93276dbb306bfc8ac`

The source-bound append grew 1024×534 to 1024×551 and preserved 1755 old rectangles
and all old RGBA bytes (SHA256 `c50ab43d869de09b9924592365ccbb76ff38d7bc59320184771edb82ea6d9019`).
No Windows code or installer was executed. Directional audio cues 110/111 reuse the
already imported samples 148/149 and existing mute/pause behavior; cue-request
evidence does not assert audible playback.

## Evidence boundaries

Maintained tests execute actual Page handlers/effects, Scene request/animate/store
composition, time/lifetime edges, count boundaries and a portable controlled
decoder/appender fixture. The original baseline failed because HFX875 called
overview,876–878 were absent, and persistent Total used global counts/default font.
Supplied DOM/GPU/event fixtures are not real browser input. Canonical import/check
receipts establish asset bytes; static native source establishes provenance.
The genuine authored Mission 1 camera/count/selection/checkpoint episode, final
standard checks and fresh full-diff review are separate acceptance gates. This
slice does not claim original runtime cadence, complete native HUD pixels,
hardware performance, native save codec, or full issue #60 completion.
