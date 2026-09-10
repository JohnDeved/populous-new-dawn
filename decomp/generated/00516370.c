/* Ghidra 12.1.3 pseudocode; entry 00516370; add_ui_polygons.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_ui_polygons(int param_1,int param_2,undefined4 param_3,uint param_4,undefined4 param_5)

{
  int local_8;
  undefined4 local_4;

  if (DAT_005da078 != 0) {
    FUN_0052c300(param_1,param_2,param_3,param_4,param_5);
    return;
  }
  get_sprite_bank(param_3,&local_8,&local_4);
  if (local_8 != 0) {
    add_polygon_quad_sprite_5a_3
              ((float)param_1,(float)param_2,local_8,local_4,
               (param_4 >> 8 & 0xff) << 8 | (param_4 >> 0x10 & 0xff) << 0x10 | param_4 & 0xff,
               DAT_005da0e4 & vertices_flags);
  }
  return;
}
