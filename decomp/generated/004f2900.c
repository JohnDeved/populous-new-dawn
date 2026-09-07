/* Ghidra 12.1.3 pseudocode; entry 004f2900; FUN_004f2900.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f2900(undefined1 param_1,undefined1 param_2)

{
  unit_struct *puVar1;
  undefined2 local_2;

  local_2 = CONCAT11(param_2,param_1);
  puVar1 = unit_land_array
           [(short)(&game_state.level_data[0].unit_index)
                   [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
  while( true ) {
    if (puVar1 == (unit_struct *)0x0) {
      return 0;
    }
    if ((puVar1->unit_class == '\x06') && (puVar1->unit_type == '\x06')) break;
    puVar1 = unit_land_array[puVar1->next_unit_index];
  }
  return (int)*(char *)((int)&puVar1->coord_scale_4 + 3);
}
