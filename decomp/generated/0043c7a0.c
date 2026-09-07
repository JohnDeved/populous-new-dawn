/* Ghidra 12.1.3 pseudocode; entry 0043c7a0; FUN_0043c7a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0043c7a0(int param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  short sVar3;
  uint uVar4;
  int iVar5;
  int iVar6;
  undefined2 extraout_var;
  uint uVar7;
  char cVar8;
  unit_struct *puVar9;
  unit_struct *puVar10;
  undefined4 uVar11;
  undefined4 uVar12;
  undefined2 local_12;
  undefined4 local_10;
  undefined4 local_c;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  cVar8 = '\0';
  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 1;
    *(undefined2 *)(param_1 + 0x89) = *(undefined2 *)(param_1 + 0x72);
  }
  puVar10 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x89) != 0) &&
      (puVar9 = unit_land_array[*(ushort *)(param_1 + 0x89)], (*(byte *)&puVar9->flags_2 & 1) == 0))
     && (puVar9->unit_class != '\0')) {
    puVar10 = puVar9;
  }
  if (puVar10 == (unit_struct *)0x0) goto LAB_0043cf6f;
  if (*(char *)(param_1 + 0x2d) == '\x01') {
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      uVar4 = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      *(uint *)(param_1 + 0xc) = uVar4;
      *(uint *)(param_1 + 0xc) = uVar4 | 0x200000;
      FUN_004044b0(puVar10,&local_c);
      FUN_004e9d80(param_1,&local_c);
      FUN_004d4f40(param_1);
      local_10 = local_c;
      local_12 = CONCAT11((char)(local_c >> 0x18),(char)(local_c >> 8));
      uVar4 = (local_12 & 0xfe) * 2 | local_12 & 0xfe00;
      if ((*(byte *)((int)&game_state.level_data[0].flags + uVar4 * 4 + 1) & 2) != 0) {
        FUN_004044b0(unit_land_array
                     [(ushort)(&game_state.level_data[0].unit_index_2)[uVar4 * 2] & 0x3ff],&local_10
                    );
      }
      *(uint *)(param_1 + 0x68) = local_10;
      *(ushort *)(param_1 + 0x68) = ((ushort)local_10 & 0xfe00) + 0x100;
      *(ushort *)(param_1 + 0x6a) = (*(ushort *)(param_1 + 0x6a) & 0xfe00) + 0x100;
      *(byte *)(param_1 + 0x82) = *(byte *)(param_1 + 0x82) & 0xf0;
      *(undefined1 *)(param_1 + 0x82) = 0;
      iVar5 = FUN_00508f70(puVar10);
      if (iVar5 != 0) {
        *(undefined2 *)&puVar10->field_0xa4 = *(undefined2 *)(iVar5 + 0x24);
      }
      local_10 = local_10 & 0xffffff00;
      iVar6 = get_adjacent_unit(param_1,0x12);
      if (iVar6 == 0) {
        if (iVar5 == 0) {
          cVar8 = '\x01';
        }
      }
      else if (iVar5 == 0) {
        local_10 = CONCAT31(local_10._1_3_,7);
      }
      else if (*(int *)(iVar5 + 0x9a) <= *(int *)(iVar5 + 0x96)) {
        local_10 = CONCAT31(local_10._1_3_,4);
      }
      if ((char)local_10 != '\0') {
        *(char *)(param_1 + 0x2d) = (char)local_10;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
    }
    if (*(char *)(param_1 + 0x2d) == '\x01') {
      uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
      uVar7 = (int)uVar4 >> 0x1f;
      if ((0xb < (int)((uVar4 ^ uVar7) - uVar7)) ||
         (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
         uVar7 = (int)uVar4 >> 0x1f, bVar2 = true, 0xb < (int)((uVar4 ^ uVar7) - uVar7))) {
        bVar2 = false;
      }
      if (bVar2) {
        if ((puVar10->obj_index_anim_prev_2 == 0) || (puVar10->obj_index_anim_prev_2 != 0x99)) {
          *(undefined1 *)(param_1 + 0x2d) = 2;
        }
        else {
          *(undefined1 *)(param_1 + 0x2d) = 4;
        }
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
    }
  }
  if ((*(byte *)(param_1 + 0x2d) < 4) || (8 < *(byte *)(param_1 + 0x2d))) {
    uVar4 = *(uint *)(param_1 + 0x10) & 0xffffff7f;
    *(uint *)(param_1 + 0x10) = uVar4;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffeffff;
    *(uint *)(param_1 + 0x10) = uVar4 | 0x100;
  }
  else {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x80;
    FUN_004458d0(param_1,0,0);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10000;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffeff;
  }
  switch(*(undefined1 *)(param_1 + 0x2d)) {
  case 1:
  case 2:
  case 8:
  case 9:
    if ((puVar10->obj_index_anim_prev_2 != 0) && (puVar10->obj_index_anim_prev_2 == 0x99)) {
      uVar12 = 0x9b;
      uVar11 = 0x99;
LAB_0043ca36:
      unit_set_object_2(puVar10,0x98,uVar11,uVar12,0x28);
    }
    break;
  default:
    if ((puVar10->obj_index_anim_prev_2 != 0) && (puVar10->obj_index_anim_prev_2 == 0x9b)) {
      uVar12 = 0x99;
      uVar11 = 0x9b;
      goto LAB_0043ca36;
    }
  }
  if (cVar8 != '\0') goto LAB_0043cf79;
  switch((uint)*(byte *)(param_1 + 0x2d)) {
  case 2:
  case 3:
  case 4:
  case 5:
    puVar9 = (unit_struct *)0x0;
    if (((*(ushort *)&puVar10->field_0xa4 != 0) &&
        (puVar1 = unit_land_array[*(ushort *)&puVar10->field_0xa4],
        (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
      puVar9 = puVar1;
    }
    if (puVar9 == (unit_struct *)0x0) {
LAB_0043cf6f:
      cVar8 = '\x01';
    }
    else {
      switch(*(byte *)(param_1 + 0x2d) - 2) {
      case 0:
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          *(undefined2 *)(param_1 + 0x5f) = 0;
          FUN_0040a980(param_1,puVar10);
        }
        unit_set_object_upper
                  (param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0x1b]);
        uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar7 = (int)uVar4 >> 0x1f;
        if ((0xb < (int)((uVar4 ^ uVar7) - uVar7)) ||
           (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar7 = (int)uVar4 >> 0x1f, bVar2 = true, 0xb < (int)((uVar4 ^ uVar7) - uVar7))) {
          bVar2 = false;
        }
        if (bVar2) {
          if (*(int *)&puVar9->field_0x9a <= *(int *)&puVar9->field_0x96) {
            *(undefined1 *)(param_1 + 0x2d) = 3;
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
          }
        }
        else {
          *(undefined1 *)(param_1 + 0x2d) = 1;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        }
        break;
      case 1:
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          *(undefined2 *)(param_1 + 0x70) = 0x28;
          FUN_0048a050(puVar10,0x9f,0);
          unit_set_object_2(puVar10,0x98,0x9a,0x99,0x28);
        }
        sVar3 = *(short *)(param_1 + 0x70) + -1;
        *(short *)(param_1 + 0x70) = sVar3;
        if (sVar3 < 1) {
          *(undefined1 *)(param_1 + 0x2d) = 4;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
          unit_set_object(&puVar10->object,
                          unit_type_array_building[(byte)puVar10->unit_type].some_index,0x99);
        }
        break;
      case 2:
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          get_building_coords(puVar10,&local_c);
          uVar4 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
          *(uint *)(param_1 + 0x10) = uVar4;
          *(uint *)(param_1 + 0x10) = uVar4 | 2;
          FUN_004e9dd0(param_1,&local_c);
          FUN_004d4f40(param_1);
        }
        uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar7 = (int)uVar4 >> 0x1f;
        if ((0xb < (int)((uVar4 ^ uVar7) - uVar7)) ||
           (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar7 = (int)uVar4 >> 0x1f, bVar2 = true, 0xb < (int)((uVar4 ^ uVar7) - uVar7))) {
          bVar2 = false;
        }
        if (bVar2) {
          *(undefined1 *)(param_1 + 0x2d) = 5;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        }
        break;
      case 3:
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          *(undefined2 *)(param_1 + 0x70) = 0x18;
        }
        sVar3 = *(short *)(param_1 + 0x70) + -1;
        *(short *)(param_1 + 0x70) = sVar3;
        if (sVar3 < 1) {
          local_10 = CONCAT31(local_10._1_3_,(char)((ushort)(puVar10->pos).x >> 8)) & 0xfffffffe;
          local_10 = CONCAT22(local_10._2_2_,
                              CONCAT11((char)((ushort)(puVar10->pos).y >> 8),(char)local_10)) &
                     0xfffffeff;
          FUN_004fbf40(local_10);
          *(undefined1 *)(param_1 + 0x2d) = 6;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        }
      }
    }
    break;
  case 6:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      *(undefined2 *)(param_1 + 0x70) = 0x18;
    }
    sVar3 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar3;
    if (sVar3 < 1) {
      *(undefined1 *)(param_1 + 0x2d) = 7;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    break;
  case 7:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004044b0(puVar10,&local_c);
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffefff8;
      FUN_004e9dd0(param_1,&local_c);
      FUN_004d4f40(param_1);
    }
    uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar7 = (int)uVar4 >> 0x1f;
    if ((0xb < (int)((uVar4 ^ uVar7) - uVar7)) ||
       (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar7 = (int)uVar4 >> 0x1f, bVar2 = true, 0xb < (int)((uVar4 ^ uVar7) - uVar7))) {
      bVar2 = false;
    }
    if (bVar2) {
      *(undefined1 *)(param_1 + 0x2d) = 8;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    break;
  case 8:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004d4ee0(param_1);
      FUN_0040a980(param_1,puVar10);
      *(undefined2 *)(param_1 + 0x70) = 0x28;
      FUN_0048a050(puVar10,0x9f,0);
      puVar10->flags_2 = puVar10->flags_2 & 0xffefffff;
      empty_unit_function(puVar10);
      puVar10->state = 5;
      init_unit_class(puVar10);
      unit_set_object_2(puVar10,0x98,0x99,0x9b,0x28);
      puVar10->field_0xa7 = 0x28;
    }
    sVar3 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar3;
    if (sVar3 < 1) {
      *(undefined1 *)(param_1 + 0x2d) = 9;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    break;
  case 9:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004d4f40(param_1);
      FUN_004044b0(puVar10,&local_c);
      local_4 = 0;
      local_8 = (undefined2)local_c;
      local_6 = local_c._2_2_;
      move_pos_angle_length
                (&local_8,CONCAT22(extraout_var,puVar10->maybe_shape_angle + 0x400) & 0xffff07ff,
                 0x400);
      local_c = CONCAT22(local_6,local_8);
      local_10 = local_c;
      local_12 = CONCAT11((char)((ushort)local_6 >> 8),(char)((ushort)local_8 >> 8));
      uVar4 = (local_12 & 0xfe) * 2 | local_12 & 0xfe00;
      if ((*(byte *)((int)&game_state.level_data[0].flags + uVar4 * 4 + 1) & 2) != 0) {
        FUN_004044b0(unit_land_array
                     [(ushort)(&game_state.level_data[0].unit_index_2)[uVar4 * 2] & 0x3ff],&local_10
                    );
      }
      *(uint *)(param_1 + 0x68) = local_10;
      *(ushort *)(param_1 + 0x68) = ((ushort)local_10 & 0xfe00) + 0x100;
      *(ushort *)(param_1 + 0x6a) = (*(ushort *)(param_1 + 0x6a) & 0xfe00) + 0x100;
      *(byte *)(param_1 + 0x82) = *(byte *)(param_1 + 0x82) & 0xf0;
      *(undefined1 *)(param_1 + 0x82) = 0;
      FUN_004e9dd0(param_1,&local_c);
    }
    uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar7 = (int)uVar4 >> 0x1f;
    if ((0xb < (int)((uVar4 ^ uVar7) - uVar7)) ||
       (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar7 = (int)uVar4 >> 0x1f, bVar2 = true, 0xb < (int)((uVar4 ^ uVar7) - uVar7))) {
      bVar2 = false;
    }
    if (bVar2) goto LAB_0043cf6f;
  }
  if (cVar8 == '\0') {
    return '\0';
  }
LAB_0043cf79:
  uVar4 = *(uint *)(param_1 + 0x10) & 0xffffff7f;
  *(uint *)(param_1 + 0x10) = uVar4;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffeffff;
  *(uint *)(param_1 + 0x10) = uVar4 | 0x100;
  if (puVar10 != (unit_struct *)0x0) {
    iVar5 = FUN_00508f70(puVar10);
    if (((iVar5 == 0) && (puVar10->state != '\x05')) && (puVar10->state != '\x03')) {
      puVar10->flags_2 = puVar10->flags_2 & 0xffefffff;
      empty_unit_function(puVar10);
      puVar10->state = 5;
      init_unit_class(puVar10);
    }
    if ((puVar10->object).obj_index != 0x9b) {
      unit_set_object_2(puVar10,0x98,0x99,0x9b,0x28);
    }
  }
  return cVar8;
}
