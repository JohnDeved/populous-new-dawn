/* Ghidra 12.1.3 pseudocode; entry 004a1170; FUN_004a1170.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a1170(int param_1)

{
  short sVar1;

  sVar1 = *(short *)((int)&DAT_0089dbef + *(int *)(param_1 + 99) * 2 + DAT_0089c6f0 * 0xc65);
  if ((*(int *)(param_1 + 99) == 7) &&
     ((*(byte *)((int)&DAT_0089db05 + DAT_0089c6f0 * 0xc65 + 2) & 8) != 0)) {
    *(undefined4 *)(param_1 + 0x10) = 0;
    *(undefined4 *)(param_1 + 8) = 0;
  }
  else {
    *(undefined4 *)(param_1 + 0x10) = 1;
    *(undefined4 *)(param_1 + 8) = 1;
    if (sVar1 < 1) {
      *(undefined4 *)(param_1 + 8) = 0;
    }
  }
  if (0 < sVar1) {
    *(short *)(param_1 + 0x57) = (short)*(undefined4 *)(param_1 + 0x5f);
    return;
  }
  *(undefined2 *)(param_1 + 0x57) = 0;
  return;
}
