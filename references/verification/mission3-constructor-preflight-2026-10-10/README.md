# Mission 3 constructor entry: static packet, native NOT_RUN

## Result and boundary

The raw Mission 3 input and producer/postpass boundaries are bound. The actual
campaign-entry state is not bound, so the complete constructor ledger is BLOCKED.
No original instruction was executed, no installer or PE entry was launched, and
no game/API/network/file-I/O leaf was run or replaced. No product path was edited.

The active `constructor_trace.py` supports only `prepare`. It uses the existing
SHA-locked static PE reader and Capstone. The unfinished native implementation is
retained as `constructor_trace_draft.py.disabled`, NOT_ACCEPTED_FOR_EXECUTION.
It must not be renamed or enabled without repairs, a fresh review, and a parent
run-lane release. `preflight03/` is the current static receipt; earlier preflight02
predates the final static-only split. `preflight01` failed a static window-boundary
assertion and did not run original code.

## Positive, directly source-bound findings

- Original EXE SHA-256: 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.
- LEVL2003.DAT SHA-256: eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf.
- LEVL2003.HDR SHA-256: 219dd7611a4e3f6c2d4e78620a4d5bb9cf61bf0e9c66c21b2b43b89c8ba4d3f0.
- All 2000 55-byte raw records start at file offset 0x14043; 109 are nonempty.
  `preflight03/raw-records.json` retains every raw byte and file origin, including
  empty records. Exactly 52 direct records are class 1: 44 Wildmen, six Braves,
  and two Shamans. This is not a complete allocation count or class-1 seed.
- Header[88] is 3. Original 0042c7a6 reads 0089b741+88 and copies it to both
  0096eac0 and 0096eabf at 0042c7ab/0042c7b0. Header[94]=4 is not tribe count.
  Header[96]=25 selects landscape 25 and Header[97]=6 selects object bank 6.
- Both random streams are assigned 0x09d78afe by 0042bfa0, at 0042bfb5 and
  0042bfc5. The twelve class counters are cleared at 0042bff6..0042bffe.
- Original producer segment 00484edc..00485038 retains its record-class/model
  filter, owner map, genuine allocator 004ed8a0, model initializer 004ed580,
  state dispatch, and postprocessor 00485b00. ESI points at record+1, EDI holds
  the one-based file record number, and EBX=0. Frame counts are ESP+2c..38;
  the four-entry identity tribe map is ESP+40..4c.
- Original full postpass is 00485050..00485122: trigger links 004851e0,
  primary next_unit clearing, 004866a0, 004edf50, and linked-effect flag handling.
  Its conditional convert-wild predicate is CLASS 7 / MODEL 89, directly tested
  at 004850ef/004850f9, and calls 00478c60. It is not class 10/model 89.
- Original pre-object terrain runs 0044ddf0(0,64,0) then 00422a60(0,64).
  The height copy is 00484c9a..00484cba. The third 0x4000-byte plane at file
  offset0x10000 supplies terrain mask0x04; the first two such planes are read/discarded.
- Loading raw objs0-6.dat alone is incomplete. Original 0040c690 also calls
  0040c920 point/face relocation, applies objects/aniob0-6.dat through
  0040c7d8..0040c818, processes objects/morph0-6.dat via 0040ce30, and invokes
  00418de0 fixed object flags. Those source-bound files are available and hashed.

## Finite entry flag audit

Neither retained caller body, 0042b590 or 0042c790, directly supplies the prior
value of 00895da4 before calling 0042bfa0. Earlier helper calls in 0042c790 are
not fully closed by this bounded audit. The first conservative unbound read would be 0042c002:
OR dword[00895da4],0x10. The preceding original palette helper 004a32d0 is pure:
it consumes the reset's stack arguments and writes the reset palette. No native
run is needed to rediscover this first strict read-before-write failure.

Crucially, an unknown WHOLE flagword is not proof that the constructor outcome
needs every bit. Reset makes 00895da4 = (prior & 0xffff9fff) | 0x00800010.
The later 0042c8f0 clears 0x02500000, with actual writes at 0042c989,
0042c99e, and0042c9ad. After those masks, known-one bits are0x00800010,
known-zero bits are0x02506000, and preserved unknown bits are0xfd2f9fef.
00477780 can clear the same0x02500000 earlier, conditionally on gameFlags mask0x02.
None of these is a complete prior supplier.

