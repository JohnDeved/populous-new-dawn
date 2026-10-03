/* Ghidra 12.1.3 pseudocode; entry 00419790; FUN_00419790.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00419790(int param_1)

{
  int iVar1;
  short sVar2;

  if (((byte)DAT_0089d17c & 0x20) == 0) {
    *(undefined4 *)(param_1 + 0x24) = 0;
    *(undefined2 *)(param_1 + 0x28) = 0;
    *(undefined2 *)(param_1 + 0x32) = 0x100;
  }
  _DAT_0087ca1c = _DAT_0087ca1c | 0x80;
  iVar1 = *(int *)(param_1 + 0x89d);
  if (iVar1 != 0) {
    *(undefined4 *)(param_1 + 0x24) = *(undefined4 *)(iVar1 + 0x3d);
    *(undefined2 *)(param_1 + 0x28) = *(undefined2 *)(iVar1 + 0x41);
  }
  *(ushort *)(param_1 + 0x24) = *(ushort *)(param_1 + 0x24) - (*(ushort *)(param_1 + 0x24) & 0x1ff);
  sVar2 = *(ushort *)(param_1 + 0x26) - (*(ushort *)(param_1 + 0x26) & 0x1ff);
  *(short *)(param_1 + 0x26) = sVar2;
  *(short *)(param_1 + 0x26) = sVar2 + 0x100;
  return;
}
