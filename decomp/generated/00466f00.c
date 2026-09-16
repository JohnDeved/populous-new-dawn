/* Ghidra 12.1.3 pseudocode; entry 00466f00; FUN_00466f00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00466f00(int param_1,char param_2,short param_3)

{
  if (((level_flags_2._3_1_ & 4) == 0) && (*(char *)(param_1 + 0x2f) != param_2)) {
    *(short *)(param_1 + 0x98) = *(short *)(param_1 + 0x98) - param_3;
  }
  return;
}
