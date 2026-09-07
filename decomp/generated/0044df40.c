/* Ghidra 12.1.3 pseudocode; entry 0044df40; level_land_processing_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void level_land_processing_2(void)

{
  int iVar1;
  char cVar2;
  char cVar3;
  ushort uVar4;
  ushort *puVar5;
  bool bVar6;
  uint *puVar7;
  byte bVar8;
  uint uVar9;
  uint uVar10;
  uint uVar11;
  uint uVar12;
  uint uVar13;
  uint uVar14;
  uint uVar15;
  uint uVar16;
  int iVar17;
  ushort **ppuVar18;
  int iVar19;
  undefined4 *puVar20;
  uint uVar21;
  ushort *puVar22;
  int *piVar23;
  short *psVar24;
  int iVar25;
  byte *pbVar26;
  uint uVar27;
  int iVar28;
  ushort *puVar29;
  int iVar30;
  int iVar31;
  byte *pbVar32;
  undefined2 local_80;
  char local_7e;
  char cStack_7d;
  ushort uStack_7c;
  ushort *local_78;
  int local_74;
  int local_70;
  ushort *local_6c;
  int local_68;
  int local_64;
  int local_60;
  int local_5c;
  ushort *local_58;
  int local_54;
  int local_50;
  int local_4c;
  int local_48;
  int local_44;
  int local_40;
  int local_3c;
  int local_38;
  ushort *local_34;
  int local_30 [12];

  puVar7 = (uint *)(uint)uStack_7c;
  iVar19 = 0;
  if (0 < level_land_counter_1) {
    local_34 = (ushort *)land_coord_array;
    do {
      uVar4 = *local_34;
      local_7e = (char)uVar4;
      cStack_7d = (char)(uVar4 >> 8);
      uVar9 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
      cVar2 = cStack_7d + -2;
      iVar1 = uVar9 * 4;
      puVar7 = &game_state.level_data[0].flags + uVar9;
      uVar21 = *puVar7;
      *puVar7 = uVar21 | 0x10;
      uVar10 = (CONCAT11(cVar2,local_7e) & 0xfe) * 2 | CONCAT11(cVar2,local_7e) & 0xfe00;
      cVar3 = local_7e + '\x02';
      local_78 = (ushort *)(uVar10 * 4 + 0x8a03e4);
      uVar11 = (CONCAT11(cVar2,cVar3) & 0xfe) * 2 | CONCAT11(cVar2,cVar3) & 0xfe00;
      local_74 = uVar11 * 4 + 0x8a03e4;
      uVar12 = (CONCAT11(cStack_7d,cVar3) & 0xfe) * 2 | CONCAT11(cStack_7d,cVar3) & 0xfe00;
      cVar2 = cStack_7d + '\x02';
      local_70 = uVar12 * 4 + 0x8a03e4;
      uVar13 = (CONCAT11(cVar2,cVar3) & 0xfe) * 2 | CONCAT11(cVar2,cVar3) & 0xfe00;
      local_6c = (ushort *)(uVar13 * 4 + 0x8a03e4);
      uVar27 = (CONCAT11(cVar2,local_7e) & 0xfe) * 2 | CONCAT11(cVar2,local_7e) & 0xfe00;
      cVar3 = local_7e + -2;
      local_68 = uVar27 * 4 + 0x8a03e4;
      uVar14 = (CONCAT11(cVar2,cVar3) & 0xfe) * 2 | CONCAT11(cVar2,cVar3) & 0xfe00;
      local_64 = uVar14 * 4 + 0x8a03e4;
      uVar15 = (CONCAT11(cStack_7d,cVar3) & 0xfe) * 2 | CONCAT11(cStack_7d,cVar3) & 0xfe00;
      local_60 = uVar15 * 4 + 0x8a03e4;
      uVar16 = (CONCAT11(cStack_7d + -2,cVar3) & 0xfe) * 2 | CONCAT11(cStack_7d + -2,cVar3) & 0xfe00
      ;
      local_58 = (ushort *)(int)(short)(&game_state.level_data[0].height)[uVar9 * 2];
      local_5c = uVar16 * 4 + 0x8a03e4;
      local_54 = (int)(short)(&game_state.level_data[0].height)[uVar27 * 2];
      local_50 = (int)(short)(&game_state.level_data[0].height)[uVar12 * 2];
      local_4c = (int)(short)(&game_state.level_data[0].height)[uVar10 * 2];
      local_48 = (int)(short)(&game_state.level_data[0].height)[uVar15 * 2];
      local_44 = (int)(short)(&game_state.level_data[0].height)[uVar13 * 2];
      local_40 = (int)(short)(&game_state.level_data[0].height)[uVar11 * 2];
      local_3c = (int)(short)(&game_state.level_data[0].height)[uVar16 * 2];
      local_38 = (int)(short)(&game_state.level_data[0].height)[uVar14 * 2];
      iVar30 = local_44 + local_54 + local_50 + (int)local_58 >> 2;
      iVar28 = iVar30 - (int)local_58;
      iVar17 = iVar30 - local_54;
      iVar31 = iVar30 - local_44;
      iVar30 = iVar30 - local_50;
      if (iVar28 < 0) {
        iVar28 = -iVar28;
      }
      if (iVar17 < 0) {
        iVar17 = -iVar17;
      }
      if (iVar30 < 0) {
        iVar30 = -iVar30;
      }
      if (iVar31 < 0) {
        iVar31 = -iVar31;
      }
      iVar25 = 0;
      if (0 < iVar28) {
        iVar25 = iVar28;
      }
      if (iVar25 < iVar17) {
        iVar25 = iVar17;
      }
      if (iVar25 < iVar30) {
        iVar25 = iVar30;
      }
      if (iVar25 < iVar31) {
        iVar25 = iVar31;
      }
      bVar6 = false;
      if ((iVar28 == iVar25) || (iVar25 == iVar31)) {
        bVar6 = true;
      }
      if (bVar6) {
        uVar21 = uVar21 | 0x11;
      }
      else {
        uVar21 = uVar21 & 0xfffffffe | 0x10;
      }
      puVar29 = (ushort *)0x401;
      iVar17 = 0;
      iVar30 = 0;
      *puVar7 = uVar21;
      puVar22 = (ushort *)0x0;
      ppuVar18 = &local_58;
      do {
        puVar5 = *ppuVar18;
        if ((int)puVar22 < (int)puVar5) {
          puVar22 = puVar5;
        }
        if ((int)puVar5 < (int)puVar29) {
          iVar17 = iVar30;
          puVar29 = puVar5;
        }
        ppuVar18 = ppuVar18 + 1;
        iVar30 = iVar30 + 1;
      } while (ppuVar18 < &local_34);
      if (0xf < iVar17) {
        iVar17 = 0xf;
      }
      (&game_state.level_data[0].unit_shadow)[iVar1] =
           (&game_state.level_data[0].unit_shadow)[iVar1] & 0xf | (char)iVar17 << 4;
      if (puVar22 == (ushort *)0x0) {
        if ((*(byte *)((int)&game_state.level_data[0].flags + iVar1 + 3) & 4) == 0) {
          (&game_state.level_data[0].cliff_index)[iVar1] = 0;
        }
      }
      else {
        if ((*(byte *)((int)&game_state.level_data[0].flags + iVar1 + 3) & 4) == 0) {
          iVar17 = (int)puVar22 - (int)puVar29 >> 3;
          if (0x7f < iVar17) {
            iVar17 = 0x7f;
          }
          if (iVar17 < 1) {
            iVar17 = 1;
          }
          (&game_state.level_data[0].cliff_index)[iVar1] = (char)iVar17;
        }
        if (((int)puVar29 < 1) || (0x1ff < (int)puVar22)) {
          *puVar7 = *puVar7 & 0xffffffdf;
        }
        else {
          *puVar7 = *puVar7 | 0x20;
        }
      }
      if ((((local_58 == (ushort *)0x0) && (local_54 == 0)) && (local_50 == 0)) && (local_44 == 0))
      {
        ppuVar18 = &local_78;
        uVar21 = *puVar7;
        *puVar7 = uVar21 | 0x1000000;
        do {
          if ((**ppuVar18 & 0x200) != 0) {
            *puVar7 = uVar21 & 0xfeffffff;
            break;
          }
          ppuVar18 = ppuVar18 + 1;
        } while (ppuVar18 < &local_58);
        if ((*puVar7 & 0x1000000) != 0) {
          local_30[0] = local_40;
          local_30[1] = local_4c;
          local_30[2] = local_3c;
          local_30[3] = local_48;
          cVar2 = cStack_7d + '\x04';
          local_80 = CONCAT11(cVar2,local_7e + -2);
          uVar21 = (uint)local_80;
          local_30[4] = local_38;
          uVar10 = (uint)local_80;
          local_80 = CONCAT11(cVar2,local_7e);
          uVar11 = (uint)local_80;
          uVar9 = (uint)local_80;
          local_30[5] = (int)(short)(&game_state.level_data[0].height)
                                    [((uVar21 & 0xfe) * 2 | uVar10 & 0xfe00) * 2];
          local_80 = CONCAT11(cVar2,local_7e + '\x02');
          uVar10 = (uint)local_80;
          uVar21 = (uint)local_80;
          local_30[6] = (int)(short)(&game_state.level_data[0].height)
                                    [((uVar9 & 0xfe) * 2 | uVar11 & 0xfe00) * 2];
          local_7e = local_7e + '\x04';
          local_80 = CONCAT11(cVar2,local_7e);
          uVar11 = (uint)local_80;
          uVar9 = (uint)local_80;
          local_30[7] = (int)(short)(&game_state.level_data[0].height)
                                    [((uVar21 & 0xfe) * 2 | uVar10 & 0xfe00) * 2];
          local_80 = CONCAT11(cStack_7d + '\x02',local_7e);
          local_30[8] = (int)(short)(&game_state.level_data[0].height)
                                    [((uVar9 & 0xfe) * 2 | uVar11 & 0xfe00) * 2];
          uVar21 = (uint)local_80;
          uVar10 = (uint)local_80;
          local_80 = CONCAT11(cStack_7d,local_7e);
          uVar11 = (uint)local_80;
          uVar9 = (uint)local_80;
          local_30[9] = (int)(short)(&game_state.level_data[0].height)
                                    [((uVar21 & 0xfe) * 2 | uVar10 & 0xfe00) * 2];
          local_80 = CONCAT11(cStack_7d + -2,local_7e);
          local_30[10] = (int)(short)(&game_state.level_data[0].height)
                                     [((uVar9 & 0xfe) * 2 | uVar11 & 0xfe00) * 2];
          local_30[0xb] =
               (int)(short)(&game_state.level_data[0].height)
                           [((local_80 & 0xfe) * 2 | local_80 & 0xfe00) * 2];
          piVar23 = local_30;
          do {
            if ((int)(land_const_1 * 7 + (land_const_1 * 7 >> 0x1f & 7U)) >> 3 < *piVar23) {
              *puVar7 = *puVar7 & 0xfeffffff;
              break;
            }
            piVar23 = piVar23 + 1;
          } while (piVar23 < &stack0x00000000);
        }
      }
      else {
        *puVar7 = *puVar7 & 0xfeffffff;
      }
      local_34 = local_34 + 1;
      iVar19 = iVar19 + 1;
    } while (iVar19 < level_land_counter_1);
  }
  iVar19 = 0;
  if (0 < level_land_counter_1) {
    puVar20 = land_coord_array;
    do {
      uVar4 = *(ushort *)puVar20;
      local_7e = (char)uVar4;
      cStack_7d = (char)(uVar4 >> 8);
      uVar21 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
      cVar2 = cStack_7d + '\x02';
      iVar1 = uVar21 * 4;
      puVar7 = &game_state.level_data[0].flags + uVar21;
      cVar3 = local_7e + '\x02';
      iVar17 = ((CONCAT11(cVar2,local_7e) & 0xfe) * 2 | CONCAT11(cVar2,local_7e) & 0xfe00) * 4;
      local_78 = (ushort *)(iVar17 + 0x8a03e4);
      iVar30 = ((CONCAT11(cVar2,cVar3) & 0xfe) * 2 | CONCAT11(cVar2,cVar3) & 0xfe00) * 4;
      local_74 = iVar30 + 0x8a03e4;
      pbVar32 = &game_state.level_data[0].cliff_index + iVar1;
      iVar28 = ((CONCAT11(cStack_7d,cVar3) & 0xfe) * 2 | CONCAT11(cStack_7d,cVar3) & 0xfe00) * 4;
      local_70 = iVar28 + 0x8a03e4;
      if (((*pbVar32 < 0xab) && ((byte)(&game_state.level_data[0].cliff_index)[iVar17] < 0xab)) &&
         (((byte)(&game_state.level_data[0].cliff_index)[iVar30] < 0xab &&
          ((byte)(&game_state.level_data[0].cliff_index)[iVar28] < 0xab)))) {
        *puVar7 = *puVar7 & 0xfffbffff;
      }
      else {
        *puVar7 = *puVar7 | 0x40000;
      }
      pbVar26 = &game_state.level_data[0].c_3 + iVar1;
      bVar8 = ((&landscape_noise)
               [((uint)((&game_state.level_data[0].cliff_index)[iVar17] != '\0') +
                ((3 - (uint)((&game_state.level_data[0].cliff_index)[iVar30] == '\0')) +
                (uint)((&game_state.level_data[0].cliff_index)[iVar28] == '\0') * -2) * 2) * 2 -
                (uint)(*pbVar32 == 0)] ^ *pbVar26) & 0xf ^ *pbVar26;
      *pbVar26 = bVar8;
      if (((*puVar7 & 0x1000000) != 0) &&
         ((*(byte *)(landscape_height_array + (bVar8 & 0xf)) & 0x3c) == 0)) {
        *puVar7 = *puVar7 & 0xfeffffff;
      }
      puVar20 = (undefined4 *)((int)puVar20 + 2);
      iVar19 = iVar19 + 1;
    } while (iVar19 < level_land_counter_1);
  }
  iVar19 = 0;
  if (0 < level_land_counter_1) {
    do {
      uVar4 = *(ushort *)((int)land_coord_array + iVar19 * 2);
      local_7e = (char)uVar4;
      cStack_7d = (char)(uVar4 >> 8);
      if ((land_flags_1 & 0x80) == 0) {
        uVar21 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
        puVar7 = &game_state.level_data[0].flags + uVar21;
        psVar24 = &game_state.level_data[0].height + uVar21 * 2;
        if ((*psVar24 == 0) &&
           ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar21 * 4] & 0xf))
            & 1) != 0)) {
          cVar2 = cStack_7d + -2;
          cVar3 = local_7e + -2;
          local_78 = (ushort *)
                     (((CONCAT11(cVar2,local_7e) & 0xfe) * 2 | CONCAT11(cVar2,local_7e) & 0xfe00) *
                      4 + 0x8a03e4);
          local_74 = ((CONCAT11(cVar2,cVar3) & 0xfe) * 2 | CONCAT11(cVar2,cVar3) & 0xfe00) * 4 +
                     0x8a03e4;
          bVar6 = true;
          local_70 = ((CONCAT11(cStack_7d,cVar3) & 0xfe) * 2 | CONCAT11(cStack_7d,cVar3) & 0xfe00) *
                     4 + 0x8a03e4;
          ppuVar18 = &local_78;
          do {
            if ((*(byte *)(landscape_height_array + ((byte)(*ppuVar18)[6] & 0xf)) & 1) == 0) {
              bVar6 = false;
              break;
            }
            ppuVar18 = ppuVar18 + 1;
          } while (ppuVar18 < &local_6c);
          if (bVar6) {
            *psVar24 = 1;
          }
        }
      }
      uStack_7c = (ushort)puVar7;
      if (*(char *)((int)land_conditional_array + iVar19) != '\0') {
        set_landscape_c_4_2(CONCAT22(uStack_7c,uVar4));
      }
      iVar19 = iVar19 + 1;
    } while (iVar19 < level_land_counter_1);
  }
  iVar19 = 0;
  if (0 < level_land_counter_1) {
    do {
      uStack_7c = (ushort)puVar7;
      if (*(char *)((int)land_conditional_array + iVar19) != '\0') {
        set_landscape_globe_texture
                  (CONCAT22(uStack_7c,*(undefined2 *)((int)land_coord_array + iVar19 * 2)));
      }
      iVar19 = iVar19 + 1;
    } while (iVar19 < level_land_counter_1);
  }
  level_land_counter_1 = 0;
  land_flags_1 = land_flags_1 & 0xffffff7f;
  puVar20 = update_landscape_block_array;
  for (iVar19 = 0x1000; iVar19 != 0; iVar19 = iVar19 + -1) {
    *puVar20 = 0;
    puVar20 = puVar20 + 1;
  }
  return;
}
