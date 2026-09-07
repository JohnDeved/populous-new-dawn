/* Ghidra 12.1.3 pseudocode; entry 004c6680; FUN_004c6680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c6680(int param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;

  if (*(int *)(param_1 + 0x59e) != -1) {
    iVar1 = FUN_004f3fa0(param_1,*(int *)(param_1 + 0x59e));
    if (iVar1 == 0) {
      iVar1 = get_tribe_sub_struct(param_1);
      if (iVar1 != -1) {
        iVar2 = tribe_get_shaman(0x89d1c8);
        if (iVar2 == 0) {
          *(undefined4 *)(param_1 + 0x59e) = 0xffffffff;
          return;
        }
        iVar3 = FUN_004627f0(param_1,8,0);
        if (iVar3 != 0) {
          set_sub_struct(param_1,iVar1,8,*(undefined2 *)(iVar2 + 0x24),
                         *(undefined4 *)(param_1 + 0x59e),0,0);
          iVar2 = iVar1 * 0x52 + 0x36 + param_1;
          FUN_004f4030(param_1,iVar2,*(undefined4 *)(param_1 + 0x59e),4,1);
          *(undefined4 *)(param_1 + 0x59e) = 0xffffffff;
          if (*(short *)(iVar1 * 0x52 + param_1 + 0x58) == 0) {
            FUN_00462770(iVar2);
            return;
          }
        }
      }
    }
    else {
      *(undefined4 *)(param_1 + 0x59e) = 0xffffffff;
    }
  }
  return;
}
