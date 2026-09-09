/* Ghidra 12.1.3 pseudocode; entry 004933a0; FUN_004933a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004933a0(short param_1)

{
  if (font_type == 9) {
    if (param_1 == -0x5ec0) {
      return 1;
    }
  }
  else if (font_type == 10) {
    if (param_1 == -0x5e5f) {
      return 1;
    }
  }
  else if (font_type == 0xb) {
    if ((param_1 == -0x7ec0) || (param_1 == 0x20)) {
      return 1;
    }
  }
  else if (param_1 == 0x20) {
    return 1;
  }
  return 0;
}
