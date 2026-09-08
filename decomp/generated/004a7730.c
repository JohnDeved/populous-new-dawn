/* Ghidra 12.1.3 pseudocode; entry 004a7730; FUN_004a7730.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_004a7730(undefined2 *param_1)

{
  unit_type_scenery *puVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;
  uint uVar5;
  undefined2 local_2;

  puVar3 = (unit_struct *)0x0;
  local_2 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8));
  uVar5 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
  puVar4 = puVar3;
  if (((*(byte *)(&game_state.level_data[0].flags + uVar5) & 2) != 0) &&
     (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar5 * 2]],
     unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar5 * 2]] != (unit_struct *)0x0
     )) {
    while ((puVar4 = puVar2, puVar4->unit_class != '\x05' ||
           (puVar1 = unit_type_array_scenery + (byte)puVar4->unit_type,
           uVar5._0_1_ = puVar1->flags_1, uVar5._1_1_ = puVar1->flags,
           uVar5._2_1_ = puVar1->field14_0x16, uVar5._3_1_ = puVar1->field15_0x17,
           (uVar5 & 0x10) == 0))) {
      puVar2 = unit_land_array[puVar4->next_unit_index];
      if (unit_land_array[puVar4->next_unit_index] == (unit_struct *)0x0) {
        return puVar3;
      }
    }
  }
  return puVar4;
}
