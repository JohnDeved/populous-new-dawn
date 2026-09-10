/* Ghidra 12.1.3 pseudocode; entry 004443f0; angle_is_within_angle.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 angle_is_within_angle(short param_1,short param_2)

{
  undefined1 uVar1;
  ushort uVar2;

  uVar1 = 0;
  uVar2 = param_2 + 0x200U & 0x7ff;
  if (param_2 < 0x600) {
    if ((param_2 <= param_1) && (param_1 < (short)uVar2)) {
      uVar1 = 1;
    }
  }
  else if ((param_2 <= param_1) || (param_1 < (short)uVar2)) {
    return 1;
  }
  return uVar1;
}
