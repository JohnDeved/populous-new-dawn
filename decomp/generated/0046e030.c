/* Ghidra 12.1.3 pseudocode; entry 0046e030; clear_polygon_state.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void clear_polygon_state(void)

{
  int iVar1;
  tribe_struct *ptVar2;
  polygon_drawn **pppVar3;
  matrix3x3 *pmVar4;

  global_data_2 = &DAT_00472d80;
  if (((byte)level_flags_2 & 0x80) == 0) {
    object_to_polygons_ptr = object_to_polygons;
    object_to_polygons_ptr_2 = object_to_polygons_2;
  }
  else {
    object_to_polygons_ptr = (code *)&DAT_00472d90;
    object_to_polygons_ptr_2 = (code *)&DAT_00472d90;
  }
  _DAT_0074a344 = &DAT_00472d90;
  mesh_generator_base_y =
       CONCAT11((char)((ushort)tribe_ptr->y >> 8) + '$',(char)((ushort)tribe_ptr->x >> 8) + '$') &
       0xfefe;
  mesh_generator_curr_x = -0x6e00 - (short)((tribe_ptr->x & 0x1feU) >> 1);
  mesh_generator_curr_y = -0x6e00 - (short)((tribe_ptr->y & 0x1feU) >> 1);
  draw_units_land_pos_x = mesh_generator_base_y;
  _DAT_0087caac = 0xffff;
  _DAT_0087ca24 = 0xffffffff;
  _DAT_0087caae = 0xffff;
  polygon_counter_draw_units = 0;
  _DAT_0087ca4c = 0;
  DAT_0087ca50 = 0;
  DAT_0087ca58 = 0xdc;
  mesh_render_bounds_ptr = mesh_render_bounds_related_array;
  empty_polygon = polypool_mem_ptr_2;
  pppVar3 = polygons_to_draw;
  mesh_generator_base_x = mesh_generator_curr_x;
  _DAT_0087ca84 = mesh_generator_curr_y;
  for (iVar1 = 0xe01; iVar1 != 0; iVar1 = iVar1 + -1) {
    *pppVar3 = (polygon_drawn *)0x0;
    pppVar3 = pppVar3 + 1;
  }
  ptVar2 = tribe_ptr;
  pmVar4 = &matrix_rot_trans;
  for (iVar1 = 0x24; iVar1 != 0; iVar1 = iVar1 + -1) {
    *(undefined1 *)&pmVar4->a0 = *(undefined1 *)&(ptVar2->coord_vect).x;
    ptVar2 = (tribe_struct *)((int)&(ptVar2->coord_vect).x + 1);
    pmVar4 = (matrix3x3 *)((int)&pmVar4->a0 + 1);
  }
  if ((((byte)land_flags_1 & 1) == 0) && ((DAT_0089c671 & 0x10) == 0)) {
    DAT_0087cae9 = 0;
  }
  else {
    DAT_0087cae9 = 1;
  }
  if ((DAT_0089c6e7 == '\f') || (DAT_0089c6e7 == '\r')) {
    DAT_0074a33c = 1;
  }
  else {
    DAT_0074a33c = 0;
  }
  if (DAT_00895fb1 != '\0') {
    DAT_0074a33c = 0;
  }
  if ((((DAT_0089bb81 != '\x02') && (DAT_0089bb81 != '\x03')) && ((level_flags_1._3_1_ & 0x10) == 0)
      ) && (((game_state.level_flags & 0x20) == 0 && (DAT_00895fb1 == '\0')))) {
    iVar1 = FUN_00451370(2);
    if ((iVar1 == 0) && (((byte)level_flags_1 & 0x20) == 0)) {
      DAT_0074a2f0 = 1;
      goto LAB_0046e21a;
    }
  }
  DAT_0074a2f0 = 0;
LAB_0046e21a:
  DAT_0074a2fc = DAT_0074a2f0;
  if ((level_flags_1._3_1_ & 0x40) != 0) {
    DAT_0074a2f0 = 0;
  }
  _render_state_flags = _render_state_flags & 0xfffffefb;
  return;
}
