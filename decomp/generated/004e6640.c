/* Ghidra 12.1.3 pseudocode; entry 004e6640; FUN_004e6640.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e6640(undefined4 param_1,undefined4 param_2,undefined4 param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;

  iVar1 = get_tribe_sub_struct(param_1);
  if (iVar1 != -1) {
    iVar2 = FUN_004f67b0(param_1);
    iVar3 = FUN_004f6730(param_1);
    if (iVar3 + iVar2 != 0) {
      iVar2 = 0;
      switch(param_3) {
      case 3:
        iVar2 = 7;
        break;
      case 4:
        iVar2 = 5;
        break;
      case 5:
        iVar2 = 6;
        break;
      case 6:
        iVar2 = 8;
      }
      if ((iVar2 != 0) && (iVar2 = FUN_004f36d0(param_1,iVar2), iVar2 != 0)) {
        set_sub_struct(param_1,iVar1,6,iVar2,param_2,0,0);
      }
    }
  }
  return;
}
