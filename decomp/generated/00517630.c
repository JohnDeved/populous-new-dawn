/* Ghidra 12.1.3 pseudocode; entry 00517630; add_sky_lens_polygons.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_sky_lens_polygons(int param_1)

{
  _screen_height_maybe = (int)vconfig_struct_0088f004.surface_mem_height_related;
  if ((sky_type == 0) || (sky_type == 2)) {
    sky_vertex_1.sx.sx = (D3DVALUE)(int)screen_width;
    sky_vertex_2.sx.sx = 0.0;
    sky_vertex_3.sx.sx = 0.0;
    sky_vertex_1.sy.sy = 0.0;
    sky_vertex_3.sy.sy = 0.0;
    sky_vertex_4.sy.sy = (D3DVALUE)_screen_height_maybe;
    sky_vertex_2.color.color = 0xffffffff;
    sky_vertex_4.color.color = 0xffffffff;
    sky_vertex_1.color.color = 0xffffffff;
    sky_vertex_3.color.color = 0xffffffff;
    sky_vertex_4.sx.sx = sky_vertex_1.sx.sx;
    sky_vertex_2.sy.sy = sky_vertex_4.sy.sy;
    add_polygon_quad_texture_a0
              (&sky_vertex_3,&sky_vertex_1,&sky_vertex_4,&sky_vertex_2,&sky_texture_block_xb,0x10);
  }
  if (param_1 != 0) {
    if (sky_type == 1) {
      add_skylense_polygons_local(0,0x100,&sky_texture_block_x1);
      return;
    }
    if (sky_type == 2) {
      add_skylense_polygons_local(1,0x100,&sky_texture_block_x1);
      add_skylense_polygons_local(1,0xc0,&sky_texture_block_x2);
    }
  }
  return;
}
