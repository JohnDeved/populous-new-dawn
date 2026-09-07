/* Ghidra 12.1.3 pseudocode; entry 00491c30; FUN_00491c30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00491c30(undefined4 param_1,int param_2)

{
  ushort uVar1;
  int iVar2;
  int iVar3;
  ushort *puVar4;
  undefined4 uVar5;
  undefined4 uVar6;

  puVar4 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar5 = get_tribe_data(param_1,param_2,(uint)*puVar4 * 8 + *(int *)(param_2 + 0x3100));
  puVar4 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar4 * 8 + *(int *)(param_2 + 0x3100));
  iVar2 = *(int *)(param_2 + 0x3104);
  puVar4 = (ushort *)(iVar2 + 2);
  iVar3 = *(int *)(param_2 + 0x3100);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar1 = *puVar4;
  *(int *)(param_2 + 0x3104) = iVar2 + 4;
  uVar5 = FUN_004f2900(uVar5,uVar6);
  *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar3 + 4 + (uint)uVar1 * 8) * 4) = uVar5;
  return;
}
