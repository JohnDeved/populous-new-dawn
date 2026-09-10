/* Ghidra 12.1.3 pseudocode; entry 004fef20; FUN_004fef20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004fef20(void)

{
  unit_struct *puVar1;
  unit_struct *puVar2;

  if ((((((game_state.level_flags & 0x20) == 0) && (draw_mode != 2)) && (DAT_0089ce36 == '\0')) &&
      ((DAT_0089c6e7 != '\t' && (DAT_0089c6e7 != '\x0f')))) &&
     ((DAT_0089c6e7 == '\0' || (DAT_0089c6e7 == '\f')))) {
    puVar2 = (unit_struct *)0x0;
    if (((unit_index_2 != 0) &&
        (puVar1 = unit_land_array[unit_index_2], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
       (puVar1->unit_class != '\0')) {
      puVar2 = puVar1;
    }
    if ((puVar2 == (unit_struct *)0x0) || (puVar2->unit_class != '\x04')) {
      return 1;
    }
  }
  return 0;
}
