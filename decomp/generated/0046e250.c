/* Ghidra 12.1.3 pseudocode; entry 0046e250; update_globe_centre_inc.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void update_globe_centre_inc(void)

{
  byte bVar1;
  byte bVar2;
  unit_struct *puVar3;
  coords_xy local_4;

  globe_update_flags = 0;
  minimap_state_and_cache._2_1_ = 0;
  local_4.x = -1;
  local_4.y = -1;
  minimap_related_1 = -1;
  DAT_0087cae0 = -1;
  if ((_render_state_flags & 4) != 0) {
    minimap_state_and_cache._2_1_ = 1;
    minimap_state_and_cache._0_1_ = globe_coord_centre_inc_x & 0xfe;
    minimap_state_and_cache._1_1_ = globe_coord_centre_inc_y & 0xfe;
    minimap_interpolation(&minimap_related_2);
    _minimap_related_1 = minimap_related_2;
  }
  if ((((unit_index_1 != 0) &&
       (puVar3 = unit_land_array[unit_index_1], puVar3 != (unit_struct *)0x0)) &&
      (puVar3->unit_class == '\x01')) &&
     ((puVar3->tribe_index == player_tribe_num && (puVar3->unit_land_array_index != 0)))) {
    unit_index_1 = 0;
    unit_index_2 = puVar3->unit_land_array_index;
  }
  _minimap_related_pos = minimap_related_2;
  if (unit_index_1 == 0) {
    if (unit_index_2 != 0) {
      _render_state_flags = _render_state_flags | 4;
      puVar3 = unit_land_array[unit_index_2];
      if ((puVar3->unit_class == '\x06') && (puVar3->unit_type == '\t')) {
        unit_index_2 = puVar3->facs0_index;
        puVar3 = unit_land_array[unit_index_2];
      }
      if (puVar3->unit_class == '\x02') {
        get_building_coords(puVar3,&local_4);
      }
      else {
        local_4.x = (puVar3->pos).x;
        local_4.y = (puVar3->pos).y;
      }
      globe_coord_centre_inc_x = local_4.x._1_1_;
      globe_coord_centre_inc_y = local_4.y._1_1_;
      _minimap_related_pos = local_4;
    }
  }
  else {
    _render_state_flags = _render_state_flags | 4;
    puVar3 = unit_land_array[unit_index_1];
    globe_coord_centre_inc_x = (byte)((ushort)(puVar3->pos).x >> 8);
    globe_coord_centre_inc_y = (byte)((ushort)(puVar3->pos).y >> 8);
    minimap_related_pos = (puVar3->pos).x;
    unique0x00017202 = (puVar3->pos).y;
  }
  bVar2 = globe_coord_centre_inc_y;
  bVar1 = globe_coord_centre_inc_x;
  globe_coord_centre_inc_x = globe_coord_centre_inc_x & 0xfe;
  globe_coord_centre_inc_y = globe_coord_centre_inc_y & 0xfe;
  local_4.x = CONCAT11(bVar2,bVar1) & 0xfefe;
  local_4.y = 0;
  _minimap_related_pos_2 = local_4;
  if ((_render_state_flags & 4) != 0) {
    globe_update_flags = globe_update_flags | 1;
    minimap_centre_x = globe_coord_centre_inc_x;
    minimap_centre_y = globe_coord_centre_inc_y;
  }
  if (((land_flags_1._2_1_ & 0x40) != 0) && ((_render_state_flags & 0x100) == 0)) {
    unit_index_1 = 0;
  }
  return;
}
