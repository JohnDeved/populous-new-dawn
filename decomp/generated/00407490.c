/* Ghidra 12.1.3 pseudocode; entry 00407490; remove_person_from_hut.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0040772a) */
/* WARNING: Removing unreachable block (ram,0x00407734) */

unit_struct * remove_person_from_hut(int param_1,int param_2)

{
  unit_struct *puVar1;
  ushort uVar2;
  short *psVar3;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 uVar4;
  int iVar5;
  unit_struct *puVar6;
  uint uVar7;
  unit_struct *puVar8;
  ushort *puVar9;
  uint uVar10;
  undefined4 local_c;
  undefined4 local_8;
  undefined2 local_4;

  puVar8 = (unit_struct *)0x0;
  if (param_1 == 0) {
    if (param_2 != 0) {
      FUN_00409ed0(param_2);
    }
  }
  else if ('\0' < *(char *)(param_1 + 0xa6)) {
    if (param_2 == 0) {
      iVar5 = 0;
      psVar3 = (short *)(param_1 + 0x86);
      do {
        if (*psVar3 != 0) break;
        psVar3 = psVar3 + 1;
        iVar5 = iVar5 + 1;
      } while (iVar5 < 6);
    }
    else {
      iVar5 = 0;
      psVar3 = (short *)(param_1 + 0x86);
      do {
        if ((int)*psVar3 == (uint)*(ushort *)(param_2 + 0x24)) break;
        psVar3 = psVar3 + 1;
        iVar5 = iVar5 + 1;
      } while (iVar5 < 6);
    }
    puVar9 = (ushort *)(param_1 + 0x86);
    if (iVar5 < 6) {
      psVar3 = (short *)(param_1 + 0x86 + iVar5 * 2);
      puVar8 = unit_land_array[*psVar3];
      *(char *)(param_1 + 0xa6) = *(char *)(param_1 + 0xa6) + -1;
      *psVar3 = 0;
      *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xfffb;
      FUN_004d80e0(puVar8,1);
      if (*(char *)(param_1 + 0x2b) == '\x04') {
        game_state._858454_1_ = game_state._858454_1_ | '\x01' << (*(byte *)(param_1 + 0x2f) & 0x1f)
        ;
      }
      if ((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48 & 1) != 0) {
        *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffefff;
        *(undefined2 *)(param_1 + 0x9a) = 0;
        iVar5 = FUN_00408d20(param_1);
        if (iVar5 == 0) {
          iVar5 = 0;
          *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xff7f;
          if (unit_type_array_building[*(byte *)(param_1 + 0x2b)].field31_0x20 != '\0') {
            do {
              puVar6 = (unit_struct *)0x0;
              if (((*puVar9 != 0) && (puVar1 = unit_land_array[*puVar9], (puVar1->flags_2 & 1) == 0)
                  ) && (puVar1->unit_class != '\0')) {
                puVar6 = puVar1;
              }
              if ((puVar6 != (unit_struct *)0x0) &&
                 (puVar6->tribe_index == *(char *)(param_1 + 0x2f))) {
                puVar6->obj_index_anim_prev_2 = puVar6->obj_index_anim_prev_2 & 0xfffb;
              }
              puVar9 = puVar9 + 1;
              iVar5 = iVar5 + 1;
            } while (iVar5 < (int)(uint)(byte)unit_type_array_building[*(byte *)(param_1 + 0x2b)].
                                              field31_0x20);
          }
        }
        else {
          *(byte *)(param_1 + 0x9c) = *(byte *)(param_1 + 0x9c) | 0x80;
          FUN_0040bbe0(param_1);
          local_8 = 0;
          if (unit_type_array_building[*(byte *)(param_1 + 0x2b)].field31_0x20 != '\0') {
            do {
              iVar5 = FUN_004077e0(*puVar9);
              if ((iVar5 != 0) && (*(char *)(iVar5 + 0x2f) == *(char *)(param_1 + 0x2f))) {
                *(byte *)(iVar5 + 0x76) = *(byte *)(iVar5 + 0x76) | 4;
              }
              puVar9 = puVar9 + 1;
              local_8 = local_8 + 1;
            } while (local_8 < (int)(uint)(byte)unit_type_array_building[*(byte *)(param_1 + 0x2b)].
                                                field31_0x20);
          }
        }
      }
      FUN_0040c4e0(param_1);
      if (*(char *)(param_1 + 0x2a) == '\t') {
        FUN_004b9fc0();
        uVar4 = extraout_var;
      }
      else {
        FUN_004044b0(param_1,&local_c);
        uVar4 = extraout_var_00;
      }
      local_8._0_2_ = (ushort)local_c;
      local_8._2_2_ = local_c._2_2_;
      local_4 = 0;
      move_pos_angle_length
                (&local_8,CONCAT22(uVar4,*(short *)(param_1 + 0x26) + 0x200) & 0xffff07ff,0x200);
      local_c = CONCAT22(local_8._2_2_,(ushort)local_8);
      puVar8->coord_scale_4 = local_c;
      *(ushort *)&puVar8->coord_scale_4 = ((ushort)local_8 & 0xfe00) + 0x100;
      *(ushort *)((int)&puVar8->coord_scale_4 + 2) =
           (*(ushort *)((int)&puVar8->coord_scale_4 + 2) & 0xfe00) + 0x100;
      *(byte *)&puVar8->loc_2_y = *(byte *)&puVar8->loc_2_y & 0xf0;
      *(undefined1 *)&puVar8->loc_2_y = 0;
      uVar10 = (uint)(ushort)((ushort)local_8 - (puVar8->pos).x);
      uVar7 = (uint)(ushort)(local_8._2_2_ - (puVar8->pos).y);
      if (0x7fff < uVar10) {
        uVar10 = uVar10 - 0x10000;
      }
      if (0x7fff < uVar7) {
        uVar7 = uVar7 - 0x10000;
      }
      uVar2 = calc_angle_quadrant(uVar10,-uVar7);
      uVar2 = uVar2 & 0x7ff;
      if ((*(byte *)&puVar8->flags_2 & 0x80) != 0) {
        puVar8->pos_x1 = uVar2;
      }
      *(ushort *)&puVar8->field_0x5d = uVar2;
      if ((*(byte *)((int)&puVar8->flags_2 + 1) & 0x80) != 0) {
        uVar2 = uVar2 + 0x400 & 0x7ff;
      }
      puVar8->maybe_shape_angle = uVar2;
      puVar8->flags_2 = puVar8->flags_2 | 0x10;
      *(undefined1 *)(param_1 + 0xab) = 0xc;
      *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xfbff;
      if ((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48 & 0x20) != 0) {
        *(undefined4 *)(param_1 + 0x7e) = game_state.offset_counter_2;
        return puVar8;
      }
    }
  }
  return puVar8;
}
