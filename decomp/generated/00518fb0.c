/* Ghidra 12.1.3 pseudocode; entry 00518fb0; FUN_00518fb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0051928d) */
/* WARNING: Removing unreachable block (ram,0x00519574) */
/* WARNING: Removing unreachable block (ram,0x00519297) */
/* WARNING: Removing unreachable block (ram,0x0051957e) */

void FUN_00518fb0(int param_1)

{
  int *piVar1;
  unit_struct *puVar2;
  bool bVar3;
  char cVar4;
  undefined1 uVar5;
  ushort uVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  int iVar10;
  short sVar11;
  int iVar12;
  unit_struct *puVar13;
  ushort *puVar14;
  unit_struct *puVar15;
  undefined4 uVar16;
  byte local_4b;
  char local_4a;
  char local_49;
  ushort local_48;
  short local_46;
  int local_44;
  int local_40;
  uint local_3c;
  uint local_38;
  uint local_34;
  uint local_30;
  uint local_2c;
  int *local_28;
  uint local_24;
  ushort local_20;
  ushort uStack_1e;
  undefined2 local_1c;
  int local_18 [6];

  local_4a = '\0';
  local_49 = '\0';
  uVar8 = *(uint *)(param_1 + 0x10);
  if (((uVar8 & 0x100000) != 0) && (*(char *)(param_1 + 0x2a) != '\n')) {
    if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
      if (*(char *)(param_1 + 0x31) == '\0') {
        *(uint *)(param_1 + 0x10) = uVar8 & 0xffefffff;
        *(uint *)(param_1 + 0x10) = uVar8 & 0xffcfffff;
      }
      else {
        *(char *)(param_1 + 0x31) = *(char *)(param_1 + 0x31) + -1;
      }
    }
    if ((*(char *)(param_1 + 0x32) != '\0') &&
       (cVar4 = *(char *)(param_1 + 0x32) + -1, *(char *)(param_1 + 0x32) = cVar4, cVar4 == '\0')) {
      *(undefined1 *)(param_1 + 0x31) = 0;
      uVar8 = *(uint *)(param_1 + 0x10);
      *(uint *)(param_1 + 0x10) = uVar8 & 0xffdfffff;
      *(uint *)(param_1 + 0x10) = uVar8 & 0xffcfffff;
    }
  }
  cVar4 = FUN_00519a70(param_1,local_18);
  if (cVar4 == '\0') {
    local_4a = '\x01';
  }
  else {
    FUN_005199f0(param_1,local_18,&local_24,&local_4b);
    iVar12 = local_18[local_4b];
    if (*(ushort *)(param_1 + 0x6c) != local_24) {
      *(short *)(param_1 + 0x6c) = (short)local_24;
      add_unit_to_cell(param_1,iVar12 + 0x3d);
      *(ushort *)(param_1 + 0x26) = *(short *)(param_1 + 0x26) + 0x400U & 0x7ff;
    }
    if (local_4b != 0) {
      uVar8 = (uint)local_4b;
      local_4b = 0;
      iVar12 = local_18[uVar8];
      local_18[uVar8] = local_18[0];
      local_18[0] = iVar12;
    }
    if (((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) &&
       (uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df, uVar8 = uVar7 >> 0xd,
       local_38 = uVar8 | uVar7 * 0x80000, game_state.pseudo_random_val = local_38, (uVar8 & 1) == 0
       )) {
      uVar8 = local_38 * 0x24a1 + 0x24df;
      local_2c = uVar8 >> 0xd | uVar8 * 0x80000;
      uVar8 = local_2c % 0x155 + 0x71;
      sVar11 = (short)uVar8;
      if ((uVar8 & 1) != 0) {
        sVar11 = -sVar11;
      }
      game_state.pseudo_random_val = local_2c;
      *(ushort *)(param_1 + 0x26) = *(short *)(param_1 + 0x26) + sVar11 & 0x7ff;
    }
    FUN_00519d10(param_1,0);
    local_28 = local_18;
    local_40 = (int)*(char *)(param_1 + 0x68);
    local_44 = 0;
    if (0 < local_40) {
      do {
        puVar15 = (unit_struct *)*local_28;
        if (puVar15->state == '\x19') {
          if (puVar15->tribe_index == player_tribe_num) {
            DAT_0089d167 = 2;
          }
          if (puVar15->state_2 == '\0') {
            FUN_004d4f40(puVar15);
            FUN_0051e3d0(&local_48,param_1,local_44);
            uVar8 = (int)(short)local_48 - (int)(short)(puVar15->pos).x;
            uVar7 = (int)uVar8 >> 0x1f;
            if ((0xb < (int)((uVar8 ^ uVar7) - uVar7)) ||
               (uVar8 = (int)local_46 - (int)(short)(puVar15->pos).y, uVar7 = (int)uVar8 >> 0x1f,
               bVar3 = true, 0xb < (int)((uVar8 ^ uVar7) - uVar7))) {
              bVar3 = false;
            }
            if (bVar3) {
              local_1c = 0;
              local_20 = local_48;
              uVar16 = CONCAT22(uStack_1e,local_48);
              uStack_1e = local_46;
              local_1c = calc_point_height(uVar16,local_46);
              add_unit_to_cell(puVar15,&local_20);
              puVar15->state_2 = 1;
              puVar15->flags_2 = puVar15->flags_2 | 0x40000000;
            }
            else {
              FUN_004e9dd0(puVar15,&local_48);
            }
          }
          if (puVar15->state_2 != '\x01') goto LAB_0051947e;
          if ((puVar15->flags_2 & 0x40000000) != 0) {
            puVar15->flags_2 = puVar15->flags_2 & 0xbfffffff;
            FUN_004d4ee0(puVar15);
            if (local_44 != 0) {
              uVar8 = (uint)(ushort)(*(short *)(param_1 + 0x3d) - (puVar15->pos).x);
              uVar7 = (uint)(ushort)(*(short *)(param_1 + 0x3f) - (puVar15->pos).y);
              if (0x7fff < uVar8) {
                uVar8 = uVar8 - 0x10000;
              }
              if (0x7fff < uVar7) {
                uVar7 = uVar7 - 0x10000;
              }
              uVar6 = calc_angle_quadrant(uVar8,-uVar7);
              uVar6 = uVar6 & 0x7ff;
              if ((*(byte *)&puVar15->flags_2 & 0x80) != 0) {
                puVar15->pos_x1 = uVar6;
              }
              *(ushort *)&puVar15->field_0x5d = uVar6;
              if ((*(byte *)((int)&puVar15->flags_2 + 1) & 0x80) == 0) {
                puVar15->maybe_shape_angle = uVar6;
              }
              else {
                puVar15->maybe_shape_angle = uVar6 + 0x400 & 0x7ff;
              }
              update_gs_unit_related_array_item(puVar15);
              uVar8 = puVar15->flags_2;
              puVar15->flags_2 = uVar8 | 0x80;
              puVar15->flags_2 = uVar8 | 0x1080;
              puVar15->pos_x1 = uVar6;
            }
          }
          FUN_0051e3d0(&local_48,param_1,local_44);
          uVar8 = (int)(short)local_48 - (int)(short)(puVar15->pos).x;
          uVar7 = (int)uVar8 >> 0x1f;
          if ((0xb < (int)((uVar8 ^ uVar7) - uVar7)) ||
             (uVar8 = (int)local_46 - (int)(short)(puVar15->pos).y, uVar7 = (int)uVar8 >> 0x1f,
             bVar3 = true, 0xb < (int)((uVar8 ^ uVar7) - uVar7))) {
            bVar3 = false;
          }
          if (bVar3) {
            uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar8 = uVar7 >> 0xd;
            local_3c = uVar8 | uVar7 * 0x80000;
            iVar12 = 0;
            uVar7 = uVar8 & 0xf;
            game_state.pseudo_random_val = local_3c;
            if (local_44 == 0) {
              uVar9 = local_3c * 0x24a1 + 0x24df;
              game_state.pseudo_random_val = uVar9 >> 0xd | uVar9 * 0x80000;
              iVar12 = game_state.pseudo_random_val % (local_40 - 1U) + 1;
              local_30 = game_state.pseudo_random_val;
            }
            piVar1 = local_18 + iVar12;
            iVar10 = *piVar1;
            if ((*(char *)(iVar10 + 0x2c) == '\x19') && (*(char *)(iVar10 + 0x2d) == '\x01')) {
              puVar15->coord_scale_2 = *(short *)(iVar10 + 0x24);
              cVar4 = '\x02';
              if (puVar15->unit_type == '\a') {
                if (6 < uVar7) {
                  cVar4 = '\x04';
                }
              }
              else if (4 < uVar7) {
                cVar4 = (uVar7 < 0xe) + '\x03';
              }
              puVar15->state_2 = cVar4;
              goto LAB_00519477;
            }
            if (uVar7 < 4) {
              FUN_0051e3d0(&local_48,param_1,iVar12);
              iVar12 = calc_squared_distance_toroidal(*piVar1 + 0x3d,&local_48);
              if (iVar12 < 0x1fa40) {
                iVar12 = *piVar1;
                if (*(char *)(iVar12 + 0x2c) == '\x19') {
                  if (local_40 < 3) goto LAB_0051947e;
                  puVar15->coord_scale_2 = *(short *)(iVar12 + 0x24);
                  puVar15->state_2 = ((uVar8 & 1) == 0) + '\x03';
                }
                else {
                  puVar15->coord_scale_2 = *(short *)(iVar12 + 0x24);
                  puVar15->state_2 = 4;
                }
                goto LAB_00519477;
              }
            }
          }
          else {
            puVar15->state_2 = 0;
LAB_00519477:
            puVar15->flags_2 = puVar15->flags_2 | 0x40000000;
          }
LAB_0051947e:
          switch(puVar15->state_2) {
          case 2:
          case 3:
          case 4:
            if ((puVar15->flags_2 & 0x40000000) != 0) {
              puVar15->flags_2 = puVar15->flags_2 & 0xbfffffff;
              puVar15->field36_0x5f = 0;
              cVar4 = puVar15->state_2;
              if (cVar4 == '\x02') {
                FUN_004d3ff0(puVar15,10);
              }
              else if (cVar4 == '\x03') {
                FUN_004d3ff0(puVar15,8);
              }
              else if (cVar4 == '\x04') {
                FUN_004d3ff0(puVar15,0x10);
                (puVar15->object).f2 = 0;
                (puVar15->object).f1 = 1;
              }
              puVar13 = (unit_struct *)0x0;
              (puVar15->object).f2 = 0;
              (puVar15->object).f1 = 1;
              *(ushort *)&puVar15->coord_scale_3 =
                   ((char)obj_related_array[(byte)(puVar15->object).obj_related_index + 3]._f2 + 1)
                   * (ushort)(byte)vstart_related[(short)(puVar15->object).obj_index].frame_counter;
              if (((puVar15->coord_scale_2 != 0) &&
                  (puVar2 = unit_land_array[(ushort)puVar15->coord_scale_2],
                  (*(byte *)&puVar2->flags_2 & 1) == 0)) && (puVar2->unit_class != '\0')) {
                puVar13 = puVar2;
              }
              if (puVar13 != (unit_struct *)0x0) {
                uVar8 = (uint)(ushort)((puVar15->pos).x - (puVar13->pos).x);
                uVar7 = (uint)(ushort)((puVar15->pos).y - (puVar13->pos).y);
                if (0x7fff < uVar8) {
                  uVar8 = uVar8 - 0x10000;
                }
                if (0x7fff < uVar7) {
                  uVar7 = uVar7 - 0x10000;
                }
                uVar6 = calc_angle_quadrant(uVar8,-uVar7);
                uVar6 = uVar6 & 0x7ff;
                FUN_004a39c0(puVar13,puVar15,puVar15->state_2 == '\x04');
                if ((puVar13->state == '\x19') && (puVar13->state_2 == '\x01')) {
                  uVar5 = 6;
                  if ((puVar13->unit_type != '\a') &&
                     (((game_state.level_flags & 0x40) == 0 && (puVar15->state_2 == '\x02')))) {
                    uVar5 = 5;
                  }
                  puVar13->state_2 = uVar5;
                  uVar8 = puVar13->flags_2;
                  puVar13->flags_2 = uVar8 | 0x40000000;
                  if ((uVar8 & 0x80) != 0) {
                    puVar13->pos_x1 = uVar6;
                  }
                  *(ushort *)&puVar13->field_0x5d = uVar6;
                  if ((*(byte *)((int)&puVar13->flags_2 + 1) & 0x80) == 0) {
                    puVar13->maybe_shape_angle = uVar6;
                  }
                  else {
                    puVar13->maybe_shape_angle = uVar6 + 0x400 & 0x7ff;
                  }
                  update_gs_unit_related_array_item(puVar13);
                  uVar8 = puVar13->flags_2;
                  puVar13->flags_2 = uVar8 | 0x80;
                  puVar13->flags_2 = uVar8 | 0x1080;
                  puVar13->pos_x1 = uVar6;
                }
                uVar6 = uVar6 + 0x400 & 0x7ff;
                if ((*(byte *)&puVar15->flags_2 & 0x80) != 0) {
                  puVar15->pos_x1 = uVar6;
                }
                *(ushort *)&puVar15->field_0x5d = uVar6;
                if ((*(byte *)((int)&puVar15->flags_2 + 1) & 0x80) == 0) {
                  puVar15->maybe_shape_angle = uVar6;
                }
                else {
                  puVar15->maybe_shape_angle = uVar6 + 0x400 & 0x7ff;
                }
                update_gs_unit_related_array_item(puVar15);
                uVar8 = puVar15->flags_2;
                puVar15->flags_2 = uVar8 | 0x80;
                puVar15->flags_2 = uVar8 | 0x1080;
                puVar15->pos_x1 = uVar6;
              }
            }
            sVar11 = *(short *)&puVar15->coord_scale_3 + -1;
            *(short *)&puVar15->coord_scale_3 = sVar11;
            if (sVar11 < 1) {
              cVar4 = puVar15->state_2;
              puVar13 = puVar15;
              if (cVar4 == '\x02') {
LAB_00519718:
                uVar16 = 0xd;
              }
              else {
                if (cVar4 != '\x03') {
                  if (cVar4 != '\x04') goto LAB_005198e6;
                  goto LAB_00519718;
                }
                if (puVar15->unit_type == '\x03') {
                  puVar13 = (unit_struct *)0x0;
                  if (((puVar15->coord_scale_2 != 0) &&
                      (puVar2 = unit_land_array[(ushort)puVar15->coord_scale_2],
                      (*(byte *)&puVar2->flags_2 & 1) == 0)) && (puVar2->unit_class != '\0')) {
                    puVar13 = puVar2;
                  }
                  if (puVar13 == (unit_struct *)0x0) goto LAB_005198e6;
                  if (puVar13->unit_type == '\x03') {
                    uVar16 = 0x27;
                    puVar13 = puVar15;
                  }
                  else {
                    FUN_0048a050(puVar15,0x2b,0);
                    uVar16 = 0x32;
                  }
                }
                else {
                  uVar16 = 0xe;
                }
              }
              FUN_0048a050(puVar13,uVar16,0);
LAB_005198e6:
              puVar15->state_2 = 0;
LAB_005198ea:
              puVar15->flags_2 = puVar15->flags_2 | 0x40000000;
            }
            break;
          case 5:
            if ((puVar15->flags_2 & 0x40000000) != 0) {
              puVar15->flags_2 = puVar15->flags_2 & 0xbfffffff;
              puVar15->coord_scale_3 = 4;
              puVar15->coord_scale_1 = 0;
              puVar15->field36_0x5f = 0;
              unit_set_object_upper
                        (puVar15,unit_type_to_obj_indexes_map[(byte)puVar15->unit_type + 0x51]);
              (puVar15->object).f2 = 0;
              (puVar15->object).f1 = 1;
            }
            sVar11 = *(short *)&puVar15->coord_scale_3 + -1;
            *(short *)&puVar15->coord_scale_3 = sVar11;
            if (sVar11 < 1) {
              puVar15->state_2 = 7;
              goto LAB_005198ea;
            }
            break;
          case 6:
            if ((puVar15->flags_2 & 0x40000000) != 0) {
              puVar15->flags_2 = puVar15->flags_2 & 0xbfffffff;
              puVar15->field36_0x5f = 0;
              unit_set_object_upper
                        (puVar15,unit_type_to_obj_indexes_map[(byte)puVar15->unit_type + 0x51]);
              (puVar15->object).f2 = 0;
              (puVar15->object).f1 = 1;
              if (puVar15->unit_type == '\a') {
                puVar15->coord_scale_3 = 7;
                puVar15->coord_scale_1 = 0;
              }
              else {
                *(ushort *)&puVar15->coord_scale_3 =
                     ((char)obj_related_array[(byte)(puVar15->object).obj_related_index + 3]._f2 + 1
                     ) * (ushort)(byte)vstart_related[(short)(puVar15->object).obj_index].
                                       frame_counter;
              }
            }
            sVar11 = *(short *)&puVar15->coord_scale_3 + -1;
            *(short *)&puVar15->coord_scale_3 = sVar11;
            if (sVar11 < 1) goto LAB_005198e6;
            break;
          case 7:
            if ((puVar15->flags_2 & 0x40000000) != 0) {
              puVar15->flags_2 = puVar15->flags_2 & 0xbfffffff;
              puVar15->coord_scale_3 = 2;
              puVar15->coord_scale_1 = 0;
              uVar8 = puVar15->flags_2;
              puVar15->flags_2 = uVar8 | 0x2000;
              puVar15->flags_2 = uVar8 | 0x82000;
              puVar15->flags_4 = puVar15->flags_4 | 0x2000;
              puVar15->flags_3 = puVar15->flags_3 | 0x8000000;
              uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
              game_state.pseudo_random_val = uVar8 >> 0xd | uVar8 * 0x80000;
              local_34 = game_state.pseudo_random_val;
              FUN_004e93f0(&puVar15->vec2,&puVar15->pos,game_state.pseudo_random_val % 0x46 + 0x23,
                           (int)*(short *)&puVar15->field_0x5d + 0x400U & 0x7ff);
            }
            if (*(short *)&puVar15->coord_scale_3 < 1) {
              if ((*(byte *)((int)&puVar15->flags_2 + 2) & 8) == 0) {
                local_49 = '\x01';
                goto LAB_005198e6;
              }
            }
            else {
              sVar11 = *(short *)&puVar15->coord_scale_3 + -1;
              *(short *)&puVar15->coord_scale_3 = sVar11;
              if (sVar11 == 0) {
                puVar15->field36_0x5f = 0;
                FUN_004d3ff0(puVar15,(-(uint)(*(short *)&puVar15->field_0x78 == 0) & 0xfffffffc) + 5
                            );
              }
            }
          }
        }
        local_28 = local_28 + 1;
        local_44 = local_44 + 1;
      } while (local_44 < local_40);
    }
    if (local_49 != '\0') {
      local_1c = *(undefined2 *)(param_1 + 0x41);
      local_20 = (ushort)*(undefined4 *)(param_1 + 0x3d);
      uStack_1e = (ushort)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
      local_20 = (local_20 & 0xfe00) + 0x100;
      uStack_1e = (uStack_1e & 0xfe00) + 0x100;
      add_unit_to_cell(param_1,&local_20);
    }
  }
  if (local_4a != '\0') {
    iVar12 = (int)*(char *)(param_1 + 0x68);
    if (0 < iVar12) {
      puVar14 = (ushort *)(param_1 + 0x70);
      iVar10 = iVar12;
      do {
        puVar15 = (unit_struct *)0x0;
        if (((*puVar14 != 0) && (puVar13 = unit_land_array[*puVar14], (puVar13->flags_2 & 1) == 0))
           && (puVar13->unit_class != '\0')) {
          puVar15 = puVar13;
        }
        if (puVar15 != (unit_struct *)0x0) {
          *(undefined2 *)&puVar15->field_0x9d = 0;
        }
        puVar14 = puVar14 + 1;
        iVar10 = iVar10 + -1;
        iVar12 = 0;
      } while (iVar10 != 0);
    }
    if (*(byte *)(param_1 + 0x6b) != 0xffffffff) {
      FUN_0041b550(CONCAT31((int3)((uint)iVar12 >> 8),*(byte *)(param_1 + 0x6b)),0,1);
    }
    update_after_unit_alloc(param_1);
  }
  return;
}
