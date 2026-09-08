/* Ghidra 12.1.3 pseudocode; entry 004bdd40; set_landscape_c_4_and_texture.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void set_landscape_c_4_and_texture(undefined2 param_1,short param_2)

{
  int iVar1;
  byte *pbVar2;
  char *pcVar3;
  int iVar4;
  byte bVar5;
  char cVar6;
  char cVar7;
  char cVar8;
  char cVar9;
  uint uVar10;
  int iVar11;
  char cVar12;
  uint uVar13;
  int iVar14;
  int iVar15;
  undefined4 local_10;
  undefined2 local_c;
  undefined2 local_a;

  if (landscape_flags_1 == '\x03') {
    cVar9 = (char)param_2;
    local_10._2_1_ = (char)param_1;
    cVar6 = local_10._2_1_;
    local_10._3_1_ = (char)((ushort)param_1 >> 8);
    cVar7 = local_10._3_1_;
    local_c = CONCAT11(local_10._3_1_ + cVar9 * -2,local_10._2_1_ + cVar9 * -2);
    local_10 = (uint)local_c << 0x10;
    iVar1 = param_2 * 2 + 1;
    iVar11 = local_10;
    for (iVar15 = iVar1; iVar4 = iVar1, iVar15 != 0; iVar15 = iVar15 + -1) {
      for (; local_a._1_1_ = (char)(local_c >> 8), cVar8 = local_a._1_1_, iVar4 != 0;
          iVar4 = iVar4 + -1) {
        local_10._2_2_ = (undefined2)((uint)iVar11 >> 0x10);
        local_10 = CONCAT22(local_10._2_2_,local_c);
        uVar10 = (local_c & 0xfe) * 2 | local_c & 0xfe00;
        iVar11 = uVar10 * 4;
        cVar12 = (char)local_c;
        iVar14 = (int)(short)(&game_state.level_data[0].height)[uVar10 * 2];
        local_a = CONCAT11(local_a._1_1_,cVar12 + '\x02');
        uVar13 = (uint)local_a;
        uVar10 = (uint)local_a;
        local_a = CONCAT11(local_a._1_1_ + '\x02',cVar12);
        iVar14 = ((int)game_state.sunlight_var_3 +
                 (((short)(&game_state.level_data[0].height)
                          [((local_a & 0xfe) * 2 | local_a & 0xfe00) * 2] - iVar14) *
                  (int)game_state.sunlight_var_2 -
                 (int)game_state.sunlight_var_1 *
                 (iVar14 - (short)(&game_state.level_data[0].height)
                                  [((uVar10 & 0xfe) * 2 | uVar13 & 0xfe00) * 2]))) / 0x15e +
                 (((&game_state.level_data[0].unit_shadow)[iVar11] & 0xf) + 8) * 0x10;
        if (iVar14 < 0) {
          iVar14 = 0;
        }
        else if (0xff < iVar14) {
          iVar14 = 0xff;
        }
        (&game_state.level_data[0].brightness)[iVar11] = (char)iVar14;
        local_c = CONCAT11(cVar8,cVar12 + '\x02');
        iVar11 = local_10;
      }
      local_10._2_1_ = (char)((uint)iVar11 >> 0x10);
      local_c = CONCAT11(local_a._1_1_ + '\x02',local_10._2_1_);
    }
    local_c = CONCAT11(cVar7 + cVar9 * -2,cVar6 + cVar9 * -2);
    local_10 = (uint)local_c << 0x10;
    iVar11 = local_10;
    for (iVar15 = iVar1; iVar4 = iVar1, iVar15 != 0; iVar15 = iVar15 + -1) {
      for (; local_10._1_1_ = (byte)(local_c >> 8), bVar5 = local_10._1_1_, iVar4 != 0;
          iVar4 = iVar4 + -1) {
        local_10 = iVar11;
        if (landscape_flags_1 == '\x03') {
          local_10._2_2_ = (undefined2)((uint)iVar11 >> 0x10);
          local_10 = CONCAT22(local_10._2_2_,local_c);
          uVar13 = (uint)(byte)((byte)local_c >> 1);
          uVar10 = (uint)(bVar5 >> 1);
          iVar11 = (int)*(short *)(res_array_3 + (uVar10 * 0x80 + uVar13) * 2);
          if (-1 < iVar11) {
            pbVar2 = (byte *)(res_array_1 + 2 + iVar11 * 8);
            *pbVar2 = *pbVar2 & 0xfd;
            pcVar3 = (char *)(res_array_1 + 3 + iVar11 * 8);
            *pcVar3 = *pcVar3 + '\x01';
          }
          if ((level_flags & 4) == 0) {
            set_texture_globe(local_10,(uVar13 & 0xffffffe0) * 0x800 + (uVar13 & 0x1f) * 8 +
                                       (uVar10 & 0xffffffe0) * 0x2000 + (uVar10 & 0x1f) * 0x800 +
                                       landscape_texture_storage_big);
          }
          else {
            set_texture_globe_fade();
          }
          *(undefined1 *)(((int)uVar13 >> 2) + 0x9bc318 + (uVar10 & 0xfffffffc) * 8) = 1;
        }
        local_c = CONCAT11(bVar5,(byte)local_c + 2);
        iVar11 = local_10;
      }
      local_10._2_1_ = (char)((uint)iVar11 >> 0x10);
      local_c = CONCAT11(local_10._1_1_ + 2,local_10._2_1_);
    }
    set_landscape_flags_2_flag_2();
  }
  return;
}
