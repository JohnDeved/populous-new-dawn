/* Ghidra 12.1.3 pseudocode; entry 004e9ba0; calc_abs_angular_diff.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint calc_abs_angular_diff(short param_1,short param_2)

{
  uint in_EAX;
  uint uVar1;
  int iVar2;
  undefined2 uVar3;
  int iVar4;

  uVar1 = in_EAX & 0xffff0000;
  iVar4 = (int)param_1 - (int)param_2;
  if (iVar4 != 0) {
    iVar2 = iVar4;
    if ((int)param_1 < (int)param_2) {
      iVar2 = -iVar4;
    }
    if (0x400 < iVar2) {
      if (iVar4 < 0) {
        iVar4 = iVar4 + 0x800;
      }
      else {
        iVar4 = iVar4 + -0x800;
      }
    }
    uVar3 = (undefined2)((uint)iVar2 >> 0x10);
    uVar1 = CONCAT22(uVar3,1);
    if (iVar4 < 0) {
      uVar1 = CONCAT22(uVar3,0xffff);
    }
  }
  return uVar1;
}
