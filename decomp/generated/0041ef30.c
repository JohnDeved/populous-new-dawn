/* Ghidra 12.1.3 pseudocode; entry 0041ef30; add_globe_tex_struct_x_y.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_globe_tex_struct_x_y(int param_1,int param_2)

{
  int local_8;
  int local_4;

  tex_struct_get_x_y(&local_4,&local_8);
  local_4 = local_4 + param_1;
  local_8 = local_8 + param_2;
  set_tex_struct_x_y(local_4,local_8,0,0,0x800);
  return;
}
