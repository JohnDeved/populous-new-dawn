/* Ghidra 12.1.3 pseudocode; entry 004429c0; rotate_main_cam.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void rotate_main_cam(int param_1,int param_2)

{
  if ((level_flags_1._2_1_ & 0x10) != 0) {
    param_1 = (int)(DAT_0089c6a9 * param_1 + (DAT_0089c6a9 * param_1 >> 0x1f & 0xffU)) >> 8;
  }
  game_state.tribes_array[player_tribe_num].angle_1 =
       game_state.tribes_array[player_tribe_num].angle_1 + (short)param_1 & 0x7ff;
  FUN_004e9d60(-param_1,0x800);
  _render_state_flags = _render_state_flags | 0x80;
  if ((level_flags_2._1_1_ & 4) == 0) {
    DAT_008926c7 = 0;
    return;
  }
  DAT_008926c7 = (short)(param_2 * param_1 + (param_2 * param_1 >> 0x1f & 0xffU) >> 8);
  return;
}
