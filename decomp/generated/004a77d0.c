/* Ghidra 12.1.3 pseudocode; entry 004a77d0; FUN_004a77d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004a77d0(undefined2 *param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  unit_type_scenery *puVar3;
  int iVar4;
  undefined2 local_2;

  iVar4 = 0;
  local_2 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8));
  for (puVar1 = unit_land_array
                [(short)(&game_state.level_data[0].unit_index)
                        [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
      puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
    if ((puVar1->unit_class == '\x05') &&
       (puVar3 = unit_type_array_scenery + (byte)puVar1->unit_type, uVar2._0_1_ = puVar3->flags_1,
       uVar2._1_1_ = puVar3->flags, uVar2._2_1_ = puVar3->field14_0x16,
       uVar2._3_1_ = puVar3->field15_0x17, (uVar2 & 4) != 0)) {
      iVar4 = iVar4 + (short)puVar1->loc_2_z;
    }
  }
  return iVar4;
}
