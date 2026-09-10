/* Ghidra 12.1.3 pseudocode; entry 00488fb0; FUN_00488fb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00488fb0(undefined4 param_1)

{
  int iVar1;
  undefined4 local_1c;
  int local_18;
  int local_14;
  int local_10;
  undefined4 uStack_c;
  undefined1 uStack_8;

  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,param_1);
  iVar1 = open_file(&local_1c,global_string_buffer,0x80000001);
  if (iVar1 != 0) {
    return 0;
  }
  no_file_message();
  read_file(local_1c,&local_14,4,&local_18);
  if (local_18 != 4) {
    close_handle(local_1c);
    return 0;
  }
  iVar1 = 0;
  if (0 < local_14) {
    do {
      no_file_message();
      read_file(local_1c,&local_10,0xf,&local_18);
      if (local_18 != 0xf) {
        close_handle(local_1c);
        return 0;
      }
      if ((&DAT_005d66c8)[local_10] != 0x4c) {
        FUN_00488cb0(local_10);
      }
      iVar1 = iVar1 + 1;
    } while (iVar1 < local_14);
  }
  close_handle(local_1c);
  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,param_1);
  iVar1 = open_file(&local_1c,global_string_buffer,0x80000001);
  if (iVar1 == 0) {
    no_file_message();
    read_file(local_1c,&local_14,4,&local_18);
    if (local_18 != 4) {
      close_handle(local_1c);
      return 0;
    }
    iVar1 = 0;
    if (0 < local_14) {
      do {
        no_file_message();
        read_file(local_1c,&local_10,0xf,&local_18);
        if (local_18 != 0xf) {
          close_handle(local_1c);
          return 0;
        }
        if ((&DAT_005d66c8)[local_10] != 0x4c) {
          FUN_00488ad0(local_10,uStack_c,CONCAT13(uStack_8,uStack_c._1_3_),0,0);
        }
        iVar1 = iVar1 + 1;
      } while (iVar1 < local_14);
    }
    close_handle(local_1c);
    return 1;
  }
  return 0;
}
