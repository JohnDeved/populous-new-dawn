/* Ghidra 12.1.3 pseudocode; entry 004f6020; FUN_004f6020.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined2 FUN_004f6020(int param_1)

{
  if (*(char *)(param_1 + 0x5b4) == '\0') {
    return *(undefined2 *)(param_1 + 0x5a2);
  }
  return *(undefined2 *)(param_1 + 0x36a);
}
