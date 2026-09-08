/* Ghidra 12.1.3 pseudocode; entry 0046cfc0; FUN_0046cfc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


byte FUN_0046cfc0(int param_1)

{
  byte bVar1;

  bVar1 = *(byte *)(param_1 + 0xc) & 0xf;
  if ((*(byte *)(landscape_height_array + bVar1) & 1) != 0) {
    return 1;
  }
  if ((*(byte *)(landscape_height_array + bVar1) & 0x3c) == 0) {
    return 0;
  }
  return landscape_height_array[bVar1].field_0xd & 0x80;
}
