/* Ghidra 12.1.3 pseudocode; entry 004449d0; FUN_004449d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004449d0(int param_1,int param_2)

{
  char cVar1;
  unit_struct *puVar2;
  int iVar3;
  bool bVar4;
  char cVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  unit_struct *puVar9;
  unit_struct *puVar10;
  int iVar11;
  int iVar12;
  unit_struct *puVar13;
  ushort *puVar14;
  undefined2 *puVar15;
  byte local_78;
  byte bStack_77;
  undefined2 local_76;
  ushort local_74;
  undefined4 local_70;
  unit_struct *local_68;
  undefined4 local_58;
  unit_struct *local_54;
  undefined1 local_50;
  undefined1 uStack_4f;
  undefined2 local_4e;
  undefined1 uStack_4d;
  undefined2 local_48;
  undefined1 uStack_47;
  undefined2 local_46;
  undefined1 uStack_45;
  undefined1 local_40 [16];
  uint local_30 [12];

  cVar1 = *(char *)(param_1 + 0xc22);
  local_68 = (unit_struct *)0x0;
  bVar4 = false;
  local_58 = *(undefined4 *)(param_2 + 4);
  local_30[0] = *(uint *)(param_2 + 8);
  create_line_wide(local_40,&local_58,(local_30[0] & 0x3ff) * 2,((local_30[0] & 0xffc00) >> 10) * 2,
                   (local_30[0] >> 0x14) << 3);
  iVar3 = (*(uint *)(param_2 + 8) & 0x3ff) * 2;
  rotate_line(local_40,&local_50,iVar3);
  comp_distances(local_40,local_30);
  local_74 = CONCAT11(uStack_4d,uStack_4f) & 0xfefe;
  local_76 = local_74;
  local_74 = CONCAT11(uStack_45,uStack_47) & 0xfefe;
  local_78 = (byte)local_76;
  iVar6 = (local_74 & 0xff) - (uint)local_78;
  if (iVar6 < 0) {
    iVar6 = (uint)local_78 - (local_74 & 0xff);
  }
  if (0x80 < iVar6) {
    iVar6 = 0x100 - iVar6;
  }
  local_70._1_1_ = (byte)(local_74 >> 8);
  bStack_77 = (byte)(local_76 >> 8);
  iVar7 = (uint)local_70._1_1_ - (uint)bStack_77;
  if (iVar7 < 0) {
    iVar7 = (uint)bStack_77 - (uint)local_70._1_1_;
  }
  if (0x80 < iVar7) {
    iVar7 = 0x100 - iVar7;
  }
  for (iVar7 = iVar7 / 2 + 1; local_70 = iVar6 / 2 + 1, iVar7 != 0; iVar7 = iVar7 + -1) {
    for (; local_70 != 0; local_70 = local_70 + -1) {
      for (puVar2 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_76 & 0xfe) * 2 | local_76 & 0xfe00) * 2]];
          puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
        if ((((puVar2->unit_class == '\x01') && (puVar2->tribe_index == cVar1)) &&
            (cVar5 = FUN_004e3430(puVar2,1), cVar5 != '\0')) &&
           ((cVar5 = FUN_004de610(puVar2), cVar5 == '\0' &&
            (cVar5 = FUN_004de680(puVar2), cVar5 == '\0')))) {
          cVar5 = is_point_in_polygon(&puVar2->pos,local_30,iVar3);
          if (cVar5 != '\0') {
            if ((!bVar4) && (bVar4 = true, *(char *)(param_2 + 0xc) != 'y')) {
              FUN_00436ff0(param_1);
              for (puVar10 = *(unit_struct **)(param_1 + 0x881); puVar10 != (unit_struct *)0x0;
                  puVar10 = puVar10->next_unit) {
                puVar10->flags_3 = puVar10->flags_3 & 0xffffff7f;
                *(byte *)&puVar10->loc_1_x = *(byte *)&puVar10->loc_1_x & 0x7f;
                if (puVar10->unit_land_array_index != 0) {
                  puVar9 = unit_land_array[(ushort)puVar10->unit_land_array_index];
                  puVar13 = (unit_struct *)0x0;
                  if (((*(byte *)&puVar9->flags_2 & 1) == 0) && (puVar9->unit_class != '\0')) {
                    puVar13 = puVar9;
                  }
                  if (((puVar13 != (unit_struct *)0x0) && (puVar13->field_0x9e != '\0')) &&
                     (iVar11 = (int)(char)unit_type_array_vehicle[(byte)puVar13->unit_type].
                                          field_0x8, 0 < iVar11)) {
                    puVar14 = &puVar13->loc_1_x;
                    do {
                      puVar9 = (unit_struct *)0x0;
                      if (((*puVar14 != 0) &&
                          (puVar13 = unit_land_array[*puVar14],
                          (*(byte *)&puVar13->flags_2 & 1) == 0)) && (puVar13->unit_class != '\0'))
                      {
                        puVar9 = puVar13;
                      }
                      if ((puVar9 != (unit_struct *)0x0) && (puVar10 != puVar9)) {
                        FUN_004458d0(puVar9,0,0);
                      }
                      puVar14 = puVar14 + 1;
                      iVar11 = iVar11 + -1;
                    } while (iVar11 != 0);
                  }
                }
              }
            }
            FUN_004458d0(puVar2,1,0);
            if (puVar2->unit_land_array_index != 0) {
              puVar10 = unit_land_array[(ushort)puVar2->unit_land_array_index];
              puVar9 = (unit_struct *)0x0;
              if (((*(byte *)&puVar10->flags_2 & 1) == 0) && (puVar10->unit_class != '\0')) {
                puVar9 = puVar10;
              }
              if (((puVar9 != (unit_struct *)0x0) && (puVar9->field_0x9e != '\0')) &&
                 (iVar11 = (int)(char)unit_type_array_vehicle[(byte)puVar9->unit_type].field_0x8,
                 0 < iVar11)) {
                puVar14 = &puVar9->loc_1_x;
                do {
                  puVar10 = (unit_struct *)0x0;
                  if (((*puVar14 != 0) &&
                      (puVar9 = unit_land_array[*puVar14], (puVar9->flags_2 & 1) == 0)) &&
                     (puVar9->unit_class != '\0')) {
                    puVar10 = puVar9;
                  }
                  if ((puVar10 != (unit_struct *)0x0) && (puVar10 != puVar2)) {
                    FUN_004458d0(puVar10,1,0);
                  }
                  puVar14 = puVar14 + 1;
                  iVar11 = iVar11 + -1;
                } while (iVar11 != 0);
              }
            }
            local_68 = puVar2;
            if (puVar2->unit_land_array_index != 0) {
              FUN_004e31f0(unit_land_array[(ushort)puVar2->unit_land_array_index],1,0);
            }
          }
        }
        else if (((puVar2->unit_class == '\x04') &&
                 ((puVar2->tribe_index == cVar1 && (puVar2->field_0x9e != '\0')))) &&
                (cVar5 = is_point_in_polygon(&puVar2->pos,local_30,iVar3), cVar5 != '\0')) {
          if ((!bVar4) && (bVar4 = true, *(char *)(param_2 + 0xc) != 'y')) {
            FUN_00436ff0(param_1);
            for (iVar11 = *(int *)(param_1 + 0x881); iVar11 != 0; iVar11 = *(int *)(iVar11 + 8)) {
              FUN_004458d0(iVar11,0,0);
              if (*(ushort *)(iVar11 + 0x9f) != 0) {
                puVar10 = unit_land_array[*(ushort *)(iVar11 + 0x9f)];
                puVar9 = (unit_struct *)0x0;
                if (((*(byte *)&puVar10->flags_2 & 1) == 0) && (puVar10->unit_class != '\0')) {
                  puVar9 = puVar10;
                }
                if ((puVar9 != (unit_struct *)0x0) && (puVar9->field_0x9e != '\0')) {
                  iVar12 = (int)(char)unit_type_array_vehicle[(byte)puVar9->unit_type].field_0x8;
                  if (0 < iVar12) {
                    puVar15 = &puVar9->loc_1_x;
                    do {
                      iVar8 = FUN_004077e0(*puVar15);
                      if ((iVar8 != 0) && (iVar11 != iVar8)) {
                        FUN_004458d0(iVar8,0,0);
                      }
                      puVar15 = puVar15 + 1;
                      iVar12 = iVar12 + -1;
                    } while (iVar12 != 0);
                  }
                }
              }
            }
          }
          iVar11 = FUN_004e31f0(puVar2,1,&local_54);
          if (iVar11 != 0) {
            local_68 = local_54;
          }
        }
      }
      local_76 = CONCAT11(local_76._1_1_,(char)local_76 + '\x02');
    }
    local_76 = CONCAT11(local_76._1_1_ + '\x02',local_78);
  }
  if (local_68 != (unit_struct *)0x0) {
    FUN_00489c40(param_1,local_68,0);
  }
  FUN_0047a550(0,param_1);
  return;
}
