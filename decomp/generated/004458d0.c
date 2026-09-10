/* Ghidra 12.1.3 pseudocode; entry 004458d0; FUN_004458d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004458d0(int param_1,char param_2,byte param_3)

{
  if (param_2 == '\0') {
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffff7f;
    *(byte *)(param_1 + 0x7a) = *(byte *)(param_1 + 0x7a) & 0x7f;
  }
  else {
    *(byte *)(param_1 + 0x7a) = *(byte *)(param_1 + 0x7a) | 0x80;
    if ((param_3 & 4) == 0) {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xefffffff;
    }
    else {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x10000000;
    }
    if ((*(char *)(param_1 + 0x2f) == player_tribe_num) &&
       (game_state._838930_2_ != *(short *)(param_1 + 0x24))) {
      game_state._838943_1_ = game_state._838943_1_ & 0xfd;
      game_state._838930_2_ = *(short *)(param_1 + 0x24);
      game_state._838940_1_ = 0;
      return;
    }
  }
  return;
}
