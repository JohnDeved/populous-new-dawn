/* Ghidra 12.1.3 pseudocode; entry 00575250; FUN_00575250.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 * __fastcall FUN_00575250(undefined4 *param_1)

{
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_005752b8;
  *unaff_FS_OFFSET = &local_10;
  FUN_00584fd0();
  *param_1 = &PTR_LAB_00594298;
  param_1[2] = 0;
  *param_1 = &PTR_LAB_00594260;
  param_1[4] = 0;
  param_1[3] = 0;
  *unaff_FS_OFFSET = local_10;
  return param_1;
}
