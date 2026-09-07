/* Ghidra 12.1.3 pseudocode; entry 0047f7b0; matrix3x3_mul.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void matrix3x3_mul(int *param_1,int *param_2,int *param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;

  iVar2 = param_2[1] * param_3[3] + *param_3 * *param_2 + param_3[6] * param_2[2];
  *param_1 = iVar2;
  iVar3 = param_2[1] * param_3[4] + *param_2 * param_3[1] + param_2[2] * param_3[7];
  param_1[1] = iVar3;
  iVar4 = param_2[2] * param_3[8] + *param_2 * param_3[2] + param_3[5] * param_2[1];
  param_1[2] = iVar4;
  iVar5 = param_3[3] * param_2[4] + *param_3 * param_2[3] + param_2[5] * param_3[6];
  param_1[3] = iVar5;
  iVar6 = param_3[4] * param_2[4] + param_2[5] * param_3[7] + param_3[1] * param_2[3];
  param_1[4] = iVar6;
  iVar9 = param_2[5] * param_3[8] + param_3[5] * param_2[4] + param_3[2] * param_2[3];
  param_1[5] = iVar9;
  iVar7 = param_2[7] * param_3[3] + *param_3 * param_2[6] + param_3[6] * param_2[8];
  param_1[6] = iVar7;
  iVar8 = param_3[1] * param_2[6] + param_3[7] * param_2[8] + param_2[7] * param_3[4];
  param_1[7] = iVar8;
  iVar1 = param_3[5] * param_2[7] + param_2[6] * param_3[2] + param_3[8] * param_2[8];
  param_1[8] = iVar1;
  *param_1 = iVar2 >> 0xe;
  param_1[3] = iVar5 >> 0xe;
  param_1[6] = iVar7 >> 0xe;
  param_1[1] = iVar3 >> 0xe;
  param_1[7] = iVar8 >> 0xe;
  param_1[4] = iVar6 >> 0xe;
  param_1[2] = iVar4 >> 0xe;
  param_1[5] = iVar9 >> 0xe;
  param_1[8] = iVar1 >> 0xe;
  return;
}
