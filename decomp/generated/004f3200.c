/* Ghidra 12.1.3 pseudocode; entry 004f3200; FUN_004f3200.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f3200(int param_1)

{
  unit_struct *puVar1;
  undefined2 local_2;

  if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
    local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    puVar1 = unit_land_array
             [(ushort)(&game_state.level_data[0].unit_index_2)
                      [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] & 0x3ff];
    if (((puVar1 != (unit_struct *)0x0) && (puVar1->unit_class == '\x02')) &&
       (puVar1->unit_type == '\x04')) {
      return 1;
    }
  }
  return 0;
}
