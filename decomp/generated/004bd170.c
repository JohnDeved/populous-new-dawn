/* Ghidra 12.1.3 pseudocode; entry 004bd170; load_watdisp_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_watdisp_1(void)

{
  undefined1 local_4 [4];

  landscape_flags_1 = 2;
  if ((resource_flags & 4) != 0) {
    free_1(res_array_5);
    free_1(res_array_6);
    resource_flags = resource_flags & 0xfffffffb;
  }
  alloc_mem_1(1);
  alloc_files_mem_2(0);
  load_topmap(1);
  if ((resource_flags & 0x100) == 0) {
    watdisp_mem = malloc_1(0x10000);
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,s_data_watdisp_dat_005d45dc);
    read_file_to_mem(global_string_buffer,watdisp_mem,0x10000,local_4);
    resource_flags = resource_flags | 0x100;
  }
  load_bl320();
  return;
}
