/* Ghidra 12.1.3 pseudocode; entry 00433a10; FUN_00433a10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00433f85) */
/* WARNING: Removing unreachable block (ram,0x00433f8f) */

char FUN_00433a10(unit_struct *param_1,byte *param_2)

{
  undefined1 *puVar1;
  char cVar2;
  char cVar3;
  short sVar4;
  short sVar5;
  unit_struct *puVar6;
  undefined4 uVar7;
  bool bVar8;
  char cVar9;
  short sVar10;
  undefined2 uVar11;
  ushort uVar12;
  uint uVar13;
  int iVar14;
  undefined2 extraout_var;
  unit_struct *puVar15;
  uint uVar16;
  char local_1f;
  ushort local_1e;
  undefined4 local_1c;
  undefined2 local_18;
  short sStack_16;
  undefined2 local_14;
  undefined4 local_10;

  cVar3 = param_1->tribe_index;
  local_1f = '\0';
  local_18 = CONCAT11(local_18._1_1_,(char)local_18);
  switch(param_1->state_2) {
  case 0:
    uVar16 = param_1->flags_2;
    if ((uVar16 & 0x40000000) != 0) {
      param_1->flags_2 = uVar16 & 0xbfffffff;
      param_1->flags_2 = uVar16 & 0xbfffbfff;
      FUN_004d4f40(param_1);
      FUN_004e9d80(param_1,param_2 + 6);
      if ((level_number == 1) && (game_state.tribes_array[cVar3].tribe_num == '\0')) {
        DAT_006841ec = DAT_005aa5dc;
      }
      else {
        DAT_006841ec = 0;
      }
    }
    if (DAT_006841ec != 0) {
      DAT_006841ec = DAT_006841ec + -1;
    }
    if ((*(uint *)(&DAT_005a7dca + (uint)*param_2 * 0x16) & 0x804) == 0) {
      local_1c = *(uint *)(param_2 + 6);
    }
    else if ((*(uint *)(&DAT_005a7dca + (uint)*param_2 * 0x16) & 4) == 0) {
      local_1e = *(ushort *)(param_2 + 6) & 0xfefe;
      local_1c = CONCAT22(((local_1e >> 8) + 1) * 0x100,
                          ((*(ushort *)(param_2 + 6) & 0xfe) + 1) * 0x100);
    }
    else {
      local_1e = *(ushort *)(param_2 + 8) & 0xfefe;
      local_1c = CONCAT22(((local_1e >> 8) + 1) * 0x100,
                          ((*(ushort *)(param_2 + 8) & 0xfe) + 1) * 0x100);
    }
    puVar15 = param_1;
    if (param_1->unit_land_array_index != 0) {
      puVar15 = unit_land_array[(ushort)param_1->unit_land_array_index];
    }
    uVar16 = (int)(short)(puVar15->pos).x - (int)(short)local_1c;
    uVar13 = (int)uVar16 >> 0x1f;
    iVar14 = (uVar16 ^ uVar13) - uVar13;
    if (0x7fff < iVar14) {
      iVar14 = 0xffff - iVar14;
    }
    if (iVar14 < 0x78) {
      uVar16 = (int)(short)(puVar15->pos).y - (int)local_1c._2_2_;
      uVar13 = (int)uVar16 >> 0x1f;
      iVar14 = (uVar16 ^ uVar13) - uVar13;
      if (0x7fff < iVar14) {
        iVar14 = 0xffff - iVar14;
      }
      bVar8 = true;
      if (0x77 < iVar14) goto LAB_00433bbb;
    }
    else {
LAB_00433bbb:
      bVar8 = false;
    }
    local_18 = CONCAT11(local_18._1_1_,(char)local_18);
    if ((!bVar8) || (local_18 = CONCAT11(local_18._1_1_,(char)local_18), DAT_006841ec != 0)) break;
    if ((game_state.tribes_array[cVar3].field_0x93f & 1) == 0) {
      param_1->state_2 = 1;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      local_18 = CONCAT11(local_18._1_1_,(char)local_18);
      break;
    }
    goto LAB_00434046;
  case 1:
    if ((param_1->flags_2 & 0x40000000) != 0) {
      param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
      unit_clear_vec_2(param_1);
      param_1->field36_0x5f = 0;
      unit_set_object_upper(param_1,0x5d);
      (param_1->object).f1 = 0;
      param_1->coord_scale_3 = 0xc;
      param_1->coord_scale_1 = 0;
      (param_1->object).f2 = 0;
    }
    if (*(short *)&param_1->coord_scale_3 != 0) {
      *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
    }
    sVar4._0_1_ = param_1->coord_scale_3;
    sVar4._1_1_ = param_1->coord_scale_1;
    local_18 = CONCAT11(local_18._1_1_,(char)local_18);
    if ((sVar4 == 0) &&
       (local_18 = CONCAT11(local_18._1_1_,(char)local_18), (param_1->flags_2 & 0x80000) == 0)) {
      param_1->state_2 = 2;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      local_18 = CONCAT11(local_18._1_1_,(char)local_18);
    }
    break;
  case 2:
    if ((param_1->flags_2 & 0x40000000) != 0) {
      uVar16 = param_1->flags_2 & 0xbfffffff;
      param_1->coord_scale_3 = 10;
      param_1->coord_scale_1 = 0;
      param_1->flags_2 = uVar16;
      param_1->flags_2 = uVar16 | 0x4000;
      local_10 = CONCAT31(local_10._1_3_,(char)((ushort)*(undefined2 *)(param_2 + 6) >> 8)) &
                 0xfffffffe;
      local_10 = CONCAT22(local_10._2_2_,
                          CONCAT11((char)((ushort)*(undefined2 *)(param_2 + 8) >> 8),
                                   (undefined1)local_10)) & 0xfffffeff;
      local_18._0_1_ = (char)local_10;
      local_18._1_1_ = (char)(local_10 >> 8);
      cVar9 = (char)local_18 + -5;
      cVar2 = local_18._1_1_ + -5;
      local_10._0_2_ = CONCAT11(local_18._1_1_ + '\x05',(char)local_18 + '\x05');
      local_18._0_1_ = cVar9;
      local_18._1_1_ = cVar2;
      FUN_0044fcb0(&local_10,CONCAT22(sStack_16,CONCAT11(cVar2,cVar9)),local_10);
      sVar10 = FUN_0044eb40(&local_10);
      *(short *)((int)game_state.tribes_array[cVar3].field1414_0x969 + 0xa2) = sVar10 + 10;
      cVar9 = FUN_0043bb60(param_1,param_2);
      if (cVar9 != '\0') {
        sStack_16 = *(short *)(param_2 + 8);
        local_18._0_1_ = (char)*(undefined2 *)(param_2 + 6);
        local_18._1_1_ = (char)((ushort)*(undefined2 *)(param_2 + 6) >> 8);
        local_14 = 0;
        local_14 = FUN_004ba600((int)*(short *)((int)game_state.tribes_array[cVar3].field1414_0x969
                                               + 0xa2));
        iVar14 = alloc_unit(7,8,param_1->tribe_index,&local_18);
        if (iVar14 != 0) {
          *(undefined2 *)((int)&param_1->loc_3_y + 1) = *(undefined2 *)(iVar14 + 0x24);
          FUN_0050c820(iVar14);
        }
      }
    }
    cVar9 = FUN_0043bb60(param_1,param_2);
    if (cVar9 == '\0') {
      param_1->state_2 = 0;
      param_1->flags_2 = param_1->flags_2 | 0x40000000;
      local_18 = CONCAT11(local_18._1_1_,(char)local_18);
    }
    else {
      uVar11 = calc_point_height(CONCAT22(extraout_var,(param_1->pos).x),(param_1->pos).y);
      (param_1->pos).z = uVar11;
      if (*(short *)&param_1->coord_scale_3 != 0) {
        *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
      }
      sVar5._0_1_ = param_1->coord_scale_3;
      sVar5._1_1_ = param_1->coord_scale_1;
      local_18 = CONCAT11(local_18._1_1_,(char)local_18);
      if (sVar5 < 1) {
        uVar12 = *(ushort *)((int)&param_1->loc_3_y + 1);
        puVar15 = (unit_struct *)0x0;
        if (((uVar12 != 0) &&
            (puVar6 = unit_land_array[uVar12], (*(byte *)&puVar6->flags_2 & 1) == 0)) &&
           (puVar6->unit_class != '\0')) {
          puVar15 = puVar6;
        }
        local_18 = CONCAT11(local_18._1_1_,(char)local_18);
        if (puVar15 == (unit_struct *)0x0) {
          param_1->state_2 = 3;
          param_1->flags_2 = param_1->flags_2 | 0x40000000;
          local_18 = CONCAT11(local_18._1_1_,(char)local_18);
        }
      }
    }
    break;
  case 3:
    if ((param_1->flags_2 & 0x40000000) != 0) {
      puVar1 = &game_state.tribes_array[cVar3].field_0x911;
      param_1->flags_2 = param_1->flags_2 & 0xbfffffff;
      FUN_0044ff80(puVar1,0xffffffff,0);
      sStack_16 = *(short *)(param_2 + 8);
      local_18._0_1_ = (char)*(undefined2 *)(param_2 + 6);
      local_18._1_1_ = (char)((ushort)*(undefined2 *)(param_2 + 6) >> 8);
      local_14 = 0;
      *(ushort *)puVar1 = (*(ushort *)puVar1 & 0xfe00) + 0x100;
      *(ushort *)&game_state.tribes_array[cVar3].field_0x913 =
           (*(ushort *)&game_state.tribes_array[cVar3].field_0x913 & 0xfe00) + 0x100;
      local_14 = FUN_004ba600((int)*(short *)((int)game_state.tribes_array[cVar3].field1414_0x969 +
                                             0xa2));
      *(uint *)puVar1 = CONCAT22(sStack_16,CONCAT11(local_18._1_1_,(char)local_18));
      *(undefined2 *)&game_state.tribes_array[cVar3].field_0x915 = local_14;
      FUN_0044ff80(puVar1,param_1->tribe_index,1);
      param_1->coord_scale_3 = 8;
      param_1->coord_scale_1 = 0;
    }
    local_18 = CONCAT11(local_18._1_1_,(char)local_18);
    if ((param_1->state_2 != '\x03') ||
       (local_18 = CONCAT11(local_18._1_1_,(char)local_18), (param_1->class_counter & 1) != 0))
    break;
    sVar10._0_1_ = param_1->coord_scale_3;
    sVar10._1_1_ = param_1->coord_scale_1;
    if (sVar10 != 0) {
      uVar7 = *(undefined4 *)&game_state.tribes_array[cVar3].field_0x911;
      local_14 = *(undefined2 *)&game_state.tribes_array[cVar3].field_0x915;
      local_1c = (CONCAT11((char)((uint)uVar7 >> 0x18),(char)((uint)uVar7 >> 8)) & 0xfffe) &
                 0xfffffeff;
      local_1c = CONCAT11(local_1c._1_1_ + *(char *)(sVar10 * 2 + 0x5a9f0f),
                          (byte)local_1c + *(char *)(sVar10 * 2 + 0x5a9f0e)) & 0xfffffefe;
      local_18 = ((byte)local_1c + 1) * 0x100;
      sStack_16 = (local_1c._1_1_ + 1) * 0x100;
      local_14 = calc_point_height(CONCAT22(sStack_16,local_18),CONCAT22(local_14,sStack_16));
      uVar16 = (uint)(ushort)(local_18 - (param_1->pos).x);
      uVar13 = (uint)(ushort)(sStack_16 - (param_1->pos).y);
      if (0x7fff < uVar16) {
        uVar16 = uVar16 - 0x10000;
      }
      if (0x7fff < uVar13) {
        uVar13 = uVar13 - 0x10000;
      }
      uVar12 = calc_angle_quadrant(uVar16,-uVar13);
      uVar12 = uVar12 & 0x7ff;
      uVar16 = param_1->flags_2;
      if ((uVar16 & 0x80) != 0) {
        param_1->pos_x1 = uVar12;
      }
      *(ushort *)&param_1->field_0x5d = uVar12;
      if ((uVar16 & 0x8000) != 0) {
        uVar12 = uVar12 + 0x400 & 0x7ff;
      }
      param_1->maybe_shape_angle = uVar12;
      iVar14 = alloc_unit(8,1,CONCAT31((int3)(uVar16 >> 8),param_1->tribe_index),&local_18);
      if (iVar14 != 0) {
        *(undefined4 *)(iVar14 + 0x70) = *(undefined4 *)&param_1->pos;
        *(undefined2 *)(iVar14 + 0x74) = (param_1->pos).z;
        *(undefined1 *)(iVar14 + 0x7c) = 7;
        *(undefined1 *)(iVar14 + 0x7d) = 7;
        *(undefined1 *)(iVar14 + 0x7e) = 3;
        *(short *)(iVar14 + 0x80) = *(short *)&param_1->coord_scale_3 + -1;
        *(short *)(iVar14 + 0x82) = local_18;
        *(short *)(iVar14 + 0x84) = sStack_16;
        *(undefined1 *)(iVar14 + 0x7f) = 0;
      }
      *(short *)&param_1->coord_scale_3 = *(short *)&param_1->coord_scale_3 + -1;
      break;
    }
LAB_00434046:
    local_1f = '\x01';
    local_18 = CONCAT11(local_18._1_1_,(char)local_18);
  }
  if (local_1f != '\0') {
    param_1->flags_2 = param_1->flags_2 & 0xffffbfff;
    uVar16 = *(uint *)&game_state.tribes_array[cVar3].field_0x93d;
    *(uint *)&game_state.tribes_array[cVar3].field_0x93d = uVar16 | 2;
    if ((uVar16 & 0x80000) != 0) {
      FUN_004ef180(param_1);
    }
  }
  return local_1f;
}
