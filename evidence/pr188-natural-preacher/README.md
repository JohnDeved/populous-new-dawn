# PR 188: natural Blue Preacher verification evidence

Code head: `794cfa04e6cb73453159dd3bc7332594a655cfd9`.
Base runtime: `0b0719f270649f688a07b791a8ff831ed0c91a46`.
Browser-tested source: `c4e47046940ff5eda87a35f8a8dc9a5cf7344983`.
[Draft PR 188](https://github.com/JohnDeved/populous-new-dawn/pull/188) references
[PND-11](https://github.com/JohnDeved/populous-new-dawn/issues/11), which stays open.

The separate evidence branch is not intended for main integration. All game runtime
and parity bytes remain unchanged. Fresh independent review accepted the repaired
head. Five focused tests, scoped ESLint, syntax and structural checks pass there.
The earlier 941-test aggregate covers the unchanged application/existing tests;
build evidence carries across 13 identical source objects and matching installed
lock. The checked portable bundle retains raw source-bound evidence and failed
attempts, with workspace paths redacted by the repository's reviewed export tool.

## Captures and exact scope

All three PNGs belong to browser source `c4e4704`, sandboxed Chrome Headless Shell
154 / ANGLE SwiftShader, 1440×1000. They are lifecycle states of unchanged runtime,
not a before/after bug-fix comparison or original-game references.

- `natural-blue-sermon.png`: turn 2526. Authored Yellow Brave 53 is listening in
  state 23 to naturally trained Blue Preacher 3164, with timer 98. Vault, Temple,
  training and approach used ordinary model commands with diagnostic fixed turns.
- `sermon-cancelled.png`: turn 2526. An ordinary movement command releases the
  listener into state 10, owner 0, clears listener flags and gives the Preacher a
  movement order. The visible actor is still Yellow.
- `converted-blue-brave.png`: after shipped Save checkpoint, fresh-page Load Game
  and normal-speed real RAF. Brave 53 becomes new Blue Brave 3188 at turn 2832 after
  24.028 observed seconds, with both native replacement flags. Capture at turn 2833;
  the replacement contributes 255 pixels in the mesh-visibility comparison.

The browser run independently proves saved/load state-23 ownership and replacement.
Integration review later found its async save-readback polling guard was weak.
Final code replaces that guard with explicitly awaited sequential reads and a
literal-true assertion. False→false→true, non-overlap, bounded failure and rejection
regressions pass. No new browser execution of the repaired guard or new timing
result is claimed. The old successful result remains labelled with its own source.
Software rendering does not prove native-image equivalence or hardware performance.
