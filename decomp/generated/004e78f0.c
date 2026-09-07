/* Ghidra 12.1.3 pseudocode; entry 004e78f0; FUN_004e78f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e78f0(int param_1,short *param_2)

{
  short sVar1;
  short sVar2;
  int iVar3;

  sVar1 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].x;
  iVar3 = (int)sVar1;
  sVar2 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].y;
  if ((int)*param_2 < -iVar3) {
    *param_2 = -sVar1;
  }
  if (iVar3 < *param_2) {
    *param_2 = sVar1;
  }
  if ((int)param_2[2] < -iVar3) {
    param_2[2] = -sVar1;
  }
  if (iVar3 < param_2[2]) {
    param_2[2] = sVar1;
  }
  if ((int)param_2[1] < -(int)sVar2) {
    param_2[1] = -sVar2;
  }
  if ((int)sVar2 < (int)param_2[1]) {
    param_2[1] = sVar2;
  }
  return;
}
