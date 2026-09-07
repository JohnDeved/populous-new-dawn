/* Ghidra 12.1.3 pseudocode; entry 00490730; FUN_00490730.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00490730(undefined4 param_1,int param_2)

{
  short sVar1;
  ushort *puVar2;
  undefined4 uVar3;
  undefined4 uVar4;

  puVar2 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar2;
  sVar1 = get_tribe_data(param_1,param_2,(uint)*puVar2 * 8 + *(int *)(param_2 + 0x3100));
  puVar2 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar2;
  uVar3 = get_tribe_data(param_1,param_2,(uint)*puVar2 * 8 + *(int *)(param_2 + 0x3100));
  puVar2 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar2;
  uVar4 = get_tribe_data(param_1,param_2,(uint)*puVar2 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  FUN_00449240(3,((int)sVar1 << 8) / -100,uVar3,uVar4,0);
  return;
}
