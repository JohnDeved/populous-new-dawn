/* Ghidra 12.1.3 pseudocode; entry 0048ed90; FUN_0048ed90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0048ed90(int param_1,int param_2)

{
  int *piVar1;
  short sVar2;
  ushort uVar3;
  short *psVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  char local_4;

  psVar4 = *(short **)(param_2 + 0x3104);
  sVar2 = *psVar4;
  *(short **)(param_2 + 0x3104) = psVar4 + 1;
  uVar3 = psVar4[1];
  *(short **)(param_2 + 0x3104) = psVar4 + 2;
  piVar1 = (int *)(*(int *)(param_2 + 0x3100) + (uint)uVar3 * 8);
  uVar3 = psVar4[2];
  *(short **)(param_2 + 0x3104) = psVar4 + 3;
  iVar6 = get_tribe_data(param_1,param_2,*(int *)(param_2 + 0x3100) + (uint)uVar3 * 8);
  uVar3 = **(ushort **)(param_2 + 0x3104);
  *(ushort **)(param_2 + 0x3104) = *(ushort **)(param_2 + 0x3104) + 1;
  iVar7 = get_tribe_data(param_1,param_2,(uint)uVar3 * 8 + *(int *)(param_2 + 0x3100));
  if (*piVar1 == 1) {
    if (sVar2 == 0x401) {
      *(int *)(param_2 + 0x3000 + piVar1[1] * 4) = iVar7 * iVar6;
    }
    else if (sVar2 == 0x402) {
      if (iVar7 == 0) {
        *(undefined4 *)(param_2 + 0x3000 + piVar1[1] * 4) = 0;
      }
      else {
        *(int *)(param_2 + 0x3000 + piVar1[1] * 4) = iVar6 / iVar7;
      }
    }
  }
  else if (((*piVar1 == 2) && (iVar5 = piVar1[1], 999 < iVar5)) && (iVar5 < 0x418)) {
    if (sVar2 == 0x401) {
      local_4 = (char)iVar6;
      *(char *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x960402 + iVar5) = (char)iVar7 * local_4;
    }
    else if (sVar2 == 0x402) {
      if (iVar7 == 0) {
        *(undefined1 *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x960402 + iVar5) = 0;
      }
      else {
        *(char *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x960402 + iVar5) = (char)(iVar6 / iVar7);
      }
    }
  }
  return 1;
}
