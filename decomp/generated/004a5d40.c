/* Ghidra 12.1.3 pseudocode; entry 004a5d40; FUN_004a5d40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a5d40(void)

{
  if ((((((byte)land_flags_1 & 2) == 0) && (((byte)game_state.field95396_0xcd6e8 & 1) != 0)) &&
      (0 < game_state.start_21)) &&
     (game_state.start_21 = game_state.start_21 - game_state.field95397_0xcd6ec,
     game_state.start_21 < 0)) {
    game_state.start_21 = 0;
  }
  return;
}
