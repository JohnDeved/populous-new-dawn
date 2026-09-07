/* Ghidra 12.1.3 pseudocode; entry 004c8490; FUN_004c8490.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c8490(int param_1,int param_2)

{
  byte *pbVar1;
  int iVar2;
  byte bVar3;
  short sVar4;
  unit_struct *puVar5;
  int iVar6;
  int iVar7;
  uint uVar8;
  unit_struct *puVar9;
  ushort *puVar10;
  unit_struct *puVar11;
  undefined4 local_8;
  int local_4;

  puVar9 = (unit_struct *)0x0;
  iVar2 = param_2 * 0x52 + 0x36 + param_1;
  if (((*(ushort *)(iVar2 + 0x32) != 0) &&
      (puVar11 = unit_land_array[*(ushort *)(iVar2 + 0x32)], (*(byte *)&puVar11->flags_2 & 1) == 0))
     && (puVar11->unit_class != '\0')) {
    puVar9 = puVar11;
  }
  if ((puVar9 == (unit_struct *)0x0) || ((*(byte *)(iVar2 + 0x3e) & 2) != 0)) {
    FUN_004f6840(param_1,iVar2);
    FUN_00462770(iVar2);
  }
  else {
    switch(*(undefined2 *)(iVar2 + 0x42)) {
    case 0:
      *(undefined2 *)(iVar2 + 0x42) = 2;
    case 2:
      iVar6 = local_8;
      switch(puVar9->unit_type) {
      case 5:
        local_8 = 4;
        iVar6 = 6;
        break;
      case 6:
        local_8 = 5;
        iVar6 = 5;
        break;
      case 7:
        local_8 = 3;
        iVar6 = 7;
        break;
      case 8:
        local_8 = 6;
        iVar6 = 8;
      }
      *(int *)(iVar2 + 8) = *(int *)(iVar2 + 0x36);
      if (*(int *)(iVar2 + 0x36) == 0) {
        bVar3 = *(byte *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x9607ea + iVar6);
        iVar6 = *(int *)(param_1 + 0x91d);
        sVar4 = *(short *)(param_1 + 0xa27 + local_8 * 2);
        iVar7 = FUN_004f2ac0(param_1,puVar9->unit_type,param_2);
        iVar7 = ((int)((uint)bVar3 * iVar6) / 100 - (int)sVar4) - iVar7;
        *(int *)(iVar2 + 8) = iVar7;
        if (iVar7 < 0) {
          *(undefined4 *)(iVar2 + 8) = 0;
        }
        uVar8 = (uint)*(byte *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -0xf)
        ;
        if ((int)uVar8 <= *(int *)(iVar2 + 8)) {
          *(uint *)(iVar2 + 8) = uVar8;
        }
      }
      local_8 = 0;
      if (unit_type_array_building[(byte)puVar9->unit_type].field31_0x20 == '\0') {
        puVar11 = (unit_struct *)0x0;
      }
      else {
        puVar10 = &puVar9->loc_3_x;
        do {
          puVar11 = (unit_struct *)0x0;
          if (((*puVar10 != 0) &&
              (puVar5 = unit_land_array[*puVar10], (*(byte *)&puVar5->flags_2 & 1) == 0)) &&
             (puVar5->unit_class != '\0')) {
            puVar11 = puVar5;
          }
          if ((puVar11 != (unit_struct *)0x0) && (puVar11->unit_type != '\x02')) {
            remove_person_from_hut(puVar9,puVar11);
          }
          puVar10 = puVar10 + 1;
          local_8 = local_8 + 1;
        } while ((int)local_8 <
                 (int)(uint)(byte)unit_type_array_building[(byte)puVar9->unit_type].field31_0x20);
      }
      if ((uint)(byte)unit_type_array_building[(byte)puVar9->unit_type].field31_0x20 ==
          (int)(char)puVar9->hut_people_inside) {
        remove_person_from_hut(puVar9,puVar11);
      }
      *(undefined4 *)(iVar2 + 4) = 0;
      if (*(int *)(iVar2 + 8) != 0) {
        *(undefined2 *)(iVar2 + 0x42) = 3;
        return;
      }
      *(undefined2 *)(iVar2 + 0x42) = 8;
      return;
    case 3:
      FUN_004f5c80(param_1,iVar2,4);
      return;
    case 4:
      iVar6 = *(int *)(iVar2 + 8);
      if (99 < iVar6) {
        iVar6 = 100;
      }
      if (iVar6 < 1) {
        local_4 = 0;
      }
      else {
        local_8 = CONCAT31(local_8._1_3_,(char)((ushort)(puVar9->pos).x >> 8)) & 0xfffffffe;
        local_8 = CONCAT22(local_8._2_2_,
                           CONCAT11((char)((ushort)(puVar9->pos).y >> 8),(undefined1)local_8)) &
                  0xfffffeff;
        local_4 = FUN_004f8490(param_1,2,2,puVar9->unit_index,1,local_8,6,iVar6,&DAT_00a0d108);
      }
      if (local_4 == 0) {
        if (*(int *)(iVar2 + 4) != 0) {
          *(undefined2 *)(iVar2 + 0x42) = 5;
          *(undefined1 *)(param_1 + 0x5b1) = 0x14;
          return;
        }
        FUN_004f6440(param_1,iVar2);
        FUN_004f65e0(param_1);
        *(undefined2 *)(iVar2 + 0x42) = 8;
        return;
      }
      *(int *)(iVar2 + 4) = *(int *)(iVar2 + 4) + local_4;
      if (0 < local_4) {
        puVar10 = &DAT_00a0d10a;
        local_8 = local_4;
        do {
          puVar9 = unit_land_array[*puVar10];
          if ((*(byte *)((int)&puVar9->flags_2 + 2) & 0x10) == 0) {
            *(undefined1 *)((int)&puVar9->loc_1_y + 1) = puVar9->state;
            empty_unit_function(puVar9);
            puVar9->state = 0xe;
            init_unit_class(puVar9);
          }
          pbVar1 = (byte *)((int)&puVar9->obj_index_anim_prev_2 + 1);
          *pbVar1 = *pbVar1 | 8;
          puVar10 = puVar10 + 2;
          local_8 = local_8 + -1;
        } while (local_8 != 0);
      }
      local_4 = *(int *)(iVar2 + 8) - local_4;
      *(int *)(iVar2 + 8) = local_4;
      if (local_4 < 1) {
        *(undefined2 *)(iVar2 + 0x42) = 5;
        *(undefined1 *)(param_1 + 0x5b1) = 0x14;
        return;
      }
      break;
    case 5:
      FUN_004f5d10(param_1,iVar2,6);
      return;
    case 6:
      if ((puVar9->tribe_index == *(char *)(param_1 + 0xc22)) && (puVar9->state != '\x01')) {
        FUN_00435730(param_1,8,puVar9->unit_index,0);
        FUN_004f6440(param_1,iVar2);
        FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
        FUN_00418ce0(param_1,0xe);
        *(undefined2 *)(iVar2 + 0x42) = 7;
        *(undefined4 *)(iVar2 + 0xc) = 0;
        return;
      }
      FUN_004f6440(param_1,iVar2);
      FUN_004f65e0(param_1);
      *(undefined2 *)(iVar2 + 0x42) = 8;
      return;
    case 7:
      iVar6 = get_num_tribe_sub_struct_flag_1_set(param_1);
      *(int *)(iVar2 + 0xc) = *(int *)(iVar2 + 0xc) + iVar6;
      if (((uint)(byte)unit_type_array_building[(byte)puVar9->unit_type].field31_0x20 ==
           (int)(char)puVar9->hut_people_inside) || (300 < *(int *)(iVar2 + 0xc))) {
        *(undefined2 *)(iVar2 + 0x42) = 8;
        return;
      }
      break;
    case 8:
      FUN_004f6840(param_1,iVar2);
      FUN_00462770(iVar2);
      return;
    }
  }
  return;
}
