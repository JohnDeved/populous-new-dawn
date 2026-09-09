/* Ghidra 12.1.3 pseudocode; entry 004932e0; FUN_004932e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004932e0(ushort param_1)

{
  switch(font_type) {
  case 0:
  case 1:
  case 2:
  case 3:
  case 4:
  case 5:
  case 6:
  case 7:
  case 8:
    return 1;
  case 9:
    if (((param_1 != 0xa148) && (param_1 != 0xa142)) &&
       ((param_1 != 0xa143 && (((param_1 != 0xa147 && (param_1 != 0xa146)) && (param_1 != 0xa148))))
       )) {
      return 1;
    }
    return 0;
  case 10:
    break;
  case 0xb:
    if ((0x8140 < param_1) && (param_1 < 0x814c)) {
      return 0;
    }
    return 1;
  default:
    return 0;
  }
  if ((((param_1 != 0xa3a1) && (param_1 != 0xa1a2)) && (param_1 != 0xa1a3)) &&
     (((param_1 != 0xa3ba && (param_1 != 0xa3bb)) && (param_1 != 0xa3bf)))) {
    return 1;
  }
  return 0;
}
