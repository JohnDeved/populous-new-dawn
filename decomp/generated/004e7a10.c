/* Ghidra 12.1.3 pseudocode; entry 004e7a10; FUN_004e7a10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004e7a10(short *param_1,int param_2,short *param_3,int param_4)

{
  uint uVar1;

  uVar1 = (int)*param_1 - (int)*param_3 >> 0x1f;
  uVar1 = ((int)*param_1 - (int)*param_3 ^ uVar1) - uVar1;
  if (0x7fff < (int)uVar1) {
    uVar1 = 0xffff - uVar1;
  }
  if ((int)uVar1 < param_4 + param_2) {
    uVar1 = (int)param_1[1] - (int)param_3[1] >> 0x1f;
    uVar1 = ((int)param_1[1] - (int)param_3[1] ^ uVar1) - uVar1;
    if (0x7fff < (int)uVar1) {
      uVar1 = 0xffff - uVar1;
    }
    if ((int)uVar1 < param_4 + param_2) {
      return CONCAT31((int3)(uVar1 >> 8),1);
    }
  }
  return uVar1 & 0xffffff00;
}
