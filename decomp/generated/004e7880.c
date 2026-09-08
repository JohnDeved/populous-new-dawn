/* Ghidra 12.1.3 pseudocode; entry 004e7880; FUN_004e7880.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_004e7880(int param_1,int param_2)

{
  byte bVar1;
  int iVar2;

  bVar1 = *(byte *)(param_2 + 0x30);
  if ((unit_related_struct_26B_ARRAY_005a7b90[bVar1].field_0x18 & 8) == 0) {
    iVar2 = (uint)*(byte *)(param_1 + 3) * 0x100 + (uint)*(byte *)(param_1 + 1);
    return (*(byte *)(game_state._841980_4_ + (iVar2 >> 3)) & '\x01' << ((byte)iVar2 & 7)) == 0;
  }
  iVar2 = FUN_0044f750(param_1);
  return *(short *)&unit_related_struct_26B_ARRAY_005a7b90[bVar1].field_0x10 < iVar2;
}
