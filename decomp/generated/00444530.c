/* Ghidra 12.1.3 pseudocode; entry 00444530; vector_conv_16b_to_32b_with_wrapping.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void vector_conv_16b_to_32b_with_wrapping
               (ushort *param_1,ushort *param_2,undefined2 *param_3,undefined2 *param_4)

{
  undefined2 *puVar1;
  uint uVar2;
  int iVar3;

  param_3[1] = 0;
  *param_3 = 0;
  param_4[1] = 0;
  *param_4 = 0;
  *(uint *)(param_3 + 2) = (uint)*param_1;
  *(uint *)(param_3 + 4) = (uint)param_1[1];
  uVar2 = (uint)*param_2;
  *(uint *)(param_4 + 2) = uVar2;
  *(uint *)(param_4 + 4) = (uint)param_2[1];
  iVar3 = uVar2 - *(int *)(param_3 + 2);
  if (iVar3 < 0) {
    iVar3 = -iVar3;
  }
  if (0x8000 < iVar3) {
    puVar1 = param_3;
    if ((int)uVar2 < *(int *)(param_3 + 2)) {
      puVar1 = param_4;
    }
    *(int *)(puVar1 + 2) = *(int *)(puVar1 + 2) + 0x10000;
    *puVar1 = 1;
  }
  iVar3 = *(int *)(param_4 + 4) - *(int *)(param_3 + 4);
  if (iVar3 < 0) {
    iVar3 = -iVar3;
  }
  if (0x8000 < iVar3) {
    if (*(int *)(param_4 + 4) < *(int *)(param_3 + 4)) {
      param_3 = param_4;
    }
    *(int *)(param_3 + 4) = *(int *)(param_3 + 4) + 0x10000;
    param_3[1] = 1;
  }
  return;
}
