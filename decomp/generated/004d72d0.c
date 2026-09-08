/* Ghidra 12.1.3 pseudocode; entry 004d72d0; FUN_004d72d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d72d0(ushort param_1,short *param_2)

{
  short sVar1;
  short sVar2;
  ushort local_2;

  local_2 = param_1 & 0xfefe;
  sVar2 = ((param_1 & 0xfe) + 1) * 0x100;
  sVar1 = ((local_2 >> 8) + 1) * 0x100;
  *param_2 = sVar2;
  param_2[1] = sVar1;
  sVar1 = calc_point_height(sVar2,sVar1);
  param_2[2] = sVar1;
  return;
}
