/* Ghidra 12.1.3 pseudocode; entry 00495390; FUN_00495390.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00495390(int param_1)

{
  byte bVar1;
  ushort uVar2;
  unit_struct *puVar3;
  bool bVar4;
  bool bVar5;
  unit_type_scenery *puVar6;
  char cVar7;
  ushort *puVar8;
  uint uVar9;
  ushort local_10;
  undefined2 local_e;
  ushort *local_c;
  ushort local_8 [4];

  bVar1 = *(byte *)(param_1 + 3);
  *(byte *)(param_1 + 3) = bVar1 & 0xef;
  local_c = *(ushort **)(param_1 + 0x14);
  *(byte *)(param_1 + 3) = bVar1 & 0xcf;
  local_10 = *(ushort *)(param_1 + 4) & 0xfcfc;
  if (local_c == (ushort *)0x0) {
    return;
  }
  do {
    if ((local_c[2] & 4) == 0) {
      *(byte *)(param_1 + 3) = *(byte *)(param_1 + 3) | 0x10;
      local_8[0] = *local_c;
      if (local_8[0] != local_10) {
        *(byte *)(param_1 + 3) = *(byte *)(param_1 + 3) | 0x20;
        return;
      }
      local_e._1_1_ = (char)(local_8[0] >> 8);
      cVar7 = local_e._1_1_;
      local_e._1_1_ = local_e._1_1_ + '\x02';
      local_e._0_1_ = (char)local_8[0];
      local_8[1] = local_e;
      bVar5 = false;
      local_e._0_1_ = (char)local_e + '\x02';
      local_8[2] = local_e;
      local_e = CONCAT11(cVar7,(char)local_e);
      local_8[3] = local_e;
      puVar8 = local_8;
      do {
        if (bVar5) goto LAB_00495507;
        uVar2 = *puVar8;
        if (uVar2 != *(ushort *)(param_1 + 4)) {
          uVar9 = (uVar2 & 0xfe) * 2 | uVar2 & 0xfe00;
          bVar4 = true;
          if ((((((byte)land_flags_1 & 8) == 0) && (*(char *)(param_1 + 2) == player_tribe_num)) &&
              ((level_flags & 4) != 0)) &&
             ((*(byte *)(&game_state.level_data[0].flags + uVar9) & 8) == 0)) {
            bVar4 = false;
          }
          if (bVar4) {
            puVar3 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar9 * 2]];
            while ((puVar3 != (unit_struct *)0x0 && (!bVar5))) {
              if ((puVar3->unit_class == '\x05') &&
                 (puVar6 = unit_type_array_scenery + (byte)puVar3->unit_type,
                 uVar9._0_1_ = puVar6->flags_1, uVar9._1_1_ = puVar6->flags,
                 uVar9._2_1_ = puVar6->field14_0x16, uVar9._3_1_ = puVar6->field15_0x17,
                 (uVar9 & 4) != 0)) {
                bVar5 = true;
              }
              puVar3 = unit_land_array[puVar3->next_unit_index];
            }
          }
        }
        puVar8 = puVar8 + 1;
      } while (puVar8 < &stack0x00000000);
      if (bVar5) {
LAB_00495507:
        *(byte *)(param_1 + 3) = *(byte *)(param_1 + 3) | 0x20;
        return;
      }
    }
    local_c = *(ushort **)(local_c + 5);
    if (local_c == (ushort *)0x0) {
      return;
    }
  } while( true );
}
