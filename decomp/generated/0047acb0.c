/* Ghidra 12.1.3 pseudocode; entry 0047acb0; FUN_0047acb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0047acb0(void)

{
  unit_struct *puVar1;
  int iVar2;
  unit_struct *puVar3;
  int iVar4;

  if ((land_flags_1 & 0x400000) != 0) {
    puVar3 = (unit_struct *)0x0;
    if (((unit_index_1 != 0) &&
        (puVar1 = unit_land_array[unit_index_1], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
       (puVar1->unit_class != '\0')) {
      puVar3 = puVar1;
    }
    if (puVar3 != (unit_struct *)0x0) {
      iVar4 = screen_coord_3_x - DAT_0089c6d9;
      iVar2 = screen_coord_3_y - DAT_0089c6db;
      if (iVar4 < 0) {
        iVar4 = -iVar4;
      }
      if (iVar2 < 0) {
        iVar2 = -iVar2;
      }
      if ((iVar4 < 8) && (iVar2 < 8)) {
        iVar2 = (int)(DAT_0087cac8 / 2) + (int)DAT_0087cac4;
        iVar4 = (int)(DAT_0087caca / 2) + (int)DAT_0087cac6;
        FUN_0049d010(iVar2,iVar4);
        DAT_0089c6d9 = (short)iVar2;
        DAT_0089c6db = (short)iVar4;
        return;
      }
      land_flags_1 = land_flags_1 & 0xffbfffff;
      return;
    }
    land_flags_1 = land_flags_1 & 0xffbfffff;
  }
  return;
}
