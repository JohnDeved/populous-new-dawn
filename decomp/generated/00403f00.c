/* Ghidra 12.1.3 pseudocode; entry 00403f00; landscape_move_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void landscape_move_2(int param_1)

{
  char cVar1;
  char cVar2;
  shape_entry *psVar3;
  ushort uVar4;
  undefined4 uVar5;
  uint uVar6;
  undefined2 uVar7;
  undefined3 uVar8;
  char cVar9;
  char cVar10;
  short sVar11;
  shape_entry *psVar12;
  int iVar13;
  uint uVar14;
  uint uVar15;
  uint uVar16;
  uint uVar17;
  byte *pbVar18;
  shape_entry **ppsVar19;
  shape_entry *psVar20;
  byte *pbVar21;
  uint uVar22;
  undefined4 local_2e;
  undefined2 local_2a;
  undefined4 local_28;
  int local_24;
  int local_20;
  int local_1c;
  shape_entry *local_18;
  uint local_14;
  uint local_10;
  uint local_c;
  uint local_8;
  int local_4;

  iVar13 = (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                             ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
  local_18 = shapes_mem + (char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)[iVar13];
  local_28 = (shape_entry *)
             (CONCAT31(local_28._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) &
             0xfffffffe);
  local_28 = (shape_entry *)
             (CONCAT22(local_28._2_2_,
                       CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                                (undefined1)local_28)) & 0xfffffeff);
  psVar20 = (shape_entry *)0x400;
  local_2e._0_1_ = (char)local_28;
  local_2e._1_1_ = (char)((uint)local_28 >> 8);
  local_2e._0_2_ = CONCAT11(local_2e._1_1_ - local_18->y2,(char)local_2e - local_18->x2);
  pbVar18 = local_18->ptr;
  psVar12 = (shape_entry *)0x0;
  local_14 = (uint)(byte)local_18->x1;
  local_4 = 0;
  local_10 = (uint)(byte)local_18->y1;
  pbVar21 = pbVar18;
  uVar4 = (ushort)local_2e;
  uVar5 = local_2e;
  for (uVar14 = local_10; uVar6 = local_14, local_2e = uVar5, uVar14 != 0; uVar14 = uVar14 - 1) {
    while (local_2a._1_1_ = (byte)(uVar4 >> 8), uVar6 != 0) {
      local_2a._0_1_ = (byte)uVar4;
      if ((*pbVar21 & 1) != 0) {
        uVar7 = (ushort)local_2e;
        local_2e = CONCAT22(uVar4,(ushort)local_2e);
        if ((((byte)local_2a & 0xfe) == 0xfe) || ((local_2a._1_1_ & 0xfe) == 0xfe)) {
          local_2e = CONCAT13(local_2a._1_1_ + 2,(undefined3)local_2e);
          local_28 = (shape_entry *)
                     (int)(short)(&game_state.level_data[0].height)
                                 [((uVar4 & 0xfe) * 2 | uVar4 & 0xfe00) * 2];
          uVar15 = (uint)local_2e._2_2_;
          uVar16 = (uint)local_2e._2_2_;
          local_2e._0_3_ = CONCAT12((byte)local_2a + 2,uVar7);
          uVar8 = (undefined3)local_2e;
          local_2e = CONCAT13(local_2a._1_1_ + 2,(undefined3)local_2e);
          local_24 = (int)(short)(&game_state.level_data[0].height)
                                 [((uVar15 & 0xfe) * 2 | uVar16 & 0xfe00) * 2];
          uVar15 = (uint)local_2e._2_2_;
          uVar16 = (uint)local_2e._2_2_;
          local_2e = CONCAT13(local_2a._1_1_,uVar8);
          local_20 = (int)(short)(&game_state.level_data[0].height)
                                 [((uVar15 & 0xfe) * 2 | uVar16 & 0xfe00) * 2];
          local_1c = (int)(short)(&game_state.level_data[0].height)
                                 [((local_2e._2_2_ & 0xfe) * 2 | local_2e._2_2_ & 0xfe00) * 2];
        }
        else {
          uVar15 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
          local_28 = (shape_entry *)(int)(short)(&game_state.level_data[0].height)[uVar15 * 2];
          local_24 = (int)(short)(&game_state.level_data[0x80].height)[uVar15 * 2];
          local_20 = (int)(short)(&game_state.level_data[0x81].height)[uVar15 * 2];
          local_1c = (int)(short)(&game_state.level_data[1].height)[uVar15 * 2];
        }
        local_4 = local_4 + 4;
        ppsVar19 = (shape_entry **)&local_28;
        do {
          psVar3 = *ppsVar19;
          if ((int)psVar3 < (int)psVar20) {
            psVar20 = psVar3;
          }
          psVar12 = (shape_entry *)(&psVar3->x1 + (int)&psVar12->x1);
          ppsVar19 = ppsVar19 + 1;
        } while (ppsVar19 < &local_18);
      }
      local_2a = CONCAT11(local_2a._1_1_,(byte)local_2a + 2);
      pbVar21 = pbVar21 + 1;
      local_8 = uVar6 - 1;
      uVar4 = local_2a;
      uVar6 = local_8;
    }
    local_2a = CONCAT11(local_2a._1_1_ + 2,(char)local_2e);
    uVar4 = local_2a;
    uVar5 = local_2e;
  }
  if (local_4 != 0) {
    psVar12 = (shape_entry *)((int)psVar12 / local_4);
  }
  if ((*(uint *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48 & 0x20000) == 0) {
    psVar12 = psVar20;
  }
  if ((int)psVar12 < 1) {
    psVar12 = (shape_entry *)0x1;
  }
  local_c = 1;
  if ((*(uint *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48 & 0x40000) != 0) {
    local_c = 5;
  }
  local_2e._0_2_ = (ushort)uVar5;
  local_2a = (ushort)local_2e;
  local_2e._0_1_ = (char)uVar5;
  uVar14 = local_10;
  while (uVar6 = local_14, uVar4 = local_2a, uVar14 != 0) {
    for (; local_2a._1_1_ = (byte)(uVar4 >> 8), cVar10 = local_2a._1_1_, uVar6 != 0;
        uVar6 = uVar6 - 1) {
      local_2a._0_1_ = (byte)uVar4;
      cVar9 = (byte)local_2a;
      if ((local_c & *pbVar18) != 0) {
        uVar15 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
        cVar1 = local_2a._1_1_ + '\x02';
        local_2a = CONCAT11(cVar1,(byte)local_2a);
        local_28 = (shape_entry *)(uVar15 * 4 + 0x8a03e4);
        uVar22 = (local_2a & 0xfe) * 2 | local_2a & 0xfe00;
        cVar2 = (byte)local_2a + '\x02';
        local_2a = CONCAT11(cVar1,cVar2);
        local_24 = uVar22 * 4 + 0x8a03e4;
        uVar16 = (local_2a & 0xfe) * 2 | local_2a & 0xfe00;
        local_2a = CONCAT11(cVar10,cVar2);
        local_20 = uVar16 * 4 + 0x8a03e4;
        uVar17 = (local_2a & 0xfe) * 2 | local_2a & 0xfe00;
        ppsVar19 = (shape_entry **)&local_28;
        local_1c = uVar17 * 4 + 0x8a03e4;
        do {
          psVar20 = *ppsVar19;
          ppsVar19 = ppsVar19 + 1;
          sVar11 = (short)psVar12;
          *(short *)&psVar20->field_0x4 = sVar11;
        } while (ppsVar19 < &local_18);
        if (((((*pbVar18 & 0xf8) != 0) && (0xc < *(byte *)(param_1 + 0x2b))) &&
            (*(byte *)(param_1 + 0x2b) < 0xf)) && ((*pbVar18 & 8) != 0)) {
          switch(iVar13) {
          case 0:
            (&game_state.level_data[0].height)[uVar15 * 2] = sVar11;
            (&game_state.level_data[0].height)[uVar22 * 2] = sVar11 + -1;
            (&game_state.level_data[0].height)[uVar16 * 2] = sVar11 + -1;
            (&game_state.level_data[0].height)[uVar17 * 2] = sVar11;
            break;
          case 1:
            (&game_state.level_data[0].height)[uVar15 * 2] = sVar11;
            (&game_state.level_data[0].height)[uVar22 * 2] = sVar11;
            (&game_state.level_data[0].height)[uVar16 * 2] = sVar11 + -1;
            (&game_state.level_data[0].height)[uVar17 * 2] = sVar11 + -1;
            break;
          case 2:
            (&game_state.level_data[0].height)[uVar15 * 2] = sVar11 + -1;
            (&game_state.level_data[0].height)[uVar22 * 2] = sVar11;
            (&game_state.level_data[0].height)[uVar16 * 2] = sVar11;
            (&game_state.level_data[0].height)[uVar17 * 2] = sVar11 + -1;
            break;
          case 3:
            (&game_state.level_data[0].height)[uVar15 * 2] = sVar11 + -1;
            (&game_state.level_data[0].height)[uVar22 * 2] = sVar11 + -1;
            (&game_state.level_data[0].height)[uVar16 * 2] = sVar11;
            (&game_state.level_data[0].height)[uVar17 * 2] = sVar11;
          }
        }
      }
      local_2a = CONCAT11(cVar10,cVar9 + '\x02');
      pbVar18 = pbVar18 + 1;
      uVar4 = local_2a;
    }
    local_2a = CONCAT11(local_2a._1_1_ + '\x02',(char)local_2e);
    uVar14 = uVar14 - 1;
    local_8 = uVar14;
  }
  local_2e._1_1_ = (char)((uint)uVar5 >> 8);
  local_2e._2_2_ = (ushort)((uint)uVar5 >> 0x10);
  local_2e._0_2_ = CONCAT11(local_2e._1_1_ + local_18->y2,(char)local_2e + local_18->x2);
  uVar14 = (int)local_14 >> 1;
  if ((uint)((int)local_14 >> 1) <= (uint)((int)local_10 >> 1)) {
    uVar14 = (int)local_10 >> 1;
  }
  land_level_processing_1(local_2e,uVar14,1);
  return;
}
