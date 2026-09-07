/* Ghidra 12.1.3 pseudocode; entry 00516270; set_vertex_palette_color.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_vertex_palette_color(undefined *param_1)

{
  uint uVar1;

  if (param_1 == &ghost0_mem) {
    vertex_palette_color = 0xffffff;
  }
  else {
    uVar1 = pal0_mem[(byte)param_1[0x2f82]];
    vertex_palette_color = (uVar1 & 0xff) << 0x10 | (uVar1 >> 8 & 0xff) << 8 | uVar1 >> 0x10 & 0xff;
  }
  ghost_mem_ptr = param_1;
  ghost_mem_ptr_2 = param_1;
  return;
}
