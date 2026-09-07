/* Ghidra 12.1.3 pseudocode; entry 00449ae0; FUN_00449ae0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449ae0(int param_1)

{
  short sVar1;

  sVar1 = *(short *)(param_1 + 2) << 6;
  *(short *)(param_1 + 2) = sVar1;
  FUN_0044a070((int)sVar1 - (int)game_state.tribes_array[player_tribe_num].field9_0x34,
               (int)(short)game_state._838520_2_,0x969d52,0x969d66);
  return;
}
