/* Ghidra 12.1.3 pseudocode; entry 0049a890; read_obj_hdr.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 read_obj_hdr(undefined4 param_1,int param_2)

{
  undefined1 uVar1;
  int local_48;
  int local_44 [17];

  reset_global_palettes();
  uVar1 = 0;
  no_file_message();
  file_name_validation(global_string_buffer,param_1);
  read_file_to_mem(global_string_buffer,local_44,0x44,&local_48);
  if ((local_48 == 0x44) && (local_44[0] == param_2)) {
    uVar1 = 1;
  }
  return uVar1;
}
