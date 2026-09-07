/* Ghidra 12.1.3 pseudocode; entry 00518630; FUN_00518630.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0051875e) */
/* WARNING: Removing unreachable block (ram,0x00518db7) */
/* WARNING: Removing unreachable block (ram,0x00518a4b) */
/* WARNING: Removing unreachable block (ram,0x00518dc1) */
/* WARNING: Removing unreachable block (ram,0x0051890f) */
/* WARNING: Removing unreachable block (ram,0x00518a55) */
/* WARNING: Removing unreachable block (ram,0x0051876a) */
/* WARNING: Removing unreachable block (ram,0x00518919) */

void FUN_00518630(int param_1)

{
  byte bVar1;
  short sVar2;
  short sVar3;
  unit_struct *puVar4;
  undefined4 uVar5;
  bool bVar6;
  bool bVar7;
  char cVar8;
  ushort uVar9;
  short sVar10;
  uint uVar11;
  int iVar12;
  uint uVar13;
  unit_struct *puVar14;
  unit_struct *puVar15;
  unit_struct *puVar16;
  unit_struct *puVar17;
  unit_struct *local_28;
  uint local_24;
  int local_20;
  short local_1c;
  short local_1a;
  uint local_18;
  uint local_14;
  short local_10;
  short local_e;
  undefined2 local_c;
  undefined2 local_a;
  undefined2 local_8;
  undefined2 uStack_6;
  undefined2 local_4;

  puVar14 = (unit_struct *)0x0;
  bVar6 = false;
  bVar7 = false;
  if (((*(ushort *)(param_1 + 0x6a) != 0) &&
      (puVar17 = unit_land_array[*(ushort *)(param_1 + 0x6a)], (*(byte *)&puVar17->flags_2 & 1) == 0
      )) && (puVar17->unit_class != '\0')) {
    puVar14 = puVar17;
  }
  puVar17 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x6c) != 0) &&
      (puVar15 = unit_land_array[*(ushort *)(param_1 + 0x6c)], (*(byte *)&puVar15->flags_2 & 1) == 0
      )) && (puVar15->unit_class != '\0')) {
    puVar17 = puVar15;
  }
  if ((puVar14 != (unit_struct *)0x0) && (puVar17 != (unit_struct *)0x0)) {
    if (puVar17->tribe_index != puVar14->tribe_index) {
      if ((player_tribe_num == puVar14->tribe_index) || (player_tribe_num == puVar17->tribe_index))
      {
        DAT_0089d167 = 2;
      }
      local_20 = 0;
      do {
        if (bVar6) goto LAB_00518f5c;
        puVar15 = puVar14;
        puVar16 = puVar17;
        if (local_20 == 0) {
          puVar15 = puVar17;
          puVar16 = puVar14;
        }
        if (puVar16->state == '\x1d') {
          bVar1 = puVar16->state_2;
          if ((bVar1 == 0) || (3 < bVar1)) {
            switch(bVar1) {
            case 4:
              if ((puVar16->flags_2 & 0x40000000) != 0) {
                puVar16->flags_2 = puVar16->flags_2 & 0xbfffffff;
                puVar16->coord_scale_3 = 0x28;
                puVar16->coord_scale_1 = 0;
                FUN_004d4ee0(puVar16);
                local_24 = (uint)(ushort)((puVar15->pos).x - (puVar16->pos).x);
                uVar11 = (uint)(ushort)((puVar15->pos).y - (puVar16->pos).y);
                if (0x7fff < local_24) {
                  local_24 = local_24 - 0x10000;
                }
                if (0x7fff < uVar11) {
                  uVar11 = uVar11 - 0x10000;
                }
                uVar9 = calc_angle_quadrant(local_24,-uVar11);
                update_gs_unit_related_array_item(puVar16);
                uVar11 = puVar16->flags_2;
                puVar16->flags_2 = uVar11 | 0x80;
                puVar16->flags_2 = uVar11 | 0x1080;
                puVar16->pos_x1 = uVar9 & 0x7ff;
              }
              FUN_004d4da0(puVar16,8);
              sVar2._0_1_ = puVar16->coord_scale_3;
              sVar2._1_1_ = puVar16->coord_scale_1;
              if (sVar2 < 1) goto LAB_00518f33;
              break;
            case 5:
            case 8:
              if ((puVar16->flags_2 & 0x40000000) != 0) {
                puVar16->flags_2 = puVar16->flags_2 & 0xbfffffff;
                puVar16->coord_scale_3 = 0x28;
                puVar16->coord_scale_1 = 0;
                FUN_004d5010(puVar16);
              }
              FUN_004e9dd0(puVar16,&puVar15->pos);
              sVar10 = *(short *)&puVar16->coord_scale_3 + -1;
              *(short *)&puVar16->coord_scale_3 = sVar10;
              if (sVar10 < 1) goto LAB_00518f33;
              uVar11 = (int)(short)(puVar15->pos).x - (int)(short)(puVar16->pos).x;
              uVar13 = (int)uVar11 >> 0x1f;
              if (((int)((uVar11 ^ uVar13) - uVar13) < 0x13b) &&
                 (uVar11 = (int)(short)(puVar15->pos).y - (int)(short)(puVar16->pos).y,
                 uVar13 = (int)uVar11 >> 0x1f, (int)((uVar11 ^ uVar13) - uVar13) < 0x13b)) {
                if ((game_state.level_flags & 0x40) == 0) {
                  if (puVar16->state_2 == '\b') {
                    if (puVar17->state_2 == '\x04') {
                      bVar7 = true;
                    }
                  }
                  else if (puVar15->state_2 == '\x04') {
                    puVar14->state_2 = 6;
                    puVar14->flags_2 = puVar14->flags_2 | 0x40000000;
                  }
                }
                else {
                  bVar7 = true;
                }
              }
              break;
            case 6:
              if ((puVar16->flags_2 & 0x40000000) != 0) {
                puVar16->flags_2 = puVar16->flags_2 & 0xbfffffff;
                puVar16->field36_0x5f = 0;
                FUN_004d3ff0(puVar16,10);
                *(ushort *)&puVar16->coord_scale_3 =
                     ((char)obj_related_array[(byte)(puVar16->object).obj_related_index + 3]._f2 + 1
                     ) * (ushort)(byte)vstart_related[(short)(puVar16->object).obj_index].
                                       frame_counter;
                uVar11 = (uint)(ushort)((puVar15->pos).x - (puVar16->pos).x);
                uVar13 = (uint)(ushort)((puVar15->pos).y - (puVar16->pos).y);
                if (0x7fff < uVar11) {
                  uVar11 = uVar11 - 0x10000;
                }
                if (0x7fff < uVar13) {
                  uVar13 = uVar13 - 0x10000;
                }
                uVar9 = calc_angle_quadrant(uVar11,-uVar13);
                uVar9 = uVar9 & 0x7ff;
                if ((*(byte *)&puVar16->flags_2 & 0x80) != 0) {
                  puVar16->pos_x1 = uVar9;
                }
                *(ushort *)&puVar16->field_0x5d = uVar9;
                if ((*(byte *)((int)&puVar16->flags_2 + 1) & 0x80) == 0) {
                  puVar16->maybe_shape_angle = uVar9;
                }
                else {
                  puVar16->maybe_shape_angle = uVar9 + 0x400 & 0x7ff;
                }
                update_gs_unit_related_array_item(puVar16);
                uVar11 = puVar16->flags_2;
                puVar16->flags_2 = uVar11 | 0x80;
                puVar16->flags_2 = uVar11 | 0x1080;
                puVar16->pos_x1 = uVar9;
              }
              sVar10 = *(short *)&puVar16->coord_scale_3 + -1;
              *(short *)&puVar16->coord_scale_3 = sVar10;
              if (sVar10 == 2) {
                puVar17->state_2 = 7;
                puVar17->flags_2 = puVar17->flags_2 | 0x40000000;
              }
              sVar10._0_1_ = puVar16->coord_scale_3;
              sVar10._1_1_ = puVar16->coord_scale_1;
              if (sVar10 < 1) {
                FUN_0048a050(puVar16,0xd,0);
                puVar16->state_2 = 8;
                puVar16->flags_2 = puVar16->flags_2 | 0x40000000;
              }
              break;
            case 7:
              if ((puVar16->flags_2 & 0x40000000) != 0) {
                puVar16->flags_2 = puVar16->flags_2 & 0xbfffffff;
                puVar16->coord_scale_3 = 2;
                puVar16->coord_scale_1 = 0;
                uVar11 = puVar16->flags_2;
                puVar16->flags_2 = uVar11 | 0x2000;
                puVar16->flags_2 = uVar11 | 0x82000;
                puVar16->flags_4 = puVar16->flags_4 | 0x2000;
                puVar16->flags_3 = puVar16->flags_3 | 0x8000000;
                unit_set_object_upper
                          (puVar16,unit_type_to_obj_indexes_map[(byte)puVar16->unit_type + 99]);
                uVar11 = (uint)(ushort)((puVar15->pos).x - (puVar16->pos).x);
                uVar13 = (uint)(ushort)((puVar15->pos).y - (puVar16->pos).y);
                if (0x7fff < uVar11) {
                  uVar11 = uVar11 - 0x10000;
                }
                if (0x7fff < uVar13) {
                  uVar13 = uVar13 - 0x10000;
                }
                uVar9 = calc_angle_quadrant(uVar11,-uVar13);
                sVar10 = (short)(uVar9 & 0x7ff);
                if ((*(byte *)&puVar16->flags_2 & 0x80) != 0) {
                  puVar16->pos_x1 = sVar10;
                }
                *(short *)&puVar16->field_0x5d = sVar10;
                if ((*(byte *)((int)&puVar16->flags_2 + 1) & 0x80) == 0) {
                  puVar16->maybe_shape_angle = sVar10;
                }
                else {
                  puVar16->maybe_shape_angle = sVar10 + 0x400U & 0x7ff;
                }
                update_gs_unit_related_array_item(puVar16);
                uVar11 = puVar16->flags_2;
                puVar16->flags_2 = uVar11 | 0x80;
                puVar16->flags_2 = uVar11 | 0x1080;
                puVar16->pos_x1 = sVar10;
                uVar11 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
                local_14 = uVar11 >> 0xd | uVar11 * 0x80000;
                uVar11 = local_14 * 0x24a1 + 0x24df;
                game_state.pseudo_random_val = uVar11 >> 0xd | uVar11 * 0x80000;
                local_18 = game_state.pseudo_random_val;
                FUN_004e93f0(&puVar16->vec2,&puVar16->pos,game_state.pseudo_random_val % 100 + 100,
                             (uVar9 & 0x7ff) + local_14 % 0x2aa + 0x2ab & 0x7ff);
              }
              if (*(short *)&puVar16->coord_scale_3 < 1) {
                if ((*(byte *)((int)&puVar16->flags_2 + 2) & 8) == 0) {
                  puVar16->state_2 = 4;
                  puVar16->flags_2 = puVar16->flags_2 | 0x40000000;
                }
              }
              else {
                sVar10 = *(short *)&puVar16->coord_scale_3 + -1;
                *(short *)&puVar16->coord_scale_3 = sVar10;
                if (sVar10 == 0) {
                  FUN_004d4ee0(puVar16);
                }
              }
            }
          }
          else {
            local_28 = (unit_struct *)0x0;
            uVar9 = *(ushort *)(param_1 + 0x68);
            if (((uVar9 != 0) &&
                (puVar4 = unit_land_array[uVar9], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
               (puVar4->unit_class != '\0')) {
              local_28 = puVar4;
            }
            if ((local_28 == (unit_struct *)0x0) || (local_28->unit_class != '\x02'))
            goto LAB_00518f33;
            *(ushort *)((int)&puVar16->loc_3_y + 1) = uVar9;
            cVar8 = puVar16->state_2;
            if (cVar8 == '\x01') {
              if ((puVar16->flags_2 & 0x40000000) != 0) {
                puVar16->flags_2 = puVar16->flags_2 & 0xbfffffff;
                puVar16->field_0xa8 = 0x1f;
                *(byte *)&puVar16->obj_index_anim_prev_2 =
                     (byte)puVar16->obj_index_anim_prev_2 | 0x10;
                puVar16->coord_scale_3 = 100;
                puVar16->coord_scale_1 = 0;
              }
              puVar16->flags_2 = puVar16->flags_2 & 0xfdffffff;
              sVar10 = *(short *)&puVar16->coord_scale_3 + -1;
              *(short *)&puVar16->coord_scale_3 = sVar10;
              if (sVar10 < 0) goto LAB_00518f33;
              cVar8 = FUN_00439030(puVar16);
              if (cVar8 != '\0') {
                puVar16->state_2 = 2;
                puVar16->flags_2 = puVar16->flags_2 | 0x40000000;
              }
            }
            else if (cVar8 == '\x02') {
              if ((puVar16->flags_2 & 0x40000000) != 0) {
                puVar16->flags_2 = puVar16->flags_2 & 0xbfffffff;
                puVar16->field_0xa8 = 4;
                *(byte *)&puVar16->obj_index_anim_prev_2 =
                     (byte)puVar16->obj_index_anim_prev_2 | 0x10;
                puVar16->coord_scale_3 = 100;
                puVar16->coord_scale_1 = 0;
                get_building_coords(local_28,&local_c);
                local_4 = 0;
                local_8 = local_c;
                uVar5 = CONCAT22(uStack_6,local_c);
                uStack_6 = local_a;
                local_4 = calc_point_height(uVar5,local_a);
                add_unit_to_cell(puVar16,&local_8);
              }
              cVar8 = FUN_004391a0(puVar16);
              if (cVar8 != '\0') goto LAB_00518f33;
              if (puVar15->state_2 == '\x02') {
                puVar14->state_2 = 3;
                puVar14->flags_2 = puVar14->flags_2 | 0x40000000;
                puVar17->state_2 = 3;
                puVar17->flags_2 = puVar17->flags_2 | 0x40000000;
              }
            }
            else if ((cVar8 == '\x03') && (local_20 != 0)) {
              if ((puVar16->flags_2 & 0x40000000) != 0) {
                puVar16->flags_2 = puVar16->flags_2 & 0xbfffffff;
                FUN_004044b0(local_28,&local_1c);
                get_building_coords(local_28,&local_10);
                uVar11 = puVar14->flags_4 & 0xfffefff8;
                puVar14->flags_4 = uVar11;
                puVar14->flags_4 = uVar11 | 4;
                uVar11 = puVar17->flags_4 & 0xfffefff8;
                puVar17->flags_4 = uVar11;
                puVar17->flags_4 = uVar11 | 4;
                FUN_004e9dd0(puVar14,&local_1c);
                FUN_004d4ee0(puVar14);
                puVar17->flags_2 = puVar17->flags_2 | 0x8000;
                uVar11 = (uint)(ushort)(local_1c - local_10);
                uVar13 = (uint)(ushort)(local_1a - local_e);
                if (0x7fff < uVar11) {
                  uVar11 = uVar11 - 0x10000;
                }
                if (0x7fff < uVar13) {
                  uVar13 = uVar13 - 0x10000;
                }
                uVar9 = calc_angle_quadrant(uVar11,-uVar13);
                uVar9 = uVar9 & 0x7ff;
                if ((*(byte *)&puVar17->flags_2 & 0x80) != 0) {
                  puVar17->pos_x1 = uVar9;
                }
                *(ushort *)&puVar17->field_0x5d = uVar9;
                if ((*(byte *)((int)&puVar17->flags_2 + 1) & 0x80) != 0) {
                  uVar9 = uVar9 + 0x400 & 0x7ff;
                }
                puVar17->maybe_shape_angle = uVar9;
                puVar17->coord_scale_3 = 6;
                puVar17->coord_scale_1 = 0;
                puVar17->field_0xaa = 100;
                puVar17->field36_0x5f = 0;
              }
              uVar9 = CONCAT11((char)((ushort)(puVar17->pos).y >> 8),
                               (char)((ushort)(puVar17->pos).x >> 8));
              if ((*(byte *)((int)&game_state.level_data[0].flags +
                            ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 1) & 2) != 0) {
                puVar17->flags_2 = puVar17->flags_2 | 0x80000;
                puVar17->flags_3 = puVar17->flags_3 | 0x8000000;
                puVar17->flags_4 = puVar17->flags_4 | 0x2000;
                unit_set_object_upper
                          (puVar17,unit_type_to_obj_indexes_map[(byte)puVar17->unit_type + 99]);
                puVar17->flags_2 = puVar17->flags_2 | 0x8000;
                FUN_004e93f0(&puVar17->vec2,&puVar17->pos,(int)(char)puVar17->field_0xaa,
                             (int)*(short *)&puVar17->field_0x5d);
                if (('\'' < (char)puVar17->field_0xaa) &&
                   (iVar12 = (char)puVar17->field_0xaa * 0xc,
                   cVar8 = (char)((int)(iVar12 + (iVar12 >> 0x1f & 0xfU)) >> 4),
                   puVar17->field_0xaa = cVar8, cVar8 < '\x1e')) {
                  puVar17->field_0xaa = 0x1e;
                }
              }
              if ((*(short *)&puVar17->coord_scale_3 != 0) &&
                 (sVar10 = *(short *)&puVar17->coord_scale_3 + -1,
                 *(short *)&puVar17->coord_scale_3 = sVar10, sVar10 == 0)) {
                puVar14->flags_4 = puVar14->flags_4 & 0xfffefff8;
                puVar14->state_2 = 5;
                puVar14->flags_2 = puVar14->flags_2 | 0x40000000;
              }
              if ((*(byte *)((int)&puVar17->flags_2 + 2) & 8) == 0) {
                sVar3._0_1_ = puVar17->coord_scale_3;
                sVar3._1_1_ = puVar17->coord_scale_1;
                if (sVar3 != 0) {
                  puVar14->flags_4 = puVar14->flags_4 & 0xfffefff8;
                  puVar14->state_2 = 5;
                  puVar14->flags_2 = puVar14->flags_2 | 0x40000000;
                }
                puVar17->flags_4 = puVar17->flags_4 & 0xfffefff8;
                puVar17->flags_2 = puVar17->flags_2 & 0xffff7fff;
                puVar17->state_2 = 4;
                puVar17->flags_2 = puVar17->flags_2 | 0x40000000;
              }
            }
          }
        }
        else {
LAB_00518f33:
          bVar6 = true;
        }
        local_20 = local_20 + 1;
      } while (local_20 < 2);
      goto LAB_00518f4e;
    }
  }
  bVar6 = true;
LAB_00518f4e:
  if ((bVar6) || (bVar7)) {
LAB_00518f5c:
    if (puVar14 != (unit_struct *)0x0) {
      *(undefined2 *)&puVar14->field_0x9d = 0;
    }
    if (puVar17 != (unit_struct *)0x0) {
      *(undefined2 *)&puVar17->field_0x9d = 0;
    }
    update_after_unit_alloc(param_1);
    if (bVar7) {
      FUN_0051de60(puVar14,puVar17);
    }
  }
  return;
}
