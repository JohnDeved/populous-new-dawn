/* Ghidra 12.1.3 pseudocode; entry 00492d20; FUN_00492d20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00492d20(int param_1)

{
  int *piVar1;

  if (param_1 == 0) {
    piVar1 = (int *)((int)&DAT_0068452c + DAT_006842d8 * 0x71);
    if (piVar1 != &DAT_0068452c) {
      do {
        if (*piVar1 == 0x26) {
          piVar1[2] = 0;
        }
        if (*piVar1 == 0x27) {
          piVar1[2] = 1;
        }
        if (*piVar1 == 0x28) {
          piVar1[2] = 0;
        }
        piVar1 = (int *)((int)&DAT_0068452c + *(short *)((int)piVar1 + 0x6d) * 0x71);
      } while (piVar1 != &DAT_0068452c);
    }
    FUN_0044bb50();
    return;
  }
  if (param_1 == 1) {
    piVar1 = (int *)((int)&DAT_0068452c + DAT_006842d8 * 0x71);
    if (piVar1 != &DAT_0068452c) {
      do {
        if (*piVar1 == 0x26) {
          piVar1[2] = 1;
        }
        if (*piVar1 == 0x27) {
          piVar1[2] = 0;
        }
        if (*piVar1 == 0x28) {
          piVar1[2] = 0;
        }
        piVar1 = (int *)((int)&DAT_0068452c + *(short *)((int)piVar1 + 0x6d) * 0x71);
      } while (piVar1 != &DAT_0068452c);
    }
    FUN_0044bb30();
    return;
  }
  if (param_1 == 2) {
    piVar1 = (int *)((int)&DAT_0068452c + DAT_006842d8 * 0x71);
    if (piVar1 != &DAT_0068452c) {
      do {
        if (*piVar1 == 0x26) {
          piVar1[2] = 0;
        }
        if (*piVar1 == 0x27) {
          piVar1[2] = 0;
        }
        if (*piVar1 == 0x28) {
          piVar1[2] = 1;
        }
        piVar1 = (int *)((int)&DAT_0068452c + *(short *)((int)piVar1 + 0x6d) * 0x71);
      } while (piVar1 != &DAT_0068452c);
    }
    FUN_0044bb60();
    return;
  }
  return;
}
