/* Ghidra 12.1.3 pseudocode; entry 00439740; FUN_00439740.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_00439740(int param_1)

{
  short *psVar1;
  short sVar2;
  uint uVar3;
  uint uVar4;
  undefined2 local_6;

  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar3 = uVar4 >> 0xd;
    game_state.pseudo_random_val = uVar3 | uVar4 * 0x80000;
    sVar2 = *(short *)(param_1 + 0x5d);
    update_gs_unit_related_array_item(param_1);
    uVar4 = *(uint *)(param_1 + 0xc);
    *(ushort *)(param_1 + 0x57) = (sVar2 + ((ushort)uVar3 & 0x1ff)) - 0x100 & 0x7ff;
    *(uint *)(param_1 + 0xc) = uVar4 | 0x80;
    *(uint *)(param_1 + 0xc) = uVar4 | 0x1080;
    FUN_004d4f40(param_1);
    *(undefined2 *)(param_1 + 0x70) = 3;
  }
  local_6 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
  if (((&game_state.level_data[0].unit_index_2)[((local_6 & 0xfe) * 2 | local_6 & 0xfe00) * 2] &
      0x3ff) != 0) {
    *(undefined2 *)(param_1 + 0x70) = 3;
    return false;
  }
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    FUN_004d4f40(param_1);
  }
  psVar1 = (short *)(param_1 + 0x70);
  *psVar1 = *psVar1 + -1;
  return *psVar1 == 0;
}
