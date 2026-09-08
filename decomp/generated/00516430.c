/* Ghidra 12.1.3 pseudocode; entry 00516430; add_polygon_rect_sprite_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_polygon_rect_sprite_2(int param_1,int param_2,undefined4 param_3,uint param_4,uint param_5)

{
  undefined4 uVar1;
  int local_8;
  undefined4 local_4;

  if (DAT_005da078 != 0) {
    sprite_transform_outer(param_1,param_2,param_3,param_4,param_5);
    return;
  }
  get_sprite_bank(param_3,&local_8,&local_4);
  if (local_8 != 0) {
    uVar1 = vertex_palette_color;
    if ((vertices_flags & 8) == 0) {
      uVar1 = 0xffffff;
    }
    add_polygon_quad_sprite_5a_2
              ((float)param_1,(float)param_2,(float)param_4,(float)param_5,local_8,local_4,uVar1,
               DAT_005da0e4 & vertices_flags);
  }
  return;
}
