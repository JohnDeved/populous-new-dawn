/* Ghidra 12.1.3 pseudocode; entry 0048f130; FUN_0048f130.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_0048f130(undefined4 param_1,int param_2)

{
  undefined2 uVar1;
  ushort uVar2;
  ushort uVar3;
  undefined2 *puVar4;
  bool bVar5;
  int iVar6;
  int iVar7;

  puVar4 = *(undefined2 **)(param_2 + 0x3104);
  uVar1 = *puVar4;
  iVar7 = *(int *)(param_2 + 0x3100);
  *(undefined2 **)(param_2 + 0x3104) = puVar4 + 1;
  uVar2 = puVar4[1];
  *(undefined2 **)(param_2 + 0x3104) = puVar4 + 2;
  uVar3 = puVar4[2];
  *(undefined2 **)(param_2 + 0x3104) = puVar4 + 3;
  iVar6 = get_tribe_data(param_1,param_2,iVar7 + (uint)uVar2 * 8);
  iVar7 = get_tribe_data(param_1,param_2,iVar7 + (uint)uVar3 * 8);
  switch(uVar1) {
  case 0x3f4:
    bVar5 = true;
    if (iVar6 <= iVar7) {
      return false;
    }
    break;
  case 0x3f5:
    bVar5 = true;
    if (iVar7 <= iVar6) {
      return false;
    }
    break;
  case 0x3f6:
    return iVar7 == iVar6;
  case 0x3f7:
    return iVar7 != iVar6;
  case 0x3f8:
    bVar5 = true;
    if (iVar6 < iVar7) {
      return false;
    }
    break;
  case 0x3f9:
    bVar5 = true;
    if (iVar7 < iVar6) {
      bVar5 = false;
    }
    break;
  default:
    return false;
  }
  return bVar5;
}
