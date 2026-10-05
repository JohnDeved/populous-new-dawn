# Issue 214: ordinary person animation has a missing logical-visit gate

## Supported result

The native stamp predicate is not merely an offscreen/visibility mode. Original
person creation unconditionally sets both interpolation bit0x100 and animation
stamp-gate bit0x40000, before selecting a person model. The browser constructor
omits both and keeps stamp0; the live animation caller always supplies counter0.
The native gate therefore has no effective counterpart in the live caller.

This is a concrete owner mismatch for ordinary native-backed person animation,
including idle/walk Brave, Warrior, Preacher, Spy, Firewarrior and Shaman. The
same gate is produced by Splash. Full/partial hut smoke and building damage smoke
do not set it in their checked initializers, so changing every animation to12Hz
would conflate distinct native families. No runtime fix is made here; independent
review is required before implementation.

## Exact source and probe

Clean source `a53fa05587c4c1d363e3596162b41fcb9f26e3e8` in
`sprite-stamp-gate-audit`; original executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No browser, package/dependency change, Ghidra or original OS run.

`native/probe-stamp-gate.py` SHA256
`d4a49c7125d64e810646ce4b5f0018d961a58cfea270499337b77b164d253ce0`;
`native/result.json` SHA256
`4a6370c5addef38f68d670f4ff61107f994bf1a1da56b08d31f77f070dff9760`.
Original session42460 exited0 in2.283s onCPU4, with a60s outer cap. The exact
command, immutable source/input hashes and scoped disassembly hashes are in
`receipt.json`. All mapped read-only PE regions are checked unchanged around
every executed call. Node diagnostics import the actual source constructor,
updater and live animation adapter; they do not modify source or run a browser.

## Producer → logical stamp → animation consumer

1. `004d23d0` is the class1 type initializer called by original `004ed580`.
   Instructions `004d23de` and `004d23ed` OR flags4 with0x100 and flags3 with
   **0x40100**. The latter executes before the model switch at004d2410. The probe
   executes the exact prefix through004d23f4 for models2..7 and initial
   flags3=0/Shield0x8000/Bloodlust0x80000:18 cases retain those flags and add0x40100.
   No callee is intercepted in this prefix. It is deliberately not a complete
   person allocation/initializer or all later state transitions.
2. `004ed700` runs the relevant class processor and then writes the current
   global `00897981` into object`+0x18`. The existing reviewed allocation and
   post-allocation wrappers also initialize this stamp. It is the last logical
   processor/allocation visit, not a renderer visibility stamp. Each new outer
   iteration increments the global before draw_main; draw_main executes due
   logical work before its animation-list call.
3. `004ee7b0` modes1/2/4 require either matching stamp/counter or bit0x40000 clear.
   With the ordinary person bit set, an extra draw visit without an intervening
   logical visit leaves f1/f2 unchanged. It does not matter whether that person
   would be visible. The mode3 model sequence and mode4 transition branch have
   their own conditions and must not be generalized from this gate.
4. The probe invokes actual `004d4040` to select native idle/walk rows for each
   model2..7, then actual `004ed700` and `004ee7b0` across12 numbered draw visits
   with six supplied logical visits. Its class processor leaf is intercepted
   only to isolate and observe the dispatcher's post-body stamp write. The body
   observes the old stamp; the actual dispatcher stores the new counter after
   returning. All six non-logical draws leave animation unchanged in12 timelines.
5. The TypeScript updater matches the native rows when given those actual stamp
   inputs. The real current `animateLiveObjects` caller instead advances on every
   one of the12 visits with its counter0/stamp0 record. It diverges from each
   native timeline. Restoring the native flag alone still advances identically to
   the broken adapter, because zero still equals zero. The missing producer and
   missing live logical-visit ownership must be addressed together.

These are numbered visits, not an emulated wall clock. They show which visits may
advance the animation. They do not claim that historical rendering always ran at
24Hz or that six supplied logical visits measured half a real second. Existing
independent evidence owns normal simulation default12; current browser evidence
owns the24-visit adapter. At ordinary render rates exceeding the logical rate,
the native person gate supplies a discriminating reason for slower person frames.
At low original render rates, multiple logical visits before one draw coalesce;
modern elapsed-time repair must retain the project's frame-rate-independence goal
without pretending those obsolete coalescing losses are an authored target.

## Browser producer and retained observation limits

`app/live-people.ts:createLivePerson` initializes flags3 only from Shield and
Bloodlust and initializes stamp0. Actual constructor diagnostics for all six
ordinary kinds return flags3=0,stamp0 without those statuses. The later live
adapter has no increasing native object stamp/counter owner. Existing ordinary
state/health/physics flag masks preserve0x40000 if present, but the live creator
never supplies it. The known command27 last-frame hold separately compensates
for a12-Hz controller polling the24-Hz adapter; it is not native gate proof and
must be reviewed when fixing the owner.

The earlier pure browser snapshots captured object/draw/f1/f2/state/renderFlags,
not flags3 or stamp. This follow-up therefore does not claim raw flags from that
recording. Constructor/source and native-byte evidence establish the mismatch;
the existing recording independently establishes fast actual native-backed frame
advancement. No new browser sampling was performed.

`00471c40`, `0046f080` and `0046f850` separately use bit0x100 and the global-minus-
logical-stamp difference with measured game/render rates to interpolate between
logical positions. They corroborate the stamp's role; they do not themselves
decide the animation gate. The earlier name `visible` in the port is misleading
for this ordinary person predicate. This investigation does not expand into the
complete renderer or claim exhaustive alias-write absence.

## Bounded effect family comparison

Original effect initializers and animation setter bodies execute with state,
audio and terrain-height leaves supplied. The original class7 processor body is
supplied only during the dispatcher-stamp timeline. No timing is supplied to any
leaf.

| Producer | Resulting flags3 | Extra draw without logical visit |
| --- | --- | --- |
| Splash `00513830` / model65 |0x40400|Animation holds|
| Full hut smoke `0050c150` / model74 |0|Animation advances|
| Partial hut smoke `0050c150` / model75 |0|Animation advances|
| Building damage smoke `005119d0` / model76 |0|Animation advances|

The browser Splash producer already retains0x40400, but the zero stamp/counter
adapter bypasses its gate. Its missing ownership is thus more narrowly isolated
than the person constructor's omitted bit. Smoke lifetimes remain separate
logical consumers; this table addresses artwork advancement only.

Retained source `004a5ef0` also explicitly ORs0x40000 for scenery model9, the
ordinary Stone Head family; current StoneHeadAnimation starts flags3=0. That is a
specific additional producer lead, not part of the four dynamically executed
effect producers and not a license to include every model in a repair.

## Required independent decision before a fix

Review the exact original person prefix, actual setter/dispatcher/gate rows,
source constructor/caller mismatch and leaf limits. The supported repair boundary
is per-object native logical-visit eligibility, not the global24Hz interval.
Any implementation must bind actual controller visits, allocation and pause,
consider restored records and command27, and preserve separate non-gated smoke/UI
owners. Complete ordinary play and speed/refresh regression evidence is still
required after a candidate repair; no such acceptance is claimed here.
