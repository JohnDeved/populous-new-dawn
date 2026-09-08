/* Ghidra 12.1.3 pseudocode; entry 004708d0; object_to_polygons.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void object_to_polygons(int param_1)

{
  ushort uVar1;
  char cVar2;
  char cVar3;
  short sVar4;
  short sVar5;
  int iVar6;
  objs0_struct *poVar7;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  objs0_struct *poVar8;
  undefined2 uVar9;
  undefined2 extraout_var_02;
  undefined2 extraout_var_03;
  undefined2 extraout_var_04;
  uint uVar10;
  uint uVar11;
  int iVar12;
  pnts0_struct *ppVar13;
  int iVar14;
  facs0_struct *pfVar15;
  uint uVar16;
  pnts_related_struct *ppVar17;
  float10 fVar18;
  ushort local_6a;
  undefined2 uStack_68;
  int local_64;
  int local_60;
  ushort local_5c;
  ushort uStack_5a;
  short local_58;
  undefined4 local_54;
  short local_50;
  undefined4 local_4c;
  pnts_related_struct *local_48;
  pnts_related_struct *local_44;
  pnts_related_struct *local_40;
  pnts_related_struct *local_3c;
  short *local_38;
  uint local_34;
  int local_30;
  int local_2c;
  int local_28;
  int local_24;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  local_30 = 0;
  local_34 = (uint)*(ushort *)(param_1 + 0x24);
  local_5c = *(short *)(param_1 + 0x3d) - *(short *)(param_1 + 0x43);
  uStack_5a = *(short *)(param_1 + 0x3f) - *(short *)(param_1 + 0x45);
  local_58 = *(short *)(param_1 + 0x41) - *(short *)(param_1 + 0x47);
  uVar16 = *(uint *)(param_1 + 0x14) & 0x100;
  if ((((uVar16 != 0) && (((byte)land_flags_1 & 2) == 0)) &&
      (iVar6 = sprite_animation_counter - *(int *)(param_1 + 0x18), iVar6 != 0)) &&
     (maybe_framerate != 0)) {
    iVar6 = DAT_005ca84c * iVar6;
    local_5c = local_5c + (short)((*(short *)(param_1 + 0x43) * iVar6) / maybe_framerate);
    uStack_5a = uStack_5a + (short)((*(short *)(param_1 + 0x45) * iVar6) / maybe_framerate);
    local_58 = local_58 + (short)((*(short *)(param_1 + 0x47) * iVar6) / maybe_framerate);
  }
  sVar5 = *(short *)(param_1 + 0x26);
  local_6a = sVar5 - *(short *)(param_1 + 0x28);
  if (((uVar16 != 0) && (((byte)land_flags_1 & 2) == 0)) &&
     ((iVar6 = sprite_animation_counter - *(int *)(param_1 + 0x18), iVar6 != 0 &&
      (maybe_framerate != 0)))) {
    local_6a = local_6a +
               (short)((*(short *)(param_1 + 0x28) * DAT_005ca84c * iVar6) / maybe_framerate);
  }
  uVar1 = local_6a & 0x7ff;
  poVar7 = objs0_mem + *(short *)(param_1 + 0x33);
  uStack_68 = SUB42(poVar7,0);
  if ((*(ushort *)(param_1 + 0x35) & 0x200) == 0) {
    local_64 = poVar7->maybe_coord_scale;
  }
  else {
    local_64 = *(int *)(param_1 + 0x68);
  }
  if ((*(ushort *)(param_1 + 0x35) & 0x20) == 0) {
    if (((uVar1 == 0) && (*(short *)(param_1 + 0x6c) == 0)) && (*(short *)(param_1 + 0x6e) == 0)) {
      sVar5 = 0;
    }
    else {
      sVar5 = 1;
    }
    if (sVar5 == 0) goto LAB_00470b08;
    init_matrix3x3(&local_24);
    if ((*(byte *)(param_1 + 0x16) & 0x60) != 0) {
      make_rot_matrix3x3_z_axis(CONCAT22(uStack_68,local_6a) & 0xffff07ff,&local_24);
      create_z_rot_matrix3x3(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x6c)),&local_24);
      create_y_rot_matrix3x3(CONCAT22(extraout_var_04,*(undefined2 *)(param_1 + 0x6e)),&local_24);
      goto LAB_00470b08;
    }
    create_z_rot_matrix3x3(CONCAT22(extraout_var_02,*(undefined2 *)(param_1 + 0x6c)));
    create_y_rot_matrix3x3(CONCAT22(extraout_var_03,*(undefined2 *)(param_1 + 0x6e)),&local_24);
    uVar9 = extraout_var;
  }
  else {
    if (sVar5 == 0) goto LAB_00470b08;
    init_matrix3x3(&local_24);
    uVar9 = extraout_var_01;
  }
  rotate_basis(&local_24,CONCAT22(uVar9,-uVar1),2);
LAB_00470b08:
  uVar10 = (uint)local_5c - (uint)(ushort)tribe_ptr->x;
  uVar16 = uVar10;
  if ((int)uVar10 < 0) {
    uVar16 = -uVar10;
  }
  uVar11 = uVar10;
  if (((uVar16 & 0x8000) != 0) && (uVar11 = uVar16 - 0x10000, (int)uVar10 < 1)) {
    uVar11 = 0x10000 - uVar16;
  }
  local_2c = (int)uVar11 >> 1;
  uVar10 = (uint)uStack_5a - (uint)(ushort)tribe_ptr->y;
  uVar16 = uVar10;
  if ((int)uVar10 < 0) {
    uVar16 = -uVar10;
  }
  uVar11 = uVar10;
  if (((uVar16 & 0x8000) != 0) && (uVar11 = uVar16 - 0x10000, (int)uVar10 < 1)) {
    uVar11 = 0x10000 - uVar16;
  }
  local_28 = (int)uVar11 >> 1;
  if (((*(byte *)(param_1 + 0xc) & 4) == 0) || ((*(byte *)(param_1 + 0x16) & 0x10) != 0)) {
    local_38 = &poVar7->pnts_num;
    ppVar13 = poVar7->pnts0_ptr;
    if (0 < (short)poVar7->pnts_num) {
      local_54 = (int)local_58;
      ppVar17 = temp_pnts_related_array;
      local_4c = (int)(short)poVar7->pnts_num;
      do {
        sVar4 = ppVar13->z;
        iVar14 = ppVar13->x * local_64 >> 8;
        iVar12 = ppVar13->y * local_64 >> 8;
        ppVar17->x = iVar14;
        iVar6 = sVar4 * local_64 >> 8;
        ppVar17->y = iVar12;
        ppVar17->z = iVar6;
        *(undefined4 *)&ppVar17->field_0x18 = 0;
        if (sVar5 != 0) {
          ppVar17->x = local_1c * iVar6 + local_20 * iVar12 + local_24 * iVar14 >> 0xe;
          ppVar17->y = local_10 * iVar6 + local_14 * iVar12 + local_18 * iVar14 >> 0xe;
          ppVar17->z = local_4 * iVar6 + local_8 * iVar12 + local_c * iVar14 >> 0xe;
        }
        ppVar17->x = ppVar17->x + local_2c;
        ppVar13 = ppVar13 + 1;
        ppVar17->z = ppVar17->z + local_28;
        ppVar17->y = ppVar17->y + local_54;
        local_4c = local_4c + -1;
        ppVar17 = ppVar17 + 1;
      } while (local_4c != 0);
    }
  }
  else {
    ppVar17 = temp_pnts_related_array;
    local_38 = &poVar7->pnts_num;
    ppVar13 = poVar7->pnts0_ptr;
    poVar8 = poVar7;
    iVar6 = (int)(short)poVar7->pnts_num;
    if (0 < (short)poVar7->pnts_num) {
      do {
        local_54 = iVar6;
        sVar4 = ppVar13->z;
        iVar12 = ppVar13->x * local_64 >> 8;
        iVar14 = ppVar13->y * local_64 >> 8;
        ppVar17->x = iVar12;
        iVar6 = sVar4 * local_64 >> 8;
        ppVar17->y = iVar14;
        ppVar17->z = iVar6;
        *(undefined4 *)&ppVar17->field_0x18 = 0;
        if (sVar5 != 0) {
          ppVar17->x = local_1c * iVar6 + local_20 * iVar14 + local_24 * iVar12 >> 0xe;
          ppVar17->y = local_10 * iVar6 + local_14 * iVar14 + local_18 * iVar12 >> 0xe;
          poVar8 = (objs0_struct *)(local_c * iVar12);
          ppVar17->z = (int)&poVar8->flags + local_4 * iVar6 + local_8 * iVar14 >> 0xe;
        }
        uVar9 = (undefined2)((uint)poVar8 >> 0x10);
        iVar6 = CONCAT22(uVar9,local_5c) + ppVar17->x * 2;
        ppVar17->x = ppVar17->x + local_2c;
        iVar12 = CONCAT22(uVar9,uStack_5a) + ppVar17->z * 2;
        local_4c._0_2_ = CONCAT11((char)((uint)iVar12 >> 8),(char)((uint)iVar6 >> 8));
        ppVar17->z = ppVar17->z + local_28;
        sVar4 = local_58;
        if ((*(byte *)((int)&game_state.level_data[0].flags +
                      (((ushort)local_4c & 0xfe) * 2 | (ushort)local_4c & 0xfe00) * 4 + 2) & 2) != 0
           ) {
          sVar4 = calc_point_height(iVar6,iVar12);
        }
        ppVar17->y = (int)&((objs0_struct *)(int)sVar4)->flags + ppVar17->y;
        ppVar17 = ppVar17 + 1;
        ppVar13 = ppVar13 + 1;
        poVar8 = (objs0_struct *)(int)sVar4;
        iVar6 = local_54 + -1;
      } while (local_54 + -1 != 0);
      local_54 = 0;
    }
  }
  uVar10 = sprite_animation_counter;
  uVar16 = *(uint *)(param_1 + 0x14);
  if ((uVar16 & 0x600000) != 0) {
    if ((((byte)land_flags_1 & 8) == 0) && (((byte)opened_files_flags & 0x10) == 0)) {
      local_4c = 0;
    }
    else {
      local_4c = 1;
    }
    if ((uVar16 & 0x200000) == 0) {
      if ((uVar16 & 0x400000) != 0) {
        iVar6 = 0;
        local_60 = 0;
        sVar5 = *local_38;
        ppVar17 = temp_pnts_related_array;
        sVar4 = calc_point_height(CONCAT22(uStack_5a,local_5c),CONCAT22(local_58,uStack_5a));
        if (0 < sVar5) {
          do {
            if (1 < iVar6) break;
            if ((((uVar10 & 1) == 0) && (iVar12 = ppVar17->y - (int)sVar4, -300 < iVar12)) &&
               (iVar12 < 1)) {
              local_50 = sVar4 + -0x20;
              local_54 = CONCAT22(uStack_5a + ((short)ppVar17->z - (short)local_28) * 2,
                                  local_5c + ((short)ppVar17->x - (short)local_2c) * 2);
              cVar3 = FUN_00515d80(&local_54,0x33);
              if (((cVar3 == '\0') && (cVar3 = FUN_004edae0(7,0x33), cVar3 != '\0')) &&
                 (iVar12 = alloc_unit_2(7,0x33,0,&local_54), iVar12 != 0)) {
                *(uint *)(iVar12 + 0x14) = *(uint *)(iVar12 + 0x14) | 0x400;
                *(undefined1 *)(iVar12 + 0x3b) = 0xe8;
                iVar6 = iVar6 + 1;
              }
            }
            uVar10 = uVar10 + 1;
            ppVar17 = ppVar17 + 1;
            local_60 = local_60 + 1;
          } while (local_60 < sVar5);
        }
      }
    }
    else {
      iVar6 = 0;
      ppVar17 = temp_pnts_related_array;
      local_60 = 0;
      sVar5 = *local_38;
      uVar16 = sprite_animation_counter;
      if (0 < sVar5) {
        do {
          if (1 < iVar6) break;
          if ((((uVar16 & 1) == 0) && (-0xb4 < ppVar17->y)) && (ppVar17->y < 0x10)) {
            local_50 = 0;
            local_54 = CONCAT22(uStack_5a + ((short)ppVar17->z - (short)local_28) * 2,
                                local_5c + ((short)ppVar17->x - (short)local_2c) * 2);
            cVar3 = FUN_0044f980(&local_54);
            if ((cVar3 == '\0') && (cVar3 = FUN_00515d80(&local_54,0x41), cVar3 == '\0')) {
              iVar12 = 0;
              if (local_4c == 0) {
                iVar12 = 2;
              }
              else {
                cVar3 = FUN_004edae0(7,0x41);
                if (cVar3 != '\0') {
                  iVar12 = 1;
                }
              }
              if (iVar12 != 0) {
                if (iVar12 == 1) {
                  iVar12 = alloc_unit_2();
                }
                else {
                  iVar12 = alloc_unit(7,0x41,0,&local_54);
                }
                if (iVar12 != 0) {
                  *(uint *)(iVar12 + 0x14) = *(uint *)(iVar12 + 0x14) | 0x400;
                  *(undefined1 *)(iVar12 + 0x3b) = 0xe0;
                  iVar6 = iVar6 + 1;
                }
              }
            }
          }
          uVar16 = uVar16 + 1;
          ppVar17 = ppVar17 + 1;
          local_60 = local_60 + 1;
        } while (local_60 < sVar5);
      }
    }
  }
  iVar6 = (int)(short)poVar7->facs_num;
  pfVar15 = poVar7->facs0_ptr;
  if (0 < iVar6) {
    do {
      local_48 = temp_pnts_related_array + pfVar15->point_1;
      local_44 = temp_pnts_related_array + pfVar15->point_2;
      local_40 = temp_pnts_related_array + pfVar15->point_3;
      if ((pfVar15->f5 & 1) == 0) {
        sVar5 = (&pfVar15->f6)[(short)uVar1 >> 9];
      }
      else {
        sVar5 = calc_normal_maybe(local_48,local_44,local_40);
      }
      pfVar15->maybe_normal = sVar5;
      pfVar15 = pfVar15 + 1;
      iVar6 = iVar6 + -1;
    } while (iVar6 != 0);
  }
  if (*(char *)(param_1 + 0x65) != '\0') {
    FUN_004762b0(param_1,temp_pnts_related_array,poVar7);
  }
  ppVar17 = temp_pnts_related_array;
  iVar6 = (int)*local_38;
  if (0 < iVar6) {
    do {
      coord_pnts_global_convert(ppVar17);
      ppVar17 = ppVar17 + 1;
      iVar6 = iVar6 + -1;
    } while (iVar6 != 0);
  }
  if (((DAT_0074a2f0 != '\0') && (*(short *)(param_1 + 0x24) == unit_index_2)) &&
     (((((DAT_0074a33c != '\0' ||
         (((cVar3 = *(char *)(param_1 + 0x2f), player_tribe_num == cVar3 ||
           (cVar2 = *(char *)(param_1 + 0x2a), cVar2 == '\x04')) || (cVar3 == -1)))) ||
        ((cVar2 == '\x06' && (*(char *)(param_1 + 0x2b) == '\b')))) ||
       ((player_tribe_num != cVar3 &&
        ((cVar2 == '\x02' && (iVar6 = FUN_0040bac0(param_1), iVar6 != 0)))))) &&
      ((local_30 = 1, *(char *)(param_1 + 0x2f) == player_tribe_num &&
       ((*(char *)(param_1 + 0x2a) == '\x06' && (*(char *)(param_1 + 0x2b) == '\b')))))))) {
    local_30 = 0;
  }
  if ((*(byte *)&poVar7->flags & 1) == 0) {
    iVar6 = (int)(short)poVar7->facs_num;
    pfVar15 = poVar7->facs0_ptr;
    if (0 < iVar6) {
      do {
        local_48 = temp_pnts_related_array + pfVar15->point_1;
        local_44 = temp_pnts_related_array + pfVar15->point_2;
        local_40 = temp_pnts_related_array + pfVar15->point_3;
        local_3c = temp_pnts_related_array + pfVar15->point_4;
        uVar16 = (uint)(byte)(&sunlight_related_array_1)[pfVar15->maybe_normal];
        if (local_30 != 0) {
          uVar16 = (-(uint)(DAT_00897987 == '\0') & 0xffc8c8c9) - 1;
        }
        fVar18 = (float10)screen_clipping(local_48,local_44,local_40);
        if ((float10)_DAT_0058f468 < fVar18) {
          add_polygon_to_draw_3v_2
                    (pfVar15,&local_48,-((int)poVar7->f1 + (int)pfVar15->f8),uVar16,0,1,2,local_34);
        }
        if ((3 < (byte)pfVar15->num_points) &&
           (fVar18 = (float10)screen_clipping(local_48,local_40,local_3c),
           (float10)_DAT_0058f468 < fVar18)) {
          add_polygon_to_draw_3v_2
                    (pfVar15,&local_48,-((int)poVar7->f1 + (int)pfVar15->f8),uVar16,0,2,3,local_34);
        }
        pfVar15 = pfVar15 + 1;
        iVar6 = iVar6 + -1;
      } while (iVar6 != 0);
    }
  }
  else {
    if ((*(char *)(param_1 + 0x2a) == '\x02') && ((*(byte *)(param_1 + 0x9c) & 1) != 0)) {
      cVar3 = *(char *)(param_1 + 0xaa);
    }
    else {
      cVar3 = *(char *)(param_1 + 0x2f);
    }
    iVar6 = (int)(short)poVar7->facs_num;
    pfVar15 = poVar7->facs0_ptr;
    if (0 < iVar6) {
      do {
        local_48 = temp_pnts_related_array + pfVar15->point_1;
        local_44 = temp_pnts_related_array + pfVar15->point_2;
        local_40 = temp_pnts_related_array + pfVar15->point_3;
        local_3c = temp_pnts_related_array + pfVar15->point_4;
        uVar16 = (uint)(byte)(&sunlight_related_array_1)[pfVar15->maybe_normal];
        if (local_30 != 0) {
          uVar16 = (-(uint)(DAT_00897987 == '\0') & 0xffc8c8c9) - 1;
        }
        fVar18 = (float10)screen_clipping(local_48,local_44,local_40);
        if ((float10)_DAT_0058f468 < fVar18) {
          if (((&DAT_005aa218)[(short)pfVar15->maybe_tex_index] & 1) == 0) {
            add_polygon_to_draw_3v_2
                      (pfVar15,&local_48,-((int)poVar7->f1 + (int)pfVar15->f8),uVar16,0,1,2,local_34
                      );
          }
          else {
            add_polygon_to_draw_3v
                      (pfVar15,&local_48,-((int)poVar7->f1 + (int)pfVar15->f8),uVar16,0,1,2,
                       (int)cVar3);
          }
        }
        if ((3 < (byte)pfVar15->num_points) &&
           (fVar18 = (float10)screen_clipping(local_48,local_40,local_3c),
           (float10)_DAT_0058f468 < fVar18)) {
          if (((&DAT_005aa218)[(short)pfVar15->maybe_tex_index] & 1) == 0) {
            add_polygon_to_draw_3v_2
                      (pfVar15,&local_48,-((int)poVar7->f1 + (int)pfVar15->f8),uVar16,0,2,3,local_34
                      );
          }
          else {
            add_polygon_to_draw_3v
                      (pfVar15,&local_48,-((int)poVar7->f1 + (int)pfVar15->f8),uVar16,0,2,3,
                       (int)cVar3);
          }
        }
        pfVar15 = pfVar15 + 1;
        iVar6 = iVar6 + -1;
      } while (iVar6 != 0);
    }
  }
  if (local_30 != 0) {
    FUN_004756a0(param_1,poVar7);
  }
  if ((*(byte *)(param_1 + 0x35) & 0x80) != 0) {
    FUN_00475550(param_1,poVar7);
  }
  return;
}
