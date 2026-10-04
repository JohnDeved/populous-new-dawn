/* Ghidra 12.1.3 pseudocode; entry 004f39f0; FUN_004f39f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f39f0(int param_1)

{
  if ((*(char *)(param_1 + 0x2c) == '!') &&
     ((*(char *)(param_1 + 0x2d) == '\x03' ||
      ((*(char *)(param_1 + 0x2d) == '\x02' && (4 < *(byte *)(param_1 + 0xa8))))))) {
    return 1;
  }
  return 0;
}
