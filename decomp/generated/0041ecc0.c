/* Ghidra 12.1.3 pseudocode; entry 0041ecc0; set_obj_textures_globe_upper.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void set_obj_textures_globe_upper(void)

{
  int iVar1;
  undefined2 local_10;
  short local_c [2];
  undefined1 local_8;
  undefined1 uStack_7;
  undefined1 local_4;
  undefined1 uStack_3;

  tex_struct_get_x_y(&local_10,local_c);
  tribe_ptr->x = local_10;
  tribe_ptr->y = local_c[0];
  iVar1 = tex_use_sqrt(screen_coord_3_x,screen_coord_3_y,&local_8,&local_4);
  if (iVar1 != 0) {
    _render_state_flags = _render_state_flags | 4;
  }
  draw_persons_and_buildings_globe();
  draw_polygons_globe();
  FUN_0042d7e0(CONCAT31(player_tribe_num >> 7,tribe_icon_offset[player_tribe_num * 4]));
  minimap_state_and_cache._0_3_ = (uint3)(ushort)minimap_state_and_cache;
  _minimap_centre_x = (uint3)_minimap_centre_x;
  if ((_render_state_flags & 4) != 0) {
    globe_coord_centre_inc_y = uStack_3;
    _minimap_centre_x = CONCAT13(minimap_centre_x_2._1_1_,0x10000);
    local_10 = CONCAT11(uStack_3,uStack_7);
    globe_coord_centre_inc_x = uStack_7;
    _minimap_centre_x = CONCAT22(_globe_update_flags,local_10);
    minimap_state_and_cache = _minimap_centre_x;
  }
  _DAT_0087caac = (short)screen_coord_3_x;
  _DAT_0087caae = (short)screen_coord_3_y;
  return;
}
