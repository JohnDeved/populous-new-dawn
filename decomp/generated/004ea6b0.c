/* Ghidra 12.1.3 pseudocode; entry 004ea6b0; FUN_004ea6b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ea6b0(int param_1,undefined4 *param_2,byte *param_3)

{
  int iVar1;
  int iVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  short sVar5;
  ushort uVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  bool bVar10;
  undefined1 uStack_c;
  byte bStack_b;
  short sStack_a;
  undefined4 local_8;
  undefined4 local_4;

  uVar3 = *(undefined4 *)param_3;
  uVar4 = *param_2;
  uStack_c = (undefined1)uVar4;
  bStack_b = (byte)((uint)uVar4 >> 8);
  local_8 = (uint)(CONCAT21((ushort)(bStack_b & 0xfe) << 8,uStack_c) & 0xfffffe) << 8;
  local_4._0_1_ = (byte)uVar3;
  bStack_b = (byte)local_4 & 0xfe;
  uStack_c = 0;
  local_4._1_1_ = (byte)((uint)uVar3 >> 8);
  sStack_a = (ushort)(local_4._1_1_ & 0xfe) << 8;
  uVar7 = (((ushort)uVar4 & 0xfefe) & 0xfe) * 2 | ((ushort)uVar4 & 0xfefe) & 0xfe00;
  iVar1 = uVar7 * 4;
  uVar8 = (((ushort)uVar3 & 0xfefe) & 0xfe) * 2 | ((ushort)uVar3 & 0xfefe) & 0xfe00;
  bVar10 = (*(byte *)((int)&game_state.level_data[0].flags + iVar1 + 1) & 2) != 0;
  iVar2 = uVar8 * 4;
  local_4 = uVar3;
  if (bVar10) {
    FUN_004044b0(unit_land_array
                 [(ushort)(&game_state.level_data[0].unit_index_2)[uVar7 * 2] & 0x3ff],&local_8);
  }
  if ((*(byte *)((int)&game_state.level_data[0].flags + iVar2 + 1) & 2) != 0) {
    game_state._755280_4_ = param_1;
    iVar9 = FUN_00518070(CONCAT13(bStack_b,CONCAT12(uStack_c,(short)local_4)));
    if (iVar9 != 0) {
      bVar10 = true;
      FUN_004044b0(unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)[uVar8 * 2] & 0x3ff],&uStack_c);
    }
  }
  if (*(ushort *)(param_1 + 0x9f) == 0) {
    if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar1] & 0xf)) & 0x3c)
        != 0) {
      bVar10 = true;
      sVar5 = FUN_004655f0(&local_8);
      uVar6 = sVar5 * 0x100 + 0x400U & 0x7ff;
      local_8 = CONCAT22(local_8._2_2_ + (short)((uint)(maybe_cos[uVar6] << 9) >> 0x10),
                         (short)local_8 + (short)((uint)(maybe_sin[uVar6] << 9) >> 0x10));
    }
    if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar2] & 0xf)) & 0x3c)
        != 0) {
      bVar10 = true;
      sVar5 = FUN_004655f0(&uStack_c);
      uVar6 = sVar5 * 0x100 + 0x400U & 0x7ff;
      bStack_b = (byte)((ushort)(CONCAT11(bStack_b,uStack_c) +
                                (short)((uint)(maybe_sin[uVar6] << 9) >> 0x10)) >> 8);
      sStack_a = sStack_a + (short)((uint)(maybe_cos[uVar6] << 9) >> 0x10);
    }
  }
  else {
    bVar10 = true;
    local_8._0_2_ = (unit_land_array[*(ushort *)(param_1 + 0x9f)]->pos).x;
    local_8._2_2_ = (unit_land_array[*(ushort *)(param_1 + 0x9f)]->pos).y;
  }
  if (bVar10) {
    *(char *)param_2 = (char)((uint)local_8 >> 8);
    *(char *)((int)param_2 + 1) = (char)((uint)local_8 >> 0x18);
    *param_3 = bStack_b;
    param_3[1] = (byte)((ushort)sStack_a >> 8);
  }
  return;
}
