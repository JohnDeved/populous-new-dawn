/* Ghidra 12.1.3 pseudocode; entry 00417b70; FUN_00417b70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00417b70(void)

{
  ushort uVar1;
  int iVar2;

  if (DAT_0089ce35 != '\0') {
    iVar2 = (int)player_tribe_num;
    DAT_0089ce35 = DAT_0089ce35 + -1;
    if (DAT_0089c6c9 != 0) {
      if (DAT_0089ce35 != '\0') {
        uVar1 = game_state.tribes_array[iVar2].angle_1 + DAT_0089c6c9;
        game_state.tribes_array[iVar2].angle_1 = uVar1;
        game_state.tribes_array[iVar2].angle_1 = uVar1 & 0x7ff;
        _render_state_flags = _render_state_flags | 0x80;
        return;
      }
      game_state.tribes_array[iVar2].angle_1 = DAT_0089c6c7;
      _render_state_flags = _render_state_flags | 0x80;
      return;
    }
    DAT_0089ce35 = '\0';
    _render_state_flags = _render_state_flags | 0x80;
  }
  return;
}
