# Mission 12 Matak housing continuation

The first-Tower adapter used a port-only `0x20000000` latch to stop all later
construction. The bounded continuation removes that artificial stop only for
Matak housing while its authored Temple still satisfies its sole school target.
Red/Yellow expansion, school replacement and Tower replacement remain outside
this slice.

Original `004e5580` tries schools before the housing tail; `004f6480` counts
existing models. Matak's turn-zero `cpscr062.dat` has Temple target one and
housing target eighteen. Its imported buildings already include the Temple.
`004f6520` excludes unfinished class-2/state-1 capacity but counts completed and
planned housing. `004f5ed0` checks real model-1 availability and `004627f0`
requires at least two workers and preserves construction concurrency. Native
`004f67b0` counts non-Shaman people with state flag eight and no computer
assignment. The browser retains its extra busy exclusions and uses live native
states rather than idle animation fallbacks for this admission.

`004f6020` uses the retained loaded cell before a base exists and the stored
construction base afterward, including zero. The adapter reads the imported
Shaman position rather than the moving live Shaman before an established base.
This is not a full native construction-history ownership implementation.

## Native probe

`check-native-mission12-growth.py` pins executable, header and script hashes,
executes native header initialization, knowledge setup, complete Matak startup,
real building availability, linked capacity traversal, producer and allocation.
Only `004f67b0` worker count is intercepted. Tower/Temple/Hut owners are supplied
controlled fixtures, not whole-world loading. Eleven cases cover repeated housing,
capacity boundaries, unfinished exclusion, four-task concurrency and zero/one/two
workers. Its JSON retains executable and input identity, probe SHA-256, Python
and Unicorn versions and explicit interception limits. This does not establish
whole-game RNG, real-time construction, rendering or full producer equivalence.

## Live verification

The unmodified imported Mission 12 entry advances naturally to turn 3000 with at
least five completed Matak Huts (the level starts with one). A current-format
checkpoint at turn 256 resumes with complete world equality at every 256-turn
boundary and at 3000. No entities, resources, construction orders or AI state are
injected in that test. Controlled cases separately exercise capacity, disabled
production, concurrency, worker states, stored base zero, moving Shaman and the
Temple-replacement boundary.

The existing natural Red training route still produces eight Warriors by turn
2200 and preserves complete checkpoint equality each turn. Green's additional
construction shifts shared order allocation and subsequent RNG-dependent timing;
the regression now binds the actual shared training order and explicitly checks
the updated eight conversion IDs/turns. It retains first-student removal, native
object identity, model-8 entry payload, shared references, health and released
school occupancy instead of pinning the obsolete global order slot four.

Focused M11/M12 tests: 38 passed. All 73 selected portable campaign/presentation
checks passed. Native probe: 11 cases passed. Full check, production build, local
rendered evidence and persistent browser Save/Load remain pending; these focused
results are not release/full-original-game acceptance.
