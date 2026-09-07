/* Ghidra 12.1.3 pseudocode; entry 004f2fc0; FUN_004f2fc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f2fc0(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  undefined1 uStack_3;
  undefined1 uStack_1;

  iVar1 = (uint)(byte)param_2 - (uint)(byte)param_1;
  if (iVar1 < 0) {
    iVar1 = (uint)(byte)param_1 - (uint)(byte)param_2;
  }
  if (0x80 < iVar1) {
    iVar1 = 0x100 - iVar1;
  }
  if (iVar1 <= param_3) {
    uStack_3 = (byte)((ushort)param_2 >> 8);
    uStack_1 = (byte)((ushort)param_1 >> 8);
    iVar1 = (uint)uStack_3 - (uint)uStack_1;
    if (iVar1 < 0) {
      iVar1 = (uint)uStack_1 - (uint)uStack_3;
    }
    if (0x80 < iVar1) {
      iVar1 = 0x100 - iVar1;
    }
    if (iVar1 <= param_3) {
      return 1;
    }
  }
  return 0;
}
