/* Ghidra 12.1.3 pseudocode; entry 004055f0; FUN_004055f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004055f0(int param_1)

{
  char cVar1;
  char cVar2;
  unit_struct *puVar3;
  bool bVar4;
  char cVar5;
  ushort uVar6;
  ushort uVar7;
  ushort uVar8;
  ushort uVar9;
  ushort uVar10;
  ushort uVar11;
  ushort uVar12;
  char cVar13;
  short sVar14;
  short extraout_var;
  int iVar15;
  uint uVar16;
  int *piVar17;
  undefined2 local_4e;
  short local_4c;
  short local_4a;
  undefined4 local_48;
  ushort local_44;
  int local_40;
  ushort local_3c;
  int local_38;
  ushort local_34;
  int local_30;
  ushort local_2c;
  int local_28;
  ushort local_24;
  int local_20;
  ushort local_1c;
  int local_18;
  ushort local_14;
  int local_10;
  ushort local_c;
  int local_8;
  ushort local_4;

  bVar4 = false;
  if (((int)*(char *)(param_1 + 0xa6) + (int)*(char *)(param_1 + 0xad) <
       (int)(uint)(byte)unit_type_array_building[*(byte *)(param_1 + 0x2b)].field31_0x20) &&
     ((*(byte *)(param_1 + 0x14) & 0x40) == 0)) {
    bVar4 = true;
  }
  if ((game_state.level_flags & 8) != 0) {
    bVar4 = false;
  }
  if (*(byte *)(param_1 + 0x2b) == 4) {
    if (((bVar4) && ((*(byte *)(param_1 + 0x2e) & 0xf) == 0)) &&
       (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x01')) {
      cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
              [(short)((int)((int)*(short *)(param_1 + 0x26) +
                            ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
      local_4c = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100 +
                 (char)shapes_mem[cVar1].field6_0x6 * 0x40;
      local_4a = *(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar1].y2 * -0x100 +
                 (char)shapes_mem[cVar1].field7_0x7 * 0x40;
      local_48._0_2_ = CONCAT11((char)((ushort)local_4a >> 8),(char)((ushort)local_4c >> 8));
      bVar4 = false;
      uVar16 = ((ushort)local_48 & 0xfe) * 2 | (ushort)local_48 & 0xfe00;
      local_48 = uVar16 * 4 + 0x8a03e4;
      sVar14 = (&game_state.level_data[0].unit_index)[uVar16 * 2];
      if (sVar14 != 0) {
        puVar3 = unit_land_array[sVar14];
        while ((puVar3 != (unit_struct *)0x0 && (!bVar4))) {
          bVar4 = false;
          if ((((puVar3->unit_class == '\x01') &&
               ((puVar3->unit_type != '\x02' && (puVar3->tribe_index == *(char *)(param_1 + 0x2f))))
               ) && ((*(byte *)((int)&puVar3->flags_2 + 2) & 0x80) == 0)) &&
             ((((puVar3->unit_land_array_index == 0 && (iVar15 = FUN_004f25b0(puVar3), iVar15 != 0))
               && (puVar3->field36_0x5f == 0)) &&
              ((0x10 < *(ushort *)((int)&puVar3->loc_3_x + 1) &&
               (iVar15 = FUN_0043b180(puVar3,param_1), iVar15 != 0)))))) {
            bVar4 = true;
          }
          puVar3 = unit_land_array[puVar3->next_unit_index];
        }
      }
    }
  }
  else if ((bVar4) && ((*(byte *)(param_1 + 0x2e) & 0xf) == 0)) {
    if (*(char *)(param_1 + 0x2a) == '\t') {
      FUN_004b9fc0(param_1,&local_4c);
      sVar14 = extraout_var;
    }
    else {
      sVar14 = (short)((int)((int)*(short *)(param_1 + 0x26) +
                            ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
      cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)[sVar14];
      sVar14 = sVar14 >> 0xf;
      local_4c = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100 +
                 (char)shapes_mem[cVar1].field6_0x6 * 0x40;
      local_4a = *(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar1].y2 * -0x100 +
                 (char)shapes_mem[cVar1].field7_0x7 * 0x40;
    }
    local_48._0_2_ = local_4c;
    local_48._2_2_ = local_4a;
    local_44 = 0;
    move_pos_angle_length
              (&local_48,CONCAT22(sVar14,*(short *)(param_1 + 0x26) + 0x200) & 0xffff07ff,0x200);
    local_4c = (ushort)local_48;
    local_4a = local_48._2_2_;
    local_4e = CONCAT11((char)((ushort)local_48._2_2_ >> 8),(char)((ushort)local_48 >> 8)) & 0xfefe;
    local_4 = local_4e;
    cVar5 = (char)local_4e;
    cVar13 = local_4e._1_1_;
    local_4e._1_1_ = local_4e._1_1_ + '\x02';
    local_4e = CONCAT11(local_4e._1_1_,(char)local_4e + -2);
    uVar6 = local_4e;
    local_44 = local_4e;
    local_4e = CONCAT11(local_4e._1_1_,cVar5);
    uVar7 = local_4e;
    local_3c = local_4e;
    cVar1 = cVar5 + '\x02';
    local_4e = CONCAT11(local_4e._1_1_,cVar1);
    uVar8 = local_4e;
    local_34 = local_4e;
    local_4e = CONCAT11(cVar13,cVar1);
    uVar9 = local_4e;
    local_2c = local_4e;
    cVar2 = cVar13 + -2;
    local_4e = CONCAT11(cVar2,cVar1);
    uVar10 = local_4e;
    local_24 = local_4e;
    local_4e = CONCAT11(cVar2,cVar5);
    uVar11 = local_4e;
    local_1c = local_4e;
    local_4e = CONCAT11(cVar2,cVar5 + -2);
    uVar12 = local_4e;
    local_14 = local_4e;
    local_4e = CONCAT11(cVar13,cVar5 + -2);
    local_c = local_4e;
    local_48 = ((uVar6 & 0xfe) * 2 | uVar6 & 0xfe00) * 4 + 0x8a03e4;
    local_40 = ((uVar7 & 0xfe) * 2 | uVar7 & 0xfe00) * 4 + 0x8a03e4;
    local_38 = ((uVar8 & 0xfe) * 2 | uVar8 & 0xfe00) * 4 + 0x8a03e4;
    local_30 = ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 0x8a03e4;
    local_28 = ((uVar10 & 0xfe) * 2 | uVar10 & 0xfe00) * 4 + 0x8a03e4;
    local_20 = ((uVar11 & 0xfe) * 2 | uVar11 & 0xfe00) * 4 + 0x8a03e4;
    local_18 = ((uVar12 & 0xfe) * 2 | uVar12 & 0xfe00) * 4 + 0x8a03e4;
    local_10 = ((local_4e & 0xfe) * 2 | local_4e & 0xfe00) * 4 + 0x8a03e4;
    bVar4 = false;
    piVar17 = &local_48;
    local_8 = ((local_4 & 0xfe) * 2 | local_4 & 0xfe00) * 4 + 0x8a03e4;
    do {
      if (bVar4) break;
      puVar3 = unit_land_array[*(short *)(*piVar17 + 6)];
      while ((puVar3 != (unit_struct *)0x0 && (!bVar4))) {
        if ((((puVar3->unit_class == '\x01') &&
             (((puVar3->tribe_index == *(char *)(param_1 + 0x2f) && (puVar3->unit_type == '\x02'))
              && ((*(byte *)((int)&puVar3->flags_2 + 2) & 0x80) == 0)))) &&
            (((puVar3->unit_land_array_index == 0 && (iVar15 = FUN_004f25b0(puVar3), iVar15 != 0))
             && (puVar3->field36_0x5f == 0)))) &&
           ((0x10 < *(ushort *)((int)&puVar3->loc_3_x + 1) &&
            (iVar15 = FUN_0043b180(puVar3,param_1), iVar15 != 0)))) {
          bVar4 = true;
        }
        puVar3 = unit_land_array[puVar3->next_unit_index];
      }
      piVar17 = piVar17 + 2;
    } while (piVar17 < &stack0x00000000);
    *(undefined4 *)(param_1 + 0x7e) = game_state.offset_counter_2;
    return;
  }
  return;
}
