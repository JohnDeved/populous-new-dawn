/* Ghidra 12.1.3 pseudocode; entry 0056da40; FUN_0056da40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall FUN_0056da40(int param_1,int param_2)

{
  int *piVar1;
  int iVar2;
  undefined4 uVar3;

  if ((*(byte *)(param_1 + 0x30) & 1) == 0) {
    return 400;
  }
  if (param_2 == 0) {
    return 0x12d;
  }
  iVar2 = FUN_00570bf0(param_2);
  if (iVar2 == 0) {
    return 0x12d;
  }
  piVar1 = *(int **)(param_1 + 0x24);
  uVar3 = FUN_00570c90(param_2);
  uVar3 = (**(code **)(*piVar1 + 0x18))(iVar2,uVar3);
  return uVar3;
}
