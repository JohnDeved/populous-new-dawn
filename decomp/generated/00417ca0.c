/* Ghidra 12.1.3 pseudocode; entry 00417ca0; FUN_00417ca0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00417ca0(short *param_1,short param_2,char param_3)

{
  short *psVar1;
  bool bVar2;
  int iVar3;

  bVar2 = true;
  if ((((DAT_0089bc17 != '\0') && (*param_1 == DAT_0089bbff)) && (param_1[1] == DAT_0089bc01)) &&
     ((cam_1_angle_related == param_2 && (param_3 == '\0')))) {
    bVar2 = false;
  }
  if (bVar2) {
    DAT_0089bc17 = '\0';
    if (param_3 == '\0') {
      FUN_00417d80(param_1,param_2);
    }
    else {
      iVar3 = (int)player_tribe_num;
      psVar1 = &game_state.tribes_array[iVar3].x;
      *psVar1 = *param_1;
      game_state.tribes_array[iVar3].y = param_1[1];
      if (-1 < param_2) {
        game_state.tribes_array[iVar3].angle_1 = param_2;
      }
      set_tex_struct_globe_x_y(psVar1);
      does_water_texture_exists = 1;
    }
  }
  FUN_00448fa0();
  game_state._838943_1_ = game_state._838943_1_ & 0xfd;
  DAT_0089c6e3 = 0;
  game_state._838940_1_ = 0;
  return;
}
