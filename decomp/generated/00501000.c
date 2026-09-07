/* Ghidra 12.1.3 pseudocode; entry 00501000; process_formation_unit.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x005010e4) */
/* WARNING: Removing unreachable block (ram,0x005010ee) */

void process_formation_unit(int param_1)

{
  undefined2 *puVar1;
  byte bVar2;
  ushort uVar3;
  unit_struct *puVar4;
  undefined4 uVar5;
  int iVar6;
  short sVar7;
  uint uVar8;
  int iVar9;
  short *psVar10;
  char cVar11;
  uint uVar12;
  short *psVar13;
  undefined2 uVar14;
  uint extraout_EDX;
  uint extraout_EDX_00;
  unit_struct *puVar15;
  ushort *puVar16;
  ushort *puVar17;
  undefined4 local_38;
  int local_34;
  uint local_30;
  int local_2c;
  short local_28;
  short sStack_26;
  unit_struct *local_24;
  int local_20;
  uint local_1c;
  short local_18;
  short sStack_16;
  uint local_14;
  uint local_10;
  uint local_c;
  int local_8;

  local_20 = 0;
  local_8 = 0;
  local_2c = 0;
  local_30 = (uint)*(byte *)(param_1 + 0x68);
  if (local_30 != 0) {
    puVar16 = (ushort *)(param_1 + 0x6a);
    do {
      uVar3 = *puVar16;
      if (uVar3 != 0) {
        puVar15 = (unit_struct *)0x0;
        local_2c = local_2c + 1;
        local_34 = 0;
        if (((uVar3 != 0) && (puVar4 = unit_land_array[uVar3], (*(byte *)&puVar4->flags_2 & 1) == 0)
            ) && (puVar4->unit_class != '\0')) {
          puVar15 = puVar4;
        }
        uVar5 = local_38;
        if ((puVar15 == (unit_struct *)0x0) || ((puVar15->obj_index_anim_prev_2 & 0x20) == 0)) {
LAB_00501188:
          local_38 = uVar5;
          local_34 = 1;
        }
        else {
          if ((puVar15->flags_2 & 0x80800) == 0) {
            uVar5 = *(undefined4 *)&(puVar15->vec3).z;
            sVar7 = (puVar15->pos).x;
            uVar8 = (int)(short)uVar5 - (int)sVar7;
            uVar12 = (int)uVar8 >> 0x1f;
            local_38._2_2_ = (short)((uint)uVar5 >> 0x10);
            if ((0x237 < (int)((uVar8 ^ uVar12) - uVar12)) ||
               (uVar8 = (int)local_38._2_2_ - (int)(short)(puVar15->pos).y,
               uVar12 = (int)uVar8 >> 0x1f, 0x237 < (int)((uVar8 ^ uVar12) - uVar12))) {
              uVar8 = (uint)(ushort)((short)uVar5 - sVar7);
              uVar12 = (uint)(ushort)(local_38._2_2_ - (puVar15->pos).y);
              if (0x7fff < uVar8) {
                uVar8 = uVar8 - 0x10000;
              }
              if (0x7fff < uVar12) {
                uVar12 = uVar12 - 0x10000;
              }
              local_38 = uVar5;
              uVar8 = calc_angle_quadrant(uVar8,-uVar12);
              sVar7 = calc_angular_diff_shortest(uVar8 & 0x7ff,*(undefined2 *)(param_1 + 0x5d));
              uVar5 = local_38;
              if (sVar7 < 0x72) {
                local_38._0_2_ = (short)*(undefined4 *)(param_1 + 0x3d);
                local_38._2_2_ = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
                local_38 = CONCAT22(local_38._2_2_ + *(char *)((int)puVar16 + 0x19) * 0x10,
                                    (short)local_38 + (char)puVar16[0xc] * 0x10);
                iVar9 = calc_squared_distance_toroidal(&puVar15->pos,&local_38);
                uVar5 = local_38;
                if (iVar9 < 0x400001) goto LAB_00501190;
              }
            }
            goto LAB_00501188;
          }
          local_34 = 1;
          local_8 = 1;
        }
LAB_00501190:
        if (local_34 != 0) {
          if (*puVar16 != 0) {
            puVar15 = unit_land_array[*puVar16];
            puVar15->field_0xab = 0x18;
            if ((puVar15->obj_index_anim_prev_2 & 0x20U) != 0) {
              puVar15->obj_index_anim_prev_2 = puVar15->obj_index_anim_prev_2 & 0xffdf;
              FUN_004d4f40(puVar15);
            }
            FUN_004e9e50(puVar15,&(puVar15->vec3).z);
          }
          *puVar16 = 0;
          iVar9 = 0;
          psVar10 = (short *)(param_1 + 0x6a);
          cVar11 = *(char *)(param_1 + 0x68) + -1;
          *(char *)(param_1 + 0x68) = cVar11;
          do {
            if (*psVar10 == 0) break;
            psVar10 = psVar10 + 1;
            iVar9 = iVar9 + 1;
          } while (iVar9 < 0xc);
          *(char *)(param_1 + 0x69) = (char)iVar9;
          if (cVar11 == '\0') {
            update_after_unit_alloc(param_1);
          }
        }
      }
      puVar16 = puVar16 + 1;
    } while (local_2c < (int)local_30);
  }
  if (*(byte *)(param_1 + 0x68) < 2) {
    iVar9 = 0;
    puVar16 = (ushort *)(param_1 + 0x6a);
    do {
      if (*(char *)(param_1 + 0x68) == '\0') {
        return;
      }
      if (*puVar16 != 0) {
        puVar15 = unit_land_array[*puVar16];
        puVar15->field_0xab = 0x18;
        FUN_00501be0(puVar15);
        FUN_004e9e50(puVar15,&(puVar15->vec3).z);
        *puVar16 = 0;
        *(char *)(param_1 + 0x68) = *(char *)(param_1 + 0x68) + -1;
        FUN_00502060(param_1);
        if (*(char *)(param_1 + 0x68) == '\0') {
          update_after_unit_alloc(param_1);
        }
      }
      puVar16 = puVar16 + 1;
      iVar9 = iVar9 + 1;
    } while (iVar9 < 0xc);
  }
  else {
    if ((local_8 != 0) && (*(short *)(param_1 + 0x61) < 0x28)) {
      *(undefined2 *)(param_1 + 0x61) = 0x28;
    }
    if ((*(char *)(param_1 + 0x66) != '\0') &&
       (cVar11 = *(char *)(param_1 + 0x66) + -1, *(char *)(param_1 + 0x66) = cVar11, cVar11 == '\0')
       ) {
      uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar8 = uVar12 >> 0xd;
      local_10 = uVar8 | uVar12 * 0x80000;
      game_state.pseudo_random_val = local_10;
      *(undefined1 *)(param_1 + 0x3b) = 0;
      *(ushort *)(param_1 + 0x61) = ((ushort)uVar8 & 7) + 0x18;
      FUN_00501700(param_1);
    }
    if (((*(short *)(param_1 + 0x61) != 0) &&
        (sVar7 = *(short *)(param_1 + 0x61) + -1, *(short *)(param_1 + 0x61) = sVar7, sVar7 == 0))
       && (uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df, uVar8 = uVar12 >> 0xd,
          local_14 = uVar8 | uVar12 * 0x80000, game_state.pseudo_random_val = local_14,
          ((byte)uVar8 & 7) == 2)) {
      *(undefined1 *)(param_1 + 0x66) = 0x40;
      *(undefined1 *)(param_1 + 0x3b) = 1;
      FUN_00501700(param_1);
    }
    if ((int)(uint)*(byte *)(param_1 + 0x68) < (int)local_30) {
      uVar8 = 0;
      do {
        iVar9 = 0;
        psVar10 = (short *)(param_1 + 0x6a + (uVar8 & 0xff) * 2);
        do {
          psVar13 = psVar10;
          iVar6 = iVar9;
          if (*psVar10 == 0) {
            do {
              iVar6 = iVar6 + 1;
              if (3 < iVar6) goto LAB_00501331;
              psVar13 = psVar13 + 3;
            } while (*psVar13 == 0);
            *psVar10 = *psVar13;
            *psVar13 = 0;
          }
LAB_00501331:
          iVar9 = iVar9 + 1;
          psVar10 = psVar10 + 3;
        } while (iVar9 < 4);
        uVar8 = uVar8 + 1;
        FUN_00502060(param_1);
      } while ((int)uVar8 < 3);
      if (*(short *)(param_1 + 0x6a) == 0) {
        iVar9 = 1;
        psVar10 = (short *)(param_1 + 0x6c);
        do {
          if (*psVar10 != 0) {
            puVar1 = (undefined2 *)(param_1 + 0x6a + iVar9 * 2);
            *(undefined2 *)(param_1 + 0x6a) = *puVar1;
            *puVar1 = 0;
            FUN_00501ff0(param_1,iVar9);
            break;
          }
          psVar10 = psVar10 + 1;
          iVar9 = iVar9 + 1;
        } while (iVar9 < 3);
      }
      iVar9 = 0;
      local_c = (uint)*(byte *)(param_1 + 0x68);
      if (local_c != 0) {
        puVar16 = (ushort *)(param_1 + 0x6a);
        do {
          if (*puVar16 != 0) {
            iVar9 = iVar9 + 1;
            local_18 = (short)*(undefined4 *)(param_1 + 0x3d);
            sStack_16 = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
            _local_18 = CONCAT22(sStack_16 + *(char *)((int)puVar16 + 0x19) * 0x10,
                                 local_18 + (char)puVar16[0xc] * 0x10);
            FUN_004e9e50(unit_land_array[*puVar16],&local_18);
          }
          puVar16 = puVar16 + 1;
        } while (iVar9 < (int)local_c);
      }
    }
    puVar16 = (ushort *)(param_1 + 0x6a);
    local_24 = unit_land_array[*puVar16];
    uVar12 = (int)*(short *)(param_1 + 0x3d) - (int)(short)(local_24->pos).x;
    uVar8 = (int)uVar12 >> 0x1f;
    if (((int)((uVar12 ^ uVar8) - uVar8) < 0x48) &&
       (uVar12 = (int)*(short *)(param_1 + 0x3f) - (int)(short)(local_24->pos).y,
       uVar8 = (int)uVar12 >> 0x1f, (int)((uVar12 ^ uVar8) - uVar8) < 0x48)) {
      local_20 = 1;
    }
    uVar14 = (undefined2)(uVar8 >> 0x10);
    local_2c = 0;
    local_30 = (uint)*(byte *)(param_1 + 0x68);
    puVar17 = puVar16;
    if (local_30 != 0) {
      do {
        if (*puVar17 == 0) goto LAB_005015de;
        local_2c = local_2c + 1;
        puVar15 = unit_land_array[*puVar17];
        local_38._0_2_ = (short)*(undefined4 *)(param_1 + 0x3d);
        local_38._0_2_ = (short)local_38 + (char)puVar17[0xc] * 0x10;
        local_38._2_2_ = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
        local_38._2_2_ = local_38._2_2_ + *(char *)((int)puVar17 + 0x19) * 0x10;
        uVar8 = (int)(short)local_38 - (int)(short)(puVar15->pos).x;
        uVar12 = (int)uVar8 >> 0x1f;
        if (((int)((uVar8 ^ uVar12) - uVar12) < 0x48) &&
           (uVar12 = (int)local_38._2_2_ - (int)(short)(puVar15->pos).y, uVar8 = (int)uVar12 >> 0x1f
           , (int)((uVar12 ^ uVar8) - uVar8) < 0x48)) {
          if (local_20 != 0) {
            sVar7 = *(short *)(param_1 + 0x5f);
            goto LAB_005014dd;
          }
          puVar15->field36_0x5f = 0;
        }
        else {
          sVar7 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)puVar15->some_index].
                             field_0x4;
          uVar8 = (int)sVar7 >> 0x1f;
          sVar7 = (short)((int)sVar7 / 2) + sVar7;
LAB_005014dd:
          puVar15->field36_0x5f = sVar7;
        }
        if (puVar15->field36_0x5f == 0) {
          uVar8 = (*(short *)&puVar15->field_0x78 == 0) - 1 & 4;
LAB_005015d4:
          FUN_004d3ff0(puVar15,uVar8);
          uVar8 = extraout_EDX_00;
        }
        else if ((puVar15->obj_index_anim_prev_2 & 0x80) == 0) {
          if (((puVar15->class_counter & 0x7f) != 0) ||
             (uVar12 = pseudo_random * 0x24a1 + 0x24df, uVar8 = uVar12 >> 0xd,
             pseudo_random = uVar8 | uVar12 * 0x80000, local_1c = pseudo_random, (uVar8 & 3) != 0))
          {
            uVar8 = (-(uint)(*(short *)&puVar15->field_0x78 == 0) & 0xfffffffc) + 5;
            goto LAB_005015d4;
          }
          if (*(short *)&puVar15->field_0x78 == 0) {
            unit_set_object_upper
                      (puVar15,(char)unit_type_to_obj_indexes_map[(byte)puVar15->unit_type + 0x3f]);
            (puVar15->object).f2 = 0;
            uVar8 = 0;
            (puVar15->object).f1 =
                 (short)(char)obj_related_array[(byte)(puVar15->object).obj_related_index + 3].f1;
            *(byte *)&puVar15->obj_index_anim_prev_2 = (byte)puVar15->obj_index_anim_prev_2 | 0x80;
          }
          else {
            unit_set_object_upper
                      (puVar15,(char)unit_type_to_obj_indexes_map[(byte)puVar15->unit_type + 0x24]);
            *(byte *)&puVar15->obj_index_anim_prev_2 = (byte)puVar15->obj_index_anim_prev_2 | 0x80;
            uVar8 = extraout_EDX;
          }
        }
        else if (((puVar15->object).f2 == '\0') && ((puVar15->object).f1 == 0)) {
          uVar8 = (-(uint)(*(short *)&puVar15->field_0x78 == 0) & 0xfffffffc) + 5;
          goto LAB_005015d4;
        }
LAB_005015de:
        uVar14 = (undefined2)(uVar8 >> 0x10);
        puVar17 = puVar17 + 1;
      } while (local_2c < (int)local_30);
    }
    if (local_20 != 0) {
      iVar9 = 0;
      move_pos_angle_length
                (param_1 + 0x3d,CONCAT22(uVar14,*(undefined2 *)(param_1 + 0x5d)),
                 local_24->field36_0x5f);
      bVar2 = *(byte *)(param_1 + 0x68);
      if (bVar2 != 0) {
        do {
          if (*puVar16 != 0) {
            iVar9 = iVar9 + 1;
            local_28 = (short)*(undefined4 *)(param_1 + 0x3d);
            sStack_26 = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
            _local_28 = CONCAT22(sStack_26 + *(char *)((int)puVar16 + 0x19) * 0x10,
                                 local_28 + (char)puVar16[0xc] * 0x10);
            FUN_004e9e50(unit_land_array[*puVar16],&local_28);
          }
          puVar16 = puVar16 + 1;
        } while (iVar9 < (int)(uint)bVar2);
        return;
      }
    }
  }
  return;
}
