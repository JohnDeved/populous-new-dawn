/* Ghidra 12.1.3 pseudocode; entry 0048ef00; FUN_0048ef00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0048ef00(int param_1,int param_2)

{
  int *piVar1;
  char *pcVar2;
  short sVar3;
  ushort uVar4;
  short *psVar5;
  int iVar6;
  char cVar7;
  int iVar8;

  psVar5 = *(short **)(param_2 + 0x3104);
  sVar3 = *psVar5;
  *(short **)(param_2 + 0x3104) = psVar5 + 1;
  uVar4 = psVar5[1];
  *(short **)(param_2 + 0x3104) = psVar5 + 2;
  piVar1 = (int *)(*(int *)(param_2 + 0x3100) + (uint)uVar4 * 8);
  uVar4 = psVar5[2];
  *(short **)(param_2 + 0x3104) = psVar5 + 3;
  iVar8 = get_tribe_data(param_1,param_2,*(int *)(param_2 + 0x3100) + (uint)uVar4 * 8);
  if (*piVar1 == 1) {
    if (sVar3 == 0x3ef) {
      *(int *)(param_2 + 0x3000 + piVar1[1] * 4) = iVar8;
      return 1;
    }
    if (sVar3 != 0x3f0) {
      if (sVar3 != 0x3f1) {
        return 1;
      }
      piVar1 = (int *)(param_2 + 0x3000 + piVar1[1] * 4);
      *piVar1 = *piVar1 - iVar8;
      return 1;
    }
    piVar1 = (int *)(param_2 + 0x3000 + piVar1[1] * 4);
    *piVar1 = *piVar1 + iVar8;
    return 1;
  }
  if (*piVar1 != 2) {
    return 1;
  }
  iVar6 = piVar1[1];
  if ((999 < iVar6) && (iVar6 < 0x418)) {
    cVar7 = (char)iVar8;
    if (sVar3 == 0x3ef) {
      *(char *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x960402 + iVar6) = cVar7;
      return 1;
    }
    if (sVar3 == 0x3f0) {
      pcVar2 = (char *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x960402 + iVar6);
      *pcVar2 = *pcVar2 + cVar7;
      return 1;
    }
    if (sVar3 != 0x3f1) {
      return 1;
    }
    pcVar2 = (char *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x960402 + iVar6);
    *pcVar2 = *pcVar2 - cVar7;
  }
  return 1;
}
