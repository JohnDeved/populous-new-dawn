/* Ghidra 12.1.3 pseudocode; entry 0047f510; set_player_matrix_coords.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_player_matrix_coords(void)

{
  short *psVar1;
  int iVar2;
  short sVar3;
  uint uVar4;
  uint uVar5;
  int iVar6;
  undefined2 extraout_var;
  short sVar7;
  char cVar8;

  if ((load_level_flags & 0x20) != 0) {
    if (draw_mode == 2) {
      load_level_flags = load_level_flags & 0xffffffdf;
      return;
    }
    uVar5 = (uint)DAT_0089ce82;
    if (uVar5 != 0) {
      uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar4 = uVar4 >> 0xd | uVar4 * 0x80000;
      cVar8 = (char)((int)uVar5 >> 1);
      DAT_0089ce83 = (char)(uVar4 % uVar5) - cVar8;
      uVar4 = uVar4 * 0x24a1 + 0x24df;
      uVar4 = uVar4 >> 0xd | uVar4 * 0x80000;
      DAT_0089ce84 = (char)(uVar4 % uVar5) - cVar8;
      if ((int)uVar5 >> 4 != 0) {
        uVar4 = uVar4 * 0x24a1 + 0x24df;
        DAT_0089ce85 = (char)((uVar4 >> 0xd | uVar4 * 0x80000) % (uint)((int)uVar5 >> 4)) -
                       (char)((int)uVar5 >> 5);
      }
      iVar6 = (int)player_tribe_num;
      sVar7 = (short)DAT_0089ce84;
      psVar1 = &game_state.tribes_array[iVar6].x;
      *psVar1 = *psVar1 + (short)DAT_0089ce83;
      iVar2 = iVar6 * 0xc65 + 0x89d1c8;
      sVar3 = (short)DAT_0089ce85;
      psVar1 = &game_state.tribes_array[iVar6].y;
      *psVar1 = *psVar1 + sVar7;
      game_state.tribes_array[iVar6].angle_1 =
           sVar3 + game_state.tribes_array[iVar6].angle_1 & 0x7ff;
      if ((((game_state.level_flags & 2) != 0) && (game_state.some_unit != (unit_struct *)0x0)) &&
         (*(char *)&(game_state.some_unit)->loc_3_y != '\0')) {
        rotate_main_cam(*(char *)&(game_state.some_unit)->loc_3_y,0);
      }
      game_state.tribes_array[iVar6].angle_2 = vconfig_struct_0088f004.angle_2;
      game_state.tribes_array[iVar6].matrix_related = vconfig_struct_0088f004.matrix_related;
      init_matrix3x3(iVar2);
      rotate_basis(iVar2,CONCAT22(extraout_var,game_state.tribes_array[iVar6].angle_1),2);
      rotate_basis(iVar2,-game_state.tribes_array[iVar6].angle_2,1);
    }
    DAT_0089ce82 = 0;
  }
  return;
}
