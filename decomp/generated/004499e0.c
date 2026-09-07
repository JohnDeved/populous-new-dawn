/* Ghidra 12.1.3 pseudocode; entry 004499e0; FUN_004499e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

bool FUN_004499e0(void)

{
  undefined2 *puVar1;
  ushort uVar2;
  int iVar3;

  iVar3 = (int)(short)game_state._838514_2_;
  if (((game_state._838610_4_ & 0x7fffffff) != 0) || ((game_state._838598_4_ & 0x7fffffff) != 0)) {
    if ((float)game_state._838610_4_ <= (float)iVar3) {
      if ((float)game_state._838614_4_ <= (float)iVar3) {
        game_state._838602_4_ =
             (float)((short)game_state._838516_2_ - iVar3) * (float)game_state._838594_4_;
      }
      else {
        game_state._838602_4_ = game_state._838598_4_;
      }
    }
    else {
      game_state._838602_4_ =
           (float)game_state._838590_4_ * (float)iVar3 + (float)game_state._838606_4_;
    }
    game_state._838602_4_ = (float)game_state._838602_4_ + (float)_DAT_0058f2f0;
  }
  puVar1 = &game_state.tribes_array[player_tribe_num].angle_1;
  uVar2 = __ftol();
  *puVar1 = uVar2;
  _render_state_flags = _render_state_flags | 0x80;
  *puVar1 = uVar2 & 0x7ff;
  return (short)game_state._838516_2_ <= (short)game_state._838514_2_;
}
