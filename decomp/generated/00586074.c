/* Ghidra 12.1.3 pseudocode; entry 00586074; calc_angle_quadrant.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


ulonglong __fastcall calc_angle_quadrant(undefined4 param_1,uint param_2,uint param_3,uint param_4)

{
  ulonglong uVar1;
  uint uVar2;

  if ((param_3 == 0) && (param_4 == 0)) {
    return (ulonglong)param_2 << 0x20;
  }
  if (-1 < (int)param_3) {
    if ((int)param_4 < 0) {
      if ((int)param_3 < (int)-param_4) {
        uVar1 = (ulonglong)(param_3 << 8) / (ulonglong)-param_4;
        return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),null_ARRAY_005861b4[(int)uVar1])) &
               0xffffffffffff07ff;
      }
      uVar1 = (ulonglong)(param_4 * -0x100) / (ulonglong)param_3;
      return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),
                                       0x200 - null_ARRAY_005861b4[(int)uVar1])) &
             0xffffffffffff07ff;
    }
    if ((int)param_3 < (int)param_4) {
      uVar1 = (ulonglong)(param_3 << 8) / (ulonglong)param_4;
      return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),
                                       0x400 - null_ARRAY_005861b4[(int)uVar1])) &
             0xffffffffffff07ff;
    }
    uVar1 = (ulonglong)(param_4 << 8) / (ulonglong)param_3;
    return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),null_ARRAY_005861b4[(int)uVar1] + 0x200)
                   ) & 0xffffffffffff07ff;
  }
  uVar2 = -param_3;
  if ((int)param_4 < 0) {
    if ((int)uVar2 < (int)-param_4) {
      uVar1 = (ulonglong)(param_3 * -0x100) / (ulonglong)-param_4;
      return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),
                                       0x800 - null_ARRAY_005861b4[(int)uVar1])) &
             0xffffffffffff07ff;
    }
    uVar1 = (ulonglong)(param_4 * -0x100) / (ulonglong)uVar2;
    return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),null_ARRAY_005861b4[(int)uVar1] + 0x600)
                   ) & 0xffffffffffff07ff;
  }
  if ((int)uVar2 < (int)param_4) {
    uVar1 = (ulonglong)(param_3 * -0x100) / (ulonglong)param_4;
    return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),null_ARRAY_005861b4[(int)uVar1] + 0x400)
                   ) & 0xffffffffffff07ff;
  }
  uVar1 = (ulonglong)(param_4 << 8) / (ulonglong)uVar2;
  return CONCAT44(param_2,CONCAT22((short)(uVar1 >> 0x10),0x600 - null_ARRAY_005861b4[(int)uVar1]))
         & 0xffffffffffff07ff;
}
