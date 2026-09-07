/* Ghidra 12.1.3 pseudocode; entry 004908e0; FUN_004908e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004908e0(undefined4 param_1,int param_2)

{
  undefined1 uVar1;
  undefined1 uVar2;
  ushort *puVar3;
  int iVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  undefined2 local_8;

  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar1 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar2 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar4 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  if (iVar4 == 0) {
    iVar4 = 1;
  }
  else if (iVar4 == 1) {
    iVar4 = 2;
  }
  uVar5 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  local_8 = CONCAT11(uVar2,uVar1);
  FUN_00449240(5,local_8,uVar5,uVar6,iVar4);
  return;
}
