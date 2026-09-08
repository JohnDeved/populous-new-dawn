/* Ghidra 12.1.3 pseudocode; entry 00451370; FUN_00451370.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


ushort FUN_00451370(int param_1)

{
  return *(ushort *)(&DAT_005a219c + param_1 * 0x1e) & 0x100;
}
