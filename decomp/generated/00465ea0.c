/* Ghidra 12.1.3 pseudocode; entry 00465ea0; FUN_00465ea0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00465fcd) */
/* WARNING: Removing unreachable block (ram,0x00465fd7) */

void FUN_00465ea0(int param_1)

{
  short sVar1;
  unit_struct *puVar2;
  ushort uVar3;
  short sVar4;
  short sVar5;
  int iVar6;
  undefined2 extraout_var;
  uint uVar7;
  uint uVar8;
  int iVar9;
  unit_struct *puVar10;
  int iVar11;
  undefined4 local_20;
  short local_1c;
  uint local_18;
  int local_14;
  vector_48b *local_10;
  ushort *local_c;
  int local_8;
  uint local_4;

  local_14 = 0;
  sVar1 = *(short *)(param_1 + 0x26);
  iVar9 = (int)sVar1;
  local_c = (ushort *)(param_1 + 0x7a);
  local_8 = (int)(char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8;
  local_4 = iVar9 + 0x200U & 0x7ff;
  if (0 < local_8) {
    do {
      puVar10 = (unit_struct *)0x0;
      if (((*local_c != 0) &&
          (puVar2 = unit_land_array[*local_c], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
         (puVar2->unit_class != '\0')) {
        puVar10 = puVar2;
      }
      if (puVar10 != (unit_struct *)0x0) {
        iVar11 = (local_14 +
                 (char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x9 * 0xc) * 6;
        local_20 = *(undefined4 *)(param_1 + 0x3d);
        local_1c = *(undefined2 *)(param_1 + 0x41);
        move_pos_angle_length
                  (&local_20,iVar9,
                   CONCAT22((short)((uint)local_20 >> 0x10),*(undefined2 *)(&DAT_005a89e2 + iVar11))
                  );
        move_pos_angle_length
                  (&local_20,local_4,CONCAT22(extraout_var,*(undefined2 *)(&DAT_005a89e0 + iVar11)))
        ;
        iVar11 = (int)*(short *)(&DAT_005a89e4 + iVar11) + (int)*(short *)(param_1 + 0x41);
        if (*(char *)&puVar10->loc_1_z == '\0') {
          if ((puVar10->obj_index_anim_prev_2 & 0x200) == 0) {
            if ((*(byte *)&puVar10->flags_2 & 0x80) != 0) {
              puVar10->pos_x1 = sVar1;
            }
            *(short *)&puVar10->field_0x5d = sVar1;
            if ((*(byte *)((int)&puVar10->flags_2 + 1) & 0x80) == 0) {
              puVar10->maybe_shape_angle = sVar1;
            }
            else {
              puVar10->maybe_shape_angle = sVar1 + 0x400U & 0x7ff;
            }
          }
        }
        else {
          *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 2;
          uVar8 = (uint)(ushort)((short)local_20 - (puVar10->pos).x);
          uVar7 = (uint)(ushort)(local_20._2_2_ - (puVar10->pos).y);
          if (0x7fff < uVar8) {
            uVar8 = uVar8 - 0x10000;
          }
          if (0x7fff < uVar7) {
            uVar7 = uVar7 - 0x10000;
          }
          uVar3 = calc_angle_quadrant(uVar8,-uVar7);
          iVar6 = calc_distance_toroidal(&puVar10->pos,&local_20);
          local_10 = &puVar10->pos;
          local_20._0_2_ = local_10->x;
          local_20._2_2_ = local_10->y;
          local_1c = (puVar10->pos).z;
          move_pos_angle_length
                    (&local_20,uVar3 & 0x7ff,iVar6 / (int)(uint)*(byte *)&puVar10->loc_1_z);
          iVar6 = (iVar11 - local_1c) / (int)(uint)*(byte *)&puVar10->loc_1_z;
          iVar11 = iVar11 + iVar6;
          switch((uint)*(byte *)&puVar10->loc_1_z) {
          case 1:
            iVar11 = iVar11 + 0x28;
            break;
          case 2:
            iVar11 = iVar11 + 100;
            break;
          case 3:
            iVar11 = iVar11 + 100;
            break;
          case 4:
            iVar11 = iVar11 + 0x14;
          }
          sVar4 = calc_angular_diff_shortest
                            (iVar9,CONCAT22((short)((uint)iVar6 >> 0x10),
                                            *(undefined2 *)&puVar10->field_0x5d));
          sVar5 = calc_abs_angular_diff(iVar9,*(undefined2 *)&puVar10->field_0x5d);
          local_18 = (uint)*(byte *)&puVar10->loc_1_z;
          uVar3 = (short)((int)sVar4 / (int)local_18) * sVar5 + *(short *)&puVar10->field_0x5d &
                  0x7ff;
          if ((*(byte *)&puVar10->flags_2 & 0x80) != 0) {
            puVar10->pos_x1 = uVar3;
          }
          *(ushort *)&puVar10->field_0x5d = uVar3;
          if ((*(byte *)((int)&puVar10->flags_2 + 1) & 0x80) != 0) {
            uVar3 = uVar3 + 0x400 & 0x7ff;
          }
          puVar10->maybe_shape_angle = uVar3;
          if (*(char *)&puVar10->loc_1_z == '\x03') {
            puVar10->flags_4 = puVar10->flags_4 & 0xfffffbff;
          }
          if (*(byte *)&puVar10->loc_1_z < 2) {
            *(undefined1 *)(param_1 + 0xa0) = 1;
          }
        }
        local_1c = (short)iVar11;
        add_unit_to_cell(puVar10,&local_20);
        puVar10->flags_2 = puVar10->flags_2 | 0x4000;
      }
      local_c = local_c + 1;
      local_14 = local_14 + 1;
    } while (local_14 < local_8);
  }
  return;
}
