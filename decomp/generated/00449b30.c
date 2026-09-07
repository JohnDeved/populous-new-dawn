/* Ghidra 12.1.3 pseudocode; entry 00449b30; FUN_00449b30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

bool FUN_00449b30(void)

{
  short *psVar1;
  short sVar2;
  int iVar3;

  iVar3 = (int)(short)game_state._838518_2_;
  if (((game_state._838638_4_ & 0x7fffffff) != 0) || ((game_state._838626_4_ & 0x7fffffff) != 0)) {
    if ((float)game_state._838638_4_ <= (float)iVar3) {
      if ((float)game_state._838642_4_ <= (float)iVar3) {
        game_state._838630_4_ =
             (float)((short)game_state._838520_2_ - iVar3) * (float)game_state._838622_4_;
      }
      else {
        game_state._838630_4_ = game_state._838626_4_;
      }
    }
    else {
      game_state._838630_4_ =
           (float)game_state._838618_4_ * (float)iVar3 + (float)game_state._838634_4_;
    }
    game_state._838630_4_ = (float)game_state._838630_4_ + (float)_DAT_0058f2f0;
  }
  psVar1 = &game_state.tribes_array[player_tribe_num].field9_0x34;
  sVar2 = __ftol();
  *psVar1 = sVar2;
  if (sVar2 < -0x4000) {
    *psVar1 = -0x4000;
  }
  if (0x4000 < *psVar1) {
    *psVar1 = 0x4000;
  }
  FUN_0041c700((int)*psVar1,0x4000);
  return (short)game_state._838520_2_ <= (short)game_state._838518_2_;
}
