/* Ghidra 12.1.3 pseudocode; entry 00442480; FUN_00442480.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00442480(int param_1)

{
  if (game_state._838930_2_ != *(short *)(param_1 + 0x24)) {
    game_state._838943_1_ = game_state._838943_1_ & 0xfd;
    game_state._838940_1_ = 0;
    game_state._838930_2_ = *(short *)(param_1 + 0x24);
  }
  return;
}
