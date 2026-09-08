/* Ghidra 12.1.3 pseudocode; entry 0042dbf0; calc_star_location.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
calc_star_location(int param_1,short param_2,short param_3,int *param_4,int *param_5)

{
  longlong lVar1;
  longlong lVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;

  iVar4 = (int)param_2;
  iVar6 = (int)param_3;
  if (iVar4 < 1) {
LAB_0042dc53:
    if ((iVar4 < 0) && (0 < iVar6)) {
      if ((-0x4000 < iVar4) && (iVar6 < 0x4000)) {
        iVar4 = iVar4 + -0x4000;
        iVar6 = iVar6 + 0x4000;
      }
      goto LAB_0042dc93;
    }
    if ((iVar4 < -0x3fff) || (iVar6 < -0x3fff)) goto LAB_0042dc93;
    iVar4 = iVar4 + -0x4000;
  }
  else {
    if (0 < iVar6) {
      if ((iVar4 < 0x4000) && (iVar6 < 0x4000)) {
        iVar4 = iVar4 + 0x4000;
        iVar6 = iVar6 + 0x4000;
      }
      goto LAB_0042dc93;
    }
    if ((iVar4 < 1) || (0 < iVar6)) goto LAB_0042dc53;
    if ((0x3fff < iVar4) || (iVar6 < -0x3fff)) goto LAB_0042dc93;
    iVar4 = iVar4 + 0x4000;
  }
  iVar6 = iVar6 + -0x4000;
LAB_0042dc93:
  iVar4 = iVar4 * 2;
  iVar6 = iVar6 * 2;
  iVar5 = *(int *)(param_1 + 8);
  if (*(int *)(param_1 + 8) <= *(int *)(param_1 + 0xc)) {
    iVar5 = *(int *)(param_1 + 0xc);
  }
  lVar1 = (longlong)
          (((int)(((uint)((longlong)iVar6 * (longlong)iVar6) >> 0x10 |
                  (int)((ulonglong)((longlong)iVar6 * (longlong)iVar6) >> 0x20) << 0x10) +
                 ((uint)((longlong)iVar4 * (longlong)iVar4) >> 0x10 |
                 (int)((ulonglong)((longlong)iVar4 * (longlong)iVar4) >> 0x20) << 0x10)) >> 1) +
          0x4000) * (longlong)iVar5;
  uVar3 = (uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10;
  lVar1 = (longlong)iVar4 * (longlong)(int)uVar3;
  lVar2 = (longlong)iVar6 * (longlong)(int)uVar3;
  *param_4 = *(int *)(param_1 + 0x10) +
             ((uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10);
  *param_5 = *(int *)(param_1 + 0x14) +
             ((uint)lVar2 >> 0x10 | (int)((ulonglong)lVar2 >> 0x20) << 0x10);
  return;
}
