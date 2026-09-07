/* Ghidra 12.1.3 pseudocode; entry 0051a2a0; FUN_0051a2a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0051bdc1) */
/* WARNING: Removing unreachable block (ram,0x0051b601) */
/* WARNING: Removing unreachable block (ram,0x0051b60b) */
/* WARNING: Removing unreachable block (ram,0x0051b8e2) */
/* WARNING: Removing unreachable block (ram,0x0051b8d8) */
/* WARNING: Removing unreachable block (ram,0x0051ab41) */
/* WARNING: Removing unreachable block (ram,0x0051ab4b) */
/* WARNING: Removing unreachable block (ram,0x0051bdcb) */

undefined1 FUN_0051a2a0(unit_struct *param_1,char *param_2)

{
  ushort *puVar1;
  uint *puVar2;
  short sVar3;
  short sVar4;
  short sVar5;
  byte bVar6;
  undefined1 uVar7;
  short sVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  unit_struct *puVar11;
  uint uVar12;
  undefined4 uVar13;
  char cVar14;
  bool bVar15;
  undefined1 uVar16;
  short sVar17;
  ushort uVar18;
  uint uVar19;
  int *piVar20;
  unit_struct *puVar21;
  int iVar22;
  unit_struct *puVar23;
  uint uVar24;
  bool bVar25;
  char local_7a;
  undefined1 local_78;
  undefined4 local_77;
  char local_73;
  char local_72;
  char local_71;
  char local_70;
  char local_6f;
  char local_6e;
  char local_6d;
  char local_6c;
  char local_6b;
  undefined1 local_6a;
  undefined4 local_69;
  undefined1 local_65;
  undefined2 local_64;
  undefined2 local_62;
  undefined2 local_60;
  undefined2 local_5e;
  undefined2 local_5c;
  undefined2 local_5a;
  undefined2 local_58;
  undefined2 local_56;
  ushort local_54;
  ushort local_52;
  ushort local_50;
  ushort local_4e;
  short local_4c;
  short local_4a;
  uint local_48;
  uint local_44;
  uint local_40;
  uint local_3c;
  uint local_38;
  uint local_34;
  undefined4 local_30;
  short local_2c;
  short sStack_2a;
  undefined2 local_28;
  undefined4 local_24;
  int local_20;
  ushort local_1c;
  undefined4 local_18;
  int local_14;
  undefined2 local_10;
  undefined4 local_c;
  int local_8;
  ushort local_4;

  bVar6 = (byte)local_77;
  bVar15 = false;
  local_78 = 0;
  local_73 = '\0';
  local_6e = '\0';
  local_7a = '\0';
  local_70 = '\0';
  local_6c = '\0';
  local_71 = '\0';
  bVar25 = false;
  local_6b = '\x01';
  local_6f = '\0';
  uVar24 = local_69 >> 0x10;
  local_72 = '\0';
  local_77._0_2_ = (ushort)(byte)local_77;
  local_69 = local_69 & 0xffff0000;
  if ((param_1->tribe_index == player_tribe_num) && (DAT_0089d167 == '\0')) {
    DAT_0089d167 = '\x01';
  }
  if ((param_1->unit_type == '\x06') && (bVar15 = true, *param_2 != '\x13')) {
    local_6f = '\x01';
  }
  if (*param_2 == '\x1c') {
    local_69 = CONCAT22((short)uVar24,0x100);
  }
  uVar18 = (ushort)local_77;
  if (*param_2 == '\x15') {
    local_77._0_2_ = CONCAT11(1,bVar6);
    uVar18 = (ushort)local_77;
  }
  local_77 = (uint)uVar18;
  uVar24 = local_77;
  if (((bVar15) && (local_77._1_1_ = (char)(uVar18 >> 8), local_77._1_1_ != '\0')) &&
     (param_1->unit_land_array_index != 0)) {
    local_69 = CONCAT31(local_69._1_3_,1);
  }
  uVar19 = param_1->flags_2;
  param_1->flags_2 = uVar19 | 0x2000000;
  uVar12 = uVar19 & 0x40000000;
  if (uVar12 != 0) {
    param_1->flags_4 = param_1->flags_4 & 0xfffefff8;
    param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xfdff;
  }
  local_77 = uVar24;
  if (param_1->state_2 == '\0') {
    if (uVar12 != 0) {
      param_1->flags_2 = uVar19 & 0xbfffffff | 0x2000000;
      bVar25 = true;
      cVar14 = FUN_0051c110(param_1,param_2,&local_4c);
      if (cVar14 == '\x02') {
        param_1->flags_4 = param_1->flags_4 | 0x80000;
      }
      else {
        param_1->flags_4 = param_1->flags_4 & 0xfff7ffff;
      }
      if (bVar15) {
        if (local_77._1_1_ == '\0') {
          FUN_004e9d80(param_1,&local_4c);
          cVar14 = FUN_00438af0(param_1,param_2);
          if (cVar14 == '\0') {
            uVar24 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                     [(byte)param_1->some_index].field_0x4 >> 2;
            if (uVar24 == 0) {
              uVar24 = 1;
            }
            uVar19 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            local_34 = uVar19 >> 0xd | uVar19 * 0x80000;
            bVar6 = *(byte *)((int)&param_1->flags_3 + 2);
            sVar17 = (short)((int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                             [(byte)param_1->some_index].field_0x4 +
                            local_34 % uVar24);
            game_state.pseudo_random_val = local_34;
            param_1->field36_0x5f = sVar17;
            if ((bVar6 & 8) != 0) {
              param_1->field36_0x5f = sVar17 * 2;
            }
          }
          if (param_1->unit_land_array_index == 0) {
            if (param_1->field36_0x5f == 0) {
              uVar24 = (*(short *)&param_1->field_0x78 == 0) - 1 & 4;
            }
            else {
              uVar24 = (-(uint)(*(short *)&param_1->field_0x78 == 0) & 0xfffffffc) + 5;
            }
            FUN_004d3ff0(param_1,uVar24);
          }
        }
      }
      else {
        FUN_004e9d80(param_1,&local_4c);
        cVar14 = FUN_00438af0(param_1,param_2);
        if (cVar14 == '\0') {
          FUN_004d4f40(param_1);
        }
      }
    }
    *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 8;
    if ((param_1->class_counter & 3) == 0) {
      bVar25 = true;
    }
    if (bVar25) {
      bVar15 = true;
      if (local_69._1_1_ != '\0') {
        cVar14 = FUN_0051bf10(param_1,param_2);
        if (cVar14 == '\x01') {
          bVar15 = false;
          local_78 = 1;
        }
        else if (cVar14 == '\x02') {
          bVar15 = false;
          param_1->state_2 = 0xc;
          param_1->flags_2 = param_1->flags_2 | 0x40000000;
        }
      }
      if (param_1->unit_type != '\x06') {
        uVar24 = calc_distance_toroidal(&param_1->pos_x1,&param_1->pos);
        iVar22 = 0;
        bVar25 = DAT_00afc288 == 0;
        if (0 < DAT_00afc288) {
          piVar20 = &DAT_00afc293;
          do {
            if (*piVar20 == *(int *)(param_2 + 6)) {
              if (*(char *)&param_1->mid3 == '\0') {
                (&DAT_00afc290)[iVar22 * 0xb] = (&DAT_00afc290)[iVar22 * 0xb] + '\x01';
              }
              puVar2 = (uint *)((int)&DAT_00afc297 + iVar22 * 0xb);
              if (uVar24 < *puVar2) {
                *puVar2 = uVar24;
              }
              *(undefined1 *)&param_1->mid3 = 0x10;
              break;
            }
            piVar20 = (int *)((int)piVar20 + 0xb);
            iVar22 = iVar22 + 1;
          } while (iVar22 < DAT_00afc288);
          bVar25 = DAT_00afc288 == iVar22;
        }
        if (((bVar25) && (0xa00 < (int)uVar24)) && (DAT_00afc288 < 8)) {
          iVar22 = iVar22 * 0xb;
          (&DAT_00afc290)[iVar22] = 1;
          *(undefined4 *)((int)&DAT_00afc293 + iVar22) = *(undefined4 *)(param_2 + 6);
          *(undefined2 *)((int)&DAT_00afc291 + iVar22) = param_1->unit_index;
          DAT_00afc288 = DAT_00afc288 + 1;
          *(uint *)((int)&DAT_00afc297 + iVar22) = uVar24;
          *(undefined1 *)&param_1->mid3 = 0x10;
        }
      }
      if ((bVar15) && (cVar14 = FUN_00438af0(param_1,param_2), cVar14 != '\0')) {
        sVar17 = FUN_0051c3c0(param_1,param_2,&local_77,local_69);
        if (sVar17 == 0) {
          if (local_77._1_1_ == '\0') {
            local_78 = 1;
          }
          else {
            uVar16 = FUN_0051ff60(param_1);
            local_c = 0x15;
            local_4 = CONCAT11(uVar16,uVar16) & 0xfefe;
            uVar18 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),
                              (char)((ushort)(param_1->pos).x >> 8));
            local_4e = uVar18 & 0xfefe;
            local_8 = ((uVar18 & 0xfffe) & 0xfeff) << 0x10;
            sVar17 = FUN_0051c3c0(param_1,&local_c,&local_65,0);
            local_7a = '\0';
            if (sVar17 != 0) {
              cVar14 = '\0';
              switch(local_65) {
              case 1:
                cVar14 = '\x01';
                break;
              case 2:
                cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 2;
                break;
              case 3:
                cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 3;
                break;
              case 4:
                cVar14 = '\x04';
              }
              *(short *)((int)&param_1->loc_3_y + 1) = sVar17;
              param_1->state_2 = cVar14;
              param_1->flags_2 = param_1->flags_2 | 0x40000000;
              cVar14 = FUN_00520300(param_1,&local_c,(int)sVar17);
              if (cVar14 != '\0') {
                local_7a = '\x01';
              }
            }
            if ((sVar17 == 0) || (local_7a != '\0')) {
              local_78 = 1;
            }
          }
        }
        else {
          cVar14 = '\0';
          switch(local_77 & 0xff) {
          case 1:
            cVar14 = '\x01';
            break;
          case 2:
            cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 2;
            break;
          case 3:
            cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 3;
            break;
          case 4:
            cVar14 = '\x04';
          }
          param_1->flags_2 = param_1->flags_2 | 0x40000000;
          *(short *)((int)&param_1->loc_3_y + 1) = sVar17;
          param_1->state_2 = cVar14;
          local_7a = FUN_00520300(param_1,param_2,sVar17);
        }
      }
    }
  }
  else if (param_1->state_2 == '\a') {
    if (uVar12 != 0) {
      param_1->coord_scale_3 = 0x10;
      param_1->coord_scale_1 = 0;
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      uVar18 = (param_1->object).flags;
      param_1->field_0xa8 = 4;
      param_1->flags_2 = uVar19 & 0xbfffffff | 0x2000000;
      FUN_004391a0(param_1);
      puVar1 = &(param_1->object).flags;
      *puVar1 = *puVar1 | uVar18 & 0x10;
    }
    cVar14 = FUN_004391a0(param_1);
    if (cVar14 != '\0') {
      param_1->state_2 = 0;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
    }
  }
  cVar14 = param_1->state_2;
  if (cVar14 == '\0') {
    return local_78;
  }
  if (cVar14 == '\a') {
    return local_78;
  }
  if (cVar14 == '\f') {
    uVar24 = param_1->flags_2;
    if ((uVar24 & 0x40000000) != 0) {
      param_1->coord_scale_3 = 8;
      param_1->coord_scale_1 = 0;
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      uVar18 = (param_1->object).flags;
      param_1->field_0xa8 = 4;
      param_1->flags_2 = uVar24 & 0xbfffffff;
      FUN_00439240(param_1);
      puVar1 = &(param_1->object).flags;
      *puVar1 = *puVar1 | uVar18 & 0x10;
    }
    puVar23 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 6) != 0) &&
        (puVar21 = unit_land_array[*(ushort *)(param_2 + 6)], (*(byte *)&puVar21->flags_2 & 1) == 0)
        ) && (puVar21->unit_class != '\0')) {
      puVar23 = puVar21;
    }
    if (((puVar23 != (unit_struct *)0x0) && (0 < *(short *)&puVar23->field_0x6e)) &&
       ((*(byte *)((int)&puVar23->flags_4 + 1) & 4) != 0)) {
      if ((param_1->class_counter & 3) == 0) {
        uVar24 = (uint)(ushort)((puVar23->pos).x - (param_1->pos).x);
        uVar19 = (uint)(ushort)((puVar23->pos).y - (param_1->pos).y);
        if (0x7fff < uVar24) {
          uVar24 = uVar24 - 0x10000;
        }
        if (0x7fff < uVar19) {
          uVar19 = uVar19 - 0x10000;
        }
        uVar18 = calc_angle_quadrant(uVar24,-uVar19);
        uVar18 = uVar18 & 0x7ff;
        if ((param_1->flags_2 & 0x80) != 0) {
          param_1->pos_x1 = uVar18;
        }
        *(ushort *)&param_1->field_0x5d = uVar18;
        if ((param_1->flags_2 & 0x8000) != 0) {
          uVar18 = uVar18 + 0x400 & 0x7ff;
        }
        param_1->maybe_shape_angle = uVar18;
      }
      cVar14 = FUN_00439240(param_1);
      if (cVar14 == '\0') {
        return local_78;
      }
    }
    param_1->state_2 = 0;
    goto LAB_0051be2d;
  }
  if ((local_77._1_1_ != '\0') && ((param_1->class_counter & 3) == 0)) {
    local_18 = 0x15;
    local_10 = 0;
    uVar18 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)(param_1->pos).x >> 8));
    local_50 = uVar18 & 0xfefe;
    local_14 = ((uVar18 & 0xfffe) & 0xfeff) << 0x10;
    sVar17 = FUN_0051c3c0(param_1,&local_18,(int)&local_69 + 3,0);
    local_7a = '\0';
    if (sVar17 != 0) {
      cVar14 = '\0';
      switch(local_69 >> 0x18) {
      case 1:
        cVar14 = '\x01';
        break;
      case 2:
        cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 2;
        break;
      case 3:
        cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 3;
        break;
      case 4:
        cVar14 = '\x04';
      }
      *(short *)((int)&param_1->loc_3_y + 1) = sVar17;
      param_1->state_2 = cVar14;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      cVar14 = FUN_00520300(param_1,&local_18,(int)sVar17);
      if (cVar14 != '\0') {
        local_7a = '\x01';
      }
    }
  }
  uVar18 = *(ushort *)((int)&param_1->loc_3_y + 1);
  puVar23 = (unit_struct *)0x0;
  if (((uVar18 != 0) && (puVar21 = unit_land_array[uVar18], (*(byte *)&puVar21->flags_2 & 1) == 0))
     && (puVar21->unit_class != '\0')) {
    puVar23 = puVar21;
  }
  if (puVar23 == (unit_struct *)0x0) {
LAB_0051bb95:
    local_7a = '\x01';
  }
  else {
    cVar14 = param_1->state_2;
    switch(cVar14) {
    case '\x01':
      if ((param_1->flags_2 & 0x40000000) != 0) {
        param_1->coord_scale_2 = uVar18;
        param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
        iVar22 = puVar23->coord_scale_4;
        param_1->field_0xa8 = 0x22;
        *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
        param_1->field_0xaa = (char)iVar22;
      }
      switch(param_1->field_0xa8) {
      case 0x22:
        if ((param_1->obj_index_anim_prev_2 & 0x10) != 0) {
          param_1->coord_scale_3 = 0x40;
          param_1->coord_scale_1 = 0;
          param_1->field_0xaa = (char)puVar23->coord_scale_4;
        }
        local_6b = '\0';
        cVar14 = FUN_00439850(param_1,0xe0);
        if (cVar14 == '\0') {
          uVar24 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
          uVar19 = (int)uVar24 >> 0x1f;
          if ((((int)((uVar24 ^ uVar19) - uVar19) < 0x1f8) &&
              (uVar24 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
              uVar19 = (int)uVar24 >> 0x1f, (int)((uVar24 ^ uVar19) - uVar19) < 0x1f8)) &&
             (cVar14 = FUN_0051dcc0(puVar23,param_1), cVar14 == '\0')) {
            param_1->field_0xa8 = 0x26;
            *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
          }
          if (((char)puVar23->coord_scale_4 != param_1->field_0xaa) &&
             (cVar14 = FUN_0051dcc0(puVar23,param_1), cVar14 == '\0')) {
            local_7a = '\x01';
          }
        }
        else if (cVar14 == '\x01') {
          cVar14 = FUN_0051dcc0(puVar23,param_1);
          if (cVar14 == '\0') goto LAB_0051ad10;
          local_73 = '\x01';
        }
        else {
          local_7a = '\x01';
        }
        break;
      case 0x26:
        if ((param_1->obj_index_anim_prev_2 & 0x10) != 0) {
          param_1->coord_scale_3 = 0x40;
          param_1->coord_scale_1 = 0;
          FUN_00439850(param_1,0);
        }
        *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
        sVar3._0_1_ = param_1->coord_scale_3;
        sVar3._1_1_ = param_1->coord_scale_1;
        if (sVar3 == 0) {
          local_7a = '\x01';
        }
        else {
          FUN_0051f750(puVar23,param_1,&local_4c);
          FUN_004e9dd0(param_1,&local_4c);
          uVar24 = (int)local_4c - (int)(short)(param_1->pos).x;
          uVar19 = (int)uVar24 >> 0x1f;
          if ((0x6f < (int)((uVar24 ^ uVar19) - uVar19)) ||
             (uVar24 = (int)local_4a - (int)(short)(param_1->pos).y, uVar19 = (int)uVar24 >> 0x1f,
             bVar15 = true, 0x6f < (int)((uVar24 ^ uVar19) - uVar19))) {
            bVar15 = false;
          }
          if ((bVar15) && ((*(byte *)((int)&param_1->flags_4 + 1) & 4) == 0)) {
            local_28 = 0;
            local_2c = local_4c;
            uVar13 = CONCAT22(sStack_2a,local_4c);
            sStack_2a = local_4a;
            local_28 = calc_point_height(uVar13,local_4a);
            add_unit_to_cell(param_1,&local_2c);
            FUN_004d4ee0(param_1);
            param_1->field_0xa8 = 0x28;
LAB_0051ad17:
            *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
          }
        }
        break;
      case 0x27:
      case 0x28:
        if ((param_1->obj_index_anim_prev_2 & 0x10U) != 0) {
          param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
          uVar24 = (uint)(ushort)((puVar23->pos).x - (param_1->pos).x);
          uVar19 = (uint)(ushort)((puVar23->pos).y - (param_1->pos).y);
          if (0x7fff < uVar24) {
            uVar24 = uVar24 - 0x10000;
          }
          if (0x7fff < uVar19) {
            uVar19 = uVar19 - 0x10000;
          }
          uVar18 = calc_angle_quadrant(uVar24,-uVar19);
          uVar18 = uVar18 & 0x7ff;
          if (param_1->field_0xa8 == '\'') {
            uVar18 = uVar18 + 0x400 & 0x7ff;
          }
          if ((param_1->flags_2 & 0x80) != 0) {
            param_1->pos_x1 = uVar18;
          }
          *(ushort *)&param_1->field_0x5d = uVar18;
          if ((param_1->flags_2 & 0x8000) != 0) {
            uVar18 = uVar18 + 0x400 & 0x7ff;
          }
          param_1->maybe_shape_angle = uVar18;
          param_1->coord_scale_3 = 0x10;
          param_1->coord_scale_1 = 0;
          FUN_004d4ee0(param_1);
        }
        if (param_1->field_0xa8 == '\'') {
          local_6a = 0x28;
          if ((param_1->class_counter & 3) == 0) {
            uVar24 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            game_state.pseudo_random_val = uVar24 >> 0xd | uVar24 * 0x80000;
            sVar17 = *(short *)&param_1->field_0x5d + -0x8e +
                     (short)((ulonglong)game_state.pseudo_random_val % 0x11c);
            local_38 = game_state.pseudo_random_val;
            goto LAB_0051ac84;
          }
        }
        else if ((param_1->field_0xa8 == '(') &&
                (local_6a = 0x27, (param_1->class_counter & 1) == 0)) {
          uVar24 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          game_state.pseudo_random_val = uVar24 >> 0xd | uVar24 * 0x80000;
          sVar17 = *(short *)&param_1->field_0x5d + -0x38 +
                   (short)((ulonglong)game_state.pseudo_random_val % 0x71);
          local_3c = game_state.pseudo_random_val;
LAB_0051ac84:
          update_gs_unit_related_array_item(param_1);
          param_1->pos_x1 = sVar17;
          uVar24 = param_1->flags_2;
          param_1->flags_2 = uVar24 | 0x80;
          param_1->flags_2 = uVar24 | 0x1080;
        }
        FUN_004d4da0(param_1,0x20);
        sVar17 = *(short *)&param_1->coord_scale_3 + -1;
        *(short *)&param_1->coord_scale_3 = sVar17;
        if (sVar17 == 0) {
          *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
          param_1->field_0xa8 = local_6a;
        }
        if ((param_1->class_counter & 7) == 0) {
          FUN_0051f750(puVar23,param_1,&local_4c);
          uVar24 = (int)local_4c - (int)(short)(param_1->pos).x;
          uVar19 = (int)uVar24 >> 0x1f;
          if ((0x6f < (int)((uVar24 ^ uVar19) - uVar19)) ||
             (uVar24 = (int)local_4a - (int)(short)(param_1->pos).y, uVar19 = (int)uVar24 >> 0x1f,
             bVar15 = true, 0x6f < (int)((uVar24 ^ uVar19) - uVar19))) {
            bVar15 = false;
          }
          if (!bVar15) {
LAB_0051ad10:
            param_1->field_0xa8 = 0x26;
            goto LAB_0051ad17;
          }
        }
      }
      if ((local_6b != '\0') && ((char)puVar23->coord_scale_4 != param_1->field_0xaa)) {
        param_1->field_0xa8 = 0x22;
        *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      }
      if (local_7a != '\0') {
        puVar23->flags_4 = puVar23->flags_4 & 0xffefffff;
        if (puVar23->counter != '\0') {
          puVar23->counter = puVar23->counter + -1;
        }
      }
      break;
    case '\x02':
    case '\x06':
    case '\b':
      if (puVar23->tribe_index == param_1->tribe_index) goto LAB_0051bb95;
      if (cVar14 == '\x02') {
        if (*(short *)&puVar23->field_0x6e < 1) goto LAB_0051bb95;
        uVar24 = param_1->flags_2;
        if ((uVar24 & 0x40000000) != 0) {
          param_1->coord_scale_2 = uVar18;
          local_70 = '\x01';
          param_1->coord_scale_3 = 0x40;
          param_1->coord_scale_1 = 0;
          param_1->flags_2 = uVar24 & 0xbfffffff;
        }
        if ((param_1->class_counter & 3) == 0) {
          local_70 = '\x01';
        }
        if (local_70 != '\0') {
          local_56 = CONCAT11((char)((ushort)(puVar23->pos).y >> 8),
                              (char)((ushort)(puVar23->pos).x >> 8));
          local_6c = '\x01' - (((&game_state.level_data[0].flags)
                                [(local_56 & 0xfe) * 2 | local_56 & 0xfe00] & 0x200) == 0);
        }
        if (local_6c == '\0') {
          bVar15 = false;
          cVar14 = FUN_00439850(param_1,0xe0);
          if (cVar14 == '\0') {
            uVar24 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
            uVar19 = (int)uVar24 >> 0x1f;
            if ((((int)((uVar24 ^ uVar19) - uVar19) < 0x118) &&
                (uVar24 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
                uVar19 = (int)uVar24 >> 0x1f, (int)((uVar24 ^ uVar19) - uVar19) < 0x118)) &&
               (*(short *)&puVar23->field_0x9d != 0)) {
LAB_0051ae93:
              bVar15 = true;
            }
          }
          else if (cVar14 == '\x01') {
            if (*(short *)&puVar23->field_0x9d == 0) {
              local_77._0_3_ = CONCAT12(1,(ushort)local_77);
            }
            else {
              if (unit_land_array[*(short *)&puVar23->field_0x9d]->unit_type == '\t')
              goto LAB_0051ae93;
              local_7a = '\x01';
            }
          }
          else {
            local_7a = '\x01';
          }
          if (bVar15) {
            param_1->state_2 = 8;
            param_1->flags_2 = param_1->flags_2 | 0x40000000;
          }
        }
        else {
          local_58 = CONCAT11((char)((ushort)(puVar23->pos).y >> 8),
                              (char)((ushort)(puVar23->pos).x >> 8));
          uVar18 = (&game_state.level_data[0].unit_index_2)
                   [((local_58 & 0xfe) * 2 | local_58 & 0xfe00) * 2];
          param_1->state_2 = 6;
          param_1->flags_2 = param_1->flags_2 | 0x40000000;
          param_1->coord_scale_2 = uVar18 & 0x3ff;
        }
      }
      else if (cVar14 == '\x06') {
        if ((*(short *)&puVar23->field_0x6e < 1) || (*(short *)&puVar23->field_0x9d != 0))
        goto LAB_0051bb95;
        sVar17 = param_1->coord_scale_2;
        bVar15 = false;
        *(short *)((int)&param_1->loc_3_y + 1) = sVar17;
        if ((param_1->flags_2 & 0x40000000) != 0) {
          uVar9 = (param_1->pos).x;
          param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
          local_5a = CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)uVar9 >> 8));
          if ((((ushort)(&game_state.level_data[0].unit_index_2)
                        [((local_5a & 0xfe) * 2 | local_5a & 0xfe00) * 2] & 0x3ff) == (int)sVar17)
             && (local_5c = CONCAT11((char)((ushort)(puVar23->pos).y >> 8),
                                     (char)((ushort)(puVar23->pos).x >> 8)),
                ((ushort)(&game_state.level_data[0].unit_index_2)
                         [((local_5c & 0xfe) * 2 | local_5c & 0xfe00) * 2] & 0x3ff) == (int)sVar17))
          {
            bVar15 = true;
          }
          else {
            *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
            param_1->coord_scale_3 = 0x40;
            param_1->coord_scale_1 = 0;
            param_1->field_0xa8 = 0x1e;
          }
        }
        if (bVar15) {
LAB_0051b054:
          local_77._0_3_ = CONCAT12(1,(ushort)local_77);
          local_6e = '\x01';
        }
        else {
          sVar17 = *(short *)&param_1->coord_scale_3 + -1;
          *(short *)&param_1->coord_scale_3 = sVar17;
          bVar15 = false;
          if (sVar17 < 0) {
            local_7a = '\x01';
          }
          else {
            cVar14 = FUN_00438f20(param_1,0x38);
            if (cVar14 != '\0') {
              local_5e = CONCAT11((char)((ushort)(puVar23->pos).y >> 8),
                                  (char)((ushort)(puVar23->pos).x >> 8));
              if (((ushort)(&game_state.level_data[0].unit_index_2)
                           [((local_5e & 0xfe) * 2 | local_5e & 0xfe00) * 2] & 0x3ff) ==
                  (int)param_1->coord_scale_2) {
                bVar15 = true;
              }
              else {
                param_1->state_2 = 2;
                param_1->flags_2 = param_1->flags_2 | 0x40000000;
              }
            }
          }
          if (bVar15) goto LAB_0051b054;
        }
        *(undefined2 *)((int)&param_1->loc_3_y + 1) = puVar23->unit_index;
      }
      else if (cVar14 == '\b') {
        if (*(short *)&puVar23->field_0x6e < 1) goto LAB_0051bb95;
        uVar24 = param_1->flags_2;
        if ((uVar24 & 0x40000000) != 0) {
          param_1->coord_scale_3 = 8;
          param_1->coord_scale_1 = 0;
          param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
          param_1->field36_0x5f = 0;
          param_1->flags_2 = uVar24 & 0xbfffffff;
        }
        FUN_004d4da0(param_1,8);
        if ((*(short *)&puVar23->field_0x9d == 0) ||
           (unit_land_array[*(short *)&puVar23->field_0x9d]->unit_type != '\t')) {
          local_72 = '\x01';
        }
        cVar14 = FUN_004391a0(param_1);
        if (cVar14 != '\0') {
          local_72 = '\x01';
        }
      }
      break;
    case '\x03':
      if ((puVar23->unit_class != '\x02') || (puVar23->tribe_index == param_1->tribe_index))
      goto LAB_0051bb95;
      if ((param_1->flags_2 & 0x40000000) != 0) {
        param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
        cVar14 = puVar23->unit_type;
        *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
        param_1->field_0xa8 = (-(cVar14 == '\x13') & 0x16U) + 0x1e;
      }
      switch(param_1->field_0xa8) {
      case 0x17:
        if ((param_1->obj_index_anim_prev_2 & 0x10) != 0) {
          get_building_coords(puVar23,&local_4c);
          uVar19 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar24 = uVar19 >> 0xd;
          game_state.pseudo_random_val = uVar24 | uVar19 * 0x80000;
          uVar24 = uVar24 & 0x7ff;
          uVar18 = (ushort)uVar24;
          local_40 = game_state.pseudo_random_val;
          if (param_1->unit_type != '\a') {
            move_pos_angle_length
                      (&local_4c,uVar24,
                       *(undefined2 *)
                        &unit_type_array_building[(byte)puVar23->unit_type].pos_related);
          }
          FUN_004e9dd0(param_1,&local_4c);
          if ((param_1->flags_2 & 0x80) != 0) {
            param_1->pos_x1 = uVar18;
          }
          *(ushort *)&param_1->field_0x5d = uVar18;
          if ((param_1->flags_2 & 0x8000) != 0) {
            uVar18 = uVar18 + 0x400 & 0x7ff;
          }
          param_1->maybe_shape_angle = uVar18;
        }
        FUN_0040bae0(puVar23);
        cVar14 = FUN_00439480(param_1);
        if (cVar14 != '\0') {
          param_1->field_0xa8 = 0x2e;
          *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
        }
        break;
      case 0x1e:
        if ((param_1->obj_index_anim_prev_2 & 0x10) != 0) {
          param_1->coord_scale_3 = 0x40;
          param_1->coord_scale_1 = 0;
        }
        *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
        sVar4._0_1_ = param_1->coord_scale_3;
        sVar4._1_1_ = param_1->coord_scale_1;
        if (sVar4 < 0) {
          local_7a = '\x01';
        }
        else {
          cVar14 = FUN_00438f20(param_1,0x38);
          if (cVar14 != '\0') {
            param_1->field_0xa8 = 0x1f;
            *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
          }
        }
        break;
      case 0x1f:
        if ((param_1->obj_index_anim_prev_2 & 0x10) != 0) {
          FUN_004da170(param_1);
          param_1->coord_scale_3 = 0x40;
          param_1->coord_scale_1 = 0;
        }
        param_1->flags_2 = param_1->flags_2 & 0xfdffffff;
        FUN_0040bae0(puVar23);
        sVar17 = *(short *)&param_1->coord_scale_3 + -1;
        *(short *)&param_1->coord_scale_3 = sVar17;
        if (sVar17 < 0) {
          local_7a = '\x01';
        }
        else {
          cVar14 = FUN_00439030(param_1);
          if (cVar14 != '\0') {
            cVar14 = FUN_0051e300(param_1,puVar23);
            if (cVar14 == '\0') {
              local_71 = '\x01';
            }
            else if (puVar23->state == '\x01') {
              local_7a = '\x01';
            }
            else {
              param_1->field_0xa8 = 0x25;
              *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10
              ;
            }
          }
        }
        break;
      case 0x25:
        uVar18 = param_1->obj_index_anim_prev_2;
        if ((uVar18 & 0x10) != 0) {
          param_1->coord_scale_3 = 0x10;
          param_1->coord_scale_1 = 0;
          param_1->obj_index_anim_prev_2 = uVar18 & 0xffef;
          FUN_004d50d0(param_1);
        }
        FUN_00407810(puVar23,6);
        FUN_0040bae0(puVar23);
        if (*(short *)&param_1->coord_scale_3 < 1) {
          cVar14 = FUN_0051e300(param_1,puVar23);
          if (cVar14 == '\0') {
            local_71 = '\x01';
          }
          else if ((puVar23->field_0x9c & 4) != 0) {
            puVar23 = (unit_struct *)remove_person_from_hut(puVar23,0);
            if (puVar23 == (unit_struct *)0x0) {
              local_7a = '\x01';
            }
            else {
              puVar23->flags_2 = puVar23->flags_2 & 0xffffffef;
              local_77._0_3_ = CONCAT12(1,(ushort)local_77);
              local_77 = CONCAT13(1,(undefined3)local_77);
            }
          }
        }
        else {
          *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
        }
        break;
      case 0x2e:
        if ((param_1->obj_index_anim_prev_2 & 0x10U) != 0) {
          param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
          FUN_004d50d0(param_1);
          FUN_0048a050(param_1,1,0x10);
          puVar1 = &(param_1->object).flags;
          *puVar1 = *puVar1 & 0xffef;
          uVar19 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar24 = uVar19 >> 0xd;
          local_44 = uVar24 | uVar19 * 0x80000;
          game_state.pseudo_random_val = local_44;
          *(ushort *)&param_1->coord_scale_3 = ((ushort)uVar24 & 0xf) + 8;
        }
        FUN_00407810(puVar23,6);
        FUN_0040bae0(puVar23);
        if ((*(byte *)((int)&param_1->flags_4 + 1) & 8) == 0) {
          FUN_00409140(puVar23,param_1);
        }
        sVar17 = *(short *)&param_1->coord_scale_3 + -1;
        *(short *)&param_1->coord_scale_3 = sVar17;
        if (sVar17 < 1) {
          param_1->field_0xa8 = 0x17;
          *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
        }
        break;
      case 0x34:
        if ((param_1->obj_index_anim_prev_2 & 0x10) != 0) {
          local_28 = 0;
          local_2c = ((puVar23->pos).x & 0xfe00) + 0x100;
          sStack_2a = ((puVar23->pos).y & 0xfe00) + 0x100;
          uVar19 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar24 = uVar19 >> 0xd;
          game_state.pseudo_random_val = uVar24 | uVar19 * 0x80000;
          uVar24 = uVar24 & 0x7ff;
          local_48 = game_state.pseudo_random_val;
          move_pos_angle_length(&local_2c,uVar24,unit_type_array_building[0x13]._34_2_);
          local_64 = CONCAT11((char)((ushort)sStack_2a >> 8),(char)((ushort)local_2c >> 8));
          uVar18 = (&game_state.level_data[0].unit_index_2)
                   [((local_64 & 0xfe) * 2 | local_64 & 0xfe00) * 2];
          local_4c = local_2c;
          local_4a = sStack_2a;
          while (local_2c = local_4c, sStack_2a = local_4a, (uVar18 & 0x3ff) != 0) {
            move_pos_angle_length(&local_2c,uVar24,0x20);
            local_64 = CONCAT11((char)((ushort)sStack_2a >> 8),(char)((ushort)local_2c >> 8));
            local_4c = local_2c;
            local_4a = sStack_2a;
            uVar18 = (&game_state.level_data[0].unit_index_2)
                     [((local_64 & 0xfe) * 2 | local_64 & 0xfe00) * 2];
          }
          FUN_004e9d80(param_1,&local_4c);
          iVar22._0_2_ = (puVar23->pos).x;
          iVar22._2_2_ = (puVar23->pos).y;
          param_1->coord_scale_4 = iVar22;
          *(ushort *)&param_1->coord_scale_4 = ((undefined2)iVar22 & 0xfe00) + 0x100;
          *(ushort *)((int)&param_1->coord_scale_4 + 2) =
               (*(ushort *)((int)&param_1->coord_scale_4 + 2) & 0xfe00) + 0x100;
          *(byte *)&param_1->loc_2_y = *(byte *)&param_1->loc_2_y & 0xf0;
          *(undefined1 *)&param_1->loc_2_y = 0;
        }
        cVar14 = FUN_00439480(param_1);
        if (cVar14 != '\0') {
          param_1->field_0xa8 = 0x35;
          *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
        }
        break;
      case 0x35:
        if ((param_1->obj_index_anim_prev_2 & 0x10U) != 0) {
          param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
          FUN_004d50d0(param_1);
          uVar24 = (uint)(ushort)((puVar23->pos).x - (param_1->pos).x);
          uVar19 = (uint)(ushort)((puVar23->pos).y - (param_1->pos).y);
          if (0x7fff < uVar24) {
            uVar24 = uVar24 - 0x10000;
          }
          if (0x7fff < uVar19) {
            uVar19 = uVar19 - 0x10000;
          }
          uVar18 = calc_angle_quadrant(uVar24,-uVar19);
          update_gs_unit_related_array_item(param_1);
          param_1->pos_x1 = uVar18 & 0x7ff;
          uVar24 = param_1->flags_2;
          param_1->flags_2 = uVar24 | 0x80;
          param_1->flags_2 = uVar24 | 0x1080;
        }
        FUN_00407810(puVar23,6);
        FUN_0040bae0(puVar23);
        if ((*(byte *)((int)&param_1->flags_4 + 1) & 8) == 0) {
          FUN_00409140(puVar23,param_1);
        }
        if (param_1->unit_type == '\x05') {
          FUN_004de7f0(param_1);
        }
      }
      if (local_71 != '\0') {
        param_1->field_0xa8 = 0x17;
        *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      }
      break;
    case '\x04':
    case '\x05':
      if ((puVar23->unit_class != '\t') ||
         ((sVar8._0_1_ = puVar23->num_points, sVar8._1_1_ = puVar23->tex_size_type, sVar8 != 0 ||
          (puVar23->tribe_index == param_1->tribe_index)))) goto LAB_0051bb95;
      if (cVar14 == '\x04') {
        uVar24 = param_1->flags_2;
        if ((uVar24 & 0x40000000) != 0) {
          *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
          param_1->coord_scale_3 = 0x40;
          param_1->coord_scale_1 = 0;
          param_1->field_0xa8 = 3;
          param_1->flags_2 = uVar24 & 0xbfffffff;
        }
        *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
        sVar5._0_1_ = param_1->coord_scale_3;
        sVar5._1_1_ = param_1->coord_scale_1;
        if (sVar5 < 0) goto LAB_0051bb95;
        cVar14 = FUN_00438db0(param_1);
        if (cVar14 != '\0') {
          param_1->state_2 = 5;
          param_1->flags_2 = param_1->flags_2 | 0x40000000;
        }
      }
      else if (cVar14 == '\x05') {
        if ((param_1->flags_2 & 0x40000000) != 0) {
          param_1->field36_0x5f = 0;
          param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
          if (*(short *)&param_1->field_0x78 == 0) {
            unit_set_object_upper
                      (param_1,(char)unit_type_to_obj_indexes_map[(byte)param_1->unit_type + 0x3f]);
            (param_1->object).f2 = 0;
            (param_1->object).f1 =
                 (short)(char)obj_related_array[(byte)(param_1->object).obj_related_index + 3].f1;
          }
          else {
            unit_set_object_upper
                      (param_1,(char)unit_type_to_obj_indexes_map[(byte)param_1->unit_type + 0x24]);
          }
          *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x80;
          param_1->coord_scale_3 = 0x12;
          param_1->coord_scale_1 = 0;
        }
        uVar16 = *(undefined1 *)((int)&(param_1->pos).x + 1);
        uVar7 = *(undefined1 *)((int)&(param_1->pos).y + 1);
        local_60 = CONCAT11(uVar7,uVar16);
        if (((&game_state.level_data[0].unit_index_2)
             [((local_60 & 0xfe) * 2 | local_60 & 0xfe00) * 2] & 0x3ff) != puVar23->unit_index)
        goto LAB_0051bb95;
        sVar17 = *(short *)&param_1->coord_scale_3 + -1;
        *(short *)&param_1->coord_scale_3 = sVar17;
        if ((sVar17 < 1) && (local_7a = '\x01', (*(byte *)((int)&param_1->flags_4 + 1) & 8) == 0)) {
          uVar18 = CONCAT11(uVar7,uVar16);
          local_52 = uVar18 & 0xfefe;
          local_30 = CONCAT22(local_30._2_2_,uVar18) & 0xfffffefe;
          FUN_004b9190(local_30,0,0,0,3);
        }
      }
      break;
    case '\n':
    case '\v':
      if (cVar14 == '\n') {
        if (*(short *)&puVar23->field_0x6e < 1) goto LAB_0051b85c;
      }
      else if ((cVar14 == '\v') &&
              ((puVar23->unit_class != '\x02' || (puVar23->tribe_index == param_1->tribe_index)))) {
LAB_0051b85c:
        local_7a = '\x01';
      }
      if ((param_1->flags_2 & 0x40000000) != 0) {
        param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
        cVar14 = FUN_0051f990(param_1,puVar23,0);
        if (cVar14 == '\0') {
          local_7a = '\x01';
        }
        else {
          uVar16 = 0x2d;
          if (param_1->field_0xb2 == '\0') {
            if (param_1->unit_land_array_index == 0) {
              param_1->field36_0x5f = 0;
            }
            else {
              FUN_004d4ee0(param_1);
            }
            param_1->flags_2 = param_1->flags_2 | 0x80;
            uVar24 = (uint)(ushort)((puVar23->pos).x - (param_1->pos).x);
            uVar19 = (uint)(ushort)((puVar23->pos).y - (param_1->pos).y);
            if (0x7fff < uVar24) {
              uVar24 = uVar24 - 0x10000;
            }
            if (0x7fff < uVar19) {
              uVar19 = uVar19 - 0x10000;
            }
            uVar18 = calc_angle_quadrant(uVar24,-uVar19);
            uVar18 = uVar18 & 0x7ff;
            if ((param_1->flags_2 & 0x80) != 0) {
              param_1->pos_x1 = uVar18;
            }
            *(ushort *)&param_1->field_0x5d = uVar18;
            if ((param_1->flags_2 & 0x8000) != 0) {
              uVar18 = uVar18 + 0x400 & 0x7ff;
            }
            param_1->maybe_shape_angle = uVar18;
            uVar16 = 0x2c;
          }
          *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
          param_1->field_0xa8 = uVar16;
        }
      }
      if (local_7a == '\0') {
        cVar14 = param_1->field_0xa8;
        if (cVar14 == '(') {
          if ((param_1->obj_index_anim_prev_2 & 0x10U) != 0) {
            param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
            FUN_004d3ff0(param_1,0xf);
            (param_1->object).f1 = 1;
            (param_1->object).f2 = 0;
            (param_1->object).f2 = 0;
            puVar1 = &(param_1->object).flags;
            *(byte *)puVar1 = (byte)*puVar1 | 2;
            (param_1->object).f1 = 1;
            param_1->coord_scale_3 = 6;
            param_1->coord_scale_1 = 0;
          }
          puVar21 = (unit_struct *)0x0;
          if (((param_1->coord_scale_2 != 0) &&
              (puVar11 = unit_land_array[(ushort)param_1->coord_scale_2],
              (*(byte *)&puVar11->flags_2 & 1) == 0)) && (puVar11->unit_class != '\0')) {
            puVar21 = puVar11;
          }
          if (puVar21 == (unit_struct *)0x0) {
            param_1->coord_scale_2 = 0;
          }
          if (*(short *)&param_1->coord_scale_3 != 0) {
            *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
          }
          if ((param_1->coord_scale_2 == 0) ||
             (sVar17._0_1_ = param_1->coord_scale_3, sVar17._1_1_ = param_1->coord_scale_1,
             sVar17 < 1)) {
            FUN_00518390(param_1);
            goto LAB_0051bb95;
          }
        }
        else if (cVar14 == ',') {
          uVar18 = param_1->obj_index_anim_prev_2;
          param_1->obj_index_anim_prev_2 = uVar18 | 0x200;
          if ((uVar18 & 0x10) != 0) {
            param_1->obj_index_anim_prev_2 = uVar18 & 0xffef | 0x200;
            FUN_004d3ff0(param_1,0xf);
            uVar9 = (param_1->pos).x;
            uVar10 = (param_1->pos).y;
            cVar14 = '\0';
            (param_1->object).f2 = 0;
            (param_1->object).f1 = 1;
            local_62 = CONCAT11((char)((ushort)uVar10 >> 8),(char)((ushort)uVar9 >> 8));
            for (puVar21 = unit_land_array
                           [(short)(&game_state.level_data[0].unit_index)
                                   [((local_62 & 0xfe) * 2 | local_62 & 0xfe00) * 2]];
                puVar21 != (unit_struct *)0x0; puVar21 = unit_land_array[puVar21->next_unit_index])
            {
              if ((((param_1 != puVar21) && (puVar21->unit_class == '\x01')) &&
                  (puVar21->unit_type == '\x06')) && (puVar21->tribe_index == param_1->tribe_index))
              {
                puVar21->field_0xb2 = puVar21->field_0xb2 - cVar14;
                cVar14 = cVar14 + '\x01';
              }
            }
            if ((param_1->unit_land_array_index == 0) ||
               (bVar15 = true, (*(byte *)((int)&param_1->flags_4 + 3) & 2) == 0)) {
              bVar15 = false;
            }
            if (bVar15) {
              param_1->field36_0x5f = (short)param_1->field36_0x5f / 2;
            }
            else {
              param_1->field36_0x5f = 0;
            }
            *(ushort *)&param_1->coord_scale_3 =
                 ((char)obj_related_array[(byte)(param_1->object).obj_related_index + 3]._f2 + 1) *
                 (ushort)(byte)vstart_related[(short)(param_1->object).obj_index].frame_counter;
            sVar17 = FUN_0051fbf0(param_1,puVar23,0);
            param_1->coord_scale_2 = sVar17;
          }
          puVar21 = (unit_struct *)0x0;
          if (((param_1->coord_scale_2 != 0) &&
              (puVar11 = unit_land_array[(ushort)param_1->coord_scale_2],
              (*(byte *)&puVar11->flags_2 & 1) == 0)) && (puVar11->unit_class != '\0')) {
            puVar21 = puVar11;
          }
          if (puVar21 == (unit_struct *)0x0) {
            param_1->coord_scale_2 = 0;
          }
          if ((*(short *)&param_1->coord_scale_3 != 0) &&
             (sVar17 = *(short *)&param_1->coord_scale_3 + -1,
             *(short *)&param_1->coord_scale_3 = sVar17, sVar17 == 0)) {
            param_1->field_0xa8 = 0x28;
            *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
          }
        }
        else if (cVar14 == '-') {
          uVar18 = param_1->obj_index_anim_prev_2;
          if ((uVar18 & 0x10) != 0) {
            param_1->coord_scale_3 = 0x20;
            param_1->coord_scale_1 = 0;
            param_1->obj_index_anim_prev_2 = uVar18 & 0xffef;
          }
          sVar17 = *(short *)&param_1->coord_scale_3 + -1;
          *(short *)&param_1->coord_scale_3 = sVar17;
          if ((sVar17 < 1) || (param_1->field_0xb2 == '\0')) goto LAB_0051bb95;
        }
      }
    }
  }
  cVar14 = '\0';
  if (local_72 != '\0') {
    uVar16 = FUN_0051ff60(param_1);
    local_6d = '\0';
    local_24 = 0x15;
    local_1c = CONCAT11(uVar16,uVar16) & 0xfefe;
    uVar18 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)(param_1->pos).x >> 8));
    local_54 = uVar18 & 0xfefe;
    local_20 = ((uVar18 & 0xfffe) & 0xfeff) << 0x10;
    sVar17 = FUN_0051c3c0(param_1,&local_24,(int)&local_69 + 2,0);
    if (sVar17 != 0) {
      switch(local_69 >> 0x10 & 0xff) {
      case 1:
        cVar14 = '\x01';
        break;
      case 2:
        cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 2;
        break;
      case 3:
        cVar14 = (-(param_1->unit_type == '\x06') & 8U) + 3;
        break;
      case 4:
        cVar14 = '\x04';
      }
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      *(short *)((int)&param_1->loc_3_y + 1) = sVar17;
      param_1->state_2 = cVar14;
      cVar14 = FUN_00520300(param_1,&local_24,(int)sVar17);
      if (cVar14 != '\0') {
        local_6d = '\x01';
      }
    }
    local_7a = local_6d;
    if (sVar17 == 0) {
      local_7a = '\x01';
    }
  }
  uVar24 = local_77;
  if (local_7a != '\0') {
    param_1->state_2 = 0;
    param_1->flags_2 = param_1->flags_2 | 0x40000000;
    if (local_6f == '\0') {
      return local_78;
    }
    return 1;
  }
  if (local_73 == '\0') {
    if (local_77._2_1_ == '\0') {
      return local_78;
    }
    uVar19 = local_77 >> 0x18;
    local_77 = local_77 & 0xffffff00;
    uVar12 = local_77;
    local_77._1_3_ = SUB43(uVar24,1);
    if ((char)uVar19 == '\0') {
      if (local_6e != '\0') {
        local_77 = CONCAT31(local_77._1_3_,2);
        uVar12 = local_77;
      }
    }
    else {
      local_77 = CONCAT31(local_77._1_3_,1);
      uVar12 = local_77;
    }
    local_77 = uVar12;
    FUN_0051e150(param_1,puVar23,local_77);
    return local_78;
  }
  cVar14 = FUN_0051ddc0(param_1,puVar23);
  if (cVar14 != '\0') {
    return local_78;
  }
  param_1->state_2 = 7;
LAB_0051be2d:
  param_1->flags_2 = param_1->flags_2 | 0x40000000;
  return local_78;
}
