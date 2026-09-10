/* Ghidra 12.1.3 pseudocode; entry 0051ff40; FUN_0051ff40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0051ff40(int param_1)

{
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffefffff;
  if (*(char *)(param_1 + 0x31) != '\0') {
    *(char *)(param_1 + 0x31) = *(char *)(param_1 + 0x31) + -1;
  }
  return;
}
