/* Ghidra 12.1.3 pseudocode; entry 0041e4e0; FUN_0041e4e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041e4e0(int param_1)

{
  undefined2 uVar1;
  undefined1 local_c [4];
  union_polygon *local_8;
  undefined1 local_4 [4];

  local_8 = empty_polygon;
  empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
  tex_struct_convert_to_tex_coords
            ((int)*(short *)(param_1 + 0x3d),(int)*(short *)(param_1 + 0x3f),local_c,local_4);
  (local_8->field0).next = polygons_to_draw[7];
  polygons_to_draw[7] = &local_8->field0;
  uVar1 = __ftol();
  *(undefined2 *)&(local_8->field0).point_1_y = uVar1;
  uVar1 = __ftol();
  *(undefined2 *)((int)&(local_8->field0).point_1_y + 2) = uVar1;
  (local_8->field0).point_1_x = param_1;
  return;
}
