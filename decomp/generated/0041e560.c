/* Ghidra 12.1.3 pseudocode; entry 0041e560; convert_globe_coords.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void convert_globe_coords(int param_1,int param_2)

{
  int local_8;
  int local_4;

  tex_struct_convert_to_tex_coords
            ((int)*(short *)(param_1 + 0x3d),(int)*(short *)(param_1 + 0x3f),&local_8,&local_4);
  *(float *)(param_2 + 0xc) = (float)local_8;
  *(float *)(param_2 + 0x10) = (float)local_4;
  return;
}
