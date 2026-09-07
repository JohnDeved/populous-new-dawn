/* Ghidra 12.1.3 pseudocode; entry 0047f480; set_player_transform_matrix.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_player_transform_matrix(void)

{
  int iVar1;
  int iVar2;
  undefined2 extraout_var;

  iVar2 = (int)player_tribe_num;
  iVar1 = iVar2 * 0xc65 + 0x89d1c8;
  if ((((game_state.level_flags & 2) != 0) && (game_state.some_unit != (unit_struct *)0x0)) &&
     (*(char *)&(game_state.some_unit)->loc_3_y != '\0')) {
    rotate_main_cam(*(char *)&(game_state.some_unit)->loc_3_y,0);
  }
  game_state.tribes_array[iVar2].angle_2 = vconfig_struct_0088f004.angle_2;
  game_state.tribes_array[iVar2].matrix_related = vconfig_struct_0088f004.matrix_related;
  init_matrix3x3(iVar1);
  rotate_basis(iVar1,CONCAT22(extraout_var,game_state.tribes_array[iVar2].angle_1),2);
  rotate_basis(iVar1,-game_state.tribes_array[iVar2].angle_2,1);
  return;
}
