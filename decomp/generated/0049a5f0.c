/* Ghidra 12.1.3 pseudocode; entry 0049a5f0; read_mwsearch.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void read_mwsearch(void)

{
  undefined1 local_4 [4];

  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,s_data_MWSEARCH_DAT_005ca880);
  read_file_to_mem(global_string_buffer,mwsearch_mem,0x2080,local_4);
  return;
}
