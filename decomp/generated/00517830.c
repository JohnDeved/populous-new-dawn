/* Ghidra 12.1.3 pseudocode; entry 00517830; add_skylense_polygon_global.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_skylense_polygon_global(int *param_1,_union_3451 param_2)

{
  undefined4 uVar1;

  sky_vertex_3.sx.sx = (D3DVALUE)*param_1;
  sky_vertex_3.sy.sy = (D3DVALUE)param_1[1];
  sky_vertex_1.sx.sx = (D3DVALUE)param_1[2];
  sky_vertex_2.color = param_2;
  sky_vertex_4.sy.sy = (D3DVALUE)param_1[3];
  uVar1 = 0;
  sky_vertex_4.color = param_2;
  sky_vertex_1.color = param_2;
  sky_vertex_3.color = param_2;
  if ((param_2.color & 0xff000000) != 0xff000000) {
    uVar1 = 2;
  }
  sky_vertex_1.sy.sy = sky_vertex_3.sy.sy;
  sky_vertex_4.sx.sx = sky_vertex_1.sx.sx;
  sky_vertex_2.sx.sx = sky_vertex_3.sx.sx;
  sky_vertex_2.sy.sy = sky_vertex_4.sy.sy;
  add_polygon_quad_texture_a0(&sky_vertex_3,&sky_vertex_1,&sky_vertex_4,&sky_vertex_2,0,uVar1);
  return;
}
