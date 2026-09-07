/* Ghidra 12.1.3 pseudocode; entry 00449760; FUN_00449760.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

bool FUN_00449760(void)

{
  short sVar1;
  undefined4 uVar2;
  int iVar3;
  int iVar4;

  iVar3 = (int)(short)game_state._838510_2_;
  if (((game_state._838574_4_ & 0x7fffffff) != 0) || ((game_state._838542_4_ & 0x7fffffff) != 0)) {
    if ((float)game_state._838574_4_ <= (float)iVar3) {
      if ((float)game_state._838578_4_ <= (float)iVar3) {
        game_state._838546_4_ =
             (float)((short)game_state._838512_2_ - iVar3) * (float)game_state._838538_4_;
      }
      else {
        game_state._838546_4_ = game_state._838542_4_;
      }
    }
    else {
      game_state._838546_4_ =
           (float)game_state._838534_4_ * (float)iVar3 + (float)game_state._838550_4_;
    }
    game_state._838546_4_ = (float)game_state._838546_4_ + (float)_DAT_0058f2f0;
  }
  iVar3 = (int)player_tribe_num;
  sVar1 = __ftol();
  game_state.tribes_array[iVar3].x = sVar1;
  iVar4 = (int)(short)game_state._838510_2_;
  if (((game_state._838582_4_ & 0x7fffffff) != 0) || ((game_state._838562_4_ & 0x7fffffff) != 0)) {
    if ((float)game_state._838582_4_ <= (float)iVar4) {
      if ((float)game_state._838586_4_ <= (float)iVar4) {
        game_state._838566_4_ =
             (float)((short)game_state._838512_2_ - iVar4) * (float)game_state._838558_4_;
      }
      else {
        game_state._838566_4_ = game_state._838562_4_;
      }
    }
    else {
      game_state._838566_4_ =
           (float)game_state._838554_4_ * (float)iVar4 + (float)game_state._838570_4_;
    }
    game_state._838566_4_ = (float)game_state._838566_4_ + (float)_DAT_0058f2f0;
  }
  sVar1 = __ftol();
  game_state.tribes_array[iVar3].y = sVar1;
  uVar2 = __ftol(0x8000);
  FUN_004e9d70(uVar2);
  return (short)game_state._838512_2_ <= (short)game_state._838510_2_;
}
