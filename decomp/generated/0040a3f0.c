/* Ghidra 12.1.3 pseudocode; entry 0040a3f0; get_adjacent_unit.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * get_adjacent_unit(int param_1,char param_2)

{
  unit_struct *puVar1;
  unit_struct *puVar2;
  uint uVar3;
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
  uVar3 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
  puVar2 = (unit_struct *)0x0;
  if ((((*(byte *)((int)&game_state.level_data[0].flags + uVar3 * 4 + 1) & 2) != 0) &&
      (puVar1 = unit_land_array[(ushort)(&game_state.level_data[0].unit_index_2)[uVar3 * 2] & 0x3ff]
      , puVar2 = puVar1, param_2 != '\0')) &&
     (puVar2 = (unit_struct *)0x0, puVar1->unit_type == param_2)) {
    return puVar1;
  }
  return puVar2;
}
