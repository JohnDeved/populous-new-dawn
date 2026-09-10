/* Ghidra 12.1.3 pseudocode; entry 0043bb60; FUN_0043bb60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_0043bb60(unit_struct *param_1,byte *param_2)

{
  uint uVar1;
  uint uVar2;
  int iVar3;
  byte bStack_5;
  undefined4 local_4;

  if ((*(uint *)(&DAT_005a7dca + (uint)*param_2 * 0x16) & 0x804) == 0) {
    local_4 = *(undefined4 *)(param_2 + 6);
  }
  else if ((*(uint *)(&DAT_005a7dca + (uint)*param_2 * 0x16) & 4) == 0) {
    bStack_5 = (byte)(*(ushort *)(param_2 + 6) >> 8) & 0xfe;
    local_4 = CONCAT22((bStack_5 + 1) * 0x100,((*(ushort *)(param_2 + 6) & 0xfe) + 1) * 0x100);
  }
  else {
    bStack_5 = (byte)(*(ushort *)(param_2 + 8) >> 8) & 0xfe;
    local_4 = CONCAT22((bStack_5 + 1) * 0x100,((*(ushort *)(param_2 + 8) & 0xfe) + 1) * 0x100);
  }
  if (param_1->unit_land_array_index == 0) {
    iVar3 = (int)((uint)(byte)unit_type_array_person[(byte)param_1->unit_type].field_0x2e * 0x200)
            >> 4;
  }
  else {
    iVar3 = (-(uint)((param_1->flags_4 & 0x2000000) == 0) & 0xffffffc0) + 0x140;
    param_1 = unit_land_array[(ushort)param_1->unit_land_array_index];
  }
  uVar1 = (int)(short)(param_1->pos).x - (int)(short)local_4;
  uVar2 = (int)uVar1 >> 0x1f;
  uVar2 = (uVar1 ^ uVar2) - uVar2;
  if (0x7fff < (int)uVar2) {
    uVar2 = 0xffff - uVar2;
  }
  if ((int)uVar2 < iVar3 + 0x38) {
    uVar1 = (int)(short)(param_1->pos).y - (int)local_4._2_2_;
    uVar2 = (int)uVar1 >> 0x1f;
    uVar2 = (uVar1 ^ uVar2) - uVar2;
    if (0x7fff < (int)uVar2) {
      uVar2 = 0xffff - uVar2;
    }
    if ((int)uVar2 < iVar3 + 0x38) {
      return CONCAT31((int3)(uVar2 >> 8),1);
    }
  }
  return uVar2 & 0xffffff00;
}
