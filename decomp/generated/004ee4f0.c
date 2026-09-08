/* Ghidra 12.1.3 pseudocode; entry 004ee4f0; FUN_004ee4f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ee4f0(int param_1)

{
  ushort *puVar1;
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
  puVar1 = (ushort *)(param_1 + 0x20);
  if (*(ushort *)(param_1 + 0x22) == 0) {
    (&game_state.level_data[0].unit_index)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] = *puVar1;
  }
  else {
    unit_land_array[*(ushort *)(param_1 + 0x22)]->next_unit_index = *puVar1;
  }
  if (*puVar1 != 0) {
    unit_land_array[*puVar1]->r1 = *(undefined2 *)(param_1 + 0x22);
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffdffff;
  return;
}
