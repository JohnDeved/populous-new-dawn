/* Ghidra 12.1.3 pseudocode; entry 004a1580; FUN_004a1580.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a1580(int param_1)

{
  short sVar1;
  uint uVar2;
  int iVar3;
  int iVar4;
  uint3 uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;

  if (*(int *)(param_1 + 0x10) != 0) {
    uVar2 = *(uint *)(param_1 + 99);
    uVar6 = (int)uVar2 >> 0x1f;
    iVar3 = ((uVar2 ^ uVar6) - uVar6 & 7 ^ uVar6) - uVar6;
    if ((int)uVar2 < 8) {
      iVar8 = (int)&DAT_0089ddb1 + DAT_0089c6f0 * 0xc65;
      iVar7 = (int)&DAT_0089dd9f + DAT_0089c6f0 * 0xc65;
      iVar4 = 0x28f;
    }
    else {
      iVar7 = (int)&DAT_0089ddc3 + DAT_0089c6f0 * 0xc65;
      iVar8 = (int)&DAT_0089ddd5 + DAT_0089c6f0 * 0xc65;
      iVar4 = 0x440;
    }
    if (*(int *)(param_1 + 0x4f) != 0) {
      if ((*(int *)(param_1 + 0x18) != 0) || (iVar4 = 0, *(int *)(param_1 + 0x1c) != 0)) {
        iVar4 = 1;
      }
      iVar4 = *(int *)(param_1 + 0x4f) + iVar4;
    }
    uVar5 = (uint3)((uint)(DAT_0089c6f0 * 0x319) >> 8);
    if ((*(byte *)((int)&DAT_0089db05 + DAT_0089c6f0 * 0xc65) & 0x80) == 0) {
      sVar1 = *(short *)(iVar7 + iVar3 * 2);
      iVar3 = (uint)uVar5 << 8;
    }
    else {
      sVar1 = *(short *)(iVar8 + iVar3 * 2);
      iVar3 = CONCAT31(uVar5,1);
    }
    FUN_004a0bf0(param_1,iVar4 * 8 + DAT_0059df14,(int)sVar1,iVar3);
  }
  return;
}
