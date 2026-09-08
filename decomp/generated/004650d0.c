/* Ghidra 12.1.3 pseudocode; entry 004650d0; FUN_004650d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004650d0(unit_struct *param_1,undefined2 *param_2)

{
  byte bVar1;
  unit_struct *puVar2;
  bool bVar3;
  undefined1 uVar4;
  uint uVar5;
  ushort local_2;

  uVar4 = 0;
  local_2 = CONCAT11((char)((ushort)param_2[1] >> 8),(char)((ushort)*param_2 >> 8)) & 0xfefe;
  uVar5 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
  if (((&game_state.level_data[0].flags)[uVar5] & 0x204) == 0) {
    bVar3 = true;
    for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar5 * 2]];
        puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
      if ((puVar2->unit_class == '\x04') && (param_1 != puVar2)) {
        bVar3 = false;
        break;
      }
    }
    if (bVar3) {
      bVar1 = *(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar5 * 4] & 0xf))
      ;
      if ((bVar1 & 0x3c) == 0) {
        if ((bVar1 & 2) != 0) {
          uVar4 = 1;
        }
      }
      else if (((*(byte *)((int)&game_state.level_data[0].flags + uVar5 * 4 + 3) & 1) != 0) &&
              ((bVar1 & 0x10) == 0)) {
        return 1;
      }
    }
  }
  return uVar4;
}
