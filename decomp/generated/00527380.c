/* Ghidra 12.1.3 pseudocode; entry 00527380; load_sprite_internal.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 load_sprite_internal(undefined4 param_1,undefined4 param_2)

{
  int iVar1;
  undefined4 uVar2;
  undefined4 *unaff_FS_OFFSET;
  undefined **local_18 [2];
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0052741b;
  *unaff_FS_OFFSET = &local_10;
  file_struct_ctr();
  local_18[0] = &PTR_FUN_00591668;
  local_8 = 1;
  iVar1 = open_file_for_file_struct(param_1,param_2);
  if (iVar1 == 0) {
    uVar2 = sprite_file_base_load_file_1(local_18);
    file_struct_close();
    local_8 = 0xffffffff;
    Unwind_00527425();
  }
  else {
    local_8 = 0xffffffff;
    Unwind_00527425();
    uVar2 = 0xffffffff;
  }
  *unaff_FS_OFFSET = local_10;
  return uVar2;
}
