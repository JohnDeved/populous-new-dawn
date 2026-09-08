/* Ghidra 12.1.3 pseudocode; entry 0050c510; process_burn_cell_obstacle.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_burn_cell_obstacle(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  unit_type_scenery *puVar3;
  ushort local_2;

  local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
  for (puVar1 = unit_land_array
                [(short)(&game_state.level_data[0].unit_index)
                        [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
      puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
    if (((puVar1->unit_class == '\x05') && ((*(byte *)&puVar1->loc_4_z & 4) == 0)) &&
       (puVar3 = unit_type_array_scenery + (byte)puVar1->unit_type, uVar2._0_1_ = puVar3->flags_1,
       uVar2._1_1_ = puVar3->flags, uVar2._2_1_ = puVar3->field14_0x16,
       uVar2._3_1_ = puVar3->field15_0x17, (uVar2 & 0x20) != 0)) {
      FUN_004a7b60(puVar1,0,0);
    }
  }
  update_after_unit_alloc(param_1);
  return;
}
