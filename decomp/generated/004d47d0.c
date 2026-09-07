/* Ghidra 12.1.3 pseudocode; entry 004d47d0; FUN_004d47d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d47d0(int param_1)

{
  char cVar1;

  if ((((*(ushort *)(param_1 + 0x76) & 1) != 0) &&
      ((unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x1 & 4) != 0)) &&
     ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x31 & 4) == 0)) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfffe;
    cVar1 = '\x01';
    if (*(byte *)(param_1 + 0x2c) == 10) {
      cVar1 = *(char *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2);
    }
    if (cVar1 != '\0') {
      FUN_004d56f0(*(undefined2 *)(param_1 + 0x80));
    }
  }
  return;
}
