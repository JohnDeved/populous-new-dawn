/* Ghidra 12.1.3 pseudocode; entry 0041d1e0; coord_to_pix_coord_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void coord_to_pix_coord_2(int param_1,int param_2,int *param_3,int *param_4)

{
  int iVar1;
  int local_8;
  int local_4;

  tex_struct_get_x_y(&local_8,&local_4);
  iVar1 = FUN_0044bb70();
  *param_3 = (screen_width - iVar1 >> 1) + (((param_1 - local_8) * 0x10000 >> 0x10) * 0x15 >> 9) +
             iVar1;
  *param_4 = (((param_2 - local_4) * 0x10000 >> 0x10) * 0x15 >> 9) + (int)(screen_height >> 1);
  return;
}
