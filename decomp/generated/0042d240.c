/* Ghidra 12.1.3 pseudocode; entry 0042d240; FUN_0042d240.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall FUN_0042d240(int param_1,int param_2,int param_3)

{
  int iVar1;
  longlong lVar2;
  int iVar3;
  int *piVar4;
  int iVar5;
  int iVar6;

  if (*(int *)(param_1 + 0x4c) == 0) {
    iVar3 = *(int *)(param_1 + 0x50);
    iVar1 = *(int *)(param_1 + 0x54);
    *(int *)(param_1 + 0x18) = *(int *)(param_1 + 0x18) + iVar3;
    *(int *)(param_1 + 0x1c) = *(int *)(param_1 + 0x1c) + iVar1;
    iVar6 = 0x2000;
    piVar4 = (int *)(param_1 + 0x5c);
    iVar5 = 0x10;
    do {
      lVar2 = (longlong)iVar3 * (longlong)iVar6;
      *piVar4 = *piVar4 + ((uint)lVar2 >> 0x10 | (int)((ulonglong)lVar2 >> 0x20) << 0x10);
      lVar2 = (longlong)-iVar1 * (longlong)iVar6;
      piVar4[0x10] = piVar4[0x10] + ((uint)lVar2 >> 0x10 | (int)((ulonglong)lVar2 >> 0x20) << 0x10);
      iVar6 = iVar6 + 0x600;
      piVar4 = piVar4 + 1;
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    return;
  }
  iVar3 = *(int *)(param_1 + 0x18);
  iVar1 = *(int *)(param_1 + 0x1c);
  *(int *)(param_1 + 0x50) = iVar3;
  iVar5 = (int)(0x320000 / (longlong)*(int *)(param_1 + 0x100));
  iVar6 = ((*(int *)(param_1 + 0x3c) - param_2) * iVar5 >> 8) + *(int *)(param_1 + 0x44);
  *(int *)(param_1 + 0x54) = iVar1;
  iVar5 = ((param_3 - *(int *)(param_1 + 0x40)) * iVar5 >> 8) + *(int *)(param_1 + 0x48);
  *(int *)(param_1 + 0x18) = iVar6;
  iVar6 = iVar6 - iVar3;
  iVar3 = *(int *)(param_1 + 0x58);
  *(int *)(param_1 + 0x1c) = iVar5;
  *(int *)(param_1 + 0x50) = iVar6;
  iVar5 = iVar5 - iVar1;
  *(int *)(param_1 + 0x54) = iVar5;
  if (iVar3 < iVar6) {
    *(int *)(param_1 + 0x50) = iVar3;
  }
  if (iVar3 < iVar5) {
    *(int *)(param_1 + 0x54) = iVar3;
  }
  iVar3 = -iVar3;
  if (*(int *)(param_1 + 0x50) < iVar3) {
    *(int *)(param_1 + 0x50) = iVar3;
  }
  if (*(int *)(param_1 + 0x54) < iVar3) {
    *(int *)(param_1 + 0x54) = iVar3;
  }
  iVar3 = *(int *)(param_1 + 0x50);
  iVar1 = *(int *)(param_1 + 0x54);
  iVar6 = 0x2000;
  piVar4 = (int *)(param_1 + 0x5c);
  iVar5 = 0x10;
  do {
    lVar2 = (longlong)iVar3 * (longlong)iVar6;
    *piVar4 = *piVar4 + ((uint)lVar2 >> 0x10 | (int)((ulonglong)lVar2 >> 0x20) << 0x10);
    lVar2 = (longlong)-iVar1 * (longlong)iVar6;
    piVar4[0x10] = piVar4[0x10] + ((uint)lVar2 >> 0x10 | (int)((ulonglong)lVar2 >> 0x20) << 0x10);
    iVar6 = iVar6 + 0x600;
    piVar4 = piVar4 + 1;
    iVar5 = iVar5 + -1;
  } while (iVar5 != 0);
  return;
}
