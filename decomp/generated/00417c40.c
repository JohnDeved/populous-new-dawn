/* Ghidra 12.1.3 pseudocode; entry 00417c40; FUN_00417c40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00417c40(void)

{
  int iVar1;
  ushort uVar2;

  if ((DAT_0089c6e3 != 0) && (draw_mode != 2)) {
    iVar1 = (int)player_tribe_num;
    uVar2 = game_state.tribes_array[iVar1].angle_1 + DAT_0089c6e3;
    game_state.tribes_array[iVar1].angle_1 = uVar2;
    game_state.tribes_array[iVar1].angle_1 = uVar2 & 0x7ff;
    _render_state_flags = _render_state_flags | 0x80;
  }
  return;
}
