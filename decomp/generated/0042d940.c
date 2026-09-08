/* Ghidra 12.1.3 pseudocode; entry 0042d940; FUN_0042d940.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void __thiscall FUN_0042d940(int param_1,undefined4 *param_2)

{
  float10 fVar1;
  float10 fVar2;
  float10 fVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  undefined4 *puVar9;
  float10 fVar10;
  double dStack_18;

  if (DAT_0059c968 != 0) {
    puVar9 = param_2;
    for (iVar6 = 0x4000; iVar6 != 0; iVar6 = iVar6 + -1) {
      *puVar9 = 0;
      puVar9 = puVar9 + 1;
    }
  }
  iVar6 = *(int *)(param_1 + 0x2c);
  iVar8 = 0;
  iVar7 = 0;
  do {
    iVar4 = 0;
    do {
      iVar5 = iVar4 + iVar6;
      *(undefined1 *)((int)param_2 + iVar7 + iVar4) = 1;
      iVar4 = iVar5;
    } while (iVar5 < 0x80);
    iVar7 = iVar7 + iVar6 * 0x100;
    iVar8 = iVar8 + iVar6;
  } while (iVar8 < 0x80);
  fVar10 = (float10)FUN_0055c60c();
  fVar1 = (float10)_DAT_0059c95c;
  fVar2 = (float10)_DAT_0058f230;
  dStack_18 = 0.0;
  fVar3 = (float10)_DAT_0058f230;
  if ((float10)_DAT_0058f238 < fVar10 * fVar3) {
    do {
      fsin((float10)dStack_18);
      iVar7 = __ftol();
      fcos((float10)dStack_18);
      iVar6 = *(int *)(param_1 + 0x18);
      iVar8 = __ftol();
      FUN_00462ea0(param_2,(iVar6 + iVar7 & 0xfe00U) >> 9,
                   (iVar8 + *(int *)(param_1 + 0x1c) & 0xfe00U) >> 9);
      dStack_18 = dStack_18 + (double)((fVar10 / fVar1) * fVar2);
    } while (dStack_18 < (double)(fVar10 * fVar3));
  }
  iVar6 = -DAT_0059c964;
  if (iVar6 < DAT_0059c964) {
    do {
      iVar7 = -DAT_0059c964;
      if (iVar7 < DAT_0059c964) {
        do {
          iVar8 = (*(int *)(param_1 + 0x18) >> 9) + iVar7;
          iVar7 = iVar7 + 1;
          FUN_00462ea0(param_2,iVar8 + 10U & 0x7f,
                       ((*(int *)(param_1 + 0x1c) >> 9) + iVar6) - 10U & 0x7f);
        } while (iVar7 < DAT_0059c964);
      }
      iVar6 = iVar6 + 1;
    } while (iVar6 < DAT_0059c964);
  }
  return;
}
