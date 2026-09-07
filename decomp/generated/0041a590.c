/* Ghidra 12.1.3 pseudocode; entry 0041a590; FUN_0041a590.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041a590(int param_1)

{
  ushort uVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  bool bVar4;
  short sVar5;
  int iVar6;
  int iVar7;
  uint uVar8;
  uint uVar9;
  int iVar10;
  uint uVar11;
  uint uVar12;
  int *piVar13;
  short *psVar14;
  uint local_2c;
  int local_28;
  int local_24;
  int local_20;
  short *local_1c;
  int local_18;
  int local_14;
  uint local_10;
  int local_c;
  uint local_8;
  int local_4;

  local_1c = (short *)0x0;
  local_24 = 0;
  iVar10 = (int)*(char *)(param_1 + 0xc22);
  local_8 = (uint)(player_tribe_num * 0xc65 + 0x89d1c8 == param_1);
  if (local_8 != 0) {
    level_flags_2 = level_flags_2 & 0xfffffffe;
  }
  if (*(short *)(param_1 + 0xa05) == 0) {
    iVar6 = *(int *)(param_1 + 0x951);
    if (iVar6 != 0) {
      if (*(short *)(param_1 + 0xa07) == 0) {
        if (iVar6 / 0x5dc < 0x18) {
          sVar5 = (short)(iVar6 / 0x18);
          *(short *)(param_1 + 0xa07) = sVar5;
          if (sVar5 < 1) {
            *(undefined2 *)(param_1 + 0xa07) = 1;
          }
        }
        else {
          *(undefined2 *)(param_1 + 0xa07) = 0x5dc;
        }
        if (0xf0 < iVar6 / 0x5dc) {
          *(short *)(param_1 + 0xa07) = (short)(iVar6 / 0xf0);
        }
      }
      iVar7 = (int)*(short *)(param_1 + 0xa07);
      if (iVar6 < *(short *)(param_1 + 0xa07)) {
        iVar7 = iVar6;
      }
      *(int *)(param_1 + 0x955) = *(int *)(param_1 + 0x955) + iVar7;
      *(int *)(param_1 + 0x951) = iVar6 - iVar7;
      if (iVar6 - iVar7 == 0) {
        *(undefined2 *)(param_1 + 0xa07) = 0;
      }
    }
  }
  else {
    *(short *)(param_1 + 0xa05) = *(short *)(param_1 + 0xa05) + -1;
  }
  if (*(int *)(param_1 + 0x955) != 0) {
    iVar6 = *(int *)(param_1 + 0x885);
    local_10 = 0;
    local_20 = 0;
    for (; iVar6 != 0; iVar6 = *(int *)(iVar6 + 8)) {
      if ((*(uint *)&unit_type_array_building[*(byte *)(iVar6 + 0x2b)].field_0x48 & 1) != 0) {
        *(uint *)(iVar6 + 0x14) = *(uint *)(iVar6 + 0x14) & 0xffffefff;
        if ((*(byte *)(iVar6 + 0x9c) & 0x80) == 0) {
          uVar1 = *(ushort *)(iVar6 + 0x98);
          if (uVar1 != 0) {
            uVar11 = 100;
            if (uVar1 < 100) {
              uVar11 = (uint)uVar1;
            }
            *(int *)(param_1 + 0x955) = *(int *)(param_1 + 0x955) + uVar11;
            *(short *)(iVar6 + 0x98) = *(short *)(iVar6 + 0x98) - (short)uVar11;
          }
        }
        else {
          *(undefined2 *)(iVar6 + 0xa0) = (undefined2)local_10;
          local_20 = local_20 + 1;
          local_10 = (uint)*(ushort *)(iVar6 + 0x24);
        }
      }
    }
    if (local_20 != 0) {
      iVar6 = *(int *)(param_1 + 0x955) * 0x80;
      iVar6 = iVar6 + (iVar6 >> 0x1f & 0xffU);
      local_1c = (short *)(iVar6 >> 8);
      uVar11 = (uint)(CONCAT44(iVar6 >> 0x1f,local_1c) / (longlong)local_20);
      if (uVar11 != 0) {
        for (puVar2 = unit_land_array[local_10]; puVar2 != (unit_struct *)0x0;
            puVar2 = unit_land_array[*(short *)((int)&puVar2->unit_land_array_index + 1)]) {
          if ((int)uVar11 < 1) {
            uVar8 = (uint)*(ushort *)&puVar2->field_0x98;
            local_2c = uVar11;
            if (-uVar8 != uVar11 && (int)uVar8 <= (int)-uVar11) {
              local_2c = -uVar8;
            }
          }
          else {
            local_2c = (uint)*(ushort *)&puVar2->field_0x98;
            local_2c = *(ushort *)&puVar2->field_0x96 - local_2c;
            uVar12 = (uint)(*(ushort *)&puVar2->field_0x96 >> 5);
            uVar8 = uVar11;
            if ((int)uVar12 < (int)uVar11) {
              uVar8 = uVar12;
            }
            if (((int)uVar8 <= (int)local_2c) && (local_2c = uVar8, (int)uVar8 < 0x21)) {
              puVar2->flags_3 = puVar2->flags_3 | 0x1000;
            }
          }
          *(short *)&puVar2->field_0x98 = *(short *)&puVar2->field_0x98 + (short)local_2c;
          *(int *)(param_1 + 0x955) = *(int *)(param_1 + 0x955) - local_2c;
        }
      }
    }
    if (*(char *)(param_1 + 0xc1f) == '\x01') {
      iVar10 = *(int *)(param_1 + 0x94d) + *(int *)(param_1 + 0x955);
      *(int *)(param_1 + 0x94d) = iVar10;
      if (iVar10 < 0) {
        *(undefined4 *)(param_1 + 0x94d) = 0;
      }
      if (DAT_005aa408 < *(int *)(param_1 + 0x94d)) {
        *(int *)(param_1 + 0x94d) = DAT_005aa408;
      }
      *(undefined4 *)(param_1 + 0x955) = 0;
    }
    else {
      FUN_0041ad70(iVar10,&local_28,0,&local_c);
      if ((local_28 != 0) && (local_c != 0)) {
        if (*(short *)(&DAT_005a810a + local_c * 0x3e) != 0) {
          iVar6 = (int)((uint)DAT_0089d161 * (int)*(short *)(&DAT_005a810a + local_c * 0x3e)) /
                  (DAT_005aa44c + 1);
          if (iVar6 != 0) {
            local_24 = (*(int *)((int)&DAT_005a80d4 + local_c * 0x3e) * local_28) / iVar6 +
                       (int)local_1c;
          }
          *(int *)(param_1 + 0x961) = local_24;
          if (((((load_level_flags._3_1_ & 4) == 0) &&
               (player_tribe_num * 0xc65 + 0x89d1c8 == param_1)) &&
              (*(int *)(param_1 + 0x95d) <=
               (int)(local_24 * 0x26 + (local_24 * 0x26 >> 0x1f & 0xffU)) >> 8)) &&
             (0x59f < game_state.offset_counter_2)) {
            FUN_00499d90(0x800000,0x25d);
          }
        }
      }
      iVar6 = *(int *)(param_1 + 0x955);
      if (iVar6 < 1) {
        if ((iVar6 < 0) && (*(int *)(param_1 + 0x955) = -iVar6, 0 < -iVar6)) {
          do {
            iVar6 = 1;
            psVar14 = &DAT_005a810e;
            bVar4 = false;
            local_28 = 0;
            do {
              if (((*psVar14 != 0) &&
                  ((game_state.array_56b_4[iVar10].spells & 1 << ((byte)iVar6 & 0x1f)) != 0)) &&
                 (0 < *(int *)(param_1 + 0x969 + iVar6 * 4))) {
                local_28 = local_28 + 1;
              }
              iVar6 = iVar6 + 1;
              psVar14 = psVar14 + 0x1f;
            } while (iVar6 < 0x16);
            if (local_28 == 0) {
              *(undefined4 *)(param_1 + 0x955) = 0;
            }
            else if (local_28 < *(int *)(param_1 + 0x955)) {
              iVar6 = 1;
              piVar13 = (int *)(param_1 + 0x96d);
              local_28 = *(int *)(param_1 + 0x955) / local_28;
              local_1c = &DAT_005a810e;
              do {
                if (((*local_1c != 0) &&
                    ((game_state.array_56b_4[iVar10].spells & 1 << ((byte)iVar6 & 0x1f)) != 0)) &&
                   (0 < *piVar13)) {
                  *piVar13 = *piVar13 - local_28;
                  iVar7 = *(int *)(param_1 + 0x955) - local_28;
                  *(int *)(param_1 + 0x955) = iVar7;
                  if (*piVar13 < 0) {
                    bVar4 = true;
                    *(int *)(param_1 + 0x955) = iVar7 - *piVar13;
                    *piVar13 = 0;
                  }
                }
                piVar13 = piVar13 + 1;
                iVar6 = iVar6 + 1;
                local_1c = local_1c + 0x1f;
              } while (iVar6 < 0x16);
            }
          } while (bVar4);
        }
      }
      else {
        do {
          local_14 = 0;
          FUN_0041ad70(iVar10,&local_28,&local_4,0);
          if (local_28 == 0) {
            if (local_20 != 0) {
              local_20 = 0;
              puVar3 = unit_land_array[local_10];
              for (puVar2 = puVar3; puVar2 != (unit_struct *)0x0;
                  puVar2 = unit_land_array[*(short *)((int)&puVar2->unit_land_array_index + 1)]) {
                if (*(ushort *)&puVar2->field_0x98 < *(ushort *)&puVar2->field_0x96) {
                  local_20 = local_20 + 1;
                }
              }
              if ((local_20 != 0) &&
                 (uVar11 = *(int *)(param_1 + 0x955) / local_20, 0 < (int)uVar11)) {
                for (; puVar3 != (unit_struct *)0x0;
                    puVar3 = unit_land_array[*(short *)((int)&puVar3->unit_land_array_index + 1)]) {
                  if (*(ushort *)&puVar3->field_0x98 < *(ushort *)&puVar3->field_0x96) {
                    uVar8 = (uint)*(ushort *)&puVar3->field_0x96 -
                            (uint)*(ushort *)&puVar3->field_0x98;
                    uVar9 = (uint)(*(ushort *)&puVar3->field_0x96 >> 5);
                    uVar12 = uVar11;
                    if ((int)uVar9 < (int)uVar11) {
                      uVar12 = uVar9;
                    }
                    if (((int)uVar12 <= (int)uVar8) && (uVar8 = uVar12, (int)uVar12 < 0x21)) {
                      puVar3->flags_3 = puVar3->flags_3 | 0x1000;
                    }
                    *(short *)&puVar3->field_0x98 = *(short *)&puVar3->field_0x98 + (short)uVar8;
                    *(int *)(param_1 + 0x955) = *(int *)(param_1 + 0x955) - uVar8;
                  }
                }
              }
            }
            *(undefined4 *)(param_1 + 0x955) = 0;
            if (((local_8 != 0) && (local_20 < 1)) && (0 < local_4)) {
              level_flags_2 = level_flags_2 | 1;
              iVar6 = FUN_00499970();
              if (iVar6 != 0) {
                level_flags = level_flags | 0x1000000;
                FUN_00499d90(0x4000000,0x4a3);
              }
            }
          }
          else if (local_28 < *(int *)(param_1 + 0x955)) {
            psVar14 = &DAT_005a810e;
            piVar13 = (int *)(param_1 + 0x96d);
            iVar6 = *(int *)(param_1 + 0x955) / local_28;
            local_18 = 1;
            do {
              if ((((*psVar14 != 0) &&
                   ((game_state.array_56b_4[iVar10].spells & 1 << ((byte)local_18 & 0x1f)) != 0)) &&
                  ((*psVar14 != 2 || ((game_state.field2_0x5 & 1) != 0)))) &&
                 (iVar7 = check_struct_56B_field_16(iVar10,local_18), iVar7 != 0)) {
                local_24 = FUN_004c2d50(local_18);
                iVar7 = struct_56B_get_spell_array_val(iVar10,local_18);
                if (iVar7 < local_24) {
                  *piVar13 = *piVar13 + iVar6;
                  *(int *)(param_1 + 0x955) = *(int *)(param_1 + 0x955) - iVar6;
                }
                local_1c = (short *)0x0;
                if (iVar7 < local_24) {
                  do {
                    if (*piVar13 < *(int *)(psVar14 + 2)) break;
                    FUN_004c2cd0(local_18,iVar10,1);
                    local_1c = (short *)0x1;
                    *piVar13 = *piVar13 - *(int *)(psVar14 + 2);
                    iVar7 = struct_56B_get_spell_array_val(iVar10,local_18);
                  } while (iVar7 < local_24);
                }
                if ((local_1c != (short *)0x0) && (local_24 <= iVar7)) {
                  local_14 = 1;
                  *(int *)(param_1 + 0x955) = *(int *)(param_1 + 0x955) + *piVar13;
                  *piVar13 = 0;
                }
              }
              piVar13 = piVar13 + 1;
              psVar14 = psVar14 + 0x1f;
              local_18 = local_18 + 1;
            } while (local_18 < 0x16);
          }
        } while (local_14 != 0);
      }
      iVar6 = 1;
      psVar14 = &DAT_005a810e;
      *(undefined4 *)(param_1 + 0x959) = 0;
      do {
        if ((*psVar14 != 0) &&
           ((game_state.array_56b_4[iVar10].spells & 1 << ((byte)iVar6 & 0x1f)) != 0)) {
          *(int *)(param_1 + 0x959) =
               *(int *)(param_1 + 0x959) + *(int *)(param_1 + 0x969 + iVar6 * 4);
        }
        iVar6 = iVar6 + 1;
        psVar14 = psVar14 + 0x1f;
      } while (iVar6 < 0x16);
    }
  }
  *(undefined4 *)(param_1 + 0x955) = 0;
  return;
}
