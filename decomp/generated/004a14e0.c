/* Ghidra 12.1.3 pseudocode; entry 004a14e0; FUN_004a14e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a14e0(int param_1)

{
  short sVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;

  uVar3 = *(uint *)(param_1 + 99);
  uVar4 = (int)uVar3 >> 0x1f;
  iVar2 = ((uVar3 ^ uVar4) - uVar4 & 7 ^ uVar4) - uVar4;
  sVar1 = *(short *)((int)&DAT_0089dbef + iVar2 * 2 + DAT_0089c6f0 * 0xc65);
  uVar4 = *(uint *)((int)&DAT_0089db09 + DAT_0089c6f0 * 0xc65);
  if ((int)uVar3 < 8) {
    uVar3 = (uVar4 & 0x100) >> 8;
  }
  else {
    uVar3 = (uVar4 & 0x200) >> 9;
  }
  *(uint *)(param_1 + 0x10) = uVar3;
  if ((iVar2 == 0) || (sVar1 != 0)) {
    *(undefined4 *)(param_1 + 8) = 1;
  }
  else {
    *(undefined4 *)(param_1 + 8) = 0;
  }
  if (0 < sVar1) {
    *(short *)(param_1 + 0x57) = (short)*(undefined4 *)(param_1 + 0x5f);
    return;
  }
  if (iVar2 != 0) {
    *(undefined2 *)(param_1 + 0x57) = 0;
    return;
  }
  *(short *)(param_1 + 0x57) = (short)*(undefined4 *)(param_1 + 0x5f);
  return;
}
