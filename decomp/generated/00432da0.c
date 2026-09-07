/* Ghidra 12.1.3 pseudocode; entry 00432da0; FUN_00432da0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_00432da0(short *param_1,int param_2,short *param_3,int param_4)

{
  uint uVar1;

  uVar1 = (int)*param_3 - (int)*param_1 >> 0x1f;
  uVar1 = ((int)*param_3 - (int)*param_1 ^ uVar1) - uVar1;
  if (((int)uVar1 < param_4 + param_2) &&
     (uVar1 = (int)param_3[1] - (int)param_1[1] >> 0x1f,
     uVar1 = ((int)param_3[1] - (int)param_1[1] ^ uVar1) - uVar1, (int)uVar1 < param_4 + param_2)) {
    return CONCAT31((int3)(uVar1 >> 8),1);
  }
  return uVar1 & 0xffffff00;
}
