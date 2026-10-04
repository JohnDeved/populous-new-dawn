/* Ghidra 12.1.3 pseudocode; entry 004f2440; FUN_004f2440.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f2440(int param_1,int param_2)

{
  *(byte *)(param_1 + 0x7f) = *(byte *)(param_1 + 0x7f) & 0xfe;
  *(char *)(param_1 + 0xaf) = (char)param_2;
  if (param_2 == 0) {
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffdfff;
  }
  return;
}
