/* Ghidra 12.1.3 pseudocode; entry 0040cc10; FUN_0040cc10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0040cc10(int param_1)

{
  if (((*(ushort *)(param_1 + 0x35) & 0x400) != 0) && ((*(ushort *)(param_1 + 0x35) & 0x800) == 0))
  {
    return 1;
  }
  return 0;
}
