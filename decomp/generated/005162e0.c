/* Ghidra 12.1.3 pseudocode; entry 005162e0; add_polygon_rect_sprite.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_polygon_rect_sprite(int param_1,int param_2,undefined4 param_3)

{
  undefined4 uVar1;
  int local_8;
  undefined4 local_4;

  if (DAT_005da078 != 0) {
    set_sprite_index_tbl(param_1,param_2,param_3);
    return;
  }
  get_sprite_bank(param_3,&local_8,&local_4);
  if (local_8 != 0) {
    uVar1 = vertex_palette_color;
    if ((vertices_flags & 8) == 0) {
      uVar1 = 0xffffff;
    }
    add_polygon_quad_sprite_5a_4((float)param_1,(float)param_2,local_8,local_4,uVar1,vertices_flags)
    ;
  }
  return;
}
