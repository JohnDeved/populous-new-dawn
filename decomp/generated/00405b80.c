/* Ghidra 12.1.3 pseudocode; entry 00405b80; FUN_00405b80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00405b80(int param_1)

{
  char cVar1;
  short sVar2;
  ushort uVar3;
  ushort uVar4;
  undefined1 uVar5;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 uVar7;
  int iVar6;
  uint uVar8;
  short *psVar9;
  byte bVar10;
  unit_struct *puVar11;
  int iVar12;
  unit_struct *puVar13;
  unit_struct *puVar14;
  int iVar15;
  ushort *puVar16;
  int *piVar17;
  bool bVar18;
  int local_78;
  int *local_74;
  undefined4 local_70;
  int local_6c;
  uint local_68;
  undefined4 local_64;
  undefined2 local_60;
  unit_type_building *local_5c;
  uint local_58;
  short local_54;
  short local_52;
  undefined2 local_50;
  int local_4c;
  uint local_48;
  undefined4 local_44;
  int local_40 [16];

  local_68 = 0;
  if ((*(byte *)(param_1 + 0x9c) & 0x80) == 0) {
    if (((*(byte *)(param_1 + 0x2e) & 0xf) == 0) && (*(char *)(param_1 + 0xa6) != '\0')) {
      puVar11 = (unit_struct *)0x0;
      if ((*(ushort *)(param_1 + 0x86) != 0) &&
         ((puVar13 = unit_land_array[*(ushort *)(param_1 + 0x86)],
          (*(byte *)&puVar13->flags_2 & 1) == 0 && (puVar13->unit_class != '\0')))) {
        puVar11 = puVar13;
      }
      if (puVar11 != (unit_struct *)0x0) {
        cVar1 = unit_type_array_building[*(byte *)(param_1 + 0x2b)].unit_type1;
        if (((puVar11->unit_type == cVar1) || (puVar11->unit_type == '\a')) &&
           (*(ushort *)(param_1 + 0xa2) != 0)) {
          puVar13 = unit_land_array[*(ushort *)(param_1 + 0xa2)];
          puVar14 = (unit_struct *)0x0;
          if (((*(byte *)&puVar13->flags_2 & 1) == 0) && (puVar13->unit_class != '\0')) {
            puVar14 = puVar13;
          }
          if (((puVar14 != (unit_struct *)0x0) && (puVar14->unit_type != cVar1)) &&
             (puVar14->unit_type != '\a')) {
            remove_person_from_hut(param_1,puVar11);
          }
          puVar13 = (unit_struct *)0x0;
          uVar3 = *(ushort *)(param_1 + 0xa2);
          if (((uVar3 != 0) &&
              (puVar14 = unit_land_array[uVar3], (*(byte *)&puVar14->flags_2 & 1) == 0)) &&
             (puVar14->unit_class != '\0')) {
            puVar13 = puVar14;
          }
          bVar18 = false;
          while (puVar13 != (unit_struct *)0x0) {
            if (bVar18) goto LAB_00406575;
            bVar18 = puVar13->unit_type != cVar1;
            uVar4 = *(ushort *)((int)&puVar13->loc_2_z + 1);
            puVar13 = (unit_struct *)0x0;
            if (((uVar4 != 0) &&
                (puVar14 = unit_land_array[uVar4], (*(byte *)&puVar14->flags_2 & 1) == 0)) &&
               (puVar14->unit_class != '\0')) {
              puVar13 = puVar14;
            }
          }
          if (bVar18) {
LAB_00406575:
            puVar13 = (unit_struct *)0x0;
            if (((uVar3 != 0) &&
                (puVar14 = unit_land_array[uVar3], (*(byte *)&puVar14->flags_2 & 1) == 0)) &&
               (puVar14->unit_class != '\0')) {
              puVar13 = puVar14;
            }
            while ((puVar13 != (unit_struct *)0x0 && (puVar13->unit_type == cVar1))) {
              puVar14 = (unit_struct *)0x0;
              puVar13->state_2 = 0;
              puVar13->flags_2 = puVar13->flags_2 | 0x40000000;
              uVar3 = *(ushort *)((int)&puVar13->loc_2_z + 1);
              puVar13 = puVar14;
              if ((uVar3 != 0) &&
                 ((puVar14 = unit_land_array[uVar3], (puVar14->flags_2 & 1) == 0 &&
                  (puVar14->unit_class != '\0')))) {
                puVar13 = puVar14;
              }
            }
            *(byte *)(param_1 + 0x9d) = *(byte *)(param_1 + 0x9d) | 0x20;
            remove_person_from_hut(param_1,puVar11);
          }
        }
      }
    }
  }
  else {
    local_5c = unit_type_array_building + *(byte *)(param_1 + 0x2b);
    FUN_00509290(param_1);
    if ((*(short *)(param_1 + 0x96) == 0) || ((*(byte *)(param_1 + 0x2e) & 0xf) == 0)) {
      bVar10 = *(byte *)(param_1 + 0x2b);
      local_74 = (int *)0x0;
      local_68 = 1;
      iVar15 = 0;
      local_64 = (uint)(short)unit_type_array_person
                              [(byte)unit_type_array_building[bVar10].unit_type1].conv;
      iVar12 = 0;
      if (*(char *)(param_1 + 0xa6) != '\0') {
        if (unit_type_array_building[bVar10].field31_0x20 != 0) {
          puVar16 = (ushort *)(param_1 + 0x86);
          uVar8 = (uint)(byte)unit_type_array_building[bVar10].field31_0x20;
          do {
            puVar11 = (unit_struct *)0x0;
            if (((*puVar16 != 0) &&
                (puVar13 = unit_land_array[*puVar16], (*(byte *)&puVar13->flags_2 & 1) == 0)) &&
               (puVar13->unit_class != '\0')) {
              puVar11 = puVar13;
            }
            if ((puVar11 != (unit_struct *)0x0) &&
               (puVar11->unit_type != unit_type_array_building[bVar10].unit_type1)) {
              iVar15 = iVar15 + (short)unit_type_array_person[(byte)puVar11->unit_type].conv;
            }
            puVar16 = puVar16 + 1;
            uVar8 = uVar8 - 1;
          } while (uVar8 != 0);
        }
        if ((int)local_64 <= iVar15) {
          iVar12 = iVar15;
        }
      }
      FUN_0041b0c0(param_1,&local_74,(uint)(byte)unit_type_array_building[bVar10].unit_type1,
                   iVar12 / (int)local_64);
      if (0xffff < (int)local_74) {
        local_74 = (int *)0xffff;
      }
      *(short *)(param_1 + 0x96) = (short)local_74;
    }
    if (*(ushort *)(param_1 + 0x96) <= *(ushort *)(param_1 + 0x98)) {
      *(ushort *)(param_1 + 0x98) = *(ushort *)(param_1 + 0x96);
      iVar12 = 0;
      local_6c = 0;
      if (*(char *)(param_1 + 0xa6) != '\0') {
        bVar10 = *(byte *)(param_1 + 0x2b);
        if (unit_type_array_building[bVar10].field31_0x20 != 0) {
          puVar16 = (ushort *)(param_1 + 0x86);
          uVar8 = (uint)(byte)unit_type_array_building[bVar10].field31_0x20;
          do {
            puVar11 = (unit_struct *)0x0;
            if (((*puVar16 != 0) &&
                (puVar13 = unit_land_array[*puVar16], (puVar13->flags_2 & 1) == 0)) &&
               (puVar13->unit_class != '\0')) {
              puVar11 = puVar13;
            }
            if ((puVar11 != (unit_struct *)0x0) &&
               (unit_type_array_building[bVar10].unit_type1 != puVar11->unit_type)) {
              iVar12 = iVar12 + (short)unit_type_array_person[(byte)puVar11->unit_type].conv;
            }
            puVar16 = puVar16 + 1;
            uVar8 = uVar8 - 1;
          } while (uVar8 != 0);
        }
        if ((short)unit_type_array_person[(byte)unit_type_array_building[bVar10].unit_type1].conv <=
            iVar12) {
          local_6c = iVar12;
        }
      }
      if (local_6c != 0) {
        piVar17 = local_40;
        for (iVar12 = 0x10; iVar12 != 0; iVar12 = iVar12 + -1) {
          *piVar17 = 0;
          piVar17 = piVar17 + 1;
        }
        cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                [(short)((int)((int)*(short *)(param_1 + 0x26) +
                              ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
        local_54 = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100 +
                   (char)shapes_mem[cVar1].field_0x4 * 0x40;
        local_50 = 0;
        local_52 = *(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar1].y2 * -0x100 +
                   (char)shapes_mem[cVar1].field_0x5 * 0x40;
        local_70 = CONCAT22(local_52,local_54);
        sVar2 = unit_type_array_person[(byte)local_5c->unit_type1].conv;
        local_58 = FUN_00436c20();
        local_58 = local_58 & 0xffff;
        if (local_58 != 0) {
          if (*(char *)(param_1 + 0x2a) == '\t') {
            FUN_004b9fc0(param_1);
            uVar7 = extraout_var;
          }
          else {
            FUN_004044b0(param_1,&local_70);
            uVar7 = extraout_var_00;
          }
          local_64._0_2_ = (undefined2)local_70;
          local_64._2_2_ = local_70._2_2_;
          local_60 = 0;
          move_pos_angle_length
                    (&local_64,CONCAT22(uVar7,*(short *)(param_1 + 0x26) + 0x200) & 0xffff07ff,0x200
                    );
          local_70 = CONCAT22(local_64._2_2_,(undefined2)local_64);
          local_44 = local_70;
          FUN_00438730(local_58,3,&local_44,0x20);
        }
        bVar10 = 0;
        cVar1 = *(char *)(param_1 + 0xa6);
        local_74 = (int *)CONCAT31(local_74._1_3_,cVar1);
        if ((cVar1 != '\0') &&
           (unit_type_array_building[*(byte *)(param_1 + 0x2b)].field31_0x20 != 0)) {
          puVar16 = (ushort *)(param_1 + 0x86);
          uVar8 = (uint)(byte)unit_type_array_building[*(byte *)(param_1 + 0x2b)].field31_0x20;
          do {
            puVar11 = (unit_struct *)0x0;
            if (((*puVar16 != 0) &&
                (puVar13 = unit_land_array[*puVar16], (puVar13->flags_2 & 1) == 0)) &&
               (puVar13->unit_class != '\0')) {
              puVar11 = puVar13;
            }
            if ((puVar11 != (unit_struct *)0x0) && ((puVar11->flags_4 & 0x800) != 0)) {
              bVar10 = bVar10 + 1;
            }
            puVar16 = puVar16 + 1;
            uVar8 = uVar8 - 1;
          } while (uVar8 != 0);
        }
        local_48 = (uint)bVar10;
        local_4c = local_6c / (int)sVar2;
        local_64 = local_6c - local_4c * sVar2;
        if (local_68 == 0) {
          local_6c = 0;
          bVar10 = *(byte *)(param_1 + 0x2b);
          local_68 = (uint)(byte)unit_type_array_building[bVar10].unit_type1;
          iVar15 = 0;
          iVar12 = 0;
          if (cVar1 != '\0') {
            if (unit_type_array_building[bVar10].field31_0x20 != 0) {
              puVar16 = (ushort *)(param_1 + 0x86);
              uVar8 = (uint)(byte)unit_type_array_building[bVar10].field31_0x20;
              do {
                puVar11 = (unit_struct *)0x0;
                if (((*puVar16 != 0) &&
                    (puVar13 = unit_land_array[*puVar16], (*(byte *)&puVar13->flags_2 & 1) == 0)) &&
                   (puVar13->unit_class != '\0')) {
                  puVar11 = puVar13;
                }
                if ((puVar11 != (unit_struct *)0x0) &&
                   (puVar11->unit_type != unit_type_array_building[bVar10].unit_type1)) {
                  iVar15 = iVar15 + (short)unit_type_array_person[(byte)puVar11->unit_type].conv;
                }
                puVar16 = puVar16 + 1;
                uVar8 = uVar8 - 1;
              } while (uVar8 != 0);
            }
            if ((short)unit_type_array_person[local_68].conv <= iVar15) {
              iVar12 = iVar15;
            }
          }
          FUN_0041b0c0(param_1,&local_6c,local_68,
                       iVar12 / (int)(short)unit_type_array_person[local_68].conv);
          if (0xffff < local_6c) {
            local_6c = 0xffff;
          }
          *(short *)(param_1 + 0x96) = (short)local_6c;
        }
        if ((local_48 != 0) || (*(ushort *)(param_1 + 0x96) <= *(ushort *)(param_1 + 0x98))) {
          iVar15 = 0;
          local_78 = 0;
          iVar12 = local_4c + local_64;
          if (0 < iVar12) {
            do {
              uVar5 = 2;
              if (iVar15 < local_4c) {
                uVar5 = local_5c->unit_type1;
              }
              ptr_unit_related_20B->field0_0x0 = (int)local_54;
              ptr_unit_related_20B->field1_0x4 = (int)local_52;
              ptr_unit_related_20B->unit_ptr = (unit_struct *)(int)*(short *)(param_1 + 0x26);
              ptr_unit_related_20B->field3_0xc = 0;
              ptr_unit_related_20B->field4_0x10 = 0;
              unit_allocation_flag = 1;
              ptr_unit_related_20B = ptr_unit_related_20B + 1;
              iVar6 = alloc_unit(1,uVar5,CONCAT31((int3)((uint)&local_54 >> 8),
                                                  *(undefined1 *)(param_1 + 0x2f)),&local_54);
              local_40[iVar15] = iVar6;
              if (iVar6 == 0) break;
              local_78 = local_78 + 1;
              if ((local_48 != 0) &&
                 (*(uint *)(iVar6 + 0x10) = *(uint *)(iVar6 + 0x10) | 0x800,
                 *(char *)(iVar6 + 0x2f) == player_tribe_num)) {
                *(byte *)(iVar6 + 0x36) = *(byte *)(iVar6 + 0x36) | 0x40;
              }
              iVar15 = iVar15 + 1;
            } while (iVar15 < iVar12);
          }
          if (iVar12 <= local_78) {
            if (local_48 == 0) {
              if (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x01') {
                add_mana(*(char *)(param_1 + 0x2f) * 0xc65 + 0x89d1c8,
                         *(undefined2 *)(param_1 + 0x98),0);
              }
              *(undefined2 *)(param_1 + 0x98) = 0;
            }
            local_64 = (uint)(local_78 == iVar12);
            iVar12 = 0;
            if (0 < local_78) {
              local_74 = local_40;
              do {
                local_68 = 1;
                if ((local_64 != 0) &&
                   (uVar8 = (uint)(byte)local_5c->field31_0x20, iVar12 < (int)uVar8)) {
                  psVar9 = (short *)(param_1 + 0x86 + iVar12 * 2);
                  do {
                    if (*psVar9 != 0) break;
                    psVar9 = psVar9 + 1;
                    iVar12 = iVar12 + 1;
                  } while (iVar12 < (int)uVar8);
                  if (iVar12 < (int)uVar8) {
                    puVar11 = (unit_struct *)0x0;
                    uVar3 = *(ushort *)(param_1 + 0x86 + iVar12 * 2);
                    if (((uVar3 != 0) &&
                        (puVar13 = unit_land_array[uVar3], (*(byte *)&puVar13->flags_2 & 1) == 0))
                       && (puVar13->unit_class != '\0')) {
                      puVar11 = puVar13;
                    }
                    if ((puVar11 != (unit_struct *)0x0) &&
                       (iVar15 = FUN_0043b120(puVar11), iVar15 != 0)) {
                      iVar15 = 0;
                      local_68 = 0;
                      uVar8 = (uint)(byte)puVar11->hut_people_inside;
                      do {
                        uVar8 = uVar8 + 1;
                        if (7 < (int)uVar8) {
                          uVar8 = 0;
                        }
                        sVar2 = *(short *)((int)&puVar11->loc_3_z + uVar8 * 2 + 1);
                        if (sVar2 != 0) {
                          FUN_00436d00(*local_74,sVar2,iVar15);
                        }
                        iVar15 = iVar15 + 1;
                      } while (iVar15 < 7);
                    }
                  }
                }
                if ((local_68 != 0) && (local_58 != 0)) {
                  FUN_00436d00(*local_74,local_58,0);
                }
                iVar15 = *local_74;
                local_74 = local_74 + 1;
                *(uint *)(iVar15 + 0xc) = *(uint *)(iVar15 + 0xc) | 0x10;
                local_78 = local_78 + -1;
              } while (local_78 != 0);
            }
            iVar12 = 0;
            if (local_5c->field31_0x20 != '\0') {
              puVar16 = (ushort *)(param_1 + 0x86);
              do {
                puVar11 = (unit_struct *)0x0;
                if (((*puVar16 != 0) &&
                    (puVar13 = unit_land_array[*puVar16], (puVar13->flags_2 & 1) == 0)) &&
                   (puVar13->unit_class != '\0')) {
                  puVar11 = puVar13;
                }
                if ((puVar11 != (unit_struct *)0x0) && (puVar11->unit_type != local_5c->unit_type1))
                {
                  remove_person_from_hut(param_1,puVar11);
                  FUN_00436ca0(puVar11);
                  FUN_004ef180(puVar11);
                }
                puVar16 = puVar16 + 1;
                iVar12 = iVar12 + 1;
              } while (iVar12 < (int)(uint)(byte)local_5c->field31_0x20);
            }
            *(undefined2 *)(param_1 + 0x96) = 0;
            *(byte *)(param_1 + 0x9d) = *(byte *)(param_1 + 0x9d) | 4;
            *(undefined4 *)(param_1 + 0x7e) = game_state.offset_counter_2;
            return;
          }
          if (0 < local_78) {
            piVar17 = local_40;
            do {
              iVar12 = *piVar17;
              piVar17 = piVar17 + 1;
              FUN_004ef180(iVar12);
              local_78 = local_78 + -1;
            } while (local_78 != 0);
            return;
          }
        }
      }
    }
  }
  return;
}
