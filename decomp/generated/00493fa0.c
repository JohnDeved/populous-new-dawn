/* Ghidra 12.1.3 pseudocode; entry 00493fa0; FUN_00493fa0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00493fa0(char *param_1)

{
  undefined2 uVar1;
  short sVar2;
  short sVar3;
  unit_struct *puVar4;
  short *psVar5;
  bool bVar6;
  char cVar7;
  char cVar8;
  char cVar9;
  uint uVar10;
  int iVar11;
  int iVar12;
  int iVar13;
  unit_related_14B *puVar14;
  ushort *puVar15;
  short *psVar16;
  int iVar17;
  byte bStack_213;
  undefined2 local_212;
  ushort local_210;
  byte local_20e;
  byte bStack_20d;
  short *local_20c;
  undefined1 local_208 [4];
  undefined1 local_204 [4];
  undefined4 local_200;

  iVar17 = *param_1 * 2;
  cVar7 = get_empty_indexed_xy
                    (2,CONCAT22((short)((uint)iVar17 >> 0x10),*(undefined2 *)(param_1 + 6)),
                     (int)(char)(&DAT_005ca2e0)[iVar17],(int)(char)(&DAT_005ca2e1)[iVar17]);
  if (cVar7 != '\0') {
    uVar1 = *(undefined2 *)(param_1 + 4);
    iVar17 = 0;
    do {
      cVar8 = get_indexed_xy(cVar7,local_208,local_204);
      if (cVar8 == '\0') goto LAB_00494186;
      local_20e = (byte)uVar1;
      cVar8 = local_208[0] * '\x02' + local_20e;
      bStack_20d = (byte)((ushort)uVar1 >> 8);
      cVar9 = local_204[0] * '\x02' + bStack_20d;
      local_212 = CONCAT11(cVar9,cVar8);
      uVar10 = (local_212 & 0xfe) * 2 | local_212 & 0xfe00;
      bVar6 = true;
      if ((((((byte)land_flags_1 & 8) == 0) && (param_1[2] == player_tribe_num)) &&
          (((byte)level_flags & 4) != 0)) &&
         ((*(byte *)(&game_state.level_data[0].flags + uVar10) & 8) == 0)) {
        bVar6 = false;
      }
      if (bVar6) {
        for (puVar4 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar10 * 2]];
            puVar4 != (unit_struct *)0x0; puVar4 = unit_land_array[puVar4->next_unit_index]) {
          if ((puVar4->unit_class == '\x05') &&
             ((unit_type_array_scenery[(byte)puVar4->unit_type].flags_1 & 4) != 0)) {
            bVar6 = false;
            puVar15 = (ushort *)&local_200;
            local_210 = CONCAT11(cVar9,cVar8) & 0xfcfc;
            iVar11 = 0;
            if (0 < iVar17) {
              do {
                if (*puVar15 == local_210) {
                  bVar6 = true;
                  break;
                }
                iVar11 = iVar11 + 1;
                puVar15 = puVar15 + 2;
              } while (iVar11 < iVar17);
            }
            if (!bVar6) {
              *puVar15 = local_210;
              iVar11 = (uint)(byte)local_210 - (uint)local_20e;
              if (iVar11 < 0) {
                iVar11 = (uint)local_20e - (uint)(byte)local_210;
              }
              if (0x80 < iVar11) {
                iVar11 = 0x100 - iVar11;
              }
              bStack_213 = (byte)(local_210 >> 8);
              iVar12 = (uint)bStack_213 - (uint)bStack_20d;
              if (iVar12 < 0) {
                iVar12 = (uint)bStack_20d - (uint)bStack_213;
              }
              if (0x80 < iVar12) {
                iVar12 = 0x100 - iVar12;
              }
              iVar13 = iVar12;
              if (iVar11 < iVar12) {
                iVar13 = iVar11;
                iVar11 = iVar12;
              }
              iVar17 = iVar17 + 1;
              puVar15[1] = (short)(iVar13 / 2) + (short)iVar11;
              if (0x7f < iVar17) goto LAB_00494186;
              break;
            }
          }
        }
      }
    } while( true );
  }
LAB_00494199:
  local_20c = (short *)&local_200;
  if (0 < local_200) {
    do {
      sVar2 = local_20c[1];
      psVar16 = (short *)0x0;
      sVar3 = *local_20c;
      bVar6 = false;
      for (psVar5 = *(short **)(param_1 + 0x14); psVar5 != (short *)0x0;
          psVar5 = *(short **)(psVar5 + 5)) {
        if (*psVar5 == sVar3) {
          bVar6 = true;
          break;
        }
        if (psVar5[1] < sVar2) {
          psVar16 = psVar5;
        }
      }
      if (!bVar6) {
        iVar17 = 0;
        puVar14 = game_state.unit_related_array_14B + 1;
        do {
          iVar11 = iVar17;
          if ((puVar14->field_0x4 & 1) == 0) break;
          iVar17 = iVar17 + 1;
          puVar14 = puVar14 + 1;
          iVar11 = -1;
        } while (iVar17 < 0x1e00);
        if (iVar11 != -1) {
          puVar14->field_0x4 = 1;
          *(short *)puVar14 = sVar3;
          *(short *)&puVar14->field_0x2 = sVar2;
          if (iVar11 != -1) {
            iVar17 = iVar11 * 0xe + 0x93b2e0;
            if (psVar16 == (short *)0x0) {
              game_state.unit_related_array_14B[iVar11 + 1].field6_0x6 = 0;
              game_state.unit_related_array_14B[iVar11 + 1].field7_0xa =
                   *(undefined4 *)(param_1 + 0x14);
              *(int *)(param_1 + 0x14) = iVar17;
              iVar12 = game_state.unit_related_array_14B[iVar11 + 1].field7_0xa;
            }
            else {
              iVar12 = *(int *)(psVar16 + 5);
              *(int *)(psVar16 + 5) = iVar17;
              game_state.unit_related_array_14B[iVar11 + 1].field6_0x6 = psVar16;
              game_state.unit_related_array_14B[iVar11 + 1].field7_0xa = iVar12;
            }
            if (iVar12 != 0) {
              *(int *)(iVar12 + 6) = iVar17;
            }
            *(short *)(param_1 + 8) = *(short *)(param_1 + 8) + 1;
            *(short *)(param_1 + 10) = *(short *)(param_1 + 10) + 1;
            game_state._644608_4_ = game_state._644608_4_ + 1;
          }
        }
      }
      local_20c = local_20c + 2;
      local_200 = local_200 + -1;
    } while (local_200 != 0);
  }
  cVar7 = *param_1;
  *param_1 = cVar7 + '\x01';
  if ((param_1[1] <= (char)(cVar7 + '\x01')) && ((param_1[3] & 2U) != 0)) {
    param_1[3] = param_1[3] & 0xfd;
    if (0 < (int)game_state._644604_4_) {
      game_state._644604_4_ = game_state._644604_4_ + -1;
    }
    game_state._644612_4_ = 1;
    game_state._644616_4_ = 3;
    game_state._644620_4_ = 2;
    game_state._644624_4_ = 1;
    if (999 < (int)game_state._644608_4_) {
      game_state._644616_4_ = 1;
      game_state._644624_4_ = 3;
      return;
    }
    if (499 < (int)game_state._644608_4_) {
      game_state._644616_4_ = 1;
      game_state._644624_4_ = 2;
      return;
    }
    if (299 < (int)game_state._644608_4_) {
      game_state._644616_4_ = 1;
      game_state._644624_4_ = 1;
    }
  }
  return;
LAB_00494186:
  clear_indexed_xy(cVar7);
  local_200 = iVar17;
  goto LAB_00494199;
}
