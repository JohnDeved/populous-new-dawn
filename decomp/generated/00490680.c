/* Ghidra 12.1.3 pseudocode; entry 00490680; FUN_00490680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00490680(undefined4 param_1,int param_2)

{
  ushort *puVar1;
  undefined4 uVar2;
  undefined4 uVar3;
  undefined4 uVar4;

  puVar1 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar1;
  uVar2 = get_tribe_data(param_1,param_2,(uint)*puVar1 * 8 + *(int *)(param_2 + 0x3100));
  puVar1 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar1;
  uVar3 = get_tribe_data(param_1,param_2,(uint)*puVar1 * 8 + *(int *)(param_2 + 0x3100));
  puVar1 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar1;
  uVar4 = get_tribe_data(param_1,param_2,(uint)*puVar1 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  FUN_00449240(2,uVar2,uVar3,uVar4,0);
  return;
}
