# Ordinary tooltip owner across a no-handler visit (issue #1056)

Question from #1056: when the pointer leaves an object for a spot with no object and no
valid cell (browser route `no-handler`, for example sky at HUD Auto), does the native
ordinary visit clear the object owner, so that re-entering the same object starts a new
dwell and a new first display (hover inspection)?

**Answer: no.** The native dispatcher calls no helper on that visit, so the object owner
word survives, and cleanup does not reset the controller while any owner word is
nonzero. Re-entering the same object continues the retained dwell. Its first-display
branch, and therefore its hover inspection, does not run again. A new first display
needs a visit that changes the shared category/key first: a blank ordinary cell,
another object, or an active HUD/message/status owner. The browser
`updateTooltipController` → `finishOrdinaryTooltip` path already does this, so no
runtime change is made. `tests/tooltip-owner-retention.test.mjs` pins it.

`0x44d7f0`, named in the issue, is not part of this lifecycle. It is the forced object
tooltip acquire (`app/tooltips.ts` `showObjectTooltip`, "object modes 1/2"), with direct
callers `0044a044`, `00490d28` and `00499f27`. It has no direct reference to either owner word.

## Evidence

Static Capstone 5.0.7 reads (`.tools/decomp/oracle/bin/python -I`) of the verified
`d3dpoptb.exe`, SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` (read only, never
executed). The retained Ghidra 12.1.3 export `decomp/generated/004aa4e0.c` lines 37–45
gives the caller order:

```c
FUN_0044b130();               // HUD visit, clears HUD owner 0098db0c
cVar3 = FUN_0044db60();       // forced handling; handled -> skip the rest
if (cVar3 == '\0') {
  iVar4 = FUN_0044b060();
  if (iVar4 == 0) FUN_004af340();   // ordinary dispatcher
  FUN_0044b070();             // scroll/hold only
  FUN_0044b090();             // cleanup
}
```

Dispatcher `004af340` (excerpt). Each branch calls exactly one helper and returns:

```text
004af359  mov ax, word ptr [0x98db40]   ; message owner -> 0044cf90
004af371  mov cl, byte ptr [0x87cabc]   ; cl = valid-cell flag & 1
...                                     ; category-7 cell case -> 0044d2a0(…, 7)
004af3cd  mov ax, word ptr [0x98db2c]   ; status owner -> 0044d6d0
004af3e2  cmp word ptr [0x87cac2], 0    ; first pointed object -> 0044d0c0
004af405  cmp word ptr [0x87cace], 0    ; second pointed object -> 0044d0c0
004af428  test cl, cl                   ; valid blank cell -> 0044d2a0(…, 2)
004af42a  je 0x4af43b
004af43b  add esp, 4
004af43e  ret                           ; no object, no valid cell: no helper
```

Object helper `0044d0c0` is the only direct writer of object owner `0098db48`. It clears
the word on entry and copies object word +0x24 when enabled and non-null:

```text
0044d0c0  mov word ptr [0x98db48], 0
0044d0eb  cmp dword ptr [0x68c6a1], 4   ; category 4 (object) ...
0044d0f2  mov word ptr [0x98db48], ax   ; ax = [esi+0x24], before the branch
0044d10b  cmp eax, ecx                  ; ... and key 0068c6a5 == id -> same-target branch
0044d13a  cmp dword ptr [0x68c6af], eax ; dwell D vs threshold 005cae90
0044d17c  cmp dword ptr [0x68c6af], eax ; D == threshold only:
0044d188  inc dword ptr [0x68c6af]
0044d18e  call 0x508fe0                 ;   first display
0044d1a5  ...                           ; key change: acquisition, D = 0 when named
```

Cell helper `0044d2a0` has the same pattern for cell owner `0098db44`: it clears the
word at `0044d2a0` and copies the cell at `0044d2c4`. Cleanup `0044b090` resets the
controller only when all five owner words are zero:

```text
0044b092  cmp word ptr [0x98db0c], cx   ; HUD
0044b09b  cmp word ptr [0x98db48], cx   ; object
0044b0a4  cmp word ptr [0x98db44], cx   ; cell
0044b0ad  cmp word ptr [0x98db2c], cx   ; status
0044b0b6  cmp word ptr [0x98db40], cx   ; message
0044b0bf  ...                           ; only then clear key/D/text/category
```

A scan of `.text` for the absolute addresses `0098db48` and `0098db44` finds only these
references: `0044d0c0`, `0044d0f2` and `0044b09b` for the object word; `0044d2a0`,
`0044d2c4`, `0044b0a4` and `004af3b0` for the cell word. Direct E8 call sites:

| Callee | Callers |
| --- | --- |
| `004af340` | `004aa584` |
| `0044b070` | `004aa589` |
| `0044b090` | `004aa58e` |
| `0044d0c0` | `004af3fc`, `004af41f` |
| `0044d2a0` | `004af3c4`, `004af433` |

An earlier source-only pass reached the same conclusion: the unmerged branch
`docs/issue19-tooltip-controller-source-20261009`, commit `c1b16d5af`,
`decomp/research/ordinary-tooltip-controller/owner-retention.md`. Its review also
bounded indirect writes in `[0098da00,0098dc00)`. This note re-reads the direct
instructions above. It does not repeat the indirect-write scan.

## Browser mapping and limits

- Browser `no-handler` is `world` with `picked: null` and `cell: null`. It runs no
  object/cell visit, like native `004af43e`. `outside` (off-canvas) and the
  `unmapped-*` routes also run no helper. The browser cannot prove that a physical
  canvas leave is a native no-handler visit; native has no off-canvas pointer in
  fullscreen. It keeps the existing conservative mapping.
- Whether a particular browser sky pixel is a native "no valid cell" point (flag
  `0087cabc` bit 0) is not established here. That is a terrain-pick question, not
  an owner question. If native reported a valid cell there, the blank-cell helper
  would change category/key and re-entry would re-acquire.
- So a retained building panel reopens on hover only after the pointer crosses another
  object or an ordinary blank cell, or after another owner (HUD control, message,
  status, forced tooltip) replaces the shared category/key.
- No game, emulator or browser execution. No parity credit.
