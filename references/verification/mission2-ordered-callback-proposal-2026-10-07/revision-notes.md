# Source-review corrections to d324d1c5

The prior proposal remains preserved at
`d324d1c5dafaa86e11936ddcd2c3ef6769a20b77`. It was not executed. This revision
changes only the source case declaration and its supporting byte evidence.

1. **Header-store owner and timing.** The prior 0/0/28 tuple was wrong.
   `0042b355` loads param1 from ESP+0x14 into EBX; after successful loading,
   `0042b3ea/3ee` load params2/3 into AL/CL. Stores `0042b3f2/3f8/3fd` write
   BL/AL/CL to `0096ead0/1/2`. The Mission2 wrapper supplies 28/0/0. Those writes
   now appear explicitly between the link tail and roster tail. Initial fresh
   component bytes are 0/0/0; the landscape-bank byte is not supplied early.
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
