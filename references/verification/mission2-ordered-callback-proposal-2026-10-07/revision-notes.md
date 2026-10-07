# Source-review corrections to d324d1c5

The prior proposal remains preserved at
`d324d1c5dafaa86e11936ddcd2c3ef6769a20b77`. It was not executed. This revision
changes only the source case declaration and its supporting byte evidence.

1. **Header-store owner and timing.** The prior 0/0/28 tuple was wrong.
   `0042b355` loads param1 from ESP+0x14 into EBX; after successful loading,
   `0042b3ea/3ee` load params2/3 into AL/CL. Stores `0042b3f2/3f8/3fd` write
   BL/AL/CL to `0096ead0/1/2`. The Mission2 wrapper supplies 28/0/0. Those writes
   now appear explicitly between the link tail and roster tail.
2. **Brightness owner.** `004be230` is a call-free native calculation that
   writes terrain cell+0x0d. Remove it from supplied leaves and retain it real.
   The other explicitly excluded presentation/audio consumers are unchanged.
3. **Owner-count finalization.** Extend the existing link slice's exclusive
   stop from `00485122` to `00485153`. The intervening texture notification
   remains a declared supplied leaf. The real count loop sets tribe+0x949 to
   0x61 for owners with count0, including Mission2 owners1/2. Preserve the
   original local count array throughout all 2,000 record slices.

The fixed 2,011 top-level entries, 86 allocation-attempt ceiling/depth 2, memory
and instruction/time bounds are unchanged. No new native call, executable,
runtime implementation, package, browser or resource reservation was performed.
Callback-coverage review and a later executable freeze/grant remain required.

## Remaining timing correction to 8338da86

The first repair at `8338da867a79170434dcd1672d4230e0006e9898` incorrectly
introduced a zero-during-records assumption. That version is also preserved and
was not executed. Reconciliation of all three relevant wrapper bodies shows:

- `0042c790` obtains landscape/object/flags from canonical HDR bytes96/97/98,
  giving28/0/0, and passes that tuple to `0042b230`. The explicit-parameter
  wrapper `0042b590` forwards its existing tuple to the same loader.
- `0042b355` reads param1; `0042b359/35b` compares it with active bank
  `0089ce3d`. On reload, `0042b35e` stores28 there and **0042b364 stores28 to
  0096ead0 before resource loading and the record loader**. A matching active
  bank skips the reload and already retains28.
- `0042b3f2/3f8/3fd` repeat the landscape value and store object/flags as28/0/0
  after the record/link tail, immediately before roster initialization.

The revised declaration therefore supplies the two loaded-bank writes before
terrain preparation/records, and reapplies28/0/0 before the roster tail. It
withdraws the zero-entry inference for0096ead0. The original entry/capacity/time
bounds and the other two review repairs are unchanged.
