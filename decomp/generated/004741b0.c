/* Ghidra 12.1.3 pseudocode; entry 004741b0; render_object_type_0x10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void render_object_type_0x10(int param_1,int param_2,int param_3,int param_4)

{
  byte bVar1;
  byte bVar2;
  ushort uVar3;
  short sVar4;
  ushort *puVar5;
  uint uVar6;
  int *piVar7;
  int iVar8;
  uint uVar9;
  uint uVar10;
  ushort *puVar11;
  byte *pbVar12;
  undefined4 *puVar13;
  float10 fVar14;
  byte local_196 [30];
  undefined4 local_178;
  undefined4 local_174;
  undefined4 local_170;
  int *local_16c;
  uint local_168;
  uint local_164;
  int local_160;
  undefined2 local_15c;
  undefined2 local_15a;
  undefined1 local_156;
  undefined1 local_155;
  undefined1 local_154 [52];
  int local_120 [2];
  int local_118 [30];
  int local_a0 [32];
  ushort local_20 [16];

  local_196[0] = 7;
  local_196[1] = 0;
  local_196[2] = 7;
  local_196[4] = 1;
  local_196[5] = 5;
  local_196[7] = 1;
  local_196[3] = 3;
  local_196[9] = 0;
  local_196[0xc] = 1;
  local_196[0xe] = 5;
  local_196[0xb] = 6;
  local_196[0xd] = 6;
  local_196[6] = 4;
  local_196[0xf] = 1;
  local_196[0x11] = 7;
  local_196[8] = 4;
  local_196[0x12] = 6;
  local_196[0x14] = 6;
  local_196[10] = 2;
  local_196[0x10] = 3;
  local_196[0x17] = 5;
  local_196[0x18] = 7;
  local_196[0x19] = 5;
  local_196[0x1a] = 6;
  piVar7 = local_120;
  local_196[0x1b] = 7;
  local_196[0x13] = 3;
  local_196[0x15] = 2;
  local_196[0x16] = 4;
  puVar5 = local_20;
  do {
    *(int **)puVar5 = piVar7;
    puVar5 = puVar5 + 2;
    piVar7 = piVar7 + 8;
  } while (puVar5 < &stack0x00000000);
  uVar3 = (ushort)(param_1 + -0x8a03e4 >> 4);
  sVar4 = ((uVar3 & 0xff80) * 2 | uVar3 & 0x7f) * 2;
  local_15c._1_1_ = (byte)((ushort)sVar4 >> 8);
  bVar2 = local_15c._1_1_;
  local_15c._0_1_ = (char)sVar4;
  local_15c._1_1_ = local_15c._1_1_ & 0xfe;
  local_120[0] = (int)(short)(uVar3 << 9);
  local_118[0] = (int)(short)((ushort)local_15c._1_1_ << 8);
  local_15c._1_1_ = bVar2 + 2 & 0xfe;
  local_118[6] = (int)(short)(uVar3 << 9);
  local_118[8] = (int)(short)((ushort)local_15c._1_1_ << 8);
  bVar1 = (char)local_15c + 2;
  local_178._0_2_ = (ushort)bVar1;
  local_15c._1_1_ = bVar2 + 2 & 0xfe;
  local_118[0xe] = (int)(short)((ushort)local_178 << 8);
  local_118[0x10] = (int)(short)((ushort)local_15c._1_1_ << 8);
  local_178._0_2_ = CONCAT11(bVar2,bVar1);
  local_15c = CONCAT11(bVar2,bVar1) & 0xfeff;
  local_118[0x16] = (int)(short)((ushort)bVar1 << 8);
  local_118[0x18] = (int)(short)((bVar2 & 0xfe) << 8);
  if (param_2 == 0) {
    if (param_3 < 0x200001) {
      if (param_3 == 0x200000) {
        local_118[0] = local_118[0] + 0xa4;
        local_118[0x18] = local_118[0x18] + 0xa4;
        local_120[0] = local_120[0] + 0xa4;
        local_118[6] = local_118[6] + 0xa4;
      }
      else if (param_3 == 0) {
        local_118[0] = local_118[0] + 0xa4;
        local_118[0x18] = local_118[0x18] + 0xa4;
        local_118[0xe] = local_118[0xe] + -0xa4;
        local_118[0x16] = local_118[0x16] + -0xa4;
      }
    }
    else if (param_3 == 0x400000) {
      local_118[8] = local_118[8] + -0xa4;
      local_118[0x10] = local_118[0x10] + -0xa4;
      local_120[0] = local_120[0] + 0xa4;
      local_118[6] = local_118[6] + 0xa4;
    }
    else if (param_3 == 0x600000) {
      local_118[8] = local_118[8] + -0xa4;
      local_118[0x10] = local_118[0x10] + -0xa4;
      local_118[0xe] = local_118[0xe] + -0xa4;
      local_118[0x16] = local_118[0x16] + -0xa4;
    }
  }
  else if (param_2 == 0x80000) {
    if (param_3 == 0) {
      local_120[0] = local_120[0] + 0xa4;
      local_118[6] = local_118[6] + 0xa4;
      local_118[0xe] = local_118[0xe] + -0xa4;
      local_118[0x16] = local_118[0x16] + -0xa4;
    }
    else if (param_3 == 0x200000) {
      local_118[0] = local_118[0] + 0xa4;
      local_118[0x18] = local_118[0x18] + 0xa4;
      local_118[8] = local_118[8] + -0xa4;
      local_118[0x10] = local_118[0x10] + -0xa4;
    }
  }
  sVar4 = calc_point_height(local_120[0],local_118[0]);
  local_120[1] = (int)sVar4;
  sVar4 = calc_point_height(local_118[6],local_118[8]);
  local_118[7] = (int)sVar4;
  sVar4 = calc_point_height(local_118[0xe],local_118[0x10]);
  local_118[0xf] = (int)sVar4;
  sVar4 = calc_point_height(local_118[0x16],local_118[0x18]);
  local_118[0x17] = (int)sVar4;
  puVar5 = (ushort *)(local_118 + 0x1e);
  do {
    *(undefined4 *)puVar5 = *(undefined4 *)(puVar5 + -0x40);
    puVar11 = puVar5 + 0x10;
    *(int *)(puVar5 + 2) = *(int *)(puVar5 + -0x3e) + 0x60;
    *(undefined4 *)(puVar5 + 4) = *(undefined4 *)(puVar5 + -0x3c);
    puVar5 = puVar11;
  } while (puVar11 < local_20);
  if (param_2 == 0) {
    if (param_3 < 0x200001) {
      if (param_3 == 0x200000) {
        local_a0[2] = local_a0[2] + 0x30;
        local_a0[0x1a] = local_a0[0x1a] + 0x30;
        local_a0[0] = local_a0[0] + 0x30;
        local_a0[8] = local_a0[8] + 0x30;
      }
      else if (param_3 == 0) {
        local_a0[2] = local_a0[2] + 0x30;
        local_a0[0x1a] = local_a0[0x1a] + 0x30;
        local_a0[0x10] = local_a0[0x10] + -0x30;
        local_a0[0x18] = local_a0[0x18] + -0x30;
      }
    }
    else if (param_3 == 0x400000) {
      local_a0[10] = local_a0[10] + -0x30;
      local_a0[0x12] = local_a0[0x12] + -0x30;
      local_a0[0] = local_a0[0] + 0x30;
      local_a0[8] = local_a0[8] + 0x30;
    }
    else if (param_3 == 0x600000) {
      local_a0[10] = local_a0[10] + -0x30;
      local_a0[0x12] = local_a0[0x12] + -0x30;
      local_a0[0x10] = local_a0[0x10] + -0x30;
      local_a0[0x18] = local_a0[0x18] + -0x30;
    }
  }
  else if (param_2 == 0x80000) {
    if (param_3 == 0) {
      local_a0[0] = local_a0[0] + 0x30;
      local_a0[8] = local_a0[8] + 0x30;
      local_a0[0x10] = local_a0[0x10] + -0x30;
      local_a0[0x18] = local_a0[0x18] + -0x30;
    }
    else if (param_3 == 0x200000) {
      local_a0[2] = local_a0[2] + 0x30;
      local_a0[0x1a] = local_a0[0x1a] + 0x30;
      local_a0[10] = local_a0[10] + -0x30;
      local_a0[0x12] = local_a0[0x12] + -0x30;
    }
  }
  puVar5 = (ushort *)local_120;
  do {
    uVar9 = (uint)*puVar5 - (uint)(ushort)tribe_ptr->x;
    uVar6 = uVar9;
    if ((int)uVar9 < 0) {
      uVar6 = -uVar9;
    }
    uVar10 = uVar9;
    if (((uVar6 & 0x8000) != 0) && (uVar10 = uVar6 - 0x10000, (int)uVar9 < 1)) {
      uVar10 = 0x10000 - uVar6;
    }
    *(int *)puVar5 = (int)uVar10 >> 1;
    uVar9 = (uint)puVar5[4] - (uint)(ushort)tribe_ptr->y;
    uVar6 = uVar9;
    if ((int)uVar9 < 0) {
      uVar6 = -uVar9;
    }
    uVar10 = uVar9;
    if (((uVar6 & 0x8000) != 0) && (uVar10 = uVar6 - 0x10000, (int)uVar9 < 1)) {
      uVar10 = 0x10000 - uVar6;
    }
    *(int *)(puVar5 + 4) = (int)uVar10 >> 1;
    puVar11 = puVar5 + 0x10;
    coord_pnts_global_convert(puVar5);
    puVar5 = puVar11;
  } while (puVar11 < local_20);
  puVar13 = (undefined4 *)&local_15c;
  for (iVar8 = 0xf; iVar8 != 0; iVar8 = iVar8 + -1) {
    *puVar13 = 0;
    puVar13 = puVar13 + 1;
  }
  local_15a = 0x1a;
  local_156 = 3;
  local_155 = 6;
  FUN_0040cde0(local_154);
  local_160 = (-(uint)(*(char *)(param_4 + 0x2c) == '\x01') & 0xfffffffe) + 10;
  if (0 < local_160) {
    pbVar12 = local_196;
    do {
      bVar1 = pbVar12[-2];
      local_164 = (uint)*pbVar12;
      local_16c = local_120 + (uint)*pbVar12 * 8;
      local_168 = (uint)pbVar12[-1];
      iVar8 = local_168 * 8;
      local_15c = calc_normal_maybe(local_120 + (uint)bVar1 * 8,local_120 + iVar8,local_16c);
      fVar14 = (float10)screen_clipping(local_120 + (uint)bVar1 * 8,local_120 + iVar8,local_16c);
      if ((float10)_DAT_0058f468 < fVar14) {
        local_178 = *(undefined4 *)(local_20 + (uint)bVar1 * 2);
        local_174 = *(undefined4 *)(local_20 + local_168 * 2);
        local_170 = *(undefined4 *)(local_20 + local_164 * 2);
        add_polygon_to_draw_3v_2
                  (&local_15c,&local_178,0xfffffffb,(&sunlight_related_array_1)[(short)local_15c],0,
                   1,2,0);
      }
      pbVar12 = pbVar12 + 3;
      local_160 = local_160 + -1;
    } while (local_160 != 0);
  }
  return;
}
