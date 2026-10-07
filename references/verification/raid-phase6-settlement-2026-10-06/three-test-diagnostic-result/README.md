# Three remaining maintained raid failures

The exact48a84610 batch reproduced both Mission1 null-native exceptions and
Mission2's absent first raid member. It ran once on CPU4 for11.815 seconds,
exited1 with an empty owned group, and preserved all249 source/tool inputs.
These are unchanged fixed-step cases, not ordinary gameplay acceptance.

- Mission1 route: the task is retired at elapsed1801/phase23, while Brave35
  remains alive in registered fight.motion, state25/current21. The assertion
  dereferences its legitimately null native slot.
- Mission1 building: the task is active at phase15, with registered fight
  owners for40/41/39. A native-only model19 wait throws before those fights finish.
- Mission2: every selected Blue defender exists. Original raid member10 is
  absent; member11 remains alive and owns current19. Member10 had remained
  in state33 through a long phase6 wait before its death. A survivor-only
  test substitution is not authorized; release composition remains a blocker.

## Field-mapping correction

The native predicate004f39f0 reads **animationMode at +0xa8**, whereas
**commandPhase is +0xaa**. The existing route-recovery/person-state probes
bind these distinct fields. The diagnostic omitted animationMode, so
state33/substate2/commandPhase8 at3171 does not prove native release eligibility.
The first directly proved unconditional state33/substate3 row is3227, at50HP.
Earlier release eligibility may have occurred, but the missing field must be
captured before claiming it. The current uncomposed substate2 production guard
also uses commandPhase and requires correction as part of that reviewed work.

The earlier two25/29/10 native fixtures placed the captured commandPhase byte
at+a8, but independent memory-log review confirms that byte was neither read
nor written in either execution. Their measured results retain their original
supplied-byte scope; no old fixture, source, result or hash has been rewritten.
See the unchanged durable `field-correction/` erratum. It supersedes the earlier
3171 inference and the broader premise discussion in `result-review/`.

The next source proposal must bind the real assignment clearing, queue/pool
release, state initialization and anchor relocation. Actual animationMode,
nativeFlags7f and complete consumed person/pool/task/world fields are required.
Runtime and Mission2 assertions remain frozen pending that composition.
