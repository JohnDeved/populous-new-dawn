# Focused acceptance selection

Candidate: 30e671e8e1ec53ee1624ae85e207a6e60798ca45. Base: b8465001a618b97ded7d7a7cd4afc4a1fc7240f5.

`orchestration:plan -- --base b8465001a618b97ded7d7a7cd4afc4a1fc7240f5` was inspected. Shared world-turn/types/initialization and game-store paths route broadly to campaign, actors, renderer and persistence checks. This repair changes only the authored class-7/model-24 source binding and a legacy immutable field recovery. It does not change actor animation, training, combat, spell stock, the Land Bridge arithmetic, unrelated missions' input controls, or scene geometry implementation.

Required final gates:

- `npm run check` (typecheck, all portable tests, parity structure, orchestration structure)
- `npm run build`
- `npm run format:check`, `npm run lint`, `npm run lint:standard`
- Fallow `quality:health`, `quality:dupes`, `quality:unused`, preserving advisory failures
- `check-native-authored-bridges.py`: all five currently live campaign sources, Mission 1/3 absence, real template copy and native dispatch/controller
- `check-native-land-bridge.py`: unchanged arithmetic/lifetime regression
- Ordinary Mission 2 rendered acquisition, initial/final terrain, actual endpoints, active and completed IndexedDB reloads, no replay
- Native producer/controller replay of that browser initial/final terrain, all16,384 heights
- Fresh full-diff review with explicit final delta/evidence review

The dedicated authored portable tests cover all five live source records and legacy recovery. M1/M3 existing aggregate tests remain in scope, while fresh whole-mission browser journeys and later Mission5/6/9 victory claims are not acceptance for this immutable-coordinate adapter repair. No parity fixture regeneration, new CI, deployment or recording is selected. Existing native source/export hashes are structurally checked. New native probe/research paths are explicit reviewed additions, not an empty unknown-path check set.

No hardware performance claim: runtime change replaces one source Point at one-shot head completion, with migration lookup only for missing legacy origins. Headless renderer functional evidence is kept separate.
