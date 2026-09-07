/* Ghidra 12.1.3 pseudocode; entry 004de7b0; FUN_004de7b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004de7b0(int param_1,uint param_2)

{
  if (*(char *)(param_1 + 0x2b) == '\x05') {
    if ((*(byte *)(param_1 + 0xb2) & 0x3f) == 0) {
      if (*(byte *)(param_1 + 0xb2) >> 6 == param_2) {
        return 1;
      }
    }
    else if ((int)*(char *)(param_1 + 0x2f) == param_2) {
      return 1;
    }
  }
  return 0;
}
