/* Ghidra 12.1.3 pseudocode; entry 00501be0; FUN_00501be0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00501be0(int param_1)

{
  if ((*(ushort *)(param_1 + 0x76) & 0x20) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffdf;
    FUN_004d4f40(param_1);
  }
  return;
}
