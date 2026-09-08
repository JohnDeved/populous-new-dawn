/* Ghidra 12.1.3 pseudocode; entry 0047a930; set_draw_mode.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_draw_mode(short param_1)

{
  draw_mode = param_1;
  if (param_1 == 0) {
    DAT_005d3d20 = 1;
    DAT_005d3d24 = 0;
    DAT_0089ce32 = DAT_0089ce31;
    update_surface_mem_offset();
    return;
  }
  if (param_1 != 1) {
    if (param_1 != 2) {
      update_surface_mem_offset();
      return;
    }
    DAT_0089ce32 = DAT_0089c6f5;
    set_tex_struct_x_y((int)game_state.tribes_array[player_tribe_num].x,
                       (int)game_state.tribes_array[player_tribe_num].y,0,0,0x800);
    DAT_005d3d20 = 0;
    DAT_005d3d24 = 1;
    update_surface_mem_offset();
    return;
  }
  DAT_0089ce32 = DAT_0089ce31;
  tribe_ptr = game_state.tribes_array + player_tribe_num;
  clear_land_draw_state(&vconfig_struct_0088f004);
  update_surface_mem_offset();
  return;
}
