/* Ghidra 12.1.3 pseudocode; entry 004be330; set_texture_landscape_main.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void set_texture_landscape_main(void)

{
  polygon_drawn **pppVar1;
  byte bVar2;
  byte bVar3;
  undefined1 uVar4;
  short sVar5;
  char cVar6;
  char cVar7;
  byte *pbVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  int iVar12;
  uint uVar13;
  INT32 IVar14;
  short *psVar15;
  byte *pbVar16;
  byte *pbVar17;
  byte bVar18;
  byte bVar19;
  int iVar20;
  uint uVar21;
  uint uVar22;
  uint uVar23;
  undefined1 *puVar24;
  int iVar25;
  int iVar26;
  byte *pbVar27;
  int iVar28;
  undefined4 *puVar29;
  undefined4 *puVar30;
  char *pcVar31;
  char *pcVar32;
  res_5_item *prVar33;
  int iVar34;
  undefined1 *puVar35;
  undefined1 *puVar36;
  uint uVar37;
  undefined2 local_2b0;
  undefined2 uStack_2ac;
  int local_2a8;
  int local_2a4;
  int local_2a0;
  int local_29c;
  int local_298;
  int local_294;
  int local_290;
  undefined2 local_28c;
  int local_27c;
  int local_278;
  int local_274;
  int local_270;
  int local_260;
  int local_25c;
  int local_258;
  uint local_254;
  int local_250;
  undefined4 local_224;
  undefined4 local_124;
  char local_112 [274];

  local_124 = polygons_to_draw;
  local_260 = 0xe00;
  iVar26 = 0x200;
  iVar34 = 0;
  pbVar27 = res_array_2;
  do {
    local_224 = *local_124;
    local_124 = local_124 + 1;
    if (local_224 != (polygon_drawn *)0x0) {
      do {
        if (local_224->type == '\0') {
          local_28c = CONCAT11(polygon_related_8B_ARRAY_0076108c[(ushort)local_224->tex_index_2].y,
                               polygon_related_8B_ARRAY_0076108c[(ushort)local_224->tex_index_2].x);
          if ((((byte)level_flags & 4) != 0) ||
             ((*(byte *)(landscape_height_array +
                        ((&game_state.level_data[0].c_3)
                         [((local_28c & 0xfe) * 2 | local_28c & 0xfe00) * 4] & 0xf)) & 2) == 0)) {
            bVar18 = (byte)polygon_related_8B_ARRAY_0076108c[(ushort)local_224->tex_index_2].x >> 1;
            bVar19 = (byte)polygon_related_8B_ARRAY_0076108c[(ushort)local_224->tex_index_2].y >> 1;
            iVar11 = ((uint)bVar19 * 0x80 + (uint)bVar18) * 2;
            sVar5 = *(short *)(iVar11 + res_array_3);
            iVar20 = (int)sVar5;
            if (iVar20 == -1) {
              *pbVar27 = bVar18;
              iVar34 = iVar34 + 1;
              iVar26 = iVar26 + -1;
              pbVar27[1] = bVar19;
              *(undefined2 *)(iVar11 + res_array_3) = 0xfffe;
              pbVar27 = pbVar27 + 2;
            }
            else if (iVar20 != -2) {
              bVar18 = res_array_1[iVar20 * 8 + 2];
              if ((bVar18 & 1) == 0) {
                iVar26 = iVar26 + -1;
                res_array_1[iVar20 * 8 + 2] = bVar18 | 1;
                if (iVar20 != res_array_3_index) {
                  *(undefined2 *)(res_array_1 + *(short *)(res_array_1 + iVar20 * 8 + 6) * 8 + 4) =
                       *(undefined2 *)(res_array_1 + iVar20 * 8 + 4);
                  if (iVar20 == DAT_009bcfbc) {
                    DAT_009bcfbc = (int)*(short *)(res_array_1 + iVar20 * 8 + 6);
                  }
                  else {
                    *(undefined2 *)(res_array_1 + *(short *)(res_array_1 + iVar20 * 8 + 4) * 8 + 6)
                         = *(undefined2 *)(res_array_1 + iVar20 * 8 + 6);
                  }
                  *(short *)(res_array_1 + res_array_3_index * 8 + 6) = sVar5;
                  *(short *)(res_array_1 + iVar20 * 8 + 4) = (short)res_array_3_index;
                  pbVar8 = res_array_1 + iVar20 * 8 + 6;
                  pbVar8[0] = 0xff;
                  pbVar8[1] = 0xff;
                  res_array_3_index = iVar20;
                }
              }
            }
          }
        }
        pppVar1 = &local_224->next;
        local_224 = *pppVar1;
      } while ((*pppVar1 != (polygon_drawn *)0x0) && (0 < iVar26));
    }
    local_260 = local_260 + -1;
  } while ((-1 < local_260) && (0 < iVar26));
  pbVar27 = res_array_2;
  if (0 < iVar34) {
    do {
      pbVar8 = res_array_1 + DAT_009bcfbc * 8;
      psVar15 = (short *)(((uint)pbVar8[1] * 0x80 + (uint)*pbVar8) * 2 + res_array_3);
      if (*psVar15 == DAT_009bcfbc) {
        *psVar15 = -1;
      }
      *pbVar8 = *pbVar27;
      pbVar8[1] = pbVar27[1];
      pbVar8[2] = 1;
      pbVar8[3] = 0x40;
      iVar26 = (int)pbVar8 - (int)res_array_1 >> 3;
      iVar34 = iVar34 + -1;
      *(short *)(res_array_3 + ((uint)pbVar8[1] * 0x80 + (uint)*pbVar8) * 2) = (short)iVar26;
      *(undefined2 *)(res_array_1 + *(short *)(pbVar8 + 6) * 8 + 4) = *(undefined2 *)(pbVar8 + 4);
      DAT_009bcfbc = (int)*(short *)(pbVar8 + 6);
      *(short *)(res_array_1 + res_array_3_index * 8 + 6) = (short)iVar26;
      *(short *)(pbVar8 + 4) = (short)res_array_3_index;
      pbVar8[6] = 0xff;
      pbVar8[7] = 0xff;
      pbVar27 = pbVar27 + 2;
      res_array_3_index = iVar26;
    } while (iVar34 != 0);
  }
  if (does_water_texture_exists == 0) {
    local_2a8 = 0;
    if (DAT_005d45d4 == 0) {
      local_260 = 0x1ff;
      pbVar27 = res_array_1;
      do {
        uStack_2ac = SUB42(pbVar27,0);
        if (((pbVar27[2] & 1) != 0) && ((pbVar27[2] & 2) == 0)) {
          local_2a8 = local_2a8 + 1;
          if (0x96 < local_2a8) {
            DAT_005d45d4 = 1;
            break;
          }
          cVar6 = *pbVar27 * '\x02';
          cVar7 = pbVar27[1] * '\x02';
          iVar26 = (int)pbVar27 - (int)res_array_1 >> 3;
          if ((level_flags_2 & 0x80000000) == 0) {
            pbVar8 = (byte *)(iVar26 * 0x100 + landscape_texture_storage_main);
            if (((byte)level_flags & 4) == 0) {
              uVar9 = (CONCAT11(cVar7,cVar6) & 0xfe) * 2 | CONCAT11(cVar7,cVar6) & 0xfe00;
              iVar34 = (int)(short)(&game_state.level_data[0].height)[uVar9 * 2];
              uVar21 = (uint)(byte)(&game_state.level_data[0].brightness)[uVar9 * 4];
              local_2a0 = iVar34 + 0x4b;
              bVar18 = (&game_state.level_data[0].cliff_index)[uVar9 * 4];
              if ((bVar18 != 0) && (local_2a0 = iVar34 + 0x96, 0x3fe < local_2a0)) {
                local_2a0 = 0x3fe;
              }
              uVar22 = (uint)bVar18;
              local_2b0 = CONCAT11(cVar7,cVar6 + '\x02');
              uVar9 = (local_2b0 & 0xfe) * 2 | local_2b0 & 0xfe00;
              iVar34 = (int)(short)(&game_state.level_data[0].height)[uVar9 * 2];
              local_298 = iVar34 + 0x4b;
              bVar18 = (&game_state.level_data[0].cliff_index)[uVar9 * 4];
              if ((bVar18 != 0) && (local_298 = iVar34 + 0x96, 0x3fe < local_298)) {
                local_298 = 0x3fe;
              }
              local_2b0 = CONCAT11(cVar7 + '\x02',cVar6 + '\x02');
              uVar10 = (local_2b0 & 0xfe) * 2 | local_2b0 & 0xfe00;
              iVar34 = (int)(short)(&game_state.level_data[0].height)[uVar10 * 2];
              bVar19 = (&game_state.level_data[0].brightness)[uVar10 * 4];
              local_294 = iVar34 + 0x4b;
              bVar2 = (&game_state.level_data[0].cliff_index)[uVar10 * 4];
              if ((bVar2 != 0) && (local_294 = iVar34 + 0x96, 0x3fe < local_294)) {
                local_294 = 0x3fe;
              }
              local_2b0 = CONCAT11(cVar7 + '\x02',cVar6);
              uVar10 = (local_2b0 & 0xfe) * 2 | local_2b0 & 0xfe00;
              iVar34 = (int)(short)(&game_state.level_data[0].height)[uVar10 * 2];
              uVar23 = (uint)(byte)(&game_state.level_data[0].brightness)[uVar10 * 4];
              local_29c = iVar34 + 0x4b;
              bVar3 = (&game_state.level_data[0].cliff_index)[uVar10 * 4];
              if ((bVar3 != 0) && (local_29c = iVar34 + 0x96, 0x3fe < local_29c)) {
                local_29c = 0x3fe;
              }
              iVar34 = (byte)(&game_state.level_data[0].brightness)[uVar9 * 4] - uVar21;
              local_278 = iVar34 * 0x1000;
              local_258 = uVar21 << 0x10;
              local_274 = (local_298 - local_2a0) * 0x1000;
              local_254 = local_2a0 << 0x10;
              iVar11 = bVar18 - uVar22;
              local_270 = iVar11 * 0x1000;
              local_250 = uVar22 << 0x10;
              uVar9 = (uint)(*pbVar27 & 0x7f);
              uVar10 = (uint)(pbVar27[1] & 0x7f);
              iVar20 = (uVar9 & 7) * 0x20;
              iVar28 = (uVar10 & 7) * 0x2000;
              puVar36 = (undefined1 *)(disp0_mem + iVar20 + iVar28);
              iVar12 = (uVar9 + 1 & 7) * 0x20;
              local_27c = 0x10;
              puVar24 = (undefined1 *)(disp0_mem + iVar12 + iVar28);
              puVar29 = &local_124;
              do {
                iVar28 = 0x10;
                do {
                  puVar35 = puVar36;
                  puVar30 = puVar29;
                  iVar28 = iVar28 + -1;
                  *(undefined1 *)puVar30 = *puVar35;
                  puVar29 = (undefined4 *)((int)puVar30 + 1);
                  puVar36 = puVar35 + 2;
                } while (iVar28 != 0);
                uVar4 = *puVar24;
                puVar29 = (undefined4 *)((int)puVar30 + 2);
                puVar36 = puVar35 + 0x1e2;
                puVar24 = puVar24 + 0x200;
                *(undefined1 *)((int)puVar30 + 1) = uVar4;
                local_27c = local_27c + -1;
              } while (local_27c != 0);
              iVar25 = 0x10;
              iVar28 = (uVar10 + 1 & 7) * 0x2000;
              puVar36 = (undefined1 *)(disp0_mem + iVar28 + iVar20);
              do {
                uVar4 = *puVar36;
                puVar30 = (undefined4 *)((int)puVar29 + 1);
                puVar36 = puVar36 + 2;
                iVar25 = iVar25 + -1;
                *(undefined1 *)puVar29 = uVar4;
                puVar29 = puVar30;
              } while (iVar25 != 0);
              local_290 = 0x10;
              *(undefined1 *)puVar30 = *(undefined1 *)(disp0_mem + iVar28 + iVar12);
              pcVar32 = (char *)&local_124;
              pbVar17 = pbVar8;
              do {
                local_2a4 = local_258;
                local_27c = 0x10;
                local_25c = local_250;
                pbVar16 = pbVar17;
                uVar37 = local_254;
                do {
                  pcVar31 = pcVar32;
                  iVar12 = (int)uVar37 >> 0x10;
                  uVar13 = uVar37 & 0xffff00ff;
                  uVar37 = uVar37 + local_274;
                  iVar20 = ((int)pcVar31[0x12] - (int)*pcVar31 >> 2) + (local_2a4 >> 0x10);
                  if ((char)((uint)iVar20 >> 8) != '\0') {
                    if (iVar20 < 0) {
                      iVar20 = 0;
                    }
                    else if (0xff < iVar20) {
                      iVar20 = 0xff;
                    }
                  }
                  pbVar17 = pbVar16 + 1;
                  local_2a4 = local_2a4 + local_278;
                  iVar28 = local_25c >> 0x12;
                  local_25c = local_25c + local_270;
                  *pbVar16 = *(byte *)((uint)*(byte *)(bigf0_mem +
                                                      ((int)((int)*(short *)(static_landscape_array
                                                                            + iVar12 * 2) *
                                                             (int)*pcVar31 & 0xfffffc03U) >> 2) +
                                                      ((int)uVar13 >> 8) + iVar20) + iVar28 * 0x80 +
                                      cliff0_mem);
                  local_27c = local_27c + -1;
                  pbVar16 = pbVar17;
                  pcVar32 = pcVar31 + 1;
                } while (local_27c != 0);
                local_258 = local_258 + (uVar23 - uVar21) * 0x1000;
                local_254 = local_254 + (local_29c - local_2a0) * 0x1000;
                pcVar32 = pcVar31 + 2;
                local_250 = local_250 + (bVar3 - uVar22) * 0x1000;
                local_278 = local_278 + ((int)((bVar19 - uVar23) * 0x1000 + iVar34 * -0x1000) >> 4);
                local_274 = local_274 +
                            ((local_294 - local_29c) * 0x1000 + (local_298 - local_2a0) * -0x1000 >>
                            4);
                local_270 = local_270 +
                            ((int)(((uint)bVar2 - (uint)bVar3) * 0x1000 + iVar11 * -0x1000) >> 4);
                local_290 = local_290 + -1;
              } while (local_290 != 0);
              if ((level_flags_2 & 0x10000) == 0) {
                puVar29 = &local_224;
                for (iVar34 = 0x40; iVar34 != 0; iVar34 = iVar34 + -1) {
                  *puVar29 = 0;
                  puVar29 = puVar29 + 1;
                }
                IVar14 = res_array_6[uVar10 * 0x80 + uVar9].res_5_index;
                while (-1 < IVar14) {
                  prVar33 = res_array_5 + IVar14;
                  pbVar17 = (byte *)((int)&local_224 +
                                    (uint)((*(ushort *)((int)&prVar33->land_pos + 2) & 0x1e0) >> 5)
                                    * 0x10 + (uint)((*(ushort *)&prVar33->land_pos & 0x1e0) >> 5));
                  bVar18 = *pbVar17;
                  *pbVar17 = bVar18 + 3;
                  if (0xc < (byte)(bVar18 + 3)) {
                    *pbVar17 = 0xc;
                  }
                  IVar14 = prVar33->next_index;
                }
                pbVar17 = (byte *)&local_224;
                iVar34 = 0x10;
                do {
                  iVar11 = 0x10;
                  pbVar16 = pbVar8;
                  do {
                    bVar18 = *pbVar17;
                    pbVar8 = pbVar16 + 1;
                    pbVar17 = pbVar17 + 1;
                    iVar11 = iVar11 + -1;
                    *pbVar16 = *(byte *)((uint)bVar18 * 0x100 + 0x970ae0 + (uint)*pbVar16);
                    pbVar16 = pbVar8;
                  } while (iVar11 != 0);
                  iVar34 = iVar34 + -1;
                } while (iVar34 != 0);
              }
            }
            else {
              landscape_texture_16_fade(CONCAT22(uStack_2ac,CONCAT11(cVar7,cVar6)),pbVar8);
            }
          }
          else {
            landscape_texture_32
                      (CONCAT22(uStack_2ac,CONCAT11(cVar7,cVar6)),
                       iVar26 * 0x400 + landscape_texture_storage_main);
          }
          landscape_texture_array_indexes[iVar26] = 1;
          bVar18 = pbVar27[2];
          pbVar27[2] = bVar18 | 2;
          pbVar27[2] = bVar18 | 6;
          pbVar27[3] = 0;
        }
        pbVar27 = pbVar27 + 8;
        local_260 = local_260 + -1;
      } while (-1 < local_260);
    }
    else {
      iVar26 = 0x1ff;
      local_124 = (polygon_drawn **)0x0;
      pbVar27 = res_array_1;
      do {
        if (((pbVar27[2] & 1) != 0) && ((pbVar27[2] & 2) == 0)) {
          pbVar27[3] = pbVar27[3] + 1;
        }
        if (local_124 < (uint)pbVar27[3]) {
          local_124 = (polygon_drawn **)(uint)pbVar27[3];
        }
        pbVar27 = pbVar27 + 8;
        iVar26 = iVar26 + -1;
        uVar9 = (uint)local_124;
      } while (-1 < iVar26);
      do {
        iVar26 = 0x1ff;
        pbVar27 = res_array_1;
        do {
          if (((pbVar27[3] == uVar9) && ((pbVar27[2] & 1) != 0)) && ((pbVar27[2] & 2) == 0)) {
            local_2a8 = local_2a8 + 1;
            if (0x96 < local_2a8) break;
            iVar34 = (int)pbVar27 - (int)res_array_1 >> 3;
            local_224._0_2_ = CONCAT11(pbVar27[1] * '\x02',*pbVar27 * '\x02');
            if ((level_flags_2 & 0x80000000) == 0) {
              landscape_texture_16(local_224,iVar34 * 0x100 + landscape_texture_storage_main);
            }
            else {
              landscape_texture_32(local_224,iVar34 * 0x400 + landscape_texture_storage_main);
            }
            landscape_texture_array_indexes[iVar34] = 1;
            bVar18 = pbVar27[2];
            pbVar27[2] = bVar18 | 2;
            pbVar27[2] = bVar18 | 6;
            pbVar27[3] = 0;
          }
          pbVar27 = pbVar27 + 8;
          iVar26 = iVar26 + -1;
        } while (-1 < iVar26);
      } while ((-1 < (int)(uVar9 - 1)) && (uVar9 = uVar9 - 1, local_2a8 < 0x96));
      if (local_2a8 < 0x96) {
        DAT_005d45d4 = 0;
      }
      _DAT_009bcda8 = (uint)local_124;
    }
  }
  else {
    iVar26 = 0x1ff;
    pbVar27 = res_array_1;
    do {
      if (((pbVar27[2] & 1) != 0) && ((pbVar27[2] & 2) == 0)) {
        iVar34 = (int)pbVar27 - (int)res_array_1 >> 3;
        local_124._0_2_ = CONCAT11(pbVar27[1] * '\x02',*pbVar27 * '\x02');
        if ((level_flags_2 & 0x80000000) == 0) {
          landscape_texture_16(local_124,iVar34 * 0x100 + landscape_texture_storage_main);
        }
        else {
          landscape_texture_32(local_124,iVar34 * 0x400 + landscape_texture_storage_main);
        }
        landscape_texture_array_indexes[iVar34] = 1;
        bVar18 = pbVar27[2];
        pbVar27[2] = bVar18 | 2;
        pbVar27[2] = bVar18 | 6;
        pbVar27[3] = 0;
      }
      pbVar27 = pbVar27 + 8;
      iVar26 = iVar26 + -1;
    } while (-1 < iVar26);
    does_water_texture_exists = 0;
  }
  iVar26 = 0x1ff;
  pbVar27 = res_array_1;
  do {
    pbVar27[2] = pbVar27[2] & 0xfe;
    pbVar27 = pbVar27 + 8;
    iVar26 = iVar26 + -1;
  } while (-1 < iVar26);
  return;
}
