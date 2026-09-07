/* Ghidra 12.1.3 pseudocode; entry 0046dfb0; reset_landscape_mesh_buffers.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void reset_landscape_mesh_buffers(void)

{
  landscape_mesh_2 = &landscape_mesh_buffer_2;
  landscape_mesh_1 = &landscape_mesh_buffer_1;
  INT_0087ca74 = 0x20;
  scaling_correction = 46000;
  depth_offset = 0x1964;
  polypool_mem_ptr_2 = 0;
  polypool_mem_end_2 = 0;
  scaling_perspective_param = 0xb;
  DAT_0087ca60 = 0x50;
  _render_state_flags = _render_state_flags | 0x80;
  calc_mesh_bounds_1(0x20);
  FUN_0040cde0(&facs0_struct_0087cb03);
  return;
}
