/* Ghidra 12.1.3 pseudocode; entry 00401ae0; FUN_00401ae0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00401ae0(int param_1,short param_2)

{
  if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
    *(short *)(param_1 + 0x57) = param_2;
  }
  *(short *)(param_1 + 0x5d) = param_2;
  if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
    *(ushort *)(param_1 + 0x26) = param_2 + 0x400U & 0x7ff;
    return;
  }
  *(short *)(param_1 + 0x26) = param_2;
  return;
}
