/* Ghidra 12.1.3 pseudocode; entry 00494360; FUN_00494360.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00494360(int param_1,undefined2 *param_2,char param_3,char param_4)

{
  unit_struct *puVar1;
  bool bVar2;
  unit_type_scenery *puVar3;
  unit_struct *puVar4;
  char cVar5;
  uint uVar6;
  ushort *puVar7;
  unit_struct *local_14;
  undefined1 local_10 [2];
  ushort local_e [7];

  local_14 = (unit_struct *)0x0;
  FUN_00494720(local_10,*(undefined2 *)(param_1 + 4),*param_2);
  puVar7 = local_e;
  do {
    if (local_14 != (unit_struct *)0x0) {
      return local_14;
    }
    puVar4 = local_14;
    if (((param_3 == '\0') || (*puVar7 != *(ushort *)(param_1 + 4))) &&
       ((param_4 == '\0' ||
        (cVar5 = FUN_00494490(*puVar7,*(undefined1 *)(param_1 + 2)), cVar5 == '\0')))) {
      uVar6 = (*puVar7 & 0xfe) * 2 | *puVar7 & 0xfe00;
      bVar2 = true;
      if ((((((byte)land_flags_1 & 8) == 0) && (*(char *)(param_1 + 2) == player_tribe_num)) &&
          ((level_flags & 4) != 0)) &&
         ((*(byte *)(&game_state.level_data[0].flags + uVar6) & 8) == 0)) {
        bVar2 = false;
      }
      if (bVar2) {
        puVar1 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar6 * 2]];
        while ((puVar4 = local_14, puVar1 != (unit_struct *)0x0 &&
               (((puVar1->unit_class != '\x05' ||
                 (puVar3 = unit_type_array_scenery + (byte)puVar1->unit_type,
                 uVar6._0_1_ = puVar3->flags_1, uVar6._1_1_ = puVar3->flags,
                 uVar6._2_1_ = puVar3->field14_0x16, uVar6._3_1_ = puVar3->field15_0x17,
                 (uVar6 & 4) == 0)) ||
                (cVar5 = FUN_004a8e10(puVar1), puVar4 = puVar1, cVar5 == '\0'))))) {
          puVar1 = unit_land_array[puVar1->next_unit_index];
        }
      }
    }
    local_14 = puVar4;
    puVar7 = puVar7 + 2;
  } while (puVar7 < &stack0x00000002);
  return local_14;
}
