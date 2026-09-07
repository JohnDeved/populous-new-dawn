/* Ghidra 12.1.3 pseudocode; entry 0048ecd0; FUN_0048ecd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0048ecd0(char param_1)

{
  if (DAT_006841e7 != -1) {
    if (param_1 != '\0') {
      global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
           global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x20000;
      return;
    }
    global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 & 0xfffdffff;
  }
  return;
}
