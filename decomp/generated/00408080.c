/* Ghidra 12.1.3 pseudocode; entry 00408080; FUN_00408080.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00408080(int param_1)

{
  uint *puVar1;
  byte bVar2;
  byte bVar3;
  ushort uVar4;
  bool bVar5;
  uint uVar6;
  char cVar7;
  undefined2 uVar8;
  shape_entry *psVar9;
  int iVar10;
  uint uVar11;
  int iVar12;
  unit_struct *puVar13;
  int iVar14;
  byte *pbVar15;
  unit_struct *puVar16;
  ushort *puVar17;
  undefined2 local_344;
  undefined2 local_342;
  undefined4 local_340;
  uint local_334;
  int local_330;
  uint local_32c;
  int local_328;
  int local_324;
  undefined4 local_320;

  cVar7 = '\0';
  local_324 = 0;
  if (*(char *)(param_1 + 0x2c) != '\x03') {
    bVar5 = false;
    bVar2 = *(byte *)(param_1 + 0x2b);
    if (((*(byte *)(param_1 + 0x2e) & 3) == 0) ||
       ((unit_type_array_building[bVar2].field_0x49 & 0x80) != 0)) {
      bVar5 = true;
    }
    if (bVar5) {
      if (((*(char *)(param_1 + 0x2f) == player_tribe_num) &&
          ((unit_type_array_building[bVar2].field_0x49 & 0x10) != 0)) &&
         (*(ushort *)(param_1 + 0x92) != 0)) {
        puVar16 = unit_land_array[*(ushort *)(param_1 + 0x92)];
        puVar13 = (unit_struct *)0x0;
        if (((*(byte *)&puVar16->flags_2 & 1) == 0) && (puVar16->unit_class != '\0')) {
          puVar13 = puVar16;
        }
        if (puVar13 != (unit_struct *)0x0) {
          FUN_004ef180(puVar13);
          *(undefined2 *)(param_1 + 0x92) = 0;
        }
      }
      psVar9 = shapes_mem +
               (char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                     [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                   ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
      local_320._0_2_ =
           CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                    (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) & 0xfefe;
      local_344._0_1_ = (char)(ushort)local_320;
      local_344._0_1_ = (char)local_344 - psVar9->x2;
      local_344._1_1_ = (char)((ushort)local_320 >> 8);
      local_344 = CONCAT11(local_344._1_1_ - psVar9->y2,(char)local_344);
      iVar10 = 0;
      local_340 = (byte *)0x0;
      local_330 = 0;
      pbVar15 = psVar9->ptr;
      local_320 = (uint)(byte)psVar9->x1;
      uVar11 = (uint)(byte)psVar9->y1;
      uVar4 = local_344;
      while (uVar6 = local_320, uVar11 != 0) {
        for (; local_342._1_1_ = (char)(uVar4 >> 8), uVar6 != 0; uVar6 = uVar6 - 1) {
          if ((*pbVar15 & 2) != 0) {
            local_340 = (byte *)((int)local_340 + 1);
            iVar14 = (int)(short)(&game_state.level_data[0].height)
                                 [((uVar4 & 0xfe) * 2 | uVar4 & 0xfe00) * 2];
            iVar10 = iVar10 + iVar14;
            if (iVar14 < 1) {
              local_330 = local_330 + 1;
            }
          }
          local_342._0_1_ = (char)uVar4;
          local_342 = CONCAT11(local_342._1_1_,(char)local_342 + '\x02');
          pbVar15 = pbVar15 + 1;
          uVar4 = local_342;
        }
        local_342 = CONCAT11(local_342._1_1_ + '\x02',(char)local_344);
        uVar11 = uVar11 - 1;
        uVar4 = local_342;
        local_334 = uVar11;
      }
      if (((*(char *)(param_1 + 0x2b) != '\r') && (*(char *)(param_1 + 0x2b) != '\x0e')) &&
         (local_340 != (byte *)0x0)) {
        iVar10 = iVar10 / (int)local_340;
        if (iVar10 < 1) {
          iVar10 = 1;
        }
        *(short *)(param_1 + 0x41) = (short)iVar10;
      }
      if ((unit_type_array_building[bVar2].field_0x49 & 0x80) == 0) {
        if (*(short *)(param_1 + 0x5f) != local_330) {
          *(undefined1 *)(param_1 + 0x67) = 8;
          *(undefined2 *)(param_1 + 0x5f) = (undefined2)local_330;
        }
        if ('\x01' < *(char *)(param_1 + 0x67)) {
          *(char *)(param_1 + 0x67) = *(char *)(param_1 + 0x67) + -1;
        }
        if ((int)((int)local_340 * 0x14 + ((int)local_340 * 0x14 >> 0x1f & 0x1fU)) >> 5 < local_330)
        {
          cVar7 = '\x02';
        }
      }
      else if (*(short *)(param_1 + 0x41) < 1) {
        *(undefined2 *)(param_1 + 0x41) = 1;
      }
      local_328 = 0;
      local_320 = (uint)*(short *)(param_1 + 0x41);
      local_342 = local_344;
      local_340 = psVar9->ptr;
      local_32c = (uint)(byte)psVar9->x1;
      bVar3 = psVar9->y1;
      if (bVar3 != 0) {
        do {
          if (cVar7 != '\0') goto LAB_00408805;
          local_330 = 0;
          if (0 < (int)local_32c) {
            do {
              if (cVar7 != '\0') break;
              if ((*local_340 & 2) != 0) {
                iVar10 = local_320;
                if ((((*local_340 & 0x80) != 0) && (0xc < *(byte *)(param_1 + 0x2b))) &&
                   (*(byte *)(param_1 + 0x2b) < 0xf)) {
                  iVar10 = 0;
                }
                uVar11 = (local_342 & 0xfe) * 2 | local_342 & 0xfe00;
                iVar14 = (int)(short)(&game_state.level_data[0].height)[uVar11 * 2];
                iVar12 = iVar14 - iVar10;
                if (iVar12 != 0) {
                  local_324 = 1;
                  if (iVar14 < iVar10) {
                    iVar12 = -iVar12;
                  }
                  if (*(short *)&unit_type_array_building[bVar2].field_0x46 < iVar12) {
                    cVar7 = '\x01';
                  }
                  else {
                    bVar5 = false;
                    if ((*(char *)(param_1 + 0x67) < '\x02') ||
                       ((&game_state.level_data[0].height)[uVar11 * 2] != 0)) {
                      bVar5 = true;
                    }
                    if (bVar5) {
                      FUN_0044fde0(uVar11 * 4 + 0x8a03e4,iVar10,
                                   *(undefined2 *)&unit_type_array_building[bVar2].field_0x44,1);
                    }
                  }
                }
              }
              local_330 = local_330 + 1;
              local_340 = local_340 + 1;
              local_342 = CONCAT11(local_342._1_1_,(char)local_342 + '\x02');
            } while (local_330 < (int)local_32c);
          }
          local_328 = local_328 + 1;
          local_342 = CONCAT11(local_342._1_1_ + '\x02',(char)local_344);
        } while (local_328 < (int)(uint)bVar3);
      }
      if (cVar7 == '\0') {
        if (local_324 == 0) {
          local_342 = local_344;
          pbVar15 = psVar9->ptr;
          local_328 = 0;
          bVar2 = psVar9->x1;
          local_320 = (uint)(byte)psVar9->y1;
          if (local_320 != 0) {
            do {
              iVar10 = 0;
              if (bVar2 != 0) {
                do {
                  if ((*pbVar15 & 2) != 0) {
                    puVar1 = &game_state.level_data[0].flags +
                             ((local_342 & 0xfe) * 2 | local_342 & 0xfe00);
                    *puVar1 = *puVar1 & 0xfffdffff;
                  }
                  iVar10 = iVar10 + 1;
                  pbVar15 = pbVar15 + 1;
                  local_342 = CONCAT11(local_342._1_1_,(char)local_342 + '\x02');
                } while (iVar10 < (int)(uint)bVar2);
              }
              local_328 = local_328 + 1;
              local_342 = CONCAT11(local_342._1_1_ + '\x02',(char)local_344);
            } while (local_328 < (int)local_320);
          }
          *(undefined1 *)(param_1 + 0x67) = 0;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
          if ((*(ushort *)(param_1 + 0x94) != 0) &&
             (puVar16 = unit_land_array[*(ushort *)(param_1 + 0x94)], puVar16 != (unit_struct *)0x0)
             ) {
            puVar16->flags_2 = puVar16->flags_2 & 0xfffffffb;
            uVar8 = calc_point_height((puVar16->pos).x,(puVar16->pos).y);
            (puVar16->pos).z = uVar8;
            puVar16->flags_4 = puVar16->flags_4 & 0xfffffbff;
          }
          if ((*(char *)(param_1 + 0x2b) == '\r') || (*(char *)(param_1 + 0x2b) == '\x0e')) {
            local_320._0_2_ =
                 CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
            bVar5 = false;
            for (puVar16 = unit_land_array
                           [(short)(&game_state.level_data[0].unit_index)
                                   [(((ushort)local_320 & 0xfe) * 2 | (ushort)local_320 & 0xfe00) *
                                    2]]; puVar16 != (unit_struct *)0x0;
                puVar16 = unit_land_array[puVar16->next_unit_index]) {
              if ((puVar16->unit_class == '\a') && (puVar16->unit_type == 'S')) {
                bVar5 = true;
                break;
              }
            }
            if (!bVar5) {
              iVar14 = (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                                         ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
              iVar10 = (int)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)[iVar14];
              local_340 = (byte *)(CONCAT31(local_340._1_3_,
                                            (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) &
                                  0xfffffffe);
              local_340 = (byte *)(CONCAT22(local_340._2_2_,
                                            CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c)
                                                           >> 8),(char)local_340)) & 0xfffffeff);
              local_340._0_2_ =
                   CONCAT11(local_340._1_1_ - shapes_mem[iVar10].y2,
                            (char)local_340 - shapes_mem[iVar10].x2);
              FUN_004b9ef0(iVar10,local_340,&local_320,&local_334);
              cVar7 = FUN_0040b860(&local_320,local_334,iVar14);
              if (cVar7 == '\0') {
                alloc_unit(7,0x53,*(undefined1 *)(param_1 + 0x2f),(undefined2 *)(param_1 + 0x3d));
                return;
              }
            }
          }
        }
        else {
          if (((*(char *)(param_1 + 0x2b) == '\r') || (*(char *)(param_1 + 0x2b) == '\x0e')) &&
             ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0)) {
            local_320._0_2_ =
                 CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
            bVar5 = false;
            for (puVar16 = unit_land_array
                           [(short)(&game_state.level_data[0].unit_index)
                                   [(((ushort)local_320 & 0xfe) * 2 | (ushort)local_320 & 0xfe00) *
                                    2]]; puVar16 != (unit_struct *)0x0;
                puVar16 = unit_land_array[puVar16->next_unit_index]) {
              if ((puVar16->unit_class == '\a') && (puVar16->unit_type == 'S')) {
                bVar5 = true;
                break;
              }
            }
            if (!bVar5) {
              iVar14 = (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                                         ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
              iVar10 = (int)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)[iVar14];
              local_340 = (byte *)(CONCAT31(local_340._1_3_,
                                            (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) &
                                  0xfffffffe);
              local_340 = (byte *)(CONCAT22(local_340._2_2_,
                                            CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c)
                                                           >> 8),(char)local_340)) & 0xfffffeff);
              local_340._0_2_ =
                   CONCAT11(local_340._1_1_ - shapes_mem[iVar10].y2,
                            (char)local_340 - shapes_mem[iVar10].x2);
              FUN_004b9ef0(iVar10,local_340,&local_320,&local_334);
              cVar7 = FUN_0040b860(&local_320,local_334,iVar14);
              if (cVar7 == '\0') {
                alloc_unit(7,0x53,*(undefined1 *)(param_1 + 0x2f),(undefined2 *)(param_1 + 0x3d));
              }
            }
          }
          if (*(char *)(param_1 + 0xa6) != '\0') {
            puVar17 = (ushort *)(param_1 + 0x86);
            uVar4 = *(ushort *)(param_1 + 0x24);
            iVar10 = 6;
            do {
              puVar16 = (unit_struct *)0x0;
              if (((*puVar17 != 0) &&
                  (puVar13 = unit_land_array[*puVar17], (*(byte *)&puVar13->flags_2 & 1) == 0)) &&
                 (puVar13->unit_class != '\0')) {
                puVar16 = puVar13;
              }
              if ((puVar16 != (unit_struct *)0x0) &&
                 ((*(byte *)((int)&puVar16->flags_2 + 2) & 2) != 0)) {
                uVar8 = (puVar16->pos).x;
                local_320._0_2_ =
                     CONCAT11((char)((ushort)(puVar16->pos).y >> 8),(char)((ushort)uVar8 >> 8));
                if (((&game_state.level_data[0].unit_index_2)
                     [(((ushort)local_320 & 0xfe) * 2 | (ushort)local_320 & 0xfe00) * 2] & 0x3ff) ==
                    uVar4) {
                  uVar8 = calc_point_height(uVar8,(puVar16->pos).y);
                  (puVar16->pos).z = uVar8;
                }
              }
              puVar17 = puVar17 + 1;
              iVar10 = iVar10 + -1;
            } while (iVar10 != 0);
            return;
          }
        }
      }
      else {
LAB_00408805:
        if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = 3;
          init_unit_class(param_1);
        }
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        *(char *)(param_1 + 0x2d) = cVar7;
      }
    }
  }
  return;
}
