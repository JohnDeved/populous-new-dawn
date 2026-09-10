/* Ghidra 12.1.3 pseudocode; entry 00436b90; FUN_00436b90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_00436b90(int param_1,byte param_2)

{
  if ((*(byte *)(param_1 + 0x11) & 8) == 0) {
    return '\x01' - ((*(uint *)(&DAT_005a7dc4 + (uint)param_2 * 0x16) &
                     1 << (*(byte *)(param_1 + 0x2b) & 0x1f)) == 0);
  }
  return ((&DAT_005a7dcd)[(uint)param_2 * 0x16] & 4) != 0;
}
