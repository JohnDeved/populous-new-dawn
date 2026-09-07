/* Ghidra 12.1.3 pseudocode; entry 00449080; FUN_00449080.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449080(void)

{
  short *psVar1;
  undefined2 local_8 [2];
  undefined2 local_4;
  short sStack_2;

  if (((game_state._838239_1_ & 0x10) != 0) && ((game_state._838239_1_ & 1) != 0)) {
    if (game_state._838236_1_ == '\0') {
      if ((game_state._838239_1_ & 0x40) == 0) {
        game_state._838546_4_ = 0;
        game_state._838566_4_ = 0;
        game_state._838630_4_ = 0;
        if ((char)game_state._838237_1_ < '\v') {
          game_state._838512_2_ = (char)game_state._838237_1_ * 3;
        }
        else {
          game_state._838512_2_ = (char)game_state._838237_1_ * 2;
        }
        game_state._838238_1_ = 2;
        local_4 = 0;
        local_8[1] = game_state._838242_2_;
        local_8[0] = 1;
        game_state._838510_2_ = 0;
        sStack_2 = game_state._838512_2_;
        if (PTR_FUN_0059cd48 != (undefined *)0x0) {
          (*(code *)PTR_FUN_0059cd48)(local_8);
        }
        game_state._838238_1_ = game_state._838238_1_ | 4;
        local_8[0]._0_1_ = 2;
        local_8[1] = game_state._838244_2_;
        game_state._838516_2_ = sStack_2;
        game_state._838514_2_ = 0;
        if (PTR_FUN_0059cd50 != (undefined *)0x0) {
          (*(code *)PTR_FUN_0059cd50)(local_8);
        }
        game_state._838238_1_ = game_state._838238_1_ | 8;
        local_8[0]._0_1_ = 3;
        local_8[1] = game_state._838246_2_;
        game_state._838520_2_ = sStack_2;
        game_state._838518_2_ = 0;
        if (PTR_FUN_0059cd58 != (undefined *)0x0) {
          (*(code *)PTR_FUN_0059cd58)(local_8);
        }
        game_state._838239_1_ = game_state._838239_1_ | 0x48;
        write_str_to_debug_buffer(DAT_00973e1c,0x20,0,0);
        return;
      }
    }
    else {
      game_state._838239_1_ = game_state._838239_1_ & 0xfe;
      FUN_0049cfa0(1);
      psVar1 = &game_state.tribes_array[player_tribe_num].field9_0x34;
      if (*psVar1 != 0) {
        *psVar1 = 0;
        FUN_00479f00(0xc,0,0);
      }
      FUN_004af1c0(0x40);
    }
  }
  return;
}
