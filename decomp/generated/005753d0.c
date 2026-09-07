/* Ghidra 12.1.3 pseudocode; entry 005753d0; FUN_005753d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall FUN_005753d0(int *param_1,int *param_2,uint param_3,int param_4)

{
  int iVar1;

  if (*(uint *)param_1[2] < param_3) {
    return 0xffffffff;
  }
  if (param_4 != 0) {
    iVar1 = (**(code **)(*param_1 + 0x30))(param_4);
    if (iVar1 != 0) {
      return 0xffffffff;
    }
  }
  *param_2 = *(int *)(param_1[2] + param_3 * 4) + param_1[2];
  return 0;
}
