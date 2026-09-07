/* Ghidra 12.1.3 pseudocode; entry 004d0860; cast_some_spells.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004d0d00) */
/* WARNING: Removing unreachable block (ram,0x004d0b70) */

void cast_some_spells(int param_1)

{
  char cVar1;
  unit_struct *puVar2;
  bool bVar3;
  bool bVar4;
  byte bVar5;
  byte bVar6;
  ushort uVar7;
  int iVar8;
  int iVar9;
  byte *pbVar10;
  ushort *puVar11;
  ushort *puVar12;
  undefined2 local_28;
  byte bStack_26;
  byte bStack_25;
  byte local_24;
  byte bStack_23;
  byte bStack_22;
  byte bStack_21;
  byte local_20;
  byte bStack_1f;
  byte bStack_1e;
  byte bStack_1d;
  byte local_1c;
  byte bStack_1b;
  byte bStack_1a;
  byte bStack_19;
  ushort local_18;
  ushort uStack_16;
  undefined4 local_14;
  int local_10;
  undefined2 local_c;
  undefined2 local_a;
  int local_8;
  int local_4;

  local_10 = tribe_get_shaman(param_1);
  if (local_10 == 0) {
    *(undefined2 *)(param_1 + 0x52e) = 0;
    *(undefined1 *)(param_1 + 0x53a) = 0;
    *(undefined4 *)(param_1 + 0x532) = 0;
    *(undefined4 *)(param_1 + 0x536) = 0;
    return;
  }
  local_14 = (uint)*(byte *)(game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0xc + -4);
  if ((local_14 != 0) && (local_14 = local_14 * 4, DAT_005a8150 + 50000 < *(int *)(param_1 + 0x94d))
     ) {
    if ((*(char *)(local_10 + 0x2c) == '\x19') || (*(char *)(local_10 + 0x2c) == '\x1d')) {
      iVar8 = FUN_004c2d80(local_10);
      if (((iVar8 != 0) && ((game_state.offset_counter_2 & local_14 - 1) == 0)) &&
         (iVar8 = FUN_004f2100(local_10,2), iVar8 != 0)) {
        local_14 = CONCAT31(local_14._1_3_,(char)((ushort)*(undefined2 *)(local_10 + 0x3d) >> 8)) &
                   0xfffffffe;
        local_14 = CONCAT22(local_14._2_2_,
                            CONCAT11((char)((ushort)*(undefined2 *)(local_10 + 0x3f) >> 8),
                                     (undefined1)local_14)) & 0xfffffeff;
        alloc_spell_unit(param_1,2,local_14);
        return;
      }
    }
    else if ((((*(uint *)(param_1 + 0x596) & 0x2000) != 0) &&
             ((*(uint *)(param_1 + 0x596) & 0x1000) != 0)) &&
            (iVar8 = FUN_004c2d80(local_10), iVar8 != 0)) {
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xffffefff;
      local_14 = CONCAT31(local_14._1_3_,(char)((ushort)*(undefined2 *)(local_10 + 0x3d) >> 8)) &
                 0xfffffffe;
      local_14 = CONCAT22(local_14._2_2_,
                          CONCAT11((char)((ushort)*(undefined2 *)(local_10 + 0x3f) >> 8),
                                   (undefined1)local_14)) & 0xfffffeff;
      iVar8 = FUN_004f4680(param_1,2,local_14,&local_28,0);
      if (((iVar8 != 0) &&
          (iVar8 = FUN_004f3040(local_10,CONCAT13(bStack_25,CONCAT12(bStack_26,local_28)),2),
          iVar8 != 0)) && (iVar8 = FUN_004f2100(local_10,2), iVar8 != 0)) {
        alloc_spell_unit(param_1,2,CONCAT13(bStack_25,CONCAT12(bStack_26,local_28)));
        return;
      }
    }
  }
  if ((((((((*(byte *)(param_1 + 0x597) & 0x40) != 0) &&
          (local_14 = (uint)*(byte *)(game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0xc + -4),
          local_14 != 0)) && (iVar8 = FUN_004c2d80(local_10), iVar8 != 0)) &&
        (((local_14 * 4 - 1 & (int)*(char *)(param_1 + 0xc22) + game_state.offset_counter_2) == 0 &&
         (iVar8 = FUN_004f2100(local_10,3), iVar8 != 0)))) &&
       (iVar8 = tribe_get_shaman((uint)*(byte *)(param_1 + 0x5ba) * 0xc65 + 0x89d1c8), iVar8 != 0))
      && ((iVar9 = set_tribe_ptr_flag_1(param_1,(int)*(char *)(iVar8 + 0x2f)), iVar9 == 0 &&
          ((*(uint *)(iVar8 + 0xc) & 0x82007) == 0)))) &&
     (((*(byte *)(iVar8 + 0x11) & 4) == 0 &&
      ((iVar9 = get_struct_56B_spell_type(3,(int)*(char *)(param_1 + 0xc22)), iVar9 == 3 ||
       (DAT_005a818e <= *(int *)(param_1 + 0x94d))))))) {
    local_14 = CONCAT31(local_14._1_3_,(char)((ushort)*(undefined2 *)(iVar8 + 0x3d) >> 8)) &
               0xfffffffe;
    local_14 = CONCAT22(local_14._2_2_,
                        CONCAT11((char)((ushort)*(undefined2 *)(iVar8 + 0x3f) >> 8),
                                 (undefined1)local_14)) & 0xfffffeff;
    iVar9 = FUN_004f3040(local_10,local_14,3);
    if (iVar9 != 0) {
      local_14 = CONCAT31(local_14._1_3_,(char)((ushort)*(undefined2 *)(iVar8 + 0x3d) >> 8)) &
                 0xfffffffe;
      local_14 = CONCAT22(local_14._2_2_,
                          CONCAT11((char)((ushort)*(undefined2 *)(iVar8 + 0x3f) >> 8),
                                   (undefined1)local_14)) & 0xfffffeff;
      alloc_spell_unit(param_1,3,local_14);
      return;
    }
  }
  if (((((*(byte *)(param_1 + 0x597) & 0x80) != 0) &&
       (local_14 = (uint)*(byte *)(game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0xc + -4),
       local_14 != 0)) && (iVar8 = FUN_004c2d80(local_10), iVar8 != 0)) &&
     ((((local_14 * 4 - 1 &
        (int)*(char *)(param_1 + 0xc22) + local_14 * 2 + game_state.offset_counter_2) == 0 &&
       (iVar8 = FUN_004f2100(local_10,3), iVar8 != 0)) &&
      ((iVar8 = get_struct_56B_spell_type(3,(int)*(char *)(param_1 + 0xc22)), iVar8 == 3 ||
       (DAT_005a818e <= *(int *)(param_1 + 0x94d))))))) {
    for (puVar2 = game_state.tribes_array[*(byte *)(param_1 + 0x5ba)].building_units;
        puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit) {
      if (((puVar2->state == '\x02') && (puVar2->hut_people_inside != '\0')) &&
         (((puVar2->unit_type == '\x04' &&
           (unit_land_array[(short)puVar2->loc_3_x] != (unit_struct *)0x0)) &&
          ((cVar1 = unit_land_array[(short)puVar2->loc_3_x]->unit_type, cVar1 == '\x06' ||
           (cVar1 == '\x04')))))) {
        get_building_coords(puVar2,&local_c);
        local_14 = CONCAT31(local_14._1_3_,(char)((ushort)local_c >> 8)) & 0xfffffffe;
        local_14 = CONCAT22(local_14._2_2_,
                            CONCAT11((char)((ushort)local_a >> 8),(undefined1)local_14)) &
                   0xfffffeff;
        iVar8 = FUN_004f3040(local_10,local_14,3);
        if (iVar8 != 0) {
          local_14 = CONCAT31(local_14._1_3_,(char)((ushort)local_c >> 8)) & 0xfffffffe;
          local_14 = CONCAT22(local_14._2_2_,
                              CONCAT11((char)((ushort)local_a >> 8),(undefined1)local_14)) &
                     0xfffffeff;
          alloc_spell_unit(param_1,3,local_14);
          return;
        }
      }
    }
  }
  uVar7 = 0;
  FUN_004d1450(param_1);
  pbVar10 = (byte *)(param_1 + 0x4cf);
  iVar8 = 8;
  do {
    if (uVar7 < *pbVar10) {
      uVar7 = (ushort)*pbVar10;
    }
    pbVar10 = pbVar10 + 0xc;
    iVar8 = iVar8 + -1;
  } while (iVar8 != 0);
  if (uVar7 == 0) {
    *(undefined2 *)(param_1 + 0x52e) = 0;
    *(undefined1 *)(param_1 + 0x53a) = 0;
    *(undefined4 *)(param_1 + 0x532) = 0;
    *(undefined4 *)(param_1 + 0x536) = 0;
  }
  else {
    uVar7 = (uVar7 + 1) * uVar7 * 4 - 1;
    *(ushort *)(param_1 + 0x530) = uVar7;
    if (uVar7 < *(ushort *)(param_1 + 0x52e)) {
      *(undefined2 *)(param_1 + 0x52e) = 0;
    }
    bStack_26 = (byte)((ushort)*(undefined2 *)(local_10 + 0x3d) >> 8) & 0xfe;
    bStack_25 = (byte)((ushort)*(undefined2 *)(local_10 + 0x3f) >> 8) & 0xfe;
    if (*(char *)(param_1 + 0x53a) == '\0') {
      local_14 = 0x50;
      do {
        bVar3 = true;
        uStack_16 = FUN_0049c890(CONCAT13(bStack_23,CONCAT12(local_24,CONCAT11(bStack_25,bStack_26))
                                         ),*(undefined2 *)(param_1 + 0x52e),0);
        *(short *)(param_1 + 0x52e) = *(short *)(param_1 + 0x52e) + 1;
        puVar2 = unit_land_array
                 [(short)(&game_state.level_data[0].unit_index)
                         [((uStack_16 & 0xfe) * 2 | uStack_16 & 0xfe00) * 2]];
        while ((puVar2 != (unit_struct *)0x0 && (bVar3))) {
          if (((puVar2->unit_class == '\x01') &&
              (((puVar2->unit_type != '\x01' && (*(char *)(param_1 + 0xc22) != puVar2->tribe_index))
               && (iVar8 = set_tribe_ptr_flag_1(param_1,(int)(char)puVar2->tribe_index), iVar8 == 0)
               ))) && (((*(byte *)((int)&puVar2->flags_4 + 1) & 0x10) == 0 &&
                       (iVar8 = FUN_004de7b0(puVar2,(int)*(char *)(param_1 + 0xc22)), iVar8 == 0))))
          {
            local_18 = uStack_16;
            if (uStack_16 == 0) {
              local_18 = 1;
            }
            local_4 = 0;
            local_8 = 0;
            puVar12 = (ushort *)(param_1 + 0x532);
            puVar11 = puVar12;
            do {
              if ((*puVar11 != 0) &&
                 (iVar8 = FUN_004f2fc0(*puVar11,CONCAT22(uStack_16,local_18),3), iVar8 != 0)) {
                local_4 = 1;
                break;
              }
              puVar11 = puVar11 + 1;
              local_8 = local_8 + 1;
            } while (local_8 < 4);
            if (local_4 == 0) {
              iVar8 = 4;
              do {
                if (*puVar12 == 0) {
                  *puVar12 = local_18;
                }
                puVar12 = puVar12 + 1;
                iVar8 = iVar8 + -1;
              } while (iVar8 != 0);
            }
            bVar3 = false;
            if ((puVar2->unit_type == '\x04') && ((puVar2->obj_index_anim_prev_2 & 0x40) != 0)) {
              bVar4 = false;
              iVar8 = FUN_004c2d80(local_10);
              if (iVar8 != 0) {
                iVar8 = get_struct_56B_spell_type(2,(int)*(char *)(param_1 + 0xc22));
                if (((iVar8 != 0) && (DAT_005a8150 <= *(int *)(param_1 + 0x94d))) &&
                   (iVar8 = FUN_004f2100(local_10,2), iVar8 != 0)) {
                  bVar5 = (byte)((ushort)(puVar2->pos).x >> 8);
                  local_24 = bVar5 & 0xfe;
                  bVar6 = (byte)((ushort)(puVar2->pos).y >> 8);
                  bStack_23 = bVar6 & 0xfe;
                  iVar8 = FUN_004f3040(local_10,CONCAT13(bStack_21,
                                                         CONCAT12(bStack_22,CONCAT11(bVar6,bVar5)))
                                                & 0xfffffefe,2);
                  if (iVar8 != 0) {
                    bVar5 = (byte)((ushort)(puVar2->pos).x >> 8);
                    bStack_22 = bVar5 & 0xfe;
                    bVar6 = (byte)((ushort)(puVar2->pos).y >> 8);
                    bStack_21 = bVar6 & 0xfe;
                    bVar4 = true;
                    alloc_spell_unit(param_1,2,
                                     CONCAT13(bStack_1f,CONCAT12(local_20,CONCAT11(bVar6,bVar5))) &
                                     0xfffffefe);
                  }
                }
                if (!bVar4) {
                  iVar8 = get_struct_56B_spell_type(5,(int)*(char *)(param_1 + 0xc22));
                  if (((iVar8 != 0) && (DAT_005a820a <= *(int *)(param_1 + 0x94d))) &&
                     (iVar8 = FUN_004f2100(local_10,5), iVar8 != 0)) {
                    bVar5 = (byte)((ushort)(puVar2->pos).x >> 8);
                    local_20 = bVar5 & 0xfe;
                    bVar6 = (byte)((ushort)(puVar2->pos).y >> 8);
                    bStack_1f = bVar6 & 0xfe;
                    iVar8 = FUN_004f3040(local_10,CONCAT13(bStack_1d,
                                                           CONCAT12(bStack_1e,CONCAT11(bVar6,bVar5))
                                                          ) & 0xfffffefe,5);
                    if (iVar8 != 0) {
                      bVar5 = (byte)((ushort)(puVar2->pos).x >> 8);
                      bStack_1e = bVar5 & 0xfe;
                      bVar6 = (byte)((ushort)(puVar2->pos).y >> 8);
                      bStack_1d = bVar6 & 0xfe;
                      bVar4 = true;
                      alloc_spell_unit(param_1,5,
                                       CONCAT13(bStack_1b,CONCAT12(local_1c,CONCAT11(bVar6,bVar5)))
                                       & 0xfffffefe);
                    }
                  }
                  if (((!bVar4) &&
                      (iVar8 = get_struct_56B_spell_type(3,(int)*(char *)(param_1 + 0xc22)),
                      iVar8 != 0)) &&
                     ((DAT_005a818e <= *(int *)(param_1 + 0x94d) &&
                      (iVar8 = FUN_004f2100(local_10,3), iVar8 != 0)))) {
                    bVar5 = (byte)((ushort)(puVar2->pos).x >> 8);
                    local_1c = bVar5 & 0xfe;
                    bVar6 = (byte)((ushort)(puVar2->pos).y >> 8);
                    bStack_1b = bVar6 & 0xfe;
                    iVar8 = FUN_004f3040(local_10,CONCAT13(bStack_19,
                                                           CONCAT12(bStack_1a,CONCAT11(bVar6,bVar5))
                                                          ) & 0xfffffefe,3);
                    if (iVar8 != 0) {
                      bVar5 = (byte)((ushort)(puVar2->pos).x >> 8);
                      bStack_1a = bVar5 & 0xfe;
                      bVar6 = (byte)((ushort)(puVar2->pos).y >> 8);
                      bStack_19 = bVar6 & 0xfe;
                      alloc_spell_unit(param_1,3,
                                       CONCAT22(local_18,CONCAT11(bVar6,bVar5)) & 0xfffffefe);
                    }
                  }
                }
              }
            }
          }
          puVar2 = unit_land_array[puVar2->next_unit_index];
        }
        local_14 = local_14 - 1;
      } while (local_14 != 0);
    }
    iVar8 = FUN_004c2d80(local_10);
    if ((iVar8 != 0) && ((game_state.offset_counter_2 & 0xf) == 0)) {
      FUN_004d11b0(param_1,local_10);
      return;
    }
  }
  return;
}
