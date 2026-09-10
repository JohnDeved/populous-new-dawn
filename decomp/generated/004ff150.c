/* Ghidra 12.1.3 pseudocode; entry 004ff150; FUN_004ff150.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_004ff150(void)

{
  unit_struct *puVar1;
  ushort uVar2;
  uint uVar3;
  unit_struct *puVar4;

  if (((DAT_0089c6e7 == '\0') && ((globe_update_flags & 1) != 0)) &&
     (uVar3 = (_minimap_centre_x & 0xfe) * 2 | _minimap_centre_x & 0xfe00,
     (*(byte *)((int)&game_state.level_data[0].flags + uVar3 * 4 + 1) & 2) != 0)) {
    puVar4 = (unit_struct *)0x0;
    uVar2 = (&game_state.level_data[0].unit_index_2)[uVar3 * 2] & 0x3ff;
    if (((uVar2 != 0) && (puVar1 = unit_land_array[uVar2], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
       (puVar1->unit_class != '\0')) {
      puVar4 = puVar1;
    }
    if ((puVar4 != (unit_struct *)0x0) && (puVar4->tribe_index == player_tribe_num)) {
      return 1;
    }
  }
  return 0;
}
