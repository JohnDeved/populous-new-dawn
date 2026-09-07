/* Ghidra 12.1.3 pseudocode; entry 0056ce60; FUN_0056ce60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 * __fastcall FUN_0056ce60(undefined4 *param_1)

{
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0056cec3;
  *unaff_FS_OFFSET = &local_10;
  FUN_00584fd0();
  local_8 = 0;
  FUN_0056e630();
  *param_1 = &PTR_LAB_00593e38;
  param_1[8] = 0;
  param_1[9] = 0;
  param_1[0xb] = 0x3f800000;
  param_1[0xc] = 0;
  *unaff_FS_OFFSET = local_10;
  return param_1;
}
