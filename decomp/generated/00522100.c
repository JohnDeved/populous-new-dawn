/* Ghidra 12.1.3 pseudocode; entry 00522100; FUN_00522100.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint __thiscall FUN_00522100(int param_1,uint param_2)

{
  uint uVar1;
  int iVar2;
  float *pfVar3;
  float local_50 [4];
  undefined4 local_40;
  undefined4 local_3c;
  undefined4 local_38;
  undefined4 local_34;
  undefined4 local_8;
  undefined4 local_4;

  if (DAT_005dd3e4 == param_2) {
    return 0;
  }
  pfVar3 = local_50;
  for (iVar2 = 0x14; iVar2 != 0; iVar2 = iVar2 + -1) {
    *pfVar3 = 0.0;
    pfVar3 = pfVar3 + 1;
  }
  local_50[0] = 1.12104e-43;
  local_50[1] = (float)((param_2 & 0xff0000) >> 0x10) * _DAT_0058fc50;
  local_40 = 0x3f800000;
  local_50[2] = (float)(param_2 >> 8 & 0xff) * _DAT_0058fc50;
  local_3c = 0;
  local_38 = 0;
  local_34 = 0;
  local_4 = 1;
  local_8 = 0;
  local_50[3] = (float)(param_2 & 0xff) * _DAT_0058fc50;
  uVar1 = (**(code **)(**(int **)(param_1 + 0xd20) + 0xc))(*(int **)(param_1 + 0xd20),local_50);
  return (uVar1 == 0) - 1 & uVar1;
}
