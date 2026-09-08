/* Ghidra 12.1.3 pseudocode; entry 00450590; FUN_00450590.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00450590(undefined2 param_1,undefined2 param_2)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  undefined1 uStack_3;
  undefined1 local_2;
  undefined1 uStack_1;

  local_2 = (byte)param_1;
  uStack_3 = (byte)((ushort)param_2 >> 8);
  iVar3 = (uint)(byte)param_2 - (uint)local_2;
  uStack_1 = (byte)((ushort)param_1 >> 8);
  iVar4 = (uint)uStack_3 - (uint)uStack_1;
  iVar1 = iVar3;
  if (iVar3 < 0) {
    iVar1 = -iVar3;
  }
  iVar2 = iVar4;
  if (iVar4 < 0) {
    iVar2 = -iVar4;
  }
  if (0x80 < iVar1) {
    iVar3 = 0x100 - iVar1;
  }
  if (0x80 < iVar2) {
    iVar4 = 0x100 - iVar2;
  }
  return iVar3 * iVar3 + iVar4 * iVar4;
}
