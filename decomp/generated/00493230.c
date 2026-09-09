/* Ghidra 12.1.3 pseudocode; entry 00493230; FUN_00493230.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00493230(ushort param_1)

{
  if (((0x60 < param_1) && (param_1 < 0x7b)) || ((0x40 < param_1 && (param_1 < 0x5b)))) {
    return 0;
  }
  if (font_type == 9) {
    if ((param_1 < 0xa2cf) || (0xa302 < param_1)) {
      return 1;
    }
  }
  else if (font_type == 10) {
    if (((param_1 < 0xa3c1) || (0xa3da < param_1)) && ((param_1 < 0xa3e1 || (0xa3fa < param_1)))) {
      return 1;
    }
  }
  else if (font_type == 0xb) {
    if (((param_1 < 0x8260) || (0x8279 < param_1)) && ((param_1 < 0x8281 || (0x8299 < param_1)))) {
      return 1;
    }
  }
  else if ((((param_1 == 0x20) || (param_1 == 0x2d)) || (param_1 == 0x2c)) ||
          (((param_1 == 0x2e || (param_1 == 0x3a)) || (param_1 == 0x3b)))) {
    return 1;
  }
  return 0;
}
