/* Ghidra 12.1.3 pseudocode; entry 0042d870; FUN_0042d870.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall FUN_0042d870(int param_1,undefined4 param_2,undefined4 param_3)

{
  int *piVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  int iVar5;

  if (*(int *)(param_1 + 0xdc) == 0) {
    return 0;
  }
  piVar1 = (int *)(param_1 + 0xec);
  piVar2 = (int *)(param_1 + 0xe8);
  iVar3 = tex_use_sqrt(param_2,param_3,piVar2,piVar1);
  if (iVar3 == 0) {
    *(undefined4 *)(param_1 + 0xdc) = 2;
    return 0;
  }
  iVar5 = *piVar2 >> 9;
  iVar4 = *piVar1 >> 9;
  *piVar2 = iVar5;
  *piVar1 = iVar4;
  iVar3 = *(int *)(param_1 + 0xf0);
  if (iVar5 < *(int *)(param_1 + 0xe0) - iVar3) {
    *(int *)(param_1 + 0xe0) = iVar5 + iVar3;
  }
  if (*(int *)(param_1 + 0xe0) + iVar3 < iVar5) {
    *(int *)(param_1 + 0xe0) = iVar5 - iVar3;
  }
  iVar3 = *(int *)(param_1 + 0xf4);
  if (iVar4 < *(int *)(param_1 + 0xe4) - iVar3) {
    *(int *)(param_1 + 0xe4) = iVar4 + iVar3;
  }
  if (*(int *)(param_1 + 0xe4) + iVar3 < iVar4) {
    *(int *)(param_1 + 0xe4) = iVar4 - iVar3;
  }
  *(undefined4 *)(param_1 + 0xdc) = 1;
  return 1;
}
