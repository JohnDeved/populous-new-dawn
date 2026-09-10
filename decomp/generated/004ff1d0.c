/* Ghidra 12.1.3 pseudocode; entry 004ff1d0; FUN_004ff1d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004ff1d0(void)

{
  unit_struct *puVar1;
  unit_struct *puVar2;

  if ((DAT_0089c6e7 == '\0') || (DAT_0089c6e7 == '\f')) {
    puVar1 = (unit_struct *)0x0;
    if ((unit_index_2 != 0) &&
       ((puVar2 = unit_land_array[unit_index_2], (*(byte *)&puVar2->flags_2 & 1) == 0 &&
        (puVar2->unit_class != '\0')))) {
      puVar1 = puVar2;
    }
    if ((((puVar1 != (unit_struct *)0x0) && (puVar1->unit_class == '\x04')) &&
        (puVar1->field_0x9e != '\0')) && (puVar1->tribe_index == player_tribe_num)) {
      puVar2 = (unit_struct *)0x0;
      if (((puVar1->loc_1_x != 0) &&
          (puVar1 = unit_land_array[(ushort)puVar1->loc_1_x], (*(byte *)&puVar1->flags_2 & 1) == 0))
         && (puVar1->unit_class != '\0')) {
        puVar2 = puVar1;
      }
      if (puVar2 == (unit_struct *)0x0) {
        return 1;
      }
      if ((*(byte *)&puVar2->loc_1_x & 0x80) == 0) {
        return 1;
      }
    }
  }
  return 0;
}
