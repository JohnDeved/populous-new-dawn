/* Ghidra 12.1.3 pseudocode; entry 004fbf40; FUN_004fbf40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004fbf40(ushort param_1)

{
  unit_struct *puVar1;

  puVar1 = unit_land_array
           [(short)(&game_state.level_data[0].unit_index)
                   [((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2]];
  if (puVar1 != (unit_struct *)0x0) {
    while ((puVar1->unit_class != '\x06' || (puVar1->unit_type != '\x06'))) {
      puVar1 = unit_land_array[puVar1->next_unit_index];
      if (puVar1 == (unit_struct *)0x0) {
        return;
      }
    }
    puVar1->field_0x6d = puVar1->field_0x6d | 2;
  }
  return;
}