The retained direct allocator004ed8a0, model dispatcher004ed580,
state dispatcher004ed640, postprocessor00485b00, trigger links004851e0,
postprocessing004866a0 and004edf50 do not directly read00895da4.
The retained animation consumer004ee7b0 tests preserved bit0x10000 at004ee8c6,
but its reachability during this constructor-only stage has not been proved.
Therefore the conservative wholeword diagnostic stop alone is insufficient to
claim that original class-1 seed recovery is impossible or changes with that word.

A more directly relevant unbound mode input is land_flags_1 at0089c661 mask0x08.
00484fed tests it before allocation and, when set, rewrites non-Shaman class-1
records to neutral Wildmen at00484ff6/00484ffa. This can change the six authored
Braves' model/state/RNG path. The retained reset/loader masks preserve mask0x08.
004d24ed also tests load_flags byte0089c668 mask0x04 (word mask0x04000000) before
an owner0 person initialization path. Its effect on this specific authored/nested
allocation stream still needs reachability proof; the six direct Braves are owner2.
The interface-state byte0088f000 also guards trigger nested allocation in00485b00
and the class7/model89 postpass. None should be guessed zero to select a branch.

## Next bounded proof and unfinished implementation

1. Bind the actually consumed mode predicates above from a retained campaign
   caller or trustworthy source-bound state capture, or prove their relevant
   branches unreachable for this exact Mission3 input. No full PE/startup expansion
   is assumed. Bit-level independence may avoid demanding a whole flagword.
2. Bind pool/free-list initialization, related-record pointer00892443, game flags,
   tribe fields, initial counters, and complete loaded bank6/animation tables.
   Neither a zero-filled mapped image nor successful address reads is entry proof.
3. Repair the DISABLED draft before any native use. Known review findings:
   - constant.dat is hashed but configure_native_constants is not applied;
   - Unicorn pre-write hooks currently promote attempted writes to "known" too
     early; failed instructions must not become committed provenance;
   - its hardcoded sourceHead is stale; active static preflight now distinguishes
     preparation base76701bda from observed source27a3f0f0;
   - draft executable section allowance includes CSEG; approved text scope must
     be explicit and enforceable;
   - ABI/register/EFLAGS provenance is only documented, not a complete taint proof;
   - the setup sequence is unfinished and must be audited for source order and
     all required resets before claiming the full2000record ledger;
   - no run has tested allocation/nested-return logging or snapshots, and their
     completeness is not yet accepted.
4. A fresh reviewer must accept repaired entry/boundary/driver scope before the
   parent releases the native lane. Log all nested allocations, file origins,
   primary/secondary list order and class1seed before/after; preserve every failure.
   Stop before texture pass00485122, broader0042b230 and all gameplay turns.

## Verification

- Initial source base:76701bda3d02f9fa12684b2e8175ec3809034465; no initial tracked dirt.
- Observed final source:27a3f0f07516405cf8772980661d2a44f21fb008; no tracked dirt.
- Existing Python/Unicorn/Capstone environment reused; no installation.
- `.../native/venv/bin/python -m py_compile .../author/constructor_trace.py`: exit0.
- `.../native/venv/bin/python .../author/constructor_trace.py prepare --out .../author/preflight03`: exit0.
- Original execution, native counter ledger and first conversion waves: NOT_RUN.
- Full check/build/browser/product verification: not applicable to this ignored
  static research packet; no product edits or equivalence claims.

## Independent review and durable publication

Fresh independent review ACCEPTS this static NOT_RUN packet for publication and REJECTS original execution using the disabled draft. Review checked all 12 artifact hashes, 44 source/input bindings, 2,790 retained instruction-byte rows and all 2,000 original record slots. The archive excludes the executable, complete level files and asset files. Its disabled draft is retained as rejected work, not a runnable oracle.

The next engineering step is a bounded static caller/helper closure of the consumed mode predicates, especially `0089c661 & 0x08`, followed by repair and independent review of the enumerated harness gaps. This requires no new user files or authority; permission for the isolated Mission3 comparison has already been granted. Actual run readiness remains unproved. No product change, full product check, browser pass, merge or deployment is claimed.
