/* Ghidra 12.1.3 pseudocode; entry 004e9050; FUN_004e9050.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004e9050(int param_1)

{
  byte bVar1;
  int iVar2;
  undefined1 uVar3;
  bool bVar4;

  uVar3 = 0;
  if ((*(uint *)(param_1 + 0xc) & 0x2004) != 0) {
    bVar1 = *(byte *)(param_1 + 0x30);
    if ((unit_related_struct_26B_ARRAY_005a7b90[bVar1].field_0x18 & 8) == 0) {
      iVar2 = (uint)*(byte *)(param_1 + 0x40) * 0x100 + (uint)*(byte *)(param_1 + 0x3e);
      bVar4 = (*(byte *)(game_state._841980_4_ + (iVar2 >> 3)) & '\x01' << ((byte)iVar2 & 7)) == 0;
    }
    else {
      iVar2 = FUN_0044f750(param_1 + 0x3d);
      bVar4 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[bVar1].field_0x10 < iVar2;
    }
    if (bVar4) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80000;
      uVar3 = 1;
    }
  }
  return uVar3;
}
