/* Ghidra 12.1.3 pseudocode; entry 004f5ed0; FUN_004f5ed0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f5ed0(int param_1,undefined4 param_2,undefined2 param_3)

{
  int iVar1;
  int iVar2;

  iVar2 = 1;
  iVar1 = FUN_00408dd0(1,(int)*(char *)(param_1 + 0xc22));
  if (iVar1 == 0) {
    iVar2 = -1;
  }
  if (iVar2 != -1) {
    iVar1 = FUN_004627f0(param_1,0,iVar2);
    if (iVar1 != 0) {
      set_sub_struct(param_1,param_2,0,iVar2,param_3,0,0);
      return 1;
    }
  }
  return 0;
}
