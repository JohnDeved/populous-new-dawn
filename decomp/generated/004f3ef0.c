/* Ghidra 12.1.3 pseudocode; entry 004f3ef0; FUN_004f3ef0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_004f3ef0(int param_1,int param_2)

{
  return (1 << (*(char *)(param_1 + 0xc22) + 4U & 0x1f) & (uint)*(byte *)(param_2 + 0xf)) != 0;
}
