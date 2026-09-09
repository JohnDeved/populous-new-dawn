/* Ghidra 12.1.3 pseudocode; entry 004e6c80; calc_angular_interpolation.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint calc_angular_interpolation(short param_1,short param_2,short param_3)

{
  short sVar1;
  int iVar2;
  int iVar3;
  int iVar4;

  iVar4 = (int)param_2 - (int)param_1;
  iVar2 = iVar4;
  if (iVar4 < 0) {
    iVar2 = -iVar4;
  }
  if (0x400 < iVar2) {
    iVar2 = 0x800 - iVar2;
  }
  sVar1 = 0;
  if (iVar4 != 0) {
    iVar3 = iVar4;
    if (iVar4 < 0) {
      iVar3 = -iVar4;
    }
    if (0x400 < iVar3) {
      if (iVar4 < 0) {
        iVar4 = iVar4 + 0x800;
      }
      else {
        iVar4 = iVar4 + -0x800;
      }
    }
    sVar1 = 1;
    if (iVar4 < 0) {
      sVar1 = -1;
    }
  }
  if ((int)param_3 < (int)(short)iVar2) {
    return (int)sVar1 * (int)param_3 + (int)param_1 & 0x7ff;
  }
  return (int)param_2;
}
