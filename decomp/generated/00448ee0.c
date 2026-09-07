/* Ghidra 12.1.3 pseudocode; entry 00448ee0; FUN_00448ee0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00448ee0(void)

{
  if (((byte)opened_files_flags & 0x10) == 0) {
    FUN_0049cf90(1);
    game_state.start_15 = 0;
    game_state._838236_1_ = 6;
    game_state._838239_1_ = game_state._838239_1_ & 0x3f | 1;
    FUN_004af0a0(0x40);
    level_flags_1 = level_flags_1 & 0xffffffdf;
    if (((draw_mode == 2) || (DAT_0089ce36 != '\0')) && (DAT_0089bbf7 != '\x01')) {
      DAT_0089ce36 = '\0';
      DAT_0089ce35 = 0;
      DAT_005fe420 = 0;
      DAT_0089ce34 = 0;
      FUN_0041cdc0((int)(short)game_state.tribes_array[player_tribe_num].angle_1);
      DAT_0089c6eb = 0;
      FUN_0041d4b0(0);
    }
  }
  return;
}
