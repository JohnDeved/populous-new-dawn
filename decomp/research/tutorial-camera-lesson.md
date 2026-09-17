# Tutorial camera-controls lesson

## Canonical stage 3 to 4 boundary

CPSCR057 code offsets 2671–2699 extend the opening Tutorial after the World View
lesson. On an eligible 63-turn pass, opcode `1139` samples draw mode and the later
stage-2 branch emits message 135 and sets stage 3. Because the stage-3 branch occurs
earlier in the block, it executes on the next eligible pass while that sample remains
outside World View. It runs commands `1205`, `1209(214, 20, 1, 30)`,
`1210(256, 1, 30)`, and `1206`, then sets variable 9 to stage 4. These are the already
recovered flyby reset, position track, angle track, and start commands. At 24 Hz the
raw duration 30 becomes a 72-presentation-frame track after the six-frame warmup;
the existing Scene owner releases input when the flyby ends.

Message 135, emitted by the preceding stage, instructs the player to use the screen
edge for scrolling and the cursor keys for rotation. Those actions use the existing
browser camera-input owners; the original script schedules the transition and does
not claim an input-success predicate. The implementation therefore verifies both
real actions without inventing a script variable or gate.

## Deliberate stop

Stage 4's next branch begins at code offset 2648 with command 1142 and message 61,
the Shaman-selection lesson. Command 1142 and every later Tutorial lesson remain
outside this bounded slice. Restart rebuilds stage 0; Tutorial checkpoint saving
remains disabled.

This is static interpretation of the hash-pinned CPSCR057 plus the existing reviewed
flyby and camera owners, not a native boot-to-play capture or proof of later stages.
