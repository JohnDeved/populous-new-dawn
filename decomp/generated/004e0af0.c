/* Ghidra 12.1.3 pseudocode; entry 004e0af0; FUN_004e0af0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004e243c) */
/* WARNING: Removing unreachable block (ram,0x004e0fbf) */
/* WARNING: Removing unreachable block (ram,0x004e10b3) */
/* WARNING: Removing unreachable block (ram,0x004e215c) */
/* WARNING: Removing unreachable block (ram,0x004e2152) */
/* WARNING: Removing unreachable block (ram,0x004e20b5) */
/* WARNING: Removing unreachable block (ram,0x004e1b8e) */
/* WARNING: Removing unreachable block (ram,0x004e1b84) */
/* WARNING: Removing unreachable block (ram,0x004e2446) */
/* WARNING: Removing unreachable block (ram,0x004e10bd) */
/* WARNING: Removing unreachable block (ram,0x004e0fc9) */
/* WARNING: Removing unreachable block (ram,0x004e20bf) */

uint FUN_004e0af0(unit_struct *param_1)

{
  short *psVar1;
  ushort *puVar2;
  vector_48b *pvVar3;
  char cVar4;
  short sVar5;
  short sVar6;
  byte bVar7;
  undefined1 uVar8;
  undefined4 uVar9;
  unit_struct *puVar10;
  ulonglong uVar11;
  bool bVar12;
  char cVar13;
  ushort uVar14;
  ushort uVar15;
  ushort uVar16;
  ushort uVar17;
  ushort uVar18;
  ushort uVar19;
  char cVar20;
  short sVar22;
  ushort uVar21;
  undefined1 *puVar23;
  int iVar24;
  undefined2 uVar27;
  uint uVar25;
  uint uVar26;
  char cVar28;
  unit_struct *puVar29;
  unit_struct *puVar30;
  int iVar31;
  int *piVar32;
  short *psVar33;
  uint uVar34;
  bool bVar35;
  undefined2 local_ee;
  undefined2 local_ec;
  undefined2 local_ea;
  undefined2 local_e6;
  undefined2 local_e4;
  ushort local_e2;
  short local_e0;
  short local_de;
  uint local_dc;
  int local_d8;
  int local_d4;
  uint local_d0;
  uint local_cc;
  uint local_c8;
  uint local_c4;
  uint local_c0;
  uint local_b8;
  uint local_b4;
  uint local_b0;
  uint local_ac;
  undefined1 *local_a4;
  int local_9c;
  uint local_98;
  uint local_94;
  uint local_90;
  uint local_8c;
  uint local_88;
  uint local_84;
  uint local_80;
  int local_7c;
  int local_78;
  uint local_74;
  uint local_70;
  int local_6c;
  undefined4 local_64;
  short local_60;
  short local_5c;
  short sStack_5a;
  undefined2 local_58;
  undefined4 local_54;
  int local_50 [3];
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

  local_d0 = (uint)(byte)param_1->state_2;
  switch(local_d0) {
  case 0:
    local_d0 = param_1->flags_2;
    if ((local_d0 & 0x40000000) != 0) {
      *(undefined2 *)((int)&param_1->loc_3_x + 1) = 0;
      iVar24 = (int)*(short *)&param_1->field_0x78;
      param_1->obj_index_anim_prev = 0;
      param_1->coord_scale_2 = 0;
      param_1->flags_2 = local_d0 & 0xbfffffff;
      if (iVar24 != 0) {
        if (0 < iVar24) {
          do {
            iVar31 = alloc_unit(5,0xb,0xff,&param_1->pos);
            if (iVar31 == 0) break;
            iVar24 = iVar24 + -100;
            FUN_0048a050(param_1,0xb,0);
          } while (0 < iVar24);
        }
        if (iVar24 < 0) {
          iVar24 = 0;
        }
        *(short *)&param_1->field_0x78 = (short)iVar24;
      }
      param_1->field36_0x5f = 0;
      uVar21 = (*(short *)&param_1->field_0x78 == 0) - 1 & 4;
      if (((param_1->flags_2 & 0x80000) != 0) &&
         (uVar21 = 0xc, (*(byte *)((int)&param_1->flags_4 + 1) & 4) == 0)) {
        uVar21 = 2;
        param_1->flags_2 = param_1->flags_2 & 0xffff7fff;
      }
      unit_set_object_upper
                (param_1,unit_type_to_obj_indexes_map
                         [(uint)(byte)param_1->unit_type + (short)uVar21 * 9]);
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x80) != 0) {
        local_e4 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),
                            (char)((ushort)(param_1->pos).x >> 8));
        remove_person_from_hut
                  (unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)
                            [((local_e4 & 0xfe) * 2 | local_e4 & 0xfe00) * 2] & 0x3ff],param_1);
        param_1->flags_2 = param_1->flags_2 & 0xffffffef;
      }
      if (param_1->unit_type == '\a') {
        local_d0 = 8;
      }
      else {
        local_d0 = (-(uint)(param_1->unit_land_array_index == 0) & 0xfffffffa) + 7;
      }
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      param_1->field_0xa8 = 0;
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      param_1->state_2 = (char)local_d0;
    }
    break;
  case 1:
    bVar35 = false;
    bVar12 = false;
    uVar25 = param_1->flags_2;
    local_d8 = 0;
    if ((uVar25 & 0x40000000) != 0) {
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      param_1->coord_scale_3 = 0;
      param_1->coord_scale_1 = 0;
      param_1->flags_2 = uVar25 & 0xbfffffff;
      param_1->field_0xa8 = 0;
      param_1->field_0xa9 = 0;
    }
    cVar28 = param_1->field_0xa8;
    if (cVar28 == '\0') {
      if ((param_1->obj_index_anim_prev_2 & 0x10U) != 0) {
        param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
        uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar25 = uVar26 >> 0xd;
        local_80 = uVar25 | uVar26 * 0x80000;
        cVar28 = ((byte)uVar25 & 7) + 8;
        game_state.pseudo_random_val = local_80;
        param_1->field_0xaa = cVar28;
        param_1->coord_scale_3 = (char)(short)cVar28;
        param_1->coord_scale_1 = (char)((ushort)(short)cVar28 >> 8);
        unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[(byte)param_1->unit_type + 0xe1])
        ;
        uVar25 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index].
                                 field_0x4 >> 2;
        if (uVar25 == 0) {
          uVar25 = 1;
        }
        uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        local_84 = uVar26 >> 0xd | uVar26 * 0x80000;
        bVar7 = *(byte *)((int)&param_1->flags_3 + 2);
        sVar22 = (short)((int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                         [(byte)param_1->some_index].field_0x4 + local_84 % uVar25);
        game_state.pseudo_random_val = local_84;
        param_1->field36_0x5f = sVar22;
        if ((bVar7 & 8) != 0) {
          param_1->field36_0x5f = sVar22 * 2;
        }
        bVar12 = true;
      }
      bVar35 = true;
      cVar28 = param_1->field_0xaa + -1;
      param_1->field_0xaa = cVar28;
      if (cVar28 < '\x01') {
        local_d8 = 1;
      }
    }
    else if (cVar28 == '\x01') {
      if ((param_1->obj_index_anim_prev_2 & 0x10U) != 0) {
        param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
        uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar25 = uVar26 >> 0xd;
        local_88 = uVar25 | uVar26 * 0x80000;
        game_state.pseudo_random_val = local_88;
        param_1->field_0xaa = ((byte)uVar25 & 0xf) + 0x10;
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
        uVar25 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index].
                                 field_0x4 >> 2;
        if (uVar25 == 0) {
          uVar25 = 1;
        }
        uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        local_8c = uVar26 >> 0xd | uVar26 * 0x80000;
        bVar7 = *(byte *)((int)&param_1->flags_3 + 2);
        sVar22 = (short)((int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                         [(byte)param_1->some_index].field_0x4 + local_8c % uVar25);
        game_state.pseudo_random_val = local_8c;
        param_1->field36_0x5f = sVar22;
        if ((bVar7 & 8) != 0) {
          param_1->field36_0x5f = sVar22 * 2;
        }
        param_1->field36_0x5f = (short)param_1->field36_0x5f / 3;
      }
      bVar35 = true;
      cVar28 = param_1->field_0xaa + -1;
      param_1->field_0xaa = cVar28;
      if (cVar28 < '\x01') {
        local_d8 = 1;
      }
    }
    else if (cVar28 == '\x02') {
      if ((param_1->obj_index_anim_prev_2 & 0x10U) != 0) {
        param_1->field36_0x5f = 0;
        param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
        uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar25 = uVar26 >> 0xd;
        local_90 = uVar25 | uVar26 * 0x80000;
        game_state.pseudo_random_val = local_90;
        param_1->field_0xaa = ((byte)uVar25 & 0xf) + 0x10;
        unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[(byte)param_1->unit_type + 0x1b])
        ;
      }
      if (((param_1->class_counter & 3) == 0) &&
         (puVar30 = game_state.tribes_array[(char)param_1->tribe_index].shaman,
         puVar30 != (unit_struct *)0x0)) {
        uVar25 = (uint)(ushort)((puVar30->pos).x - (param_1->pos).x);
        uVar26 = (uint)(ushort)((puVar30->pos).y - (param_1->pos).y);
        if (0x7fff < uVar25) {
          uVar25 = uVar25 - 0x10000;
        }
        if (0x7fff < uVar26) {
          uVar26 = uVar26 - 0x10000;
        }
        uVar21 = calc_angle_quadrant(uVar25,-uVar26);
        update_gs_unit_related_array_item(param_1);
        param_1->pos_x1 = uVar21 & 0x7ff;
        uVar25 = param_1->flags_2;
        param_1->flags_2 = uVar25 | 0x80;
        param_1->flags_2 = uVar25 | 0x1080;
      }
      cVar28 = param_1->field_0xaa + -1;
      param_1->field_0xaa = cVar28;
      if (cVar28 < '\x01') {
        local_d8 = 1;
      }
    }
    if (((bVar35) || (bVar12)) &&
       ((sVar22 = *(short *)&param_1->coord_scale_3 + -1, *(short *)&param_1->coord_scale_3 = sVar22
        , sVar22 < 1 || (bVar12)))) {
      uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar25 = uVar26 >> 0xd;
      local_94 = uVar25 | uVar26 * 0x80000;
      game_state.pseudo_random_val = local_94;
      *(ushort *)&param_1->coord_scale_3 = ((ushort)uVar25 & 0xf) + 6;
      uVar25 = (uint)(ushort)((short)param_1->coord_scale_4 - (param_1->pos).x);
      uVar26 = (uint)(ushort)(*(short *)((int)&param_1->coord_scale_4 + 2) - (param_1->pos).y);
      if (0x7fff < uVar25) {
        uVar25 = uVar25 - 0x10000;
      }
      if (0x7fff < uVar26) {
        uVar26 = uVar26 - 0x10000;
      }
      uVar21 = calc_angle_quadrant(uVar25,-uVar26);
      uVar25 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar25 >> 0xd | uVar25 * 0x80000;
      uVar11 = (ulonglong)game_state.pseudo_random_val;
      local_98 = game_state.pseudo_random_val;
      update_gs_unit_related_array_item(param_1);
      param_1->pos_x1 = (short)(uVar11 % 0x58e) + -0x2c7 + (uVar21 & 0x7ff) & 0x7ff;
      uVar25 = param_1->flags_2;
      param_1->flags_2 = uVar25 | 0x80;
      param_1->flags_2 = uVar25 | 0x1080;
    }
    iVar24 = 0;
    local_dc = (uint)(byte)param_1->field_0xa8;
    if ((local_d8 == 0) && (local_dc == 1)) {
      local_e6 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),
                          (char)((ushort)(param_1->pos).x >> 8));
      iVar31 = 0;
      puVar10 = (unit_struct *)0x0;
      for (puVar30 = unit_land_array
                     [(short)(&game_state.level_data[0].unit_index)
                             [((local_e6 & 0xfe) * 2 | local_e6 & 0xfe00) * 2]];
          puVar30 != (unit_struct *)0x0; puVar30 = unit_land_array[puVar30->next_unit_index]) {
        puVar29 = puVar10;
        if ((((param_1 != puVar30) && (puVar30->unit_class == '\x01')) &&
            (param_1->tribe_index == puVar30->tribe_index)) && (puVar30->state == ')')) {
          cVar28 = puVar30->state_2;
          if (cVar28 == '\x01') {
            if ((puVar30->field_0xa8 == '\x01') || (puVar30->field_0xa8 == '\0')) {
              iVar24 = iVar24 + 1;
            }
          }
          else {
            puVar29 = puVar30;
            if ((cVar28 != '\x03') && (puVar29 = puVar10, cVar28 == '\x04')) {
              iVar31 = iVar31 + 1;
            }
          }
        }
        puVar10 = puVar29;
      }
      if ((iVar31 < 7) && ((puVar10 != (unit_struct *)0x0 || (2 < iVar24)))) {
        param_1->field36_0x5f = 0;
        if (puVar10 == (unit_struct *)0x0) {
          param_1->state_2 = 3;
        }
        else {
          param_1->state_2 = 4;
        }
        param_1->flags_2 = param_1->flags_2 | 0x40000000;
      }
    }
    local_d0 = 0;
    iVar24 = 0;
    if (local_d8 == 0) break;
    bVar7 = param_1->field_0xa9;
    local_9c = 0;
    local_a4 = (undefined1 *)0x0;
    param_1->field_0xa9 = bVar7 + 1;
    puVar23 = (undefined1 *)0x0;
    if (bVar7 < 4) {
      local_e2 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),
                          (char)((ushort)(param_1->pos).x >> 8)) & 0xfefe;
      local_ee._0_1_ = (char)local_e2;
      cVar13 = (char)local_ee;
      local_ee._1_1_ = (char)(local_e2 >> 8);
      cVar20 = local_ee._1_1_;
      local_ee._1_1_ = local_ee._1_1_ + '\x02';
      local_ee = CONCAT11(local_ee._1_1_,(char)local_ee + -2);
      uVar21 = local_ee;
      local_44 = local_ee;
      local_ee = CONCAT11(local_ee._1_1_,cVar13);
      uVar14 = local_ee;
      local_3c = local_ee;
      cVar28 = cVar13 + '\x02';
      local_ee = CONCAT11(local_ee._1_1_,cVar28);
      uVar15 = local_ee;
      local_34 = local_ee;
      local_ee = CONCAT11(cVar20,cVar28);
      uVar16 = local_ee;
      local_2c = local_ee;
      cVar4 = cVar20 + -2;
      local_ee = CONCAT11(cVar4,cVar28);
      uVar17 = local_ee;
      local_24 = local_ee;
      local_ee = CONCAT11(cVar4,cVar13);
      uVar18 = local_ee;
      local_1c = local_ee;
      local_ee = CONCAT11(cVar4,cVar13 + -2);
      uVar19 = local_ee;
      local_14 = local_ee;
      local_ee = CONCAT11(cVar20,cVar13 + -2);
      local_c = local_ee;
      local_4 = local_e2;
      local_50[2] = ((uVar21 & 0xfe) * 2 | uVar21 & 0xfe00) * 4 + 0x8a03e4;
      local_40 = ((uVar14 & 0xfe) * 2 | uVar14 & 0xfe00) * 4 + 0x8a03e4;
      local_38 = ((uVar15 & 0xfe) * 2 | uVar15 & 0xfe00) * 4 + 0x8a03e4;
      local_30 = ((uVar16 & 0xfe) * 2 | uVar16 & 0xfe00) * 4 + 0x8a03e4;
      local_28 = ((uVar17 & 0xfe) * 2 | uVar17 & 0xfe00) * 4 + 0x8a03e4;
      local_20 = ((uVar18 & 0xfe) * 2 | uVar18 & 0xfe00) * 4 + 0x8a03e4;
      local_18 = ((uVar19 & 0xfe) * 2 | uVar19 & 0xfe00) * 4 + 0x8a03e4;
      local_10 = ((local_ee & 0xfe) * 2 | local_ee & 0xfe00) * 4 + 0x8a03e4;
      local_8 = ((local_e2 & 0xfe) * 2 | local_e2 & 0xfe00) * 4 + 0x8a03e4;
      local_54 = DAT_005d4858;
      local_50[0] = DAT_005d485c;
      piVar32 = local_50 + 2;
      local_50[1] = DAT_005d4860;
      do {
        for (puVar30 = unit_land_array[*(short *)(*piVar32 + 6)]; puVar30 != (unit_struct *)0x0;
            puVar30 = unit_land_array[puVar30->next_unit_index]) {
          if ((((param_1 != puVar30) && (puVar30->unit_class == '\x01')) &&
              (param_1->tribe_index == puVar30->tribe_index)) &&
             (((puVar30->state == ')' && (puVar30->state_2 == '\x01')) &&
              (iVar31 = calc_squared_distance_toroidal(&param_1->pos,&puVar30->pos),
              iVar31 < 0x27101)))) {
            iVar24 = iVar24 + 1;
            *(short *)(local_50 + ((byte)puVar30->field_0xa8 - 1)) =
                 (short)local_50[(byte)puVar30->field_0xa8 - 1] +
                 (short)*(char *)((int)local_50 + (uint)(byte)puVar30->field_0xa8 * 4 + -1);
          }
        }
        piVar32 = piVar32 + 2;
      } while (piVar32 < &stack0x00000000);
      puVar23 = (undefined1 *)register0x00000010;
      if (iVar24 == 0) goto LAB_004e15d9;
      do {
        bVar35 = true;
        iVar24 = 2;
        psVar33 = (short *)&local_54;
        do {
          psVar1 = psVar33 + 2;
          if (*psVar1 < *psVar33) {
            uVar9 = *(undefined4 *)psVar1;
            *(undefined4 *)psVar1 = *(undefined4 *)psVar33;
            *(undefined4 *)psVar33 = uVar9;
            bVar35 = false;
          }
          iVar24 = iVar24 + -1;
          psVar33 = psVar1;
        } while (iVar24 != 0);
      } while (!bVar35);
      puVar23 = (undefined1 *)(local_54 >> 0x10 & 0xff);
      local_a4 = puVar23;
    }
    else {
LAB_004e15d9:
      local_9c = 1;
    }
    if ((local_9c != 0) && (param_1->field_0xa9 = 0, local_dc == 0)) {
      uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar25 = uVar26 >> 0xd;
      game_state.pseudo_random_val = uVar25 | uVar26 * 0x80000;
      puVar23 = (undefined1 *)0x2;
      local_a4 = puVar23;
      if (((byte)uVar25 & 7) < 4) {
        puVar23 = (undefined1 *)0x1;
        local_a4 = puVar23;
      }
    }
    *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
    local_d0 = CONCAT31((int3)((uint)puVar23 >> 8),local_a4._0_1_);
    param_1->field_0xa8 = local_a4._0_1_;
    if ((param_1->unit_type == '\x06') &&
       (uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df, uVar25 = uVar26 >> 0xd,
       local_d0 = uVar25 | uVar26 * 0x80000, game_state.pseudo_random_val = local_d0,
       (uVar25 & 3) == 0)) {
      param_1->state_2 = 2;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
    }
    break;
  case 2:
    if ((param_1->flags_2 & 0x40000000) != 0) {
      param_1->field_0xa8 = 1;
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
    }
    local_d0 = (uint)(byte)param_1->field_0xa8;
    if (local_d0 == 1) {
      uVar21 = param_1->obj_index_anim_prev_2;
      local_d0 = (uint)uVar21;
      if ((uVar21 & 0x10) != 0) {
        param_1->field36_0x5f = 0;
        param_1->obj_index_anim_prev_2 = uVar21 & 0xffef;
        sVar22 = 0xf;
        if (((param_1->flags_2 & 0x80000) != 0) &&
           (sVar22 = 0xc, (*(byte *)((int)&param_1->flags_4 + 1) & 4) == 0)) {
          sVar22 = 2;
          param_1->flags_2 = param_1->flags_2 & 0xffff7fff;
        }
        unit_set_object_upper
                  (param_1,unit_type_to_obj_indexes_map[(uint)(byte)param_1->unit_type + sVar22 * 9]
                  );
        (param_1->object).f2 = 0;
        (param_1->object).f1 = 1;
        *(ushort *)&param_1->coord_scale_3 =
             ((char)obj_related_array[(byte)(param_1->object).obj_related_index + 3]._f2 + 1) *
             (ushort)(byte)vstart_related[(short)(param_1->object).obj_index].frame_counter;
        local_64._0_2_ = (param_1->pos).x;
        local_64._2_2_ = (param_1->pos).y;
        local_60 = (param_1->pos).z;
        move_pos_angle_length
                  (&local_64,
                   CONCAT22((short)((uint)&local_64 >> 0x10),*(undefined2 *)&param_1->field_0x5d),
                   0x500);
        local_60 = local_60 + 0xc00;
        local_d0 = FUN_0051fbf0(param_1,0,&local_64);
      }
      *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
      sVar5._0_1_ = param_1->coord_scale_3;
      sVar5._1_1_ = param_1->coord_scale_1;
      if (sVar5 == 0) {
        param_1->field_0xa8 = 2;
        *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      }
    }
    else if (local_d0 == 2) {
      uVar21 = param_1->obj_index_anim_prev_2;
      local_d0 = (uint)uVar21;
      if ((uVar21 & 0x10) != 0) {
        param_1->obj_index_anim_prev_2 = uVar21 & 0xffef;
        sVar22 = 0xf;
        if (((param_1->flags_2 & 0x80000) != 0) &&
           (sVar22 = 0xc, (*(byte *)((int)&param_1->flags_4 + 1) & 4) == 0)) {
          sVar22 = 2;
          param_1->flags_2 = param_1->flags_2 & 0xffff7fff;
        }
        local_d0 = unit_set_object_upper
                             (param_1,unit_type_to_obj_indexes_map
                                      [(uint)(byte)param_1->unit_type + sVar22 * 9]);
        (param_1->object).f1 = 1;
        (param_1->object).f2 = 0;
        (param_1->object).f2 = 0;
        puVar2 = &(param_1->object).flags;
        *(byte *)puVar2 = (byte)*puVar2 | 2;
        (param_1->object).f1 = 1;
        param_1->coord_scale_3 = 0x10;
        param_1->coord_scale_1 = 0;
      }
      *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
      sVar6._0_1_ = param_1->coord_scale_3;
      sVar6._1_1_ = param_1->coord_scale_1;
      if (sVar6 == 0) {
        param_1->state_2 = 1;
        param_1->flags_2 = param_1->flags_2 | 0x40000000;
      }
    }
    break;
  case 3:
    if ((param_1->flags_2 & 0x40000000) != 0) {
      param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
      uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar25 = uVar26 >> 0xd;
      local_ac = uVar25 | uVar26 * 0x80000;
      game_state.pseudo_random_val = local_ac;
      param_1->field_0xaa = ((byte)uVar25 & 0x1f) + 0x28;
      uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar25 = uVar26 >> 0xd;
      local_b0 = uVar25 | uVar26 * 0x80000;
      uVar21 = (ushort)uVar25 & 0x7ff;
      sVar22 = *(short *)&param_1->field_0x78;
      game_state.pseudo_random_val = local_b0;
      param_1->coord_scale_3 = (char)uVar21;
      param_1->coord_scale_1 = (char)(uVar21 >> 8);
      if (sVar22 == 0) {
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
      uVar25 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index].
                               field_0x4 >> 2;
      if (uVar25 == 0) {
        uVar25 = 1;
      }
      uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      local_b4 = uVar26 >> 0xd | uVar26 * 0x80000;
      sVar22 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index].
                          field_0x4 + (short)(local_b4 % uVar25);
      bVar7 = *(byte *)((int)&param_1->flags_3 + 2);
      game_state.pseudo_random_val = local_b4;
      param_1->field36_0x5f = sVar22;
      if ((bVar7 & 8) != 0) {
        param_1->field36_0x5f = sVar22 * 2;
      }
    }
    pvVar3 = &param_1->pos;
    uVar21 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)pvVar3->x >> 8));
    local_d4 = 0;
    uVar26 = (uVar21 & 0xfe) * 2 | uVar21 & 0xfe00;
    puVar30 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar26 * 2]];
    uVar25 = uVar26;
    while (puVar30 != (unit_struct *)0x0) {
      if ((((puVar30->unit_class == '\x01') && (param_1->tribe_index == puVar30->tribe_index)) &&
          (puVar30->state == ')')) && ((puVar30->state_2 == '\x03' || (puVar30->state_2 == '\x04')))
         ) {
        puVar30->flags_3 = puVar30->flags_3 | 0x10;
        local_d4 = local_d4 + 1;
      }
      uVar25 = (uint)puVar30->next_unit_index;
      puVar30 = unit_land_array[uVar25];
    }
    if (local_d4 == 0) {
      param_1->field_0xaa = 0;
    }
    else {
      local_6c = (int)(0x800 / (longlong)local_d4);
      uVar25._0_2_ = pvVar3->x;
      uVar25._2_2_ = pvVar3->y;
      sVar22._0_1_ = param_1->coord_scale_3;
      sVar22._1_1_ = param_1->coord_scale_1;
      uVar34 = (uint)sVar22;
      local_60 = (param_1->pos).z;
      local_5c = (short)(uVar25 & 0xfffffe00) + 0x100;
      uVar25 = CONCAT22((short)((uVar25 & 0xfffffe00) >> 0x10),uVar25._2_2_) & 0xfffffe00;
      sStack_5a = (short)uVar25 + 0x100;
      uVar25 = CONCAT22((short)(uVar25 >> 0x10),sStack_5a);
      puVar30 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar26 * 2]];
      while (puVar30 != (unit_struct *)0x0) {
        local_58 = local_60;
        if ((puVar30->flags_3 & 0x10) != 0) {
          puVar30->flags_3 = puVar30->flags_3 & 0xffffffef;
          uVar25 = puVar30->flags_2;
          puVar30->flags_2 = uVar25 | 0x200;
          puVar30->flags_2 = uVar25 | 0x200200;
          local_64._0_2_ = local_5c;
          local_64._2_2_ = sStack_5a;
          move_pos_angle_length(&local_64,uVar34,0x80);
          local_e0 = (short)local_64;
          local_de = local_64._2_2_;
          uVar25 = (int)(short)local_64 - (int)(short)(puVar30->pos).x;
          uVar26 = (int)uVar25 >> 0x1f;
          if (((int)((uVar25 ^ uVar26) - uVar26) < 0xc) &&
             (uVar25 = (int)local_64._2_2_ - (int)(short)(puVar30->pos).y,
             uVar26 = (int)uVar25 >> 0x1f, (int)((uVar25 ^ uVar26) - uVar26) < 0xc)) {
            puVar30->field36_0x5f = 0;
            uVar25 = (uint)(ushort)(local_5c - (puVar30->pos).x);
            uVar26 = (uint)(ushort)(sStack_5a - (puVar30->pos).y);
            if (0x7fff < uVar25) {
              uVar25 = uVar25 - 0x10000;
            }
            if (0x7fff < uVar26) {
              uVar26 = uVar26 - 0x10000;
            }
            uVar21 = calc_angle_quadrant(uVar25,-uVar26);
            uVar21 = uVar21 & 0x7ff;
            update_gs_unit_related_array_item(puVar30);
            uVar25 = puVar30->flags_2;
            puVar30->flags_2 = uVar25 | 0x80;
            puVar30->flags_2 = uVar25 | 0x1080;
            puVar30->pos_x1 = uVar21;
            *(ushort *)&puVar30->field_0x5d = uVar21;
            if ((*(byte *)((int)&puVar30->flags_2 + 1) & 0x80) == 0) {
              puVar30->maybe_shape_angle = uVar21;
            }
            else {
              puVar30->maybe_shape_angle = uVar21 + 0x400 & 0x7ff;
            }
          }
          else {
            FUN_004e9dd0(puVar30,&local_e0);
            if (puVar30->field36_0x5f == 0) {
              uVar25 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                       [(byte)puVar30->some_index].field_0x4 >> 2;
              if (uVar25 == 0) {
                uVar25 = 1;
              }
              uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
              local_b8 = uVar26 >> 0xd | uVar26 * 0x80000;
              sVar22 = (short)((int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                               [(byte)puVar30->some_index].field_0x4 +
                              local_b8 % uVar25);
              game_state.pseudo_random_val = local_b8;
              puVar30->field36_0x5f = sVar22;
              if ((*(byte *)((int)&puVar30->flags_3 + 2) & 8) != 0) {
                puVar30->field36_0x5f = sVar22 * 2;
              }
            }
          }
          uVar34 = uVar34 + local_6c & 0x7ff;
        }
        uVar25 = (uint)puVar30->next_unit_index;
        local_60 = local_58;
        puVar30 = unit_land_array[uVar25];
      }
      if (5 < local_d4) {
        param_1->state_2 = 5;
        param_1->flags_2 = param_1->flags_2 | 0x40000000;
      }
    }
    if ((param_1->class_counter & 7) == 0) {
      uVar25 = CONCAT22((short)(uVar25 >> 0x10),*(short *)&param_1->coord_scale_3 + 0x5b) &
               0xffff07ff;
      param_1->coord_scale_3 = (char)(short)uVar25;
      param_1->coord_scale_1 = (char)((ushort)(short)uVar25 >> 8);
    }
    cVar28 = param_1->field_0xaa + -1;
    local_d0 = CONCAT31((int3)(uVar25 >> 8),cVar28);
    param_1->field_0xaa = cVar28;
    if (cVar28 < '\x01') {
      param_1->state_2 = 1;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
    }
    break;
  case 4:
    local_ea = CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)(param_1->pos).x >> 8))
    ;
    iVar24 = 0;
    puVar10 = (unit_struct *)0x0;
    for (puVar30 = unit_land_array
                   [(short)(&game_state.level_data[0].unit_index)
                           [((local_ea & 0xfe) * 2 | local_ea & 0xfe00) * 2]];
        puVar30 != (unit_struct *)0x0; puVar30 = unit_land_array[puVar30->next_unit_index]) {
      puVar29 = puVar10;
      if (((puVar30->unit_class == '\x01') && (param_1->tribe_index == puVar30->tribe_index)) &&
         ((puVar30->state == ')' &&
          ((puVar29 = puVar30, puVar30->state_2 != '\x03' &&
           (puVar29 = puVar10, puVar30->state_2 == '\x04')))))) {
        iVar24 = iVar24 + 1;
      }
      puVar10 = puVar29;
    }
    local_d0 = 0;
    if ((puVar10 == (unit_struct *)0x0) || (6 < iVar24)) {
      local_d0 = 1;
    }
    if (local_d0 == 0) {
      local_d0 = param_1->flags_2;
      if ((local_d0 & 0x40000000) != 0) {
        param_1->flags_2 = local_d0 & 0xbfffffff;
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
        uVar25 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index].
                                 field_0x4 >> 2;
        if (uVar25 == 0) {
          uVar25 = 1;
        }
        uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        game_state.pseudo_random_val = uVar26 >> 0xd | uVar26 * 0x80000;
        local_d0 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index]
                                   .field_0x4 + game_state.pseudo_random_val % uVar25;
        bVar7 = *(byte *)((int)&param_1->flags_3 + 2);
        param_1->field36_0x5f = (short)local_d0;
        if ((bVar7 & 8) != 0) {
          sVar22 = (short)local_d0 * 2;
          local_d0 = CONCAT22((short)(local_d0 >> 0x10),sVar22);
          param_1->field36_0x5f = sVar22;
        }
        if (puVar10 != (unit_struct *)0x0) {
          uVar8 = (puVar10->object).f2;
          local_d0 = CONCAT31((int3)(local_d0 >> 8),uVar8);
          (param_1->object).f2 = uVar8;
          (param_1->object).f1 = (puVar10->object).f1;
        }
      }
    }
    else {
      param_1->state_2 = 1;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
    }
    break;
  case 5:
    local_74 = 0;
    bVar35 = (param_1->flags_2 & 0x40000000) != 0;
    if (bVar35) {
      param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
      uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar25 = uVar26 >> 0xd;
      local_c0 = uVar25 | uVar26 * 0x80000;
      game_state.pseudo_random_val = local_c0;
      param_1->field_0xa8 = 0;
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      *(ushort *)&param_1->coord_scale_3 = ((ushort)uVar25 & 0xff) + 0x100;
      param_1->obj_index_anim_prev = 0;
    }
    local_c8 = (uint)bVar35;
    local_dc = (uint)(byte)param_1->field_0xa8;
    iVar24 = local_dc * 6;
    bVar35 = (param_1->obj_index_anim_prev_2 & 0x10U) != 0;
    local_70 = (uint)(byte)(&DAT_005d486b)[iVar24];
    if (bVar35) {
      local_74 = (uint)(byte)(&DAT_005d486c)[iVar24];
      param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xffef;
      param_1->field_0xaa = (&DAT_005d4868)[iVar24];
    }
    cVar28 = param_1->field_0xaa + -1;
    param_1->field_0xaa = cVar28;
    if (cVar28 < '\x01') {
      uVar8 = (&DAT_005d486a)[iVar24];
      iVar24 = CONCAT31((int3)((uint)iVar24 >> 8),uVar8);
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
      param_1->field_0xa8 = uVar8;
    }
    if (bVar35) {
      FUN_004e2610(param_1,CONCAT31((int3)((uint)iVar24 >> 8),param_1->field_0xa8));
    }
    if (local_74 != 0) {
      uVar25 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar25 >> 0xd | uVar25 * 0x80000;
      uVar11 = (ulonglong)game_state.pseudo_random_val;
      sVar22 = *(short *)&param_1->field_0x5d;
      local_c4 = game_state.pseudo_random_val;
      update_gs_unit_related_array_item(param_1);
      param_1->pos_x1 = (sVar22 + (short)(uVar11 % 0x471)) - 0x238U & 0x7ff;
      uVar25 = param_1->flags_2;
      param_1->flags_2 = uVar25 | 0x80;
      param_1->flags_2 = uVar25 | 0x1080;
    }
    local_78 = 1;
    iVar24 = (int)param_1->obj_index_anim_prev;
    puVar10 = unit_land_array[iVar24];
    puVar30 = param_1;
    while (puVar29 = puVar10, puVar29 != (unit_struct *)0x0) {
      if ((puVar29->state != ')') || (puVar29->state_2 != '\x06')) {
        local_78 = 0;
        break;
      }
      if (bVar35) {
        FUN_004e2610(puVar29,local_dc);
      }
      if (local_70 == 0) {
        uVar25 = (uint)(ushort)((puVar30->pos).x - (puVar29->pos).x);
        uVar26 = (uint)(ushort)((puVar30->pos).y - (puVar29->pos).y);
        if (0x7fff < uVar25) {
          uVar25 = uVar25 - 0x10000;
        }
        if (0x7fff < uVar26) {
          uVar26 = uVar26 - 0x10000;
        }
        uVar21 = calc_angle_quadrant(uVar25,-uVar26);
        uVar21 = uVar21 & 0x7ff;
        update_gs_unit_related_array_item(puVar29);
        uVar25 = puVar29->flags_2;
        puVar29->flags_2 = uVar25 | 0x80;
        puVar29->flags_2 = uVar25 | 0x1080;
        puVar29->pos_x1 = uVar21;
        *(ushort *)&puVar29->field_0x5d = uVar21;
        if ((*(byte *)((int)&puVar29->flags_2 + 1) & 0x80) != 0) {
          uVar21 = uVar21 + 0x400 & 0x7ff;
        }
        puVar29->maybe_shape_angle = uVar21;
      }
      else {
        uVar25 = puVar29->flags_2;
        pvVar3 = &puVar30->pos;
        puVar29->flags_2 = uVar25 | 0x200;
        puVar29->flags_2 = uVar25 | 0x200200;
        local_64._0_2_ = pvVar3->x;
        local_64._2_2_ = pvVar3->y;
        local_60 = (puVar30->pos).z;
        uVar25 = (uint)(ushort)((puVar29->pos).x - pvVar3->x);
        uVar26 = (uint)(ushort)((puVar29->pos).y - (puVar30->pos).y);
        if (0x7fff < uVar25) {
          uVar25 = uVar25 - 0x10000;
        }
        if (0x7fff < uVar26) {
          uVar26 = uVar26 - 0x10000;
        }
        uVar21 = calc_angle_quadrant(uVar25,-uVar26);
        move_pos_angle_length(&local_64,uVar21 & 0x7ff,0x60);
        local_e0 = (short)local_64;
        local_de = local_64._2_2_;
        FUN_004e9dd0(puVar29,&local_e0);
      }
      iVar24 = (int)puVar29->obj_index_anim_prev;
      puVar30 = puVar29;
      puVar10 = unit_land_array[iVar24];
    }
    uVar27 = (undefined2)((uint)iVar24 >> 0x10);
    if (local_78 == 0) {
      param_1->coord_scale_3 = 0;
      param_1->coord_scale_1 = 0;
    }
    else {
      if ((param_1->class_counter & 7) == 0) {
        local_c8 = 1;
      }
      if (local_c8 != 0) {
        local_7c = 0;
        puVar30 = param_1;
        while (uVar27 = (undefined2)((uint)iVar24 >> 0x10), puVar30 != (unit_struct *)0x0) {
          local_ec = CONCAT11((char)((ushort)(puVar30->pos).y >> 8),
                              (char)((ushort)(puVar30->pos).x >> 8));
          uVar25 = (local_ec & 0xfe) * 2 | local_ec & 0xfe00;
          iVar24 = uVar25 * 4 + 0x8a03e4;
          if (local_7c != iVar24) {
            for (puVar10 = unit_land_array
                           [(short)(&game_state.level_data[0].unit_index)[uVar25 * 2]];
                local_7c = iVar24, puVar10 != (unit_struct *)0x0;
                puVar10 = unit_land_array[puVar10->next_unit_index]) {
              if ((((puVar10->unit_class == '\x01') &&
                   (param_1->tribe_index == puVar10->tribe_index)) && (puVar10->state == ')')) &&
                 (((cVar28 = puVar10->state_2, cVar28 == '\x01' || (cVar28 == '\x03')) ||
                  ((cVar28 == '\x04' || (cVar28 == '\x02')))))) {
                puVar10->state_2 = 6;
                puVar10->flags_2 = puVar10->flags_2 | 0x40000000;
                puVar10->coord_scale_2 = param_1->unit_index;
                puVar10->obj_index_anim_prev = 0;
              }
            }
          }
          iVar24 = (int)puVar30->obj_index_anim_prev;
          puVar30 = unit_land_array[iVar24];
        }
      }
    }
    sVar22 = *(short *)&param_1->coord_scale_3 + -1;
    local_d0 = CONCAT22(uVar27,sVar22);
    *(short *)&param_1->coord_scale_3 = sVar22;
    if (sVar22 < 1) {
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      param_1->obj_index_anim_prev = 0;
      param_1->state_2 = 1;
    }
    break;
  case 6:
    puVar30 = (unit_struct *)0x0;
    if (((param_1->coord_scale_2 != 0) &&
        (puVar10 = unit_land_array[(ushort)param_1->coord_scale_2],
        (*(byte *)&puVar10->flags_2 & 1) == 0)) && (puVar10->unit_class != '\0')) {
      puVar30 = puVar10;
    }
    if ((puVar30 != (unit_struct *)0x0) && (puVar30->state_2 != '\x05')) {
      puVar30 = (unit_struct *)0x0;
    }
    local_d0 = param_1->flags_2;
    if ((local_d0 & 0x40000000) == 0) {
LAB_004e23ac:
      if (puVar30 != (unit_struct *)0x0) break;
    }
    else {
      param_1->obj_index_anim_prev = 0;
      local_d0 = local_d0 & 0xbfffffff;
      param_1->flags_2 = local_d0;
      if (puVar30 != (unit_struct *)0x0) {
        if (puVar30->obj_index_anim_prev == 0) {
          local_d0 = CONCAT22((short)(local_d0 >> 0x10),param_1->unit_index);
          puVar30->obj_index_anim_prev = param_1->unit_index;
        }
        else {
          local_d0 = (uint)puVar30->obj_index_anim_prev;
          puVar10 = unit_land_array[local_d0];
          while( true ) {
            if ((puVar10 == (unit_struct *)0x0) || (param_1 == puVar10)) goto LAB_004e23ac;
            if (puVar10->obj_index_anim_prev == 0) break;
            local_d0 = (uint)puVar10->obj_index_anim_prev;
            puVar10 = unit_land_array[local_d0];
          }
          local_d0 = CONCAT22((short)(local_d0 >> 0x10),param_1->unit_index);
          puVar10->obj_index_anim_prev = param_1->unit_index;
        }
        goto LAB_004e23ac;
      }
    }
    param_1->obj_index_anim_prev = 0;
    param_1->state_2 = 1;
    param_1->flags_2 = param_1->flags_2 | 0x40000000;
    param_1->coord_scale_2 = 0;
    break;
  case 7:
    local_d0 = param_1->flags_2;
    if ((local_d0 & 0x40000000) != 0) {
      param_1->flags_2 = local_d0 & 0xbfffffff;
      local_d0 = unit_set_object_upper
                           (param_1,unit_type_to_obj_indexes_map[(byte)param_1->unit_type + 0x1b]);
    }
    if ((param_1->class_counter & 3) == 0) {
      puVar30 = game_state.tribes_array[(char)param_1->tribe_index].shaman;
      local_d0 = 0;
      if (puVar30 != (unit_struct *)0x0) {
        uVar25 = (uint)(ushort)((puVar30->pos).x - (param_1->pos).x);
        uVar26 = (uint)(ushort)((puVar30->pos).y - (param_1->pos).y);
        if (0x7fff < uVar25) {
          uVar25 = uVar25 - 0x10000;
        }
        if (0x7fff < uVar26) {
          uVar26 = uVar26 - 0x10000;
        }
        uVar21 = calc_angle_quadrant(uVar25,-uVar26);
        update_gs_unit_related_array_item(param_1);
        param_1->pos_x1 = uVar21 & 0x7ff;
        local_d0 = param_1->flags_2;
        param_1->flags_2 = local_d0 | 0x80;
        local_d0 = local_d0 | 0x1080;
        param_1->flags_2 = local_d0;
      }
    }
    if (param_1->unit_land_array_index == 0) {
      param_1->state_2 = 1;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      param_1->field_0xa8 = 0;
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 0x10;
    }
    break;
  case 8:
    uVar25 = param_1->flags_2;
    if ((uVar25 & 0x40000000) != 0) {
      param_1->field36_0x5f = 0;
      param_1->flags_2 = uVar25 & 0xbfffffff;
      uVar21 = (*(short *)&param_1->field_0x78 == 0) - 1 & 4;
      if (((param_1->flags_2 & 0x80000) != 0) &&
         (uVar21 = 0xc, (*(byte *)((int)&param_1->flags_4 + 1) & 4) == 0)) {
        uVar21 = 2;
        param_1->flags_2 = param_1->flags_2 & 0xffff7fff;
      }
      uVar25 = unit_set_object_upper
                         (param_1,unit_type_to_obj_indexes_map
                                  [(uint)(byte)param_1->unit_type + (short)uVar21 * 9]);
      param_1->coord_scale_3 = 0;
      param_1->coord_scale_1 = 0;
    }
    sVar22 = *(short *)&param_1->coord_scale_3 + -1;
    local_d0 = CONCAT22((short)(uVar25 >> 0x10),sVar22);
    *(short *)&param_1->coord_scale_3 = sVar22;
    if (sVar22 < 1) {
      uVar26 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar25 = uVar26 >> 0xd;
      local_cc = uVar25 | uVar26 * 0x80000;
      game_state.pseudo_random_val = local_cc;
      *(ushort *)&param_1->coord_scale_3 = ((ushort)uVar25 & 0x1f) + 0x20;
      uVar25 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar25 >> 0xd | uVar25 * 0x80000;
      local_d0 = game_state.pseudo_random_val;
      update_gs_unit_related_array_item(param_1);
      uVar25 = param_1->flags_2;
      param_1->flags_2 = uVar25 | 0x80;
      param_1->flags_2 = uVar25 | 0x1080;
      local_d0 = local_d0 & 0xffff07ff;
      param_1->pos_x1 = (short)local_d0;
    }
  }
  return local_d0 & 0xffffff00;
}
