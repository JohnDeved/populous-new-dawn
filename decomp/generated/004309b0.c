/* Ghidra 12.1.3 pseudocode; entry 004309b0; load_sprite_to_surface_mem.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 load_sprite_to_surface_mem(undefined4 param_1,undefined4 param_2,undefined4 *param_3)

{
  int iVar1;
  undefined4 uVar2;
  undefined4 *puVar3;
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_41c [256];
  int local_1c;
  undefined4 local_18;
  undefined4 local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_00430ac8;
  *unaff_FS_OFFSET = &local_10;
  clear_surface_mem();
  local_18 = 0;
  local_14 = 0;
  local_8 = 2;
  no_file_message();
  file_name_validation(global_string_buffer,param_1);
  iVar1 = load_image_2(global_string_buffer,0,param_2);
  if (iVar1 != -1) {
    alloc_surface_mem();
    iVar1 = FUN_00528e50(param_2,global_string_buffer,0,0);
    if (iVar1 != -1) {
      if ((local_1c != 0) && (param_3 != (undefined4 *)0x0)) {
        puVar3 = local_41c;
        for (iVar1 = 0x100; iVar1 != 0; iVar1 = iVar1 + -1) {
          *param_3 = *puVar3;
          puVar3 = puVar3 + 1;
          param_3 = param_3 + 1;
        }
      }
      local_8 = 0xffffffff;
      Unwind_00430ad2();
      uVar2 = 0;
      goto LAB_00430a51;
    }
    free_surface_mem();
  }
  local_8 = 0xffffffff;
  Unwind_00430ad2();
  uVar2 = 0xffffffff;
LAB_00430a51:
  *unaff_FS_OFFSET = local_10;
  return uVar2;
}
