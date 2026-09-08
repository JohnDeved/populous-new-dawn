/* Ghidra 12.1.3 pseudocode; entry 00462e60; FUN_00462e60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00462e60(void)

{
  int *piVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;

  _DAT_00749ee8 = 7;
  uVar3 = 1;
  do {
    piVar1 = (int *)(&DAT_00749ee8 + uVar3 * 4);
    uVar4 = 1;
    *piVar1 = 0;
    uVar2 = uVar3 & 1;
    while (uVar2 == 0) {
      uVar4 = uVar4 * 2;
      *piVar1 = *piVar1 + 1;
      uVar2 = uVar3 & uVar4;
    }
    uVar3 = uVar3 + 1;
  } while (uVar3 < 0x101);
  return;
}
