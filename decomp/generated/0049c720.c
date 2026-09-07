/* Ghidra 12.1.3 pseudocode; entry 0049c720; FUN_0049c720.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0049c720(undefined2 param_1,undefined2 param_2)

{
  int iVar1;
  int iVar2;
  undefined1 uStack_3;
  undefined1 local_2;
  undefined1 uStack_1;

  local_2 = (byte)param_1;
  iVar2 = (uint)(byte)param_2 - (uint)local_2;
  if (iVar2 < 0) {
    iVar2 = (uint)local_2 - (uint)(byte)param_2;
  }
  if (0x80 < iVar2) {
    iVar2 = 0x100 - iVar2;
  }
  uStack_3 = (byte)((ushort)param_2 >> 8);
  uStack_1 = (byte)((ushort)param_1 >> 8);
  iVar1 = (uint)uStack_3 - (uint)uStack_1;
  if (iVar1 < 0) {
    iVar1 = (uint)uStack_1 - (uint)uStack_3;
  }
  if (0x80 < iVar1) {
    iVar1 = 0x100 - iVar1;
  }
  return (iVar1 >> 1) * (iVar1 >> 1) + (iVar2 >> 1) * (iVar2 >> 1);
}
