/* Ghidra 12.1.3 pseudocode; entry 004da080; FUN_004da080.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004da080(int param_1,char param_2,int param_3,char param_4)

{
  short sVar1;

  if (((level_flags_2._3_1_ & 4) == 0) &&
     ((param_4 != '\0' || ((*(byte *)(param_1 + 0x15) & 0x80) == 0)))) {
    if ((*(byte *)(param_1 + 0x16) & 8) == 0) {
      sVar1 = (short)param_3;
    }
    else {
      sVar1 = (short)(param_3 >> (DAT_005aa5b0 & 0x1f));
    }
    *(short *)(param_1 + 0x6e) = *(short *)(param_1 + 0x6e) - sVar1;
    if ((*(char *)(param_1 + 0x2f) != -1) && (param_2 != -1)) {
      *(char *)(param_1 + 0xb0) = param_2;
    }
  }
  return;
}
