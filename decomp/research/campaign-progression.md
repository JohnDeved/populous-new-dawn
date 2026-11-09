# Campaign progression snapshot

Executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

The Mission 1 victory branch in `00418e30` sets campaign progress bit 0 and calls
`004860c0(level - 1)`. The callee makes no calls: except for sentinel index 99,
it copies the current 56-byte player-things record to the fixed
`level_hdr_savegame_mem` buffer at `0089a3a9`. It copies 48 bytes for each
non-player tribe and four still-opaque values into the selected 164-byte per-level
memory slot. Disk serialization is owned separately by callers in `00427220`.

This proves an in-memory completion snapshot, not an automatic next-level load or
Windows screen transition. The browser therefore keeps its result screen as the
player boundary and creates Mission 2 fresh from the recovered level, header, and
header-selected script when Continue is chosen.

Evidence: reviewed export [`004860c0.c`](../generated/004860c0.c), SHA-256
`cbf09af1961d2bb3d1592473f5d65445428147e4019902ea1b81f3dcfe901fc5`.
The complete native probe supplied only stack/global input bytes, intercepted no
calls, and matched 32 reads and 30 writes; exact profile-record compatibility and
the remaining opaque field meanings are not claimed.
