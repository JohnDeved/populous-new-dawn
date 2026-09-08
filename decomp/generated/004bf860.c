/* Ghidra 12.1.3 pseudocode; entry 004bf860; landscape_texture_32.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void landscape_texture_32(ushort param_1,byte *param_2)

{
  byte bVar1;
  byte bVar2;
  char cVar3;
  byte bVar4;
  ushort uVar5;
  uint uVar6;
  uint uVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  int iVar11;
  int iVar12;
  char *pcVar13;
  char *pcVar14;
  INT32 IVar15;
  uint uVar16;
  int iVar17;
  int iVar18;
  char *pcVar19;
  res_5_item *prVar20;
  uint uVar21;
  byte *pbVar22;
  byte *pbVar23;
  undefined4 *puVar24;
  uint uVar25;
  uint uVar26;
  int *piVar27;
  undefined4 local_8c0;
  undefined4 *local_8bc;
  int local_8b8;
  int local_8b4;
  int local_8b0;
  undefined4 local_8ac;
  int local_8a8;
  int local_8a4;
  int local_8a0;
  int local_89c;
  uint local_898;
  int local_894;
  int local_890;
  int local_88c;
  undefined4 *local_888;
  int local_878;
  uint local_874;
  int local_870;
  uint local_86c;
  uint local_868;
  int local_858;
  int local_854;
  int local_850;
  int local_844 [256];
  char local_444 [34];
  char local_422 [1058];

  if (((byte)level_flags & 4) == 0) {
    uVar6 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
    uVar7 = (uint)(byte)(&game_state.level_data[0].brightness)[uVar6 * 4];
    iVar8 = (int)(short)(&game_state.level_data[0].height)[uVar6 * 2];
    local_8bc = (undefined4 *)(iVar8 + 0x4b);
    bVar1 = (&game_state.level_data[0].cliff_index)[uVar6 * 4];
    if ((bVar1 != 0) && (local_8bc = (undefined4 *)(iVar8 + 0x96), 0x3fe < (int)local_8bc)) {
      local_8bc = (undefined4 *)0x3fe;
    }
    uVar6 = (uint)bVar1;
    uVar5 = CONCAT11(param_1._1_1_,(byte)param_1 + 2);
    local_8ac = (uint)uVar5;
    uVar16 = (local_8ac & 0xfe) * 2 | uVar5 & 0xfe00;
    local_844[2] = (int)(byte)(&game_state.level_data[0].brightness)[uVar16 * 4];
    iVar8 = (int)(short)(&game_state.level_data[0].height)[uVar16 * 2];
    local_8b4 = iVar8 + 0x4b;
    bVar1 = (&game_state.level_data[0].cliff_index)[uVar16 * 4];
    if ((bVar1 != 0) && (local_8b4 = iVar8 + 0x96, 0x3fe < local_8b4)) {
      local_8b4 = 0x3fe;
    }
    local_8ac._0_2_ = CONCAT11(param_1._1_1_ + 2,(byte)param_1 + 2);
    uVar5 = (ushort)local_8ac;
    local_8ac = (uint)(ushort)local_8ac;
    uVar16 = (local_8ac & 0xfe) * 2 | uVar5 & 0xfe00;
    local_844[3] = (int)(byte)(&game_state.level_data[0].brightness)[uVar16 * 4];
    iVar8 = (int)(short)(&game_state.level_data[0].height)[uVar16 * 2];
    local_8b0 = iVar8 + 0x4b;
    bVar2 = (&game_state.level_data[0].cliff_index)[uVar16 * 4];
    if ((bVar2 != 0) && (local_8b0 = iVar8 + 0x96, 0x3fe < local_8b0)) {
      local_8b0 = 0x3fe;
    }
    uVar5 = CONCAT11(param_1._1_1_ + 2,(byte)param_1);
    local_8ac = (uint)uVar5;
    uVar16 = (local_8ac & 0xfe) * 2 | uVar5 & 0xfe00;
    local_844[1] = (int)(byte)(&game_state.level_data[0].brightness)[uVar16 * 4];
    iVar8 = (int)(short)(&game_state.level_data[0].height)[uVar16 * 2];
    local_8b8 = iVar8 + 0x4b;
    bVar4 = (&game_state.level_data[0].cliff_index)[uVar16 * 4];
    if ((bVar4 != 0) && (local_8b8 = iVar8 + 0x96, 0x3fe < local_8b8)) {
      local_8b8 = 0x3fe;
    }
    iVar8 = local_844[2] - uVar7;
    local_878 = iVar8 * 0x800;
    local_89c = uVar7 << 0x10;
    local_874 = (local_8b4 - (int)local_8bc) * 0x800;
    local_898 = (int)local_8bc << 0x10;
    iVar9 = bVar1 - uVar6;
    local_870 = iVar9 * 0x800;
    local_868 = uVar6 << 0x10;
    uVar16 = (uint)((byte)param_1 >> 1);
    param_1._1_1_ = param_1._1_1_ >> 1;
    iVar10 = (uVar16 & 7) * 0x20;
    iVar12 = (param_1._1_1_ & 7) * 0x2000;
    local_888 = (undefined4 *)(disp0_mem + iVar10 + iVar12);
    iVar11 = (uVar16 + 1 & 7) * 0x20;
    local_844[0] = 0x20;
    pcVar13 = (char *)(disp0_mem + iVar11 + iVar12);
    pcVar14 = local_444;
    do {
      pcVar19 = pcVar14;
      puVar24 = local_888;
      pcVar14 = pcVar19;
      for (iVar12 = 8; iVar12 != 0; iVar12 = iVar12 + -1) {
        *(undefined4 *)pcVar14 = *puVar24;
        puVar24 = puVar24 + 1;
        pcVar14 = pcVar14 + 4;
      }
      cVar3 = *pcVar13;
      pcVar13 = pcVar13 + 0x100;
      pcVar19[0x20] = cVar3;
      local_888 = local_888 + 0x40;
      local_844[0] = local_844[0] + -1;
      pcVar14 = pcVar19 + 0x21;
    } while (local_844[0] != 0);
    iVar12 = (param_1._1_1_ + 1 & 7) * 0x2000;
    puVar24 = (undefined4 *)(disp0_mem + iVar12 + iVar10);
    for (iVar17 = 8; iVar17 != 0; iVar17 = iVar17 + -1) {
      *(undefined4 *)pcVar14 = *puVar24;
      puVar24 = puVar24 + 1;
      pcVar14 = pcVar14 + 4;
    }
    pcVar14 = local_444;
    pcVar19[0x41] = *(char *)(disp0_mem + iVar11 + iVar12);
    local_888 = (undefined4 *)0x20;
    pbVar23 = param_2;
    do {
      local_894 = local_89c;
      local_890 = local_868;
      local_844[0] = 0x20;
      uVar21 = local_898;
      pbVar22 = pbVar23;
      do {
        pcVar13 = pcVar14;
        iVar11 = (int)uVar21 >> 0x10;
        uVar25 = uVar21 & 0xffff00ff;
        uVar21 = uVar21 + local_874;
        iVar10 = ((int)pcVar13[0x22] - (int)*pcVar13 >> 2) + (local_894 >> 0x10);
        if ((char)((uint)iVar10 >> 8) != '\0') {
          if (iVar10 < 0) {
            iVar10 = 0;
          }
          else if (0xff < iVar10) {
            iVar10 = 0xff;
          }
        }
        pbVar23 = pbVar22 + 1;
        local_894 = local_894 + local_878;
        iVar12 = local_890 >> 0x12;
        local_890 = local_890 + local_870;
        *pbVar22 = *(byte *)((uint)*(byte *)(((int)uVar25 >> 8) +
                                             ((int)((int)*(short *)(static_landscape_array +
                                                                   iVar11 * 2) * (int)*pcVar13 &
                                                   0xfffffc03U) >> 2) + iVar10 + bigf0_mem) +
                             iVar12 * 0x80 + cliff0_mem);
        local_844[0] = local_844[0] + -1;
        pcVar14 = pcVar13 + 1;
        pbVar22 = pbVar23;
      } while (local_844[0] != 0);
      local_89c = local_89c + (local_844[1] - uVar7) * 0x800;
      local_868 = local_868 + (bVar4 - uVar6) * 0x800;
      pcVar14 = pcVar13 + 2;
      local_898 = local_898 + (local_8b8 - (int)local_8bc) * 0x800;
      local_878 = local_878 + ((local_844[3] - local_844[1]) * 0x800 + iVar8 * -0x800 >> 5);
      local_870 = local_870 + ((int)(((uint)bVar2 - (uint)bVar4) * 0x800 + iVar9 * -0x800) >> 5);
      local_874 = local_874 +
                  ((local_8b0 - local_8b8) * 0x800 + (local_8b4 - (int)local_8bc) * -0x800 >> 5);
      local_888 = (undefined4 *)((int)local_888 + -1);
    } while (local_888 != (undefined4 *)0x0);
    if ((level_flags_2._2_1_ & 1) == 0) {
      piVar27 = local_844;
      for (iVar8 = 0x100; iVar8 != 0; iVar8 = iVar8 + -1) {
        *piVar27 = 0;
        piVar27 = piVar27 + 1;
      }
      IVar15 = res_array_6[(uint)param_1._1_1_ * 0x80 + uVar16].res_5_index;
      while (-1 < IVar15) {
        prVar20 = res_array_5 + IVar15;
        pbVar23 = (byte *)((int)local_844 +
                          (uint)((*(ushort *)((int)&prVar20->land_pos + 2) & 0x1f0) >> 4) * 0x20 +
                          (uint)((*(ushort *)&prVar20->land_pos & 0x1f0) >> 4));
        bVar1 = *pbVar23;
        *pbVar23 = bVar1 + 3;
        if (0xc < (byte)(bVar1 + 3)) {
          *pbVar23 = 0xc;
        }
        IVar15 = prVar20->next_index;
      }
      pbVar23 = (byte *)local_844;
      iVar8 = 0x20;
      do {
        iVar9 = 0x20;
        pbVar22 = param_2;
        do {
          bVar1 = *pbVar23;
          param_2 = pbVar22 + 1;
          pbVar23 = pbVar23 + 1;
          iVar9 = iVar9 + -1;
          *pbVar22 = *(byte *)((uint)bVar1 * 0x100 + 0x970ae0 + (uint)*pbVar22);
          pbVar22 = param_2;
        } while (iVar9 != 0);
        iVar8 = iVar8 + -1;
      } while (iVar8 != 0);
    }
  }
  else {
    uVar6 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
    uVar7 = (uint)(byte)(&game_state.level_data[0].brightness)[uVar6 * 4];
    iVar8 = (int)(short)(&game_state.level_data[0].height)[uVar6 * 2];
    local_8ac = iVar8 + 0x4b;
    bVar1 = (&game_state.level_data[0].cliff_index)[uVar6 * 4];
    if ((bVar1 != 0) && (local_8ac = iVar8 + 0x96, 0x3fe < (int)local_8ac)) {
      local_8ac = 0x3fe;
    }
    local_8bc = (undefined4 *)0x20;
    uVar16 = (uint)bVar1;
    if ((*(byte *)(&game_state.level_data[0].flags + uVar6) & 8) == 0) {
      local_8bc = (undefined4 *)0x0;
    }
    uVar5 = CONCAT11(param_1._1_1_,(byte)param_1 + 2);
    local_8c0 = (uint)uVar5;
    uVar6 = (local_8c0 & 0xfe) * 2 | uVar5 & 0xfe00;
    local_844[2] = (int)(byte)(&game_state.level_data[0].brightness)[uVar6 * 4];
    iVar8 = (int)(short)(&game_state.level_data[0].height)[uVar6 * 2];
    local_8a4 = iVar8 + 0x4b;
    bVar1 = (&game_state.level_data[0].cliff_index)[uVar6 * 4];
    if ((bVar1 != 0) && (local_8a4 = iVar8 + 0x96, 0x3fe < local_8a4)) {
      local_8a4 = 0x3fe;
    }
    local_8b4 = 0x20;
    if ((*(byte *)(&game_state.level_data[0].flags + uVar6) & 8) == 0) {
      local_8b4 = 0;
    }
    local_8c0._0_2_ = CONCAT11(param_1._1_1_ + 2,(byte)param_1 + 2);
    uVar5 = (ushort)local_8c0;
    local_8c0 = (uint)(ushort)local_8c0;
    uVar6 = (local_8c0 & 0xfe) * 2 | uVar5 & 0xfe00;
    iVar8 = uVar6 * 4;
    local_844[3] = (int)(byte)(&game_state.level_data[0].brightness)[iVar8];
    iVar9 = (int)(short)(&game_state.level_data[0].height)[uVar6 * 2];
    local_8a0 = iVar9 + 0x4b;
    if (((&game_state.level_data[0].cliff_index)[iVar8] != '\0') &&
       (local_8a0 = iVar9 + 0x96, 0x3fe < local_8a0)) {
      local_8a0 = 0x3fe;
    }
    local_8b0 = 0x20;
    bVar2 = (&game_state.level_data[0].cliff_index)[iVar8];
    if ((*(byte *)(&game_state.level_data[0].flags + uVar6) & 8) == 0) {
      local_8b0 = 0;
    }
    uVar5 = CONCAT11(param_1._1_1_ + 2,(byte)param_1);
    local_8c0 = (uint)uVar5;
    uVar6 = (local_8c0 & 0xfe) * 2 | uVar5 & 0xfe00;
    iVar8 = uVar6 * 4;
    local_844[1] = (int)(byte)(&game_state.level_data[0].brightness)[iVar8];
    iVar9 = (int)(short)(&game_state.level_data[0].height)[uVar6 * 2];
    local_8a8 = iVar9 + 0x4b;
    if (((&game_state.level_data[0].cliff_index)[iVar8] != '\0') &&
       (local_8a8 = iVar9 + 0x96, 0x3fe < local_8a8)) {
      local_8a8 = 0x3fe;
    }
    local_8b8 = 0x20;
    uVar21 = (uint)(byte)(&game_state.level_data[0].cliff_index)[iVar8];
    if ((*(byte *)(&game_state.level_data[0].flags + uVar6) & 8) == 0) {
      local_8b8 = 0;
    }
    iVar8 = local_844[2] - uVar7;
    local_88c = iVar8 * 0x800;
    local_878 = uVar7 << 0x10;
    local_858 = (local_8a4 - local_8ac) * 0x800;
    local_874 = local_8ac << 0x10;
    iVar9 = bVar1 - uVar16;
    local_854 = iVar9 * 0x800;
    local_870 = uVar16 << 0x10;
    iVar10 = local_8b8 - (int)local_8bc;
    local_8b4 = local_8b4 - (int)local_8bc;
    local_850 = local_8b4 * 0x800;
    local_86c = (int)local_8bc << 0x10;
    uVar6 = (uint)((byte)param_1 >> 1);
    param_1._1_1_ = param_1._1_1_ >> 1;
    iVar11 = (uVar6 & 7) * 0x20;
    iVar17 = (param_1._1_1_ & 7) * 0x2000;
    local_8bc = (undefined4 *)(disp0_mem + iVar11 + iVar17);
    iVar12 = (uVar6 + 1 & 7) * 0x20;
    local_844[0] = 0x20;
    pcVar13 = (char *)(disp0_mem + iVar12 + iVar17);
    pcVar14 = local_444;
    do {
      pcVar19 = pcVar14;
      puVar24 = local_8bc;
      pcVar14 = pcVar19;
      for (iVar17 = 8; iVar17 != 0; iVar17 = iVar17 + -1) {
        *(undefined4 *)pcVar14 = *puVar24;
        puVar24 = puVar24 + 1;
        pcVar14 = pcVar14 + 4;
      }
      cVar3 = *pcVar13;
      pcVar13 = pcVar13 + 0x100;
      local_8bc = local_8bc + 0x40;
      pcVar19[0x20] = cVar3;
      local_844[0] = local_844[0] + -1;
      pcVar14 = pcVar19 + 0x21;
    } while (local_844[0] != 0);
    iVar17 = (param_1._1_1_ + 1 & 7) * 0x2000;
    puVar24 = (undefined4 *)(disp0_mem + iVar17 + iVar11);
    for (iVar18 = 8; iVar18 != 0; iVar18 = iVar18 + -1) {
      *(undefined4 *)pcVar14 = *puVar24;
      puVar24 = puVar24 + 1;
      pcVar14 = pcVar14 + 4;
    }
    local_8bc = (undefined4 *)0x20;
    pcVar19[0x41] = *(char *)(disp0_mem + iVar17 + iVar12);
    pcVar14 = local_444;
    pbVar23 = param_2;
    do {
      local_89c = local_878;
      local_898 = local_870;
      local_844[0] = 0x20;
      local_868 = local_86c;
      pbVar22 = pbVar23;
      uVar25 = local_874;
      do {
        pcVar13 = pcVar14;
        iVar12 = (int)uVar25 >> 0x10;
        uVar26 = uVar25 & 0xffff00ff;
        uVar25 = uVar25 + local_858;
        iVar11 = ((int)pcVar13[0x22] - (int)*pcVar13 >> 2) + (local_89c >> 0x10);
        if ((char)((uint)iVar11 >> 8) != '\0') {
          if (iVar11 < 0) {
            iVar11 = 0;
          }
          else if (0xff < iVar11) {
            iVar11 = 0xff;
          }
        }
        pbVar23 = pbVar22 + 1;
        local_89c = local_89c + local_88c;
        *pbVar22 = fade0_mem[((int)(local_868 & 0xffff00ff) >> 8) +
                             (uint)*(byte *)((uint)*(byte *)(((int)uVar26 >> 8) +
                                                             ((int)((int)*(short *)(
                                                  static_landscape_array + iVar12 * 2) *
                                                  (int)*pcVar13 & 0xfffffc03U) >> 2) + iVar11 +
                                                  bigf0_mem) + ((int)local_898 >> 0x12) * 0x80 +
                                            cliff0_mem)];
        local_868 = local_868 + local_850;
        local_898 = local_898 + local_854;
        local_844[0] = local_844[0] + -1;
        pcVar14 = pcVar13 + 1;
        pbVar22 = pbVar23;
      } while (local_844[0] != 0);
      local_878 = local_878 + (local_844[1] - uVar7) * 0x800;
      local_874 = local_874 + (local_8a8 - local_8ac) * 0x800;
      local_870 = local_870 + (uVar21 - uVar16) * 0x800;
      local_86c = local_86c + iVar10 * 0x800;
      pcVar14 = pcVar13 + 2;
      local_88c = local_88c + ((local_844[3] - local_844[1]) * 0x800 + iVar8 * -0x800 >> 5);
      local_858 = local_858 +
                  ((int)((local_8a0 - local_8a8) * 0x800 + (local_8a4 - local_8ac) * -0x800) >> 5);
      local_854 = local_854 + ((int)((bVar2 - uVar21) * 0x800 + iVar9 * -0x800) >> 5);
      local_850 = local_850 + ((local_8b0 - local_8b8) * 0x800 + local_8b4 * -0x800 >> 5);
      local_8bc = (undefined4 *)((int)local_8bc + -1);
    } while (local_8bc != (undefined4 *)0x0);
    if ((level_flags_2._2_1_ & 1) == 0) {
      piVar27 = local_844;
      for (iVar8 = 0x100; iVar8 != 0; iVar8 = iVar8 + -1) {
        *piVar27 = 0;
        piVar27 = piVar27 + 1;
      }
      IVar15 = res_array_6[(uint)param_1._1_1_ * 0x80 + uVar6].res_5_index;
      while (-1 < IVar15) {
        prVar20 = res_array_5 + IVar15;
        pbVar23 = (byte *)((int)local_844 +
                          (uint)((*(ushort *)((int)&prVar20->land_pos + 2) & 0x1f0) >> 4) * 0x20 +
                          (uint)((*(ushort *)&prVar20->land_pos & 0x1f0) >> 4));
        bVar1 = *pbVar23;
        *pbVar23 = bVar1 + 3;
        if (0xc < (byte)(bVar1 + 3)) {
          *pbVar23 = 0xc;
        }
        IVar15 = prVar20->next_index;
      }
      pbVar23 = (byte *)local_844;
      iVar8 = 0x20;
      do {
        iVar9 = 0x20;
        pbVar22 = param_2;
        do {
          bVar1 = *pbVar23;
          param_2 = pbVar22 + 1;
          pbVar23 = pbVar23 + 1;
          iVar9 = iVar9 + -1;
          *pbVar22 = *(byte *)((uint)bVar1 * 0x100 + 0x970ae0 + (uint)*pbVar22);
          pbVar22 = param_2;
        } while (iVar9 != 0);
        iVar8 = iVar8 + -1;
      } while (iVar8 != 0);
      return;
    }
  }
  return;
}
