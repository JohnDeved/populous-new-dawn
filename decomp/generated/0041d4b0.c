/* Ghidra 12.1.3 pseudocode; entry 0041d4b0; FUN_0041d4b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0041d4b0(char param_1)

{
  undefined2 *puVar1;
  int iVar2;

  if (((DAT_0089ce36 == '\0') && (DAT_005fe420 == 0)) && (DAT_0089ce34 == '\0')) {
    if (param_1 == '\0') {
      DAT_005fe404 = 0x100;
      sound_func_1();
      vconfig_index_start = DAT_0089c6eb;
      FUN_0042d380();
      set_draw_mode(0,player_tribe_num * 0xc65 + 0x89d1c8);
      game_state.tribes_array[player_tribe_num].angle_1 = (short)DAT_005fe42c;
      iVar2 = vconfig_dat_mem[vconfig_index * 5 + (int)vconfig_index_start].matrix_related;
    }
    else {
      DAT_005fe404 = 0;
      _DAT_005fe438 = GetTickCount();
      FUN_0048b8d0();
      maybe_sound_1(1);
      DAT_0089c6eb = vconfig_index_start;
      DAT_0089ce35 = 0;
      vconfig_index_start = '\x04';
      puVar1 = &game_state.tribes_array[player_tribe_num].angle_1;
      DAT_005fe42c = (int)(short)*puVar1;
      *puVar1 = 0;
      FUN_00418810();
      set_draw_mode(2,player_tribe_num * 0xc65 + 0x89d1c8);
      iVar2 = (int)vconfig_index;
      game_state.tribes_array[player_tribe_num].field9_0x34 = 0x100;
      iVar2 = vconfig_dat_mem[iVar2 * 5 + 4].matrix_related;
    }
    FUN_00417980(iVar2);
    _render_state_flags = _render_state_flags | 0x80;
    update_vfconfig();
    DAT_0089ce36 = '\0';
    DAT_005fe420 = 0;
    DAT_005fe400 = DAT_005fe404;
    DAT_0059bc0c = DAT_005fe404;
  }
  return;
}
