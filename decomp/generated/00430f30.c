/* Ghidra 12.1.3 pseudocode; entry 00430f30; FUN_00430f30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00430f30(char param_1,undefined2 param_2)

{
  if (((&DAT_0059cb10)[(char)global_struct_45B_ARRAY_00683b92[param_1].field_0x20 * 0x1c] & 0x80) !=
      0) {
    global_struct_45B_ARRAY_00683b92[param_1].field13_0x10 = param_2;
  }
  return;
}
