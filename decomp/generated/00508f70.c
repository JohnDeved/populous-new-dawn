/* Ghidra 12.1.3 pseudocode; entry 00508f70; FUN_00508f70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00508f70(int param_1)

{
  unit_struct *puVar1;
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
  puVar1 = unit_land_array
           [(short)(&game_state.level_data[0].unit_index)
                   [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
  while( true ) {
    if (puVar1 == (unit_struct *)0x0) {
      return (unit_struct *)0x0;
    }
    if ((puVar1->unit_class == '\x06') && (puVar1->unit_type == '\x06')) break;
    puVar1 = unit_land_array[puVar1->next_unit_index];
  }
  return puVar1;
}
