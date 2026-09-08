/* Ghidra 12.1.3 pseudocode; entry 00403c10; landscape_set_unit_shadow.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void landscape_set_unit_shadow(int param_1)

{
  uint *puVar1;
  ushort uVar2;
  byte bVar3;
  byte bVar4;
  uint uVar5;
  int iVar6;
  byte *pbVar7;
  int iVar8;
  shape_entry *psVar9;
  uint uVar10;
  undefined2 local_10;
  char local_e;
  char cStack_d;
  byte bStack_c;
  byte bStack_b;
  undefined2 uStack_a;

  iVar8 = (int)(char)objs0_mem[*(short *)(param_1 + 0x33)].shapes_index;
  if (iVar8 == 0) {
    iVar8 = 1;
  }
  psVar9 = shapes_mem + iVar8;
  bVar3 = (byte)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
  bStack_c = bVar3 & 0xfe;
  bVar4 = (byte)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  bStack_b = bVar4 & 0xfe;
  uVar2 = CONCAT11(bVar4,bVar3) & 0xfefe;
  pbVar7 = psVar9->ptr;
  local_e = (char)uVar2;
  cStack_d = (char)(uVar2 >> 8);
  local_e = local_e - psVar9->x2;
  cStack_d = cStack_d - psVar9->y2;
  bVar3 = psVar9->x1;
  bVar4 = psVar9->y1;
  if (bVar4 != 0) {
    bStack_b = 0;
    uStack_a = 0;
    bStack_c = bVar4;
    local_10._1_1_ = cStack_d;
    do {
      local_10 = CONCAT11(local_10._1_1_,local_e);
      uVar2 = local_10;
      for (uVar10 = (uint)bVar3; local_10._1_1_ = (char)(uVar2 >> 8), uVar10 != 0;
          uVar10 = uVar10 - 1) {
        if ((*pbVar7 & 1) != 0) {
          uVar5 = (uVar2 & 0xfe) * 2 | uVar2 & 0xfe00;
          iVar8 = uVar5 * 4;
          puVar1 = &game_state.level_data[0].flags + uVar5;
          *puVar1 = *puVar1 | 0x10;
          iVar6 = calc_unit_shade_value(puVar1);
          if (0xf < iVar6) {
            iVar6 = 0xf;
          }
          (&game_state.level_data[0].unit_shadow)[iVar8] =
               (&game_state.level_data[0].unit_shadow)[iVar8] & 0xf0 | (byte)iVar6;
        }
        local_10._0_1_ = (char)uVar2;
        local_10 = CONCAT11(local_10._1_1_,(char)local_10 + '\x02');
        pbVar7 = pbVar7 + 1;
        uVar2 = local_10;
      }
      local_10._1_1_ = local_10._1_1_ + '\x02';
      iVar8 = CONCAT22(uStack_a,CONCAT11(bStack_b,bStack_c)) + -1;
      bStack_c = (byte)iVar8;
      bStack_b = (byte)((uint)iVar8 >> 8);
      uStack_a = (undefined2)((uint)iVar8 >> 0x10);
    } while (iVar8 != 0);
  }
  uVar10 = (int)(uint)bVar4 >> 1;
  uVar5 = (int)(uint)bVar3 >> 1;
  if (uVar10 <= uVar5) {
    uVar10 = uVar5;
  }
  set_landscape_c_4_and_texture
            (CONCAT13(bStack_b,CONCAT12(bStack_c,CONCAT11(cStack_d + psVar9->y2,local_e + psVar9->x2
                                                         ))),uVar10);
  return;
}
