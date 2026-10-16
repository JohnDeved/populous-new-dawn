# Independent review of 96868869

Disposition: **HOLD. Do not merge.** The visual direction is not accepted; no implementation repair was requested for this bounded experiment.

Inspected the complete four-file source/test diff and the actual Home screenshots, geometry records and badge-detail crops.

Verified:
- Native 640×480 focused/unfocused and portrait 768×1024 PNGs are byte-identical to the baseline.
- Frame, title and all button geometries are identical in the six compared viewports.
- Native palette-fade positioning and the centered logical interaction frame are preserved.
- Bullfrog/QSound panel and TM detail at 1920 and 3840 is visually clean, with both TMs retained and no obvious stone rectangles.

Visual blockers:
- At 32:9 the face is over-enlarged and the crown is cropped away.
- At 21:9 the gold subtitle competes with the bright forehead.
- Moving from 640×480 to 641×480 triggers an immediate roughly 25% backdrop zoom despite a one-pixel viewport change.

The 16:9 composition is coherent, but that does not establish a good wide-screen direction across the target displays. Preserve the candidate for comparison. Do not spend broad-check/build time on this held visual approach.

Not established: candidate short-viewport/fallback/interruption/interaction regressions, DPR2, per-frame performance, full check/build, or original native-runtime screenshot parity. These remain not-run, not passed.
