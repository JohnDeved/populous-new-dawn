/* Ghidra 12.1.3 pseudocode; entry 00436d00; FUN_00436d00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00436d00(int param_1,ushort param_2,char param_3)

{
  short *psVar1;
  ushort local_2;

  psVar1 = (short *)((int)(game_state.sunlight_array + 0x32) + (uint)param_2 * 10 + 2);
  if (*psVar1 == 0) {
    game_state._841986_2_ = game_state._841986_2_ + 1;
  }
  *psVar1 = *psVar1 + 1;
  if (-1 < param_3) {
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xfdffffff;
    *(undefined2 *)(param_1 + 0x83) = 0;
    *(ushort *)(param_1 + 0x8b + param_3 * 2) = param_2;
    FUN_0043b010(param_1);
    return;
  }
  if (*(short *)(param_1 + 0x9b) != 0) {
    FUN_004364d0(param_1,0xffffffff);
  }
  *(ushort *)(param_1 + 0x9b) = param_2;
  if ((*(byte *)(param_1 + 0x17) & 2) == 0) {
    local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
    *(ushort *)(param_1 + 0x83) = local_2 + 1;
  }
  return;
}
