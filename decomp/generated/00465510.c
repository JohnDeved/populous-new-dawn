/* Ghidra 12.1.3 pseudocode; entry 00465510; FUN_00465510.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00465510(ushort param_1,unit_struct *param_2)

{
  undefined1 uVar1;
  unit_struct *puVar2;

  uVar1 = 1;
  puVar2 = unit_land_array
           [(short)(&game_state.level_data[0].unit_index)
                   [((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2]];
  if (puVar2 != (unit_struct *)0x0) {
    while ((puVar2->unit_class != '\x04' || (puVar2 == param_2))) {
      puVar2 = unit_land_array[puVar2->next_unit_index];
      if (puVar2 == (unit_struct *)0x0) {
        return uVar1;
      }
    }
    uVar1 = 0;
  }
  return uVar1;
}
