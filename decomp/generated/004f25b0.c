/* Ghidra 12.1.3 pseudocode; entry 004f25b0; FUN_004f25b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f25b0(int param_1)

{
  if (((unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x1 & 8) != 0) &&
     (*(char *)(param_1 + 0xaf) == '\0')) {
    return 1;
  }
  return 0;
}
