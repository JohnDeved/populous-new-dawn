/* Ghidra 12.1.3 pseudocode; entry 00443910; FUN_00443910.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00443910(void)

{
  uint uVar1;

  uVar1 = level_flags;
  level_flags = level_flags & 0xfffffffb;
  if ((uVar1 & 2) != 0) {
    if ((load_level_flags._1_1_ & 2) == 0) {
      level_flags = level_flags | 4;
    }
    if ((level_flags & 2) != 0) {
      game_state.flags_1 = game_state.flags_1 | 1;
      return;
    }
  }
  game_state.flags_1 = game_state.flags_1 & 0xfe;
  return;
}
