/* Ghidra 12.1.3 pseudocode; entry 00405050; FUN_00405050.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00405050(undefined2 *param_1)

{
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8));
  return ((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4 + 0x8a03e4;
}
