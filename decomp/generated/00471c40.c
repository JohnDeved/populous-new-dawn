/* Ghidra 12.1.3 pseudocode; entry 00471c40; object_to_polygons_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void object_to_polygons_2(unit_struct *param_1)

{
  union_polygon *puVar1;
  char cVar2;
  ushort uVar3;
  short sVar4;
  int iVar5;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  undefined2 extraout_var_02;
  undefined2 extraout_var_03;
  undefined2 uVar9;
  pnts_related_struct *ppVar6;
  int iVar7;
  int iVar8;
  short sVar10;
  uint uVar11;
  undefined2 extraout_var_04;
  pnts_related_struct *ppVar12;
  facs0_struct *pfVar13;
  short *psVar14;
  int iVar15;
  uint uVar16;
  uint uVar17;
  pnts0_struct *ppVar18;
  int iVar19;
  undefined4 local_78;
  short local_74;
  int local_70;
  undefined4 local_6c;
  undefined4 local_68;
  objs0_struct *local_64;
  facs0_struct *local_60;
  uint local_5c;
  short *local_58;
  float local_54;
  int local_50;
  undefined4 local_4c;
  undefined4 local_48;
  pnts_related_struct *local_44;
  pnts_related_struct *ppStack_40;
  int iStack_3c;
  int local_38;
  int local_34;
  int local_30;
  int local_2c;
  int local_28;
  int local_24;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  uint local_10;
  uint local_c;
  int local_8;
  uint local_4;

  local_8 = (int)(char)param_1->tribe_index;
  local_38 = 0;
  sVar4 = (param_1->vec1).x;
  local_4 = (uint)(ushort)param_1->unit_index;
  local_4c._0_2_ = (param_1->pos).x - sVar4;
  sVar10 = (param_1->vec1).y;
  local_4c._2_2_ = (param_1->pos).y - sVar10;
  uVar11 = param_1->flags_3 & 0x100;
  if ((((uVar11 != 0) && (((byte)land_flags_1 & 2) == 0)) &&
      (iVar5 = sprite_animation_counter - param_1->mid, iVar5 != 0)) && (maybe_framerate != 0)) {
    iVar5 = DAT_005ca84c * iVar5;
    local_4c._0_2_ = (short)local_4c + (short)((sVar4 * iVar5) / maybe_framerate);
    local_4c._2_2_ = local_4c._2_2_ + (short)((sVar10 * iVar5) / maybe_framerate);
  }
  uVar3 = param_1->maybe_shape_angle - param_1->r2;
  local_68._0_2_ = uVar3;
  if (((uVar11 != 0) && (((byte)land_flags_1 & 2) == 0)) &&
     ((iVar5 = sprite_animation_counter - param_1->mid, iVar5 != 0 && (maybe_framerate != 0)))) {
    local_68._0_2_ = uVar3 + (short)(((short)param_1->r2 * DAT_005ca84c * iVar5) / maybe_framerate);
  }
  local_10 = 1 << (param_1->field_0x78 & 0x1f);
  uVar3 = (ushort)local_68 & 0x7ff;
  local_68 = (short *)(CONCAT22(local_68._2_2_,(ushort)local_68) & 0xffff07ff);
  local_c = 0x10 << (param_1->field_0x78 & 0x1f);
  local_64 = objs0_mem + (short)(param_1->object).obj_index;
  local_5c = local_64->maybe_coord_scale;
  if (((param_1->object).flags & 0x20) == 0) {
    if (((uVar3 == 0) && (*(short *)&param_1->field_0x6c == 0)) &&
       (*(short *)&param_1->field_0x6e == 0)) {
      local_70 = 0;
    }
    else {
      local_70 = 1;
    }
    if (local_70 != 0) {
      init_matrix3x3(&local_34);
      if ((*(byte *)((int)&param_1->flags_3 + 2) & 0x60) == 0) {
        create_z_rot_matrix3x3(CONCAT22(extraout_var_04,*(undefined2 *)&param_1->field_0x6c));
        create_y_rot_matrix3x3(CONCAT22(extraout_var,*(undefined2 *)&param_1->field_0x6e),&local_34)
        ;
        uVar9 = extraout_var_00;
        goto LAB_00471e5c;
      }
      make_rot_matrix3x3_z_axis(local_68,&local_34);
      create_z_rot_matrix3x3
                (CONCAT22(extraout_var_01,*(undefined2 *)&param_1->field_0x6c),&local_34);
      create_y_rot_matrix3x3
                (CONCAT22(extraout_var_02,*(undefined2 *)&param_1->field_0x6e),&local_34);
    }
  }
  else {
    local_70 = (int)(short)param_1->maybe_shape_angle;
    if (local_70 != 0) {
      init_matrix3x3(&local_34);
      uVar9 = extraout_var_03;
LAB_00471e5c:
      rotate_basis(&local_34,CONCAT22(uVar9,-(ushort)local_68),2);
    }
  }
  uVar16 = (uint)(ushort)(param_1->pos).x - (uint)(ushort)tribe_ptr->x;
  uVar11 = uVar16;
  if ((int)uVar16 < 0) {
    uVar11 = -uVar16;
  }
  uVar17 = uVar16;
  if (((uVar11 & 0x8000) != 0) && (uVar17 = uVar11 - 0x10000, (int)uVar16 < 1)) {
    uVar17 = 0x10000 - uVar11;
  }
  local_50 = (int)uVar17 >> 1;
  uVar16 = (uint)(ushort)(param_1->pos).y - (uint)(ushort)tribe_ptr->y;
  uVar11 = uVar16;
  if ((int)uVar16 < 0) {
    uVar11 = -uVar16;
  }
  uVar17 = uVar16;
  if (((uVar11 & 0x8000) != 0) && (uVar17 = uVar11 - 0x10000, (int)uVar16 < 1)) {
    uVar17 = 0x10000 - uVar11;
  }
  local_54 = (float)((int)uVar17 >> 1);
  if ((*(byte *)&param_1->flags_2 & 4) == 0) {
    local_58 = &local_64->pnts_num;
    ppVar12 = temp_pnts_related_array;
    ppVar18 = local_64->pnts0_ptr;
    iVar5 = (int)*local_58;
    if (0 < *local_58) {
      do {
        local_78 = iVar5;
        sVar4 = ppVar18->z;
        iVar5 = (int)((int)ppVar18->x * local_5c) >> 8;
        iVar19 = (int)((int)ppVar18->y * local_5c) >> 8;
        ppVar12->x = iVar5;
        iVar15 = (int)((int)sVar4 * local_5c) >> 8;
        ppVar12->y = iVar19;
        ppVar12->z = iVar15;
        *(undefined4 *)&ppVar12->field_0x18 = 0;
        if (local_70 != 0) {
          ppVar12->x = iVar5 * local_34 + local_2c * iVar15 + local_30 * iVar19 >> 0xe;
          ppVar12->y = iVar5 * local_28 + local_20 * iVar15 + local_24 * iVar19 >> 0xe;
          ppVar12->z = iVar5 * local_1c + local_14 * iVar15 + local_18 * iVar19 >> 0xe;
        }
        ppVar12->x = ppVar12->x + local_50;
        ppVar12->z = ppVar12->z + (int)local_54;
        ppVar18 = ppVar18 + 1;
        ppVar12->y = ppVar12->y + (int)(short)(param_1->pos).z;
        ppVar12 = ppVar12 + 1;
        iVar5 = local_78 + -1;
      } while (local_78 + -1 != 0);
      local_78 = 0;
    }
  }
  else {
    local_58 = &local_64->pnts_num;
    ppVar12 = temp_pnts_related_array;
    ppVar18 = local_64->pnts0_ptr;
    iVar5 = (int)*local_58;
    if (0 < *local_58) {
      do {
        local_78 = iVar5;
        sVar4 = ppVar18->z;
        iVar5 = (int)((int)ppVar18->x * local_5c) >> 8;
        iVar15 = (int)((int)ppVar18->y * local_5c) >> 8;
        ppVar12->x = iVar5;
        iVar19 = (int)((int)sVar4 * local_5c) >> 8;
        ppVar12->y = iVar15;
        ppVar12->z = iVar19;
        *(undefined4 *)&ppVar12->field_0x18 = 0;
        if (local_70 != 0) {
          ppVar12->x = iVar5 * local_34 + local_2c * iVar19 + local_30 * iVar15 >> 0xe;
          ppVar12->y = iVar5 * local_28 + local_20 * iVar19 + local_24 * iVar15 >> 0xe;
          ppVar12->z = iVar5 * local_1c + local_14 * iVar19 + local_18 * iVar15 >> 0xe;
        }
        iVar5 = ppVar12->x;
        iVar15 = ppVar12->z;
        sVar4 = (short)iVar5 * 2 + (param_1->pos).x;
        sVar10 = (short)iVar15 * 2 + (param_1->pos).y;
        local_6c._0_2_ = CONCAT11((char)((ushort)sVar10 >> 8),(char)((ushort)sVar4 >> 8));
        ppVar12->x = iVar5 + local_50;
        ppVar12->z = ppVar12->z + (int)local_54;
        if (((*(byte *)((int)&game_state.level_data[0].flags +
                       (((ushort)local_6c & 0xfe) * 2 | (ushort)local_6c & 0xfe00) * 4 + 2) & 2) ==
             0) || ((*(byte *)((int)&param_1->flags_3 + 3) & 4) != 0)) {
          sVar4 = (param_1->pos).z;
        }
        else {
          sVar4 = calc_point_height(CONCAT22((short)((uint)iVar5 >> 0x10),sVar4),
                                    CONCAT22((short)((uint)iVar15 >> 0x10),sVar10));
        }
        ppVar12->y = ppVar12->y + (int)sVar4;
        ppVar12 = ppVar12 + 1;
        ppVar18 = ppVar18 + 1;
        local_78 = local_78 + -1;
        iVar5 = local_78;
      } while (local_78 != 0);
    }
  }
  uVar16 = sprite_animation_counter;
  uVar11 = param_1->flags_3;
  if ((uVar11 & 0x600000) != 0) {
    if ((((byte)land_flags_1 & 8) == 0) && (((byte)opened_files_flags & 0x10) == 0)) {
      local_5c = 0;
    }
    else {
      local_5c = 1;
    }
    if ((uVar11 & 0x200000) == 0) {
      if ((uVar11 & 0x400000) != 0) {
        iVar5 = 0;
        local_6c = (uint)*local_58;
        local_70 = 0;
        ppVar12 = temp_pnts_related_array;
        sVar4 = calc_point_height(CONCAT22(local_4c._2_2_,(short)local_4c),
                                  CONCAT22((undefined2)local_48,local_4c._2_2_));
        if (0 < (int)local_6c) {
          do {
            if (1 < iVar5) break;
            if ((((uVar16 & 1) == 0) && (iVar15 = ppVar12->y - (int)sVar4, -300 < iVar15)) &&
               (iVar15 < 1)) {
              local_74 = sVar4 + -0x20;
              local_78 = CONCAT22(local_4c._2_2_ + ((short)ppVar12->z - local_54._0_2_) * 2,
                                  (short)local_4c + ((short)ppVar12->x - (short)local_50) * 2);
              cVar2 = FUN_00515d80(&local_78,0x33);
              if (((cVar2 == '\0') && (cVar2 = FUN_004edae0(7,0x33), cVar2 != '\0')) &&
                 (iVar15 = alloc_unit_2(7,0x33,0,&local_78), iVar15 != 0)) {
                *(uint *)(iVar15 + 0x14) = *(uint *)(iVar15 + 0x14) | 0x400;
                *(undefined1 *)(iVar15 + 0x3b) = 0xe8;
                iVar5 = iVar5 + 1;
              }
            }
            uVar16 = uVar16 + 1;
            ppVar12 = ppVar12 + 1;
            local_70 = local_70 + 1;
          } while (local_70 < (int)local_6c);
        }
      }
    }
    else {
      iVar5 = 0;
      local_70 = 0;
      local_6c = (uint)*local_58;
      ppVar12 = temp_pnts_related_array;
      uVar11 = sprite_animation_counter;
      if (0 < (int)local_6c) {
        do {
          if (1 < iVar5) break;
          if ((((uVar11 & 1) == 0) && (-0xb4 < ppVar12->y)) && (ppVar12->y < 0x10)) {
            local_74 = 0;
            local_78 = CONCAT22(local_4c._2_2_ + ((short)ppVar12->z - local_54._0_2_) * 2,
                                (short)local_4c + ((short)ppVar12->x - (short)local_50) * 2);
            cVar2 = FUN_0044f980(&local_78);
            if ((cVar2 == '\0') && (cVar2 = FUN_00515d80(&local_78,0x41), cVar2 == '\0')) {
              iVar15 = 0;
              if (local_5c == 0) {
                iVar15 = 2;
              }
              else {
                cVar2 = FUN_004edae0(7,0x41);
                if (cVar2 != '\0') {
                  iVar15 = 1;
                }
              }
              if (iVar15 != 0) {
                if (iVar15 == 1) {
                  iVar15 = alloc_unit_2();
                }
                else {
                  iVar15 = alloc_unit(7,0x41,0,&local_78);
                }
                if (iVar15 != 0) {
                  *(uint *)(iVar15 + 0x14) = *(uint *)(iVar15 + 0x14) | 0x400;
                  *(undefined1 *)(iVar15 + 0x3b) = 0xe0;
                  iVar5 = iVar5 + 1;
                }
              }
            }
          }
          uVar11 = uVar11 + 1;
          ppVar12 = ppVar12 + 1;
          local_70 = local_70 + 1;
        } while (local_70 < (int)local_6c);
      }
    }
  }
  iVar5 = (int)(short)local_64->facs_num;
  pfVar13 = local_64->facs0_ptr;
  if (0 < iVar5) {
    do {
      local_4c = temp_pnts_related_array + pfVar13->point_1;
      local_48 = temp_pnts_related_array + pfVar13->point_2;
      local_44 = temp_pnts_related_array + pfVar13->point_3;
      if ((pfVar13->f5 & 1) == 0) {
        sVar4 = (&pfVar13->f6)
                [(short)((int)((int)(short)(ushort)local_68 +
                              ((int)(short)(ushort)local_68 >> 0x1f & 0x1ffU)) >> 9)];
      }
      else {
        sVar4 = calc_normal_maybe(local_4c,local_48,local_44);
      }
      pfVar13->maybe_normal = sVar4;
      pfVar13 = pfVar13 + 1;
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
  }
  if (param_1->field40_0x65 != '\0') {
    FUN_004762b0(param_1,temp_pnts_related_array,local_64);
  }
  ppVar12 = temp_pnts_related_array;
  iVar5 = (int)*local_58;
  if (0 < iVar5) {
    do {
      coord_pnts_global_convert(ppVar12);
      ppVar12 = ppVar12 + 1;
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
  }
  if ((DAT_0074a2f0 == '\0') || (param_1->unit_index != unit_index_2)) goto LAB_004724a8;
  if ((DAT_0074a33c == '\0') &&
     ((cVar2 = param_1->tribe_index, player_tribe_num != cVar2 && (cVar2 != -1)))) {
    if ((player_tribe_num == cVar2) || (param_1->unit_class != '\x02')) goto LAB_004724a8;
    iVar5 = FUN_0040bac0(param_1);
    if (iVar5 == 0) goto LAB_004724a8;
  }
  local_38 = 1;
LAB_004724a8:
  local_60 = local_64->facs0_ptr;
  iVar5 = (int)(short)local_64->facs_num;
  ppVar12 = local_4c;
  ppVar6 = local_48;
  if (0 < (short)local_64->facs_num) {
    do {
      local_50 = iVar5;
      ppVar12 = temp_pnts_related_array + local_60->point_1;
      local_4c._0_2_ = (short)ppVar12;
      local_4c._2_2_ = (short)((uint)ppVar12 >> 0x10);
      ppVar6 = temp_pnts_related_array + local_60->point_2;
      local_48._0_2_ = SUB42(ppVar6,0);
      local_48._2_2_ = (undefined2)((uint)ppVar6 >> 0x10);
      local_44 = temp_pnts_related_array + local_60->point_3;
      ppStack_40 = temp_pnts_related_array + local_60->point_4;
      local_6c = (uint)(byte)(&sunlight_related_array_1)[local_60->maybe_normal];
      if (local_38 != 0) {
        local_6c = (-(uint)(DAT_00897987 == '\0') & 0xffc8c8c9) - 1;
      }
      if ((local_10 & (byte)local_60->flags) != 0) {
        local_5c = local_c & (byte)local_60->flags;
        puVar1 = empty_polygon;
        for (local_70 = 2 - (uint)(local_60->num_points == '\x03'); empty_polygon = puVar1,
            local_70 != 0; local_70 = local_70 + -1) {
          if (local_70 == 1) {
            local_58 = (short *)0x0;
            iStack_3c = 1;
            local_68 = (short *)0x2;
          }
          else if (local_70 == 2) {
            local_58 = (short *)0x0;
            iStack_3c = 2;
            local_68 = (short *)0x3;
          }
          uVar11 = 0;
          uVar16 = 0;
          uVar17 = 0;
          iVar5 = (&local_4c)[(int)local_58];
          if (*(uint *)(iVar5 + 0xc) < 0x80000001) {
            if ((float)(int)screen_width_2 <= *(float *)(iVar5 + 0xc)) {
              uVar16 = 4;
            }
          }
          else {
            uVar16 = 2;
          }
          local_78 = (int)screen_height_2;
          local_54 = (float)local_78;
          if (local_54 <= *(float *)(iVar5 + 0x10)) {
            uVar16 = uVar16 | 0x10;
          }
          if (uVar16 == 0) {
LAB_004726a7:
            if (puVar1 < polypool_mem_end_2) {
              empty_polygon = puVar1 + 1;
              local_78 = (&local_4c)[(int)local_68];
              iVar15 = (&local_4c)[iStack_3c];
              iVar19 = *(int *)(iVar5 + 8);
              iVar8 = (*(int *)(iVar15 + 8) + *(int *)(local_78 + 8) + iVar19 + 0x15000) * 0x55;
              iVar7 = iVar8 >> 8;
              if (iVar7 < 0x40) {
LAB_00472744:
                iVar8 = 0;
              }
              else {
                iVar8 = (int)(iVar7 + (iVar8 >> 0x1f & 0xfU)) >> 4;
                if ((int)local_60->f8 + (int)local_64->f1 == 0) {
                  if (0xe00 < iVar8) {
                    iVar8 = 0xe00;
                  }
                }
                else {
                  iVar8 = iVar8 - ((int)local_60->f8 + (int)local_64->f1);
                  if (iVar8 < 0xe01) {
                    if (iVar8 < 0) goto LAB_00472744;
                  }
                  else {
                    iVar8 = 0xe00;
                  }
                }
              }
              uVar11 = local_6c;
              if (((-0xd00 < iVar19) && ((local_6c & 0xff000000) == 0)) &&
                 (iVar19 = (-0xd00 - iVar19) * 0x20,
                 uVar11 = local_6c + ((int)(iVar19 + (iVar19 >> 0x1f & 0x1fffU)) >> 0xd),
                 (int)uVar11 < 1)) {
                uVar11 = 1;
              }
              (puVar1->field0).next = polygons_to_draw[iVar8];
              polygons_to_draw[iVar8] = (polygon_drawn *)puVar1;
              (puVar1->field0).type = 6;
              (puVar1->field0).unknown_1 = 0;
              if (local_5c == 0) {
                (puVar1->field0).tex_size_type = local_60->f11;
                uVar3 = local_60->maybe_tex_index;
                if (((&DAT_005aa218)[(short)uVar3] & 1) != 0) {
                  uVar3 = (ushort)(byte)((char)uVar3 + (char)local_8);
                }
                (puVar1->field0).tex_index = (char)uVar3 + '\x01';
                pfVar13 = (facs0_struct *)&local_60->point_1_u;
              }
              else {
                (puVar1->field0).tex_size_type = 7;
                (puVar1->field0).tex_index = 0xfb;
                pfVar13 = &facs0_struct_0087cb03;
              }
              (puVar1->field0).point_1_color = uVar11;
              (puVar1->field0).point_2_color = uVar11;
              (puVar1->field0).point_3_color = uVar11;
              if ((*(float *)(local_78 + 0x10) - *(float *)(iVar15 + 0x10)) *
                  (*(float *)(iVar15 + 0xc) - *(float *)(iVar5 + 0xc)) -
                  (*(float *)(local_78 + 0xc) - *(float *)(iVar15 + 0xc)) *
                  (*(float *)(iVar15 + 0x10) - *(float *)(iVar5 + 0x10)) <= _DAT_0058f468) {
                (puVar1->field0).point_1_x = *(undefined4 *)(local_78 + 0xc);
                (puVar1->field0).point_1_y = *(undefined4 *)(local_78 + 0x10);
                (puVar1->field0).point_2_x = *(undefined4 *)(iVar15 + 0xc);
                (puVar1->field0).point_2_y = *(undefined4 *)(iVar15 + 0x10);
                (puVar1->field0).point_3_x = *(undefined4 *)(iVar5 + 0xc);
                (puVar1->field0).point_3_y = *(undefined4 *)(iVar5 + 0x10);
                (puVar1->field0).point_1_u =
                     *(undefined4 *)(&pfVar13->maybe_normal + (int)local_68 * 4);
                (puVar1->field0).point_1_v =
                     *(undefined4 *)(&pfVar13->maybe_normal + (int)local_68 * 4 + 2);
                (puVar1->field0).point_2_u = *(undefined4 *)(&pfVar13->maybe_normal + iStack_3c * 4)
                ;
                (puVar1->field0).point_2_v =
                     *(undefined4 *)(&pfVar13->maybe_normal + iStack_3c * 4 + 2);
                psVar14 = local_58;
              }
              else {
                (puVar1->field0).point_1_x = *(undefined4 *)(iVar5 + 0xc);
                (puVar1->field0).point_1_y = *(undefined4 *)(iVar5 + 0x10);
                (puVar1->field0).point_2_x = *(undefined4 *)(iVar15 + 0xc);
                (puVar1->field0).point_2_y = *(undefined4 *)(iVar15 + 0x10);
                (puVar1->field0).point_3_x = *(undefined4 *)(local_78 + 0xc);
                (puVar1->field0).point_3_y = *(undefined4 *)(local_78 + 0x10);
                (puVar1->field0).point_1_u =
                     *(undefined4 *)(&pfVar13->maybe_normal + (int)local_58 * 4);
                (puVar1->field0).point_1_v =
                     *(undefined4 *)(&pfVar13->maybe_normal + (int)local_58 * 4 + 2);
                (puVar1->field0).point_2_u = *(undefined4 *)(&pfVar13->maybe_normal + iStack_3c * 4)
                ;
                (puVar1->field0).point_2_v =
                     *(undefined4 *)(&pfVar13->maybe_normal + iStack_3c * 4 + 2);
                psVar14 = local_68;
              }
              (puVar1->field0).point_3_u =
                   *(undefined4 *)(&pfVar13->maybe_normal + (int)psVar14 * 4);
              (puVar1->field0).point_3_v =
                   *(undefined4 *)(&pfVar13->maybe_normal + (int)psVar14 * 4 + 2);
              (puVar1->field0).tex_index_2 = (undefined2)local_4;
            }
          }
          else {
            iVar15 = (&local_4c)[iStack_3c];
            if (*(uint *)(iVar15 + 0xc) < 0x80000001) {
              local_78 = (int)screen_width_2;
              if ((float)local_78 <= *(float *)(iVar15 + 0xc)) {
                uVar17 = 4;
              }
            }
            else {
              uVar17 = 2;
            }
            if (local_54 <= *(float *)(iVar15 + 0x10)) {
              uVar17 = uVar17 | 0x10;
            }
            if ((uVar16 & uVar17) == 0) goto LAB_004726a7;
            iVar15 = (&local_4c)[(int)local_68];
            if (*(uint *)(iVar15 + 0xc) < 0x80000001) {
              local_78 = (int)screen_width_2;
              if ((float)local_78 <= *(float *)(iVar15 + 0xc)) {
                uVar11 = 4;
              }
            }
            else {
              uVar11 = 2;
            }
            if (local_54 <= *(float *)(iVar15 + 0x10)) {
              uVar11 = uVar11 | 0x10;
            }
            if ((uVar11 & uVar16 & uVar17) == 0) goto LAB_004726a7;
          }
          puVar1 = empty_polygon;
        }
      }
      local_60 = local_60 + 1;
      local_50 = local_50 + -1;
      iVar5 = local_50;
    } while (local_50 != 0);
  }
  local_4c = ppVar12;
  local_48 = ppVar6;
  if (local_38 != 0) {
    FUN_004756a0(param_1,local_64);
  }
  if (((param_1->object).flags & 0x80) != 0) {
    FUN_00475550(param_1,local_64);
  }
  return;
}
