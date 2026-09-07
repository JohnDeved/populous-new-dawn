/* Ghidra 12.1.3 pseudocode; entry 004389c0; FUN_004389c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004389c0(byte *param_1,short *param_2)

{
  uint uVar1;
  unit_struct *puVar2;
  bool bVar3;
  undefined2 uVar4;
  ushort local_2;

  uVar1 = *(uint *)(&DAT_005a7dca + (uint)*param_1 * 0x16);
  if ((uVar1 & 4) != 0) {
    local_2 = *(ushort *)(param_1 + 8) & 0xfefe;
    *param_2 = ((*(ushort *)(param_1 + 8) & 0xfe) + 1) * 0x100;
    param_2[1] = ((local_2 >> 8) + 1) * 0x100;
    return 1;
  }
  if ((uVar1 & 0x800) == 0) {
    if ((uVar1 & 0x242) == 0) {
      *(undefined4 *)param_2 = *(undefined4 *)(param_1 + 6);
    }
    else {
      bVar3 = false;
      puVar2 = unit_land_array[*(ushort *)(param_1 + 6)];
      if (puVar2->unit_class == '\x02') {
        FUN_004044b0(puVar2,param_2);
      }
      else if ((puVar2->unit_class == '\x05') && (puVar2->unit_type == '\t')) {
        FUN_004a8e70(puVar2,param_2);
      }
      else {
        bVar3 = true;
      }
      if (bVar3) {
        uVar4 = (puVar2->pos).y;
        param_2[0] = (puVar2->pos).x;
        param_2[1] = uVar4;
        return 1;
      }
    }
    return 1;
  }
  local_2 = *(ushort *)(param_1 + 6) & 0xfefe;
  *param_2 = ((*(ushort *)(param_1 + 6) & 0xfe) + 1) * 0x100;
  param_2[1] = ((local_2 >> 8) + 1) * 0x100;
  return 1;
}
