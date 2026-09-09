/* Ghidra 12.1.3 pseudocode; entry 004982e0; FUN_004982e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004982e0(int param_1,undefined4 param_2)

{
  uint uVar1;
  uint uVar2;

  FUN_004ba130(param_1,param_2);
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar1 = uVar2 >> 0xd;
  game_state.pseudo_random_val = uVar1 | uVar2 * 0x80000;
  uVar2 = (uint)*(ushort *)&unit_type_array_building[*(byte *)(param_1 + 0x9e)].pos_related;
  if (*(short *)(param_1 + 0x92) == 0) {
    uVar2 = (int)uVar2 >> 1;
  }
  move_pos_angle_length(param_2,uVar1 & 0x7ff,uVar2);
  return;
}
