/* Ghidra 12.1.3 pseudocode; entry 0041ebf0; set_viewport_and_globals.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void set_viewport_and_globals(void)

{
  int iVar1;
  polygon_drawn **pppVar2;

  FUN_005231e0();
  global_data_2 = &DAT_00472d80;
  empty_polygon = polypool_mem_ptr_2;
  pppVar2 = polygons_to_draw;
  for (iVar1 = 10; iVar1 != 0; iVar1 = iVar1 + -1) {
    *pppVar2 = (polygon_drawn *)0x0;
    pppVar2 = pppVar2 + 1;
  }
  minimap_ref_1 = (undefined2)screen_coord_3_x;
  _render_state_flags = _render_state_flags & 0xfffffffb;
  minimap_ref_2 = (undefined2)screen_coord_3_y;
  minimap_interpolation_adj_1 = 0;
  minimap_interpolation_adj_2 = 0;
  screen_width_2 = screen_width;
  screen_height_2 = screen_height;
  screen_width_2_half = screen_width / 2;
  screen_height_2_half = screen_height / 2;
  set_viewport_2(0,0,(int)screen_width,(int)screen_height);
  unit_index_1 = 0;
  unit_index_2 = 0;
  DAT_0059bc30 = DAT_0059bc30 + (sky_tick_counter >> 4);
  return;
}
