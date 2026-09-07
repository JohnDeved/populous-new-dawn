/* Ghidra 12.1.3 pseudocode; entry 00429f90; update_surface_mem_offset.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void update_surface_mem_offset(void)

{
  int iVar1;

  if (draw_mode == 2 || (draw_mode == 1 || DAT_0089c6c3 != 0)) {
    iVar1 = (int)surface_mem_height;
  }
  else {
    iVar1 = (int)vconfig_struct_0088f004.surface_mem_height_related;
    if (iVar1 < 0) {
      iVar1 = 0;
    }
    if (surface_mem_height < iVar1) {
      iVar1 = (int)surface_mem_height;
    }
  }
  surface_mem_offset = surface_mem_index * iVar1;
  return;
}
