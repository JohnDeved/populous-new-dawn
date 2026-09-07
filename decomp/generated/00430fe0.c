/* Ghidra 12.1.3 pseudocode; entry 00430fe0; FUN_00430fe0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00430fe0(char param_1)

{
  int iVar1;

  iVar1 = (int)param_1;
  (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[iVar1].field_0x20] =
       (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[iVar1].field_0x20] + -1;
  DAT_006841e3 = DAT_006841e3 + -1;
  if (((&DAT_0059cb0f)[(char)global_struct_45B_ARRAY_00683b92[iVar1].field_0x20 * 0x1c] != '\0') &&
     ((*(byte *)((int)&global_struct_45B_ARRAY_00683b92[iVar1].field24_0x21 + 2) & 1) == 0)) {
    FUN_00432160(global_struct_45B_ARRAY_00683b92 + iVar1);
  }
  global_struct_45B_ARRAY_00683b92[iVar1].field_0x20 = 0;
  FUN_00431a80();
  return;
}
