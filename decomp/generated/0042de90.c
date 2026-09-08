/* Ghidra 12.1.3 pseudocode; entry 0042de90; tex_use_sqrt.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 __thiscall tex_use_sqrt(int param_1,int param_2,int param_3,int *param_4,int *param_5)

{
  double dVar1;
  double dVar2;
  double dVar3;
  int iVar4;
  unkbyte10 extraout_ST0;
  unkbyte10 Var5;

  if (*(int *)(param_1 + 0x20) != 0) {
    return 0;
  }
  dVar1 = (double)(param_2 - *(int *)(param_1 + 0x10)) / (double)*(float *)(param_1 + 0x34);
  dVar2 = -((double)(param_3 - *(int *)(param_1 + 0x14)) / (double)*(float *)(param_1 + 0x34));
  dVar3 = SQRT(dVar1 * dVar1 + dVar2 * dVar2);
  if (dVar3 * (double)*(float *)(param_1 + 0x30) * dVar3 * _DAT_0058f240 + _DAT_0058f248 <
      _DAT_0058f238) {
    return 0;
  }
  Var5 = fpatan((float10)dVar1,(float10)dVar2);
  fsin(Var5);
  iVar4 = __ftol();
  fcos(extraout_ST0);
  *param_4 = *(int *)(param_1 + 0x18) + iVar4;
  iVar4 = __ftol();
  *param_5 = *(int *)(param_1 + 0x1c) + iVar4;
  return 1;
}
