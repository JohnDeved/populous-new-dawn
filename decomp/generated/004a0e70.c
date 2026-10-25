/* Ghidra 12.1.3 pseudocode; entry 004a0e70; FUN_004a0e70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a0e70(int param_1)

{
  short sVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;

  if (*(int *)(param_1 + 0x10) != 0) {
    iVar3 = *(int *)(param_1 + 99) / 5;
    iVar5 = *(int *)(param_1 + 99) % 5 + 1;
    iVar2 = DAT_0089c6f0 * 0xc65;
    if ((*(byte *)((int)&DAT_0089db05 + iVar2) & 0x80) == 0) {
      iVar4 = (uint)(uint3)(DAT_0089c6f0 >> 7) << 8;
      sVar1 = *(short *)((int)&DAT_0089dc6d + (iVar5 + iVar3 * 6) * 2 + iVar2);
    }
    else {
      iVar4 = CONCAT31(DAT_0089c6f0 >> 7,1);
      sVar1 = *(short *)((int)&DAT_0089dcd9 + (iVar5 + iVar3 * 6) * 2 + iVar2);
    }
    FUN_004a0bf0(param_1,DAT_0059df14 + 0x21d8 + iVar5 * 8,(int)sVar1,iVar4);
  }
  return;
}
