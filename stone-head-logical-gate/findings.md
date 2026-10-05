# Issue214: confirmed model45 Stone Head body logical-visit mismatch

Result: **confirmed bounded mismatch; implementation is not started or accepted**.
Source `3cc9e830d2e7d2aa9844e8104fa51017d65dd171` is clean. One permitted CPU4
emulated check completed in1.62seconds, original session23234, exit0, with stable
source/probe hashes. It executes original instructions in Unicorn2.1.4, not the
original OS. Raw result, source-bound command receipt, probe and scoped instruction
excerpts are beside this note.

## Actual producer and active consumer

- Original class dispatcher004ed580 calls004a5ef0 for class5. Model9 runs the real
  common scenery initializer004a67d0, then004a5fdc ORs flags3 with0x40000.
  The shipped model9 record selects nonzero state10. The wrapper also ORs bit4
  and copies current sprite_animation_counter to object+0x18.
- Both executed creation cases (initial flags0 and0x100) preserve that input and
  return gate0x40000, class5/model9/state10, stamp90. With initial0, final flags3
  is0x40004. The table's initial object45/draw2 is not the active animated pose.
- The real004851e0 three-object post-load walk derives the automatic-gift flag
  from class6/model2 byte+0x80=3, then004fbd20 and004a66c0 select object45/draw4,
  morph1, scenery presentation mode2. The gate survives. Render flags are0x188,
  with neither the morph-transition bit0x1000 nor the held0x400 state active.
- At a supplied logical visit,004ed700 executes the actual class5 processor
  004a6480→004a8b00 (state10), then writes the current animation counter. These
  class processor bodies are **not intercepted**. Its morph/sound sampling does
  not clear the gate. Native primary traversal004ec6f0 visits nonzero states;
  secondary traversal visits all entries. The created state10 qualifies.
- Actual004ee770 traverses the supplied primary or secondary list and invokes
  004ee7b0. Draw4's ordinary morph branch calls0040cc10 for hold state, then tests
  matching stamp OR clear0x40000. Enabled45 therefore advances only on a stamped
  logical visit. The18-phase loop is18 eligible visits, not18 arbitrary draws.

The enabled/disabled/refill selector rows never set0x1000. A separate explicitly
synthetic transition control retains0x40000 with mismatched stamps and still
advances morphTimer by4. This corroborates the ungated transition branch; it does
not claim that the45 selector produces such a transition.

## Controlled comparison and current adapter

[StoneHeadAnimation](https://github.com/JohnDeved/populous-new-dawn/blob/3cc9e830d2e7d2aa9844e8104fa51017d65dd171/app/stone-head-animation.ts) creates flags3=0,
stamp=0; stepStoneHeadAnimation supplies counter0. The game clock calls it on each
24Hz presentation boundary. This is the same missing gate/visit-owner integration
pattern, scoped here only to the implemented45 body. Adding the flag alone would
leave stamp0==counter0 and would not remove extra visits.

Each list has an original-gate timeline and a deliberate clear-bit negative
control:40 enabled visits/20 logical visits, disabled hold, refill, land pause and
resume. For the first12 ordinary visits the native frames are
1,1,2,2,3,3,4,4,5,5,6,6; the current helper shows1,2,3,4,5,6,7,8,9,10,11,12.
The current helper matches every clear-bit control row exactly. It differs from
native raw f1 on61 rows per list and visible phase on54 rows per list. The held
phase has a retained raw-counter difference but the same displayed frame1; the
pause rows preserve an already-divergent phase and do not imply advancement while
paused. Both sides freeze. Refill is executed through the original selector and
resets/releases through its actual setters.

The normal45 geometry/per-visit evidence remains valid. The previous
scripts/check-native-stone-head-animation.py zero-initialized its supplied scenery
record and executed linkage/setters/updater, but did not run004ed580/004a5ef0.
Consequently that proof omitted the creation gate and did not establish the
logical-visit owner. Its notes already kept full outer timing qualified. No old
geometry, morph interpolation, face/UV or callback receipt is relabelled.

## Supplied boundaries and scope

The original executable is SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Hash-verified original bank2 object/face/point/morph data is loaded and normalized
by0040ce30. Read-only PE sections remain byte-identical throughout. No instruction,
imported model or production source is patched.

Supplied environment leaves are: terrain height128, object insertion, tile
invalidation, land shadow update, neighbor object/terrain notifications, terrain
propagation and audio submission. Actual class creation, state initialization,
post-load linkage, family selector/setters, class processor, stamp write, animation
list traversal, hold check and updater execute. The controlled allocation lists,
clock counters, logical-visit schedule and enable transitions are fixture inputs;
full world traversal, audio behavior, full render/campaign and original elapsed
wall time are not claimed. The second list is a traversal control, not proof that
ordinary heads are allocated there. The probe does not execute full allocation.

This is the decorative class5/model9 **body**, with the currently implemented
model45/46/47 family. The linked class6 gift/trigger supplies family selection and
is not the same animation owner. Vault bodies, model149/static157/other Stone Head
families, model8 sequences, UI acquisition, knowledge/HFX glows and generic scenery
are outside this finding. No global frequency change follows.

## Next decision

Independent review should verify the exact composed trace and leaf limits before
any implementation. A subsequent repair would need the45 body's own logical visit
owner plus constructor/checkpoint stamps, preserve disabled/refill and retired
trigger/decorative lifetimes, and keep genuinely ungated branches separate. Its
ordinary browser witness and regression scope remain to be designed after proof
acceptance. The fresh campaign lane and frozen Firewarrior proposal are untouched.
