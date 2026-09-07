/* Ghidra 12.1.3 pseudocode; entry 0048f230; FUN_0048f230.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0048f230(undefined4 param_1,int param_2)

{
  short sVar1;
  short *psVar2;
  int iVar3;
  int iVar4;

  iVar4 = 0;
  sVar1 = **(short **)(param_2 + 0x3104);
  psVar2 = *(short **)(param_2 + 0x3104) + 1;
  *(short **)(param_2 + 0x3104) = psVar2;
  switch(*psVar2) {
  case 0x3f4:
  case 0x3f5:
  case 0x3f6:
  case 0x3f7:
  case 0x3f8:
  case 0x3f9:
    iVar4 = FUN_0048f130(param_1,param_2);
    break;
  default:
    break;
  case 0x3fc:
  case 0x3fd:
    iVar4 = FUN_0048f230(param_1,param_2);
  }
  iVar3 = 0;
  switch(**(undefined2 **)(param_2 + 0x3104)) {
  case 0x3f4:
  case 0x3f5:
  case 0x3f6:
  case 0x3f7:
  case 0x3f8:
  case 0x3f9:
    iVar3 = FUN_0048f130(param_1,param_2);
    break;
  case 0x3fc:
  case 0x3fd:
    iVar3 = FUN_0048f230(param_1,param_2);
  }
  if (sVar1 == 0x3fc) {
    if ((iVar4 != 0) && (iVar3 != 0)) {
      return 1;
    }
    return 0;
  }
  if (sVar1 != 0x3fd) {
    return 0;
  }
  if ((iVar4 == 0) && (iVar3 == 0)) {
    return 0;
  }
  return 1;
}
