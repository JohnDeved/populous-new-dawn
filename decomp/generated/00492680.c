/* Ghidra 12.1.3 pseudocode; entry 00492680; FUN_00492680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00492680(undefined4 param_1,int param_2)

{
  ushort uVar1;
  int iVar2;
  int iVar3;
  ushort *puVar4;
  int iVar5;
  undefined4 uVar6;
  undefined4 uVar7;
  uint uVar8;

  puVar4 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar1 = *puVar4;
  uVar8 = (uint)uVar1;
  if (uVar8 == 0x422) {
    iVar5 = -1;
  }
  else if ((uVar1 < 0x45e) || (0x461 < uVar1)) {
    iVar5 = get_tribe_data(param_1,param_2,uVar8 * 8 + *(int *)(param_2 + 0x3100));
  }
  else {
    iVar5 = uVar8 - 0x45e;
  }
  puVar4 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar4 * 8 + *(int *)(param_2 + 0x3100));
  puVar4 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar7 = get_tribe_data(param_1,param_2,(uint)*puVar4 * 8 + *(int *)(param_2 + 0x3100));
  iVar2 = *(int *)(param_2 + 0x3104);
  puVar4 = (ushort *)(iVar2 + 2);
  iVar3 = *(int *)(param_2 + 0x3100);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar1 = *puVar4;
  *(int *)(param_2 + 0x3104) = iVar2 + 4;
  uVar6 = FUN_004f54f0(param_1,iVar5,uVar6,uVar7);
  *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar3 + 4 + (uint)uVar1 * 8) * 4) = uVar6;
  return;
}
