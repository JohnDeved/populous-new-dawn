/* Ghidra 12.1.3 pseudocode; entry 00494490; FUN_00494490.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00494490(ushort param_1,char param_2)

{
  ushort uVar1;
  ushort uVar2;
  ushort uVar3;
  ushort uVar4;
  unit_struct *puVar5;
  bool bVar6;
  unit_type_scenery *puVar7;
  char cVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  uint *puVar12;
  unit_struct *puVar13;
  undefined1 local_23;
  ushort local_22;
  undefined4 local_20;
  undefined1 local_1c [4];
  int local_18;
  uint local_14 [4];
  uint local_4;

  iVar11 = 0;
  local_18 = 0;
  local_23 = 0;
  local_20._0_1_ = (char)param_1;
  uVar1 = (&game_state.level_data[0].unit_index_2)
          [(((byte)((char)local_20 + 2) & 0xfe) * 2 | param_1 & 0xfe00) * 2];
  local_14[0] = uVar1 & 0x3ff;
  local_20._1_1_ = (char)(param_1 >> 8);
  cVar8 = local_20._1_1_;
  local_20._0_2_ = CONCAT11(local_20._1_1_ + '\x02',(char)local_20);
  uVar2 = (&game_state.level_data[0].unit_index_2)
          [(((byte)((char)local_20 - 2) & 0xfe) * 2 | param_1 & 0xfe00) * 2];
  local_14[1] = uVar2 & 0x3ff;
  uVar9 = (uint)(ushort)local_20;
  uVar10 = (uint)(ushort)local_20;
  local_20._0_2_ = CONCAT11(cVar8 + -2,(char)local_20);
  uVar3 = (&game_state.level_data[0].unit_index_2)[((uVar9 & 0xfe) * 2 | uVar10 & 0xfe00) * 2];
  local_14[2] = uVar3 & 0x3ff;
  uVar4 = (&game_state.level_data[0].unit_index_2)
          [(((ushort)local_20 & 0xfe) * 2 | (ushort)local_20 & 0xfe00) * 2];
  uVar9 = uVar4 & 0x3ff;
  local_14[3] = uVar9;
  if (((((uVar1 & 0x3ff) != 0) || ((uVar2 & 0x3ff) != 0)) || ((uVar3 & 0x3ff) != 0)) ||
     ((uVar4 & 0x3ff) != 0)) {
    puVar12 = local_14;
    do {
      uVar9 = *puVar12;
      if (uVar9 != 0) {
        puVar13 = (unit_struct *)0x0;
        if ((((short)uVar9 != 0) &&
            (puVar5 = unit_land_array[uVar9 & 0xffff], (*(byte *)&puVar5->flags_2 & 1) == 0)) &&
           (puVar5->unit_class != '\0')) {
          puVar13 = puVar5;
        }
        if (puVar13 != (unit_struct *)0x0) {
          if (puVar13->unit_class == '\t') {
            FUN_004b9fc0();
          }
          else {
            FUN_004044b0(puVar13,local_1c);
          }
          local_22 = CONCAT11(SUB21(local_1c._2_2_,1),SUB21(local_1c._0_2_,1)) & 0xfefe;
          if (local_22 == param_1) {
            FUN_0040b4f0(puVar13,&local_4,&local_20,0,0);
            iVar11 = (iVar11 - local_20) + local_4;
          }
        }
      }
      puVar12 = puVar12 + 1;
    } while (puVar12 < &local_4);
    uVar10 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
    bVar6 = true;
    uVar9 = uVar10 * 4;
    if (((((byte)land_flags_1 & 8) == 0) && (player_tribe_num == param_2)) &&
       ((((byte)level_flags & 4) != 0 &&
        ((*(byte *)(&game_state.level_data[0].flags + uVar10) & 8) == 0)))) {
      bVar6 = false;
    }
    if (bVar6) {
      uVar9 = (uint)(short)(&game_state.level_data[0].unit_index)[uVar10 * 2];
      puVar13 = unit_land_array[uVar9];
      while (puVar13 != (unit_struct *)0x0) {
        if (((puVar13->unit_class == '\x05') &&
            (puVar7 = unit_type_array_scenery + (byte)puVar13->unit_type,
            uVar9._0_1_ = puVar7->flags_1, uVar9._1_1_ = puVar7->flags,
            uVar9._2_1_ = puVar7->field14_0x16, uVar9._3_1_ = puVar7->field15_0x17, (uVar9 & 4) != 0
            )) && (cVar8 = FUN_004a8e10(puVar13), cVar8 != '\0')) {
          local_18 = local_18 + (short)puVar13->loc_2_z;
        }
        uVar9 = (uint)puVar13->next_unit_index;
        puVar13 = unit_land_array[uVar9];
      }
    }
    if (local_18 <= iVar11) {
      local_23 = 1;
    }
  }
  return CONCAT31((int3)(uVar9 >> 8),local_23);
}
