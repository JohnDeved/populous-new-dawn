/* Ghidra 12.1.3 pseudocode; entry 00403a00; landscape_move_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void landscape_move_1(int param_1,char param_2)

{
  int iVar1;
  uint *puVar2;
  byte bVar3;
  byte bVar4;
  ushort uVar5;
  ushort uVar6;
  bool bVar7;
  ushort uVar8;
  short sVar9;
  uint uVar10;
  int iVar11;
  uint uVar12;
  shape_entry *psVar13;
  uint uVar14;
  byte *pbVar15;
  undefined2 local_20;
  char local_1e;
  char cStack_1d;
  undefined2 uStack_1c;
  uint local_18;
  byte local_14;

  local_14 = 0;
  uVar5 = 0;
  bVar7 = false;
  if (param_2 == '\0') {
    local_14 = 0;
  }
  else {
    if (param_2 != '\x01') goto LAB_00403a7a;
    local_14 = *(char *)(param_1 + 0x2f) + 1;
    uVar5 = *(ushort *)(param_1 + 0x24);
  }
  bVar7 = true;
LAB_00403a7a:
  psVar13 = shapes_mem +
            (char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                  [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  uStack_1c = SUB42(psVar13,0);
  local_18 = (CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) & 0xfffe) & 0xfffffeff;
  pbVar15 = psVar13->ptr;
  local_1e = (char)local_18;
  cStack_1d = (char)(local_18 >> 8);
  local_1e = local_1e - psVar13->x2;
  cStack_1d = cStack_1d - psVar13->y2;
  bVar3 = psVar13->x1;
  bVar4 = psVar13->y1;
  local_20._1_1_ = cStack_1d;
  uVar12 = (uint)bVar4;
  do {
    if (uVar12 == 0) {
      uVar14 = (int)(uint)bVar3 >> 1;
      uVar12 = (int)(uint)bVar4 >> 1;
      sVar9 = (short)uVar12;
      if (uVar12 <= uVar14) {
        sVar9 = (short)uVar14;
      }
      set_landscape_c_4_and_texture
                (CONCAT22(uStack_1c,CONCAT11(cStack_1d + psVar13->y2,local_1e + psVar13->x2)),
                 sVar9 + 1);
      return;
    }
    local_20 = CONCAT11(local_20._1_1_,local_1e);
    uVar8 = local_20;
    for (uVar14 = (uint)bVar3; local_20._1_1_ = (char)(uVar8 >> 8), uVar14 != 0; uVar14 = uVar14 - 1
        ) {
      if ((*pbVar15 & 1) != 0) {
        uVar10 = (uVar8 & 0xfe) * 2 | uVar8 & 0xfe00;
        iVar1 = uVar10 * 4;
        puVar2 = &game_state.level_data[0].flags + uVar10;
        (&game_state.level_data[0].c_2)[iVar1] =
             (&game_state.level_data[0].c_2)[uVar10 * 4] & 0xf0 | local_14;
        uVar6 = (&game_state.level_data[0].unit_index_2)[uVar10 * 2];
        (&game_state.level_data[0].unit_index_2)[uVar10 * 2] = (uVar6 ^ uVar5) & 0x3ff ^ uVar6;
        uVar10 = *puVar2;
        *puVar2 = uVar10 | 0x10;
        if (param_2 == '\0') {
          uVar10 = uVar10 & 0xfffffdff | 0x10;
LAB_00403b76:
          *puVar2 = uVar10;
        }
        else {
          if (param_2 == '\x01') {
            uVar10 = uVar10 | 0x210;
            goto LAB_00403b76;
          }
          if (param_2 == '\x04') {
            uVar10 = uVar10 & 0xfffdffff | 0x10;
            goto LAB_00403b76;
          }
        }
        if (bVar7) {
          iVar11 = calc_unit_shade_value(puVar2);
          if (0xf < iVar11) {
            iVar11 = 0xf;
          }
          (&game_state.level_data[0].unit_shadow)[iVar1] =
               (&game_state.level_data[0].unit_shadow)[iVar1] & 0xf0 | (byte)iVar11;
        }
      }
      local_20._0_1_ = (char)uVar8;
      local_20 = CONCAT11(local_20._1_1_,(char)local_20 + '\x02');
      pbVar15 = pbVar15 + 1;
      uVar8 = local_20;
    }
    local_20._1_1_ = local_20._1_1_ + '\x02';
    uVar12 = uVar12 - 1;
  } while( true );
}
