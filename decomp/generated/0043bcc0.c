/* Ghidra 12.1.3 pseudocode; entry 0043bcc0; FUN_0043bcc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0043c12a) */
/* WARNING: Removing unreachable block (ram,0x0043c134) */

char FUN_0043bcc0(unit_struct *param_1)

{
  ushort *puVar1;
  byte bVar2;
  short sVar3;
  short sVar4;
  unit_struct *puVar5;
  char cVar6;
  bool bVar7;
  bool bVar8;
  undefined2 uVar9;
  ushort uVar10;
  uint uVar11;
  undefined2 extraout_var;
  int iVar12;
  unit_struct *puVar13;
  undefined2 extraout_var_00;
  uint uVar14;
  char local_23;
  undefined2 local_22;
  undefined2 local_20;
  undefined2 local_1e;
  undefined4 local_1c;
  undefined4 local_18 [2];
  undefined4 local_10;
  int local_c;
  int local_8;
  char local_4 [4];

  bVar8 = false;
  local_23 = '\0';
  uVar11 = param_1->flags_2;
  cVar6 = param_1->state_2;
  param_1->flags_2 = uVar11 & 0xffdfffff;
  switch(cVar6) {
  case '\0':
    if ((uVar11 & 0x40000000) != 0) {
      puVar13 = (unit_struct *)0x0;
      param_1->flags_2 = uVar11 & 0xbfdfffff;
      if (((param_1->coord_scale_2 != 0) &&
          (puVar5 = unit_land_array[(ushort)param_1->coord_scale_2],
          (*(byte *)&puVar5->flags_2 & 1) == 0)) && (puVar5->unit_class != '\0')) {
        puVar13 = puVar5;
      }
      if (puVar13 != (unit_struct *)0x0) {
        bVar8 = true;
        FUN_004a8e70(puVar13,&local_1c);
        FUN_004e9d80(param_1,&local_1c);
        FUN_004d4f40(param_1);
      }
    }
    if ((param_1->class_counter & 3) == 0) {
      bVar8 = true;
    }
    if (((bVar8) &&
        (uVar11 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x,
        uVar14 = (int)uVar11 >> 0x1f, (int)((uVar11 ^ uVar14) - uVar14) < 0x638)) &&
       (uVar11 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
       uVar14 = (int)uVar11 >> 0x1f, (int)((uVar11 ^ uVar14) - uVar14) < 0x638)) {
      param_1->state_2 = 1;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
    }
    break;
  case '\x01':
    if ((uVar11 & 0x40000000) != 0) {
      param_1->field_0xa8 = 0;
      param_1->flags_2 = uVar11 & 0xbfdfffff;
      puVar13 = unit_land_array[param_1->coord_scale_2];
      cVar6 = FUN_0043c340(puVar13,param_1,&local_1c,local_4);
      param_1->field_0xa8 = cVar6;
      if ((*(byte *)((int)&param_1->flags_4 + 3) & 0x10) == 0) {
        if (cVar6 == '\0') {
          local_23 = '\x01';
        }
        else {
          if (cVar6 == '\x01') {
            puVar13->counter_2 = 0x10;
            puVar13->counter = local_4[0] + 1U;
            if (0x31 < (byte)(local_4[0] + 1U)) {
              puVar13->counter = 0;
            }
          }
          FUN_004d4f40(param_1);
LAB_0043be49:
          FUN_004e9d80(param_1,&local_1c);
        }
      }
      else {
        puVar13 = (unit_struct *)0x0;
        if (((param_1->coord_scale_2 != 0) &&
            (puVar5 = unit_land_array[(ushort)param_1->coord_scale_2],
            (*(byte *)&puVar5->flags_2 & 1) == 0)) && (puVar5->unit_class != '\0')) {
          puVar13 = puVar5;
        }
        if (puVar13 != (unit_struct *)0x0) {
          FUN_004a8e70(puVar13,&local_1c);
          goto LAB_0043be49;
        }
      }
    }
    if (((param_1->unit_land_array_index != 0) &&
        (uVar11 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x,
        uVar14 = (int)uVar11 >> 0x1f, (int)((uVar11 ^ uVar14) - uVar14) < 0x238)) &&
       (uVar11 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
       uVar14 = (int)uVar11 >> 0x1f, (int)((uVar11 ^ uVar14) - uVar14) < 0x238)) {
      FUN_00466c80(param_1,0);
    }
    uVar11 = param_1->flags_2;
    bVar2 = *(byte *)((int)&param_1->flags_4 + 3);
    param_1->flags_2 = uVar11 | 0x200000;
    if ((bVar2 & 0x10) != 0) {
      return local_23;
    }
    if ((param_1->class_counter & 1) != 0) {
      return local_23;
    }
    local_8 = (int)(short)(param_1->pos).x;
    sVar3 = param_1->pos_x1;
    uVar14 = sVar3 - local_8 >> 0x1f;
    if (0x437 < (int)((sVar3 - local_8 ^ uVar14) - uVar14)) {
      return local_23;
    }
    local_c = (int)(short)(param_1->pos).y;
    sVar4 = param_1->pos_y1;
    uVar14 = sVar4 - local_c >> 0x1f;
    if (0x437 < (int)((sVar4 - local_c ^ uVar14) - uVar14)) {
      return local_23;
    }
    if (param_1->field_0xa8 == '\x01') {
      bVar8 = false;
      local_1e = CONCAT11((char)((ushort)sVar4 >> 8),(char)((ushort)sVar3 >> 8));
      for (puVar13 = unit_land_array
                     [(short)(&game_state.level_data[0].unit_index)
                             [((local_1e & 0xfe) * 2 | local_1e & 0xfe00) * 2]];
          puVar13 != (unit_struct *)0x0; puVar13 = unit_land_array[puVar13->next_unit_index]) {
        if (((puVar13->unit_class == '\x01') && (puVar13->field36_0x5f == 0)) &&
           ((puVar13 != param_1 && (((puVar13->pos).x == sVar3 && ((puVar13->pos).y == sVar4)))))) {
          bVar8 = true;
          break;
        }
      }
      bVar7 = true;
      if (!bVar8) goto LAB_0043bf7a;
    }
    else {
LAB_0043bf7a:
      bVar7 = false;
    }
    if (bVar7) {
      param_1->state_2 = 1;
      param_1->flags_2 = uVar11 | 0x40200000;
    }
    else {
      uVar11 = (short)(param_1->vec3).x - local_8;
      uVar14 = (int)uVar11 >> 0x1f;
      if ((0xb < (int)((uVar11 ^ uVar14) - uVar14)) ||
         (uVar11 = (short)(param_1->vec3).y - local_c, uVar14 = (int)uVar11 >> 0x1f, bVar8 = true,
         0xb < (int)((uVar11 ^ uVar14) - uVar14))) {
        bVar8 = false;
      }
      if (bVar8) {
        local_20 = CONCAT11((char)((ushort)(unit_land_array[param_1->coord_scale_2]->pos).y >> 8),
                            (char)((ushort)(unit_land_array[param_1->coord_scale_2]->pos).x >> 8));
        for (puVar13 = unit_land_array
                       [(short)(&game_state.level_data[0].unit_index)
                               [((local_20 & 0xfe) * 2 | local_20 & 0xfe00) * 2]];
            puVar13 != (unit_struct *)0x0; puVar13 = unit_land_array[puVar13->next_unit_index]) {
          if ((((puVar13->unit_class == '\x06') && (puVar13->unit_type == '\x06')) &&
              (((puVar13->field_0x6d & 0x10) != 0 || ((char)puVar13->coord_scale_4 == '\x03')))) &&
             (param_1->unit_type != '\a')) {
            local_23 = '\x01';
            local_18[0]._0_2_ = (param_1->pos).x;
            local_18[0]._2_2_ = (param_1->pos).y;
            local_22 = CONCAT11((char)((ushort)local_18[0]._2_2_ >> 8),
                                (char)((ushort)(undefined2)local_18[0] >> 8));
            uVar11 = (local_22 & 0xfe) * 2 | local_22 & 0xfe00;
            if ((*(byte *)((int)&game_state.level_data[0].flags + uVar11 * 4 + 1) & 2) != 0) {
              FUN_004044b0(unit_land_array
                           [(ushort)(&game_state.level_data[0].unit_index_2)[uVar11 * 2] & 0x3ff],
                           local_18);
            }
            FUN_00402e70(param_1,local_18);
          }
        }
        if (local_23 == '\0') {
          param_1->state_2 = 2;
          param_1->flags_2 = param_1->flags_2 | 0x40000000;
          add_unit_to_cell(param_1,&param_1->pos_x1);
          uVar9 = calc_point_height(CONCAT22(extraout_var_00,(param_1->pos).x),
                                    CONCAT22(extraout_var,(param_1->pos).y));
          (param_1->pos).z = uVar9;
          (param_1->vec1).x = 0;
          sVar3 = param_1->coord_scale_2;
          (param_1->vec1).z = 0;
          param_1->flags_2 = param_1->flags_2 & 0xffdfffff;
          (param_1->vec1).y = 0;
          param_1->field36_0x5f = 0;
          puVar13 = unit_land_array[sVar3];
          uVar11 = (uint)(ushort)((puVar13->pos).x - (param_1->pos).x);
          uVar14 = (uint)(ushort)((puVar13->pos).y - (param_1->pos).y);
          if (0x7fff < uVar11) {
            uVar11 = uVar11 - 0x10000;
          }
          if (0x7fff < uVar14) {
            uVar14 = uVar14 - 0x10000;
          }
          uVar10 = calc_angle_quadrant(uVar11,-uVar14);
          update_gs_unit_related_array_item(param_1);
          param_1->pos_x1 = uVar10 & 0x7ff;
          uVar11 = param_1->flags_2;
          param_1->flags_2 = uVar11 | 0x80;
          param_1->flags_2 = uVar11 | 0x1080;
          FUN_004a8e70(puVar13,&local_1c);
          local_10 = local_1c;
          iVar12 = FUN_00405050(&local_10);
          if ((*(byte *)(iVar12 + 1) & 2) != 0) {
            FUN_004044b0(unit_land_array[*(ushort *)(iVar12 + 8) & 0x3ff],&local_10);
          }
          FUN_00402e70(param_1,&local_10);
        }
      }
    }
    break;
  case '\x02':
  case '\x03':
    if (cVar6 == '\x02') {
      if ((param_1->unit_type != '\a') && ((*(byte *)&param_1->flags_4 & 0x10) == 0)) {
        FUN_0048a050(param_1,0x52,0);
      }
      uVar11 = param_1->flags_2;
      if ((uVar11 & 0x40000000) == 0) {
        if (((param_1->object).f1 == 0) &&
           ((int)((byte)vstart_related[(short)(param_1->object).obj_index].frame_counter - 1) <=
            (int)(uint)(byte)(param_1->object).f2)) {
          param_1->state_2 = 3;
          param_1->flags_2 = uVar11 | 0x40000000;
        }
      }
      else {
        param_1->flags_2 = uVar11 & 0xbfffffff;
        unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[(byte)param_1->unit_type + 0x1b])
        ;
        (param_1->object).f1 = 0;
        (param_1->object).f2 = 0;
        puVar1 = &(param_1->object).flags;
        *puVar1 = *puVar1 & 0xfffd;
      }
    }
    else if (cVar6 == '\x03') {
      if ((uVar11 & 0x40000000) != 0) {
        puVar1 = &(param_1->object).flags;
        *(byte *)puVar1 = (byte)*puVar1 | 2;
        (param_1->object).f1 = 1;
        (param_1->object).f2 = 0;
        param_1->flags_2 = uVar11 & 0xbfdfffff;
        uVar14 = pseudo_random * 0x24a1 + 0x24df;
        uVar11 = uVar14 >> 0xd;
        pseudo_random = uVar11 | uVar14 * 0x80000;
        *(ushort *)&param_1->coord_scale_3 = ((ushort)uVar11 & 0xf) + 8;
      }
      *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
      sVar3._0_1_ = param_1->coord_scale_3;
      sVar3._1_1_ = param_1->coord_scale_1;
      if (sVar3 == 0) {
        param_1->state_2 = 2;
        param_1->flags_2 = param_1->flags_2 | 0x40000000;
      }
    }
    if (((param_1->flags_2 & 0x2004) != 0) || (param_1->field36_0x5f != 0)) {
      param_1->state_2 = 1;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
    }
  }
  return local_23;
}
