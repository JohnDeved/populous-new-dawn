/* Ghidra 12.1.3 pseudocode; entry 00467130; draw_land.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void draw_land(void)

{
  unit_struct *puVar1;
  bool bVar2;
  pnts_related_struct *ppVar3;
  char cVar4;
  mesh_render_bounds *pmVar5;

  if (tickcount_1 == 0) {
    tickcount_1 = GetTickCount();
    tickcount_2 = tickcount_1;
  }
  if (((byte)land_flags_1 & 2) != 0) {
    tickcount_1 = tickcount_2;
  }
  tickcount_2 = tickcount_1;
  if (((byte)level_flags_2 & 4) != 0) {
    tickcount_2 = tickcount_1;
    return;
  }
  clear_polygon_state();
  facs0_struct_0087cb03._49_4_ = (BADTYPE)(int)surface_mem_index;
  DAT_0087cb4c = 0;
  _DAT_0087cb5c = 0;
  DAT_0087cbbc = 0;
  DAT_0087cb48 = 0;
  DAT_0074a338 = 0xffffffff;
  DAT_0074a2f4 = 0;
  max_point_depth = 0;
  DAT_0087cb74 = 0;
  min_point_depth = 0xffffffff;
  DAT_0087cbc0 = 0;
  pmVar5 = mesh_render_bounds_related_array;
  DAT_0087ca58 = 0xdc;
  mesh_render_bounds_ptr = mesh_render_bounds_related_array;
  do {
    pmVar5 = pmVar5 + 1;
    if (pmVar5->start < pmVar5->end) break;
    draw_units_land_pos_x._1_1_ = draw_units_land_pos_x._1_1_ + '\x02';
    mesh_generator_curr_y = mesh_generator_curr_y + 0x100;
    mesh_render_bounds_ptr = mesh_render_bounds_ptr + 1;
    DAT_0087ca58 = DAT_0087ca58 + -1;
  } while (DAT_0087ca58 != 0);
  main_landscape_mesh_generation();
  ppVar3 = landscape_mesh_2;
  landscape_mesh_2 = landscape_mesh_1;
  pmVar5 = mesh_render_bounds_ptr;
  for (; landscape_mesh_1 = ppVar3, mesh_render_bounds_ptr = pmVar5, DAT_0087ca58 != 0;
      DAT_0087ca58 = DAT_0087ca58 + -1) {
    mesh_render_bounds_ptr = pmVar5 + 1;
    draw_units_land_pos_x._1_1_ = draw_units_land_pos_x._1_1_ + '\x02';
    mesh_generator_curr_y = mesh_generator_curr_y + 0x100;
    if (pmVar5[1].end <= mesh_render_bounds_ptr->start) break;
    main_landscape_mesh_generation();
    draw_units();
    ppVar3 = landscape_mesh_2;
    landscape_mesh_2 = landscape_mesh_1;
    pmVar5 = mesh_render_bounds_ptr;
  }
  ppVar3 = landscape_mesh_2;
  landscape_mesh_2 = landscape_mesh_1;
  landscape_mesh_1 = ppVar3;
  FUN_00422fc0();
  if ((_DAT_0087cb5c & 0x7fffffff) != 0) {
    maybe_curve_rendering();
  }
  if ((DAT_0074a2fc == '\0') || (unit_index_1 == 0)) goto LAB_0046731c;
  bVar2 = false;
  puVar1 = unit_land_array[unit_index_1];
  if ((player_tribe_num == puVar1->tribe_index) || ((*(byte *)&puVar1->flags_4 & 0x20) != 0)) {
    if (((puVar1->unit_class == '\x01') && (cVar4 = FUN_004de610(puVar1), cVar4 == '\0')) &&
       (puVar1->unit_land_array_index == 0)) goto LAB_0046730d;
  }
  else if (puVar1->tribe_index == -1) {
    if ((puVar1->unit_class == '\x05') && (puVar1->unit_type == '\v')) goto LAB_0046730d;
  }
  else if (DAT_0074a33c != '\0') {
LAB_0046730d:
    bVar2 = true;
  }
  if (bVar2) {
    render_unit_sprite_board(puVar1);
  }
LAB_0046731c:
  render_halo_shaman();
  render_tile_1();
  if (((level_flags_2._3_1_ & 0x40) == 0) && (((byte)level_flags & 8) == 0)) {
    set_texture_landscape_main();
  }
  draw_polygons();
  DAT_00895dc1 = DAT_0087cb74;
  DAT_00895dc3 = DAT_0074a2f4;
  DAT_00895dc5 = DAT_0087cbc0;
  DAT_00895dc7 = DAT_0087cb48;
  DAT_00895dc9 = DAT_0087cbbc;
  DAT_00895dcb = DAT_0087cb4c;
  minimap_coords_calc();
  update_globe_centre_inc();
  return;
}
