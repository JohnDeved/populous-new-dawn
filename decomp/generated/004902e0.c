/* Ghidra 12.1.3 pseudocode; entry 004902e0; FUN_004902e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004902e0(int param_1,int param_2)

{
  undefined1 uVar1;
  undefined1 uVar2;
  undefined1 uVar3;
  undefined2 uVar4;
  ushort *puVar5;
  int iVar6;
  undefined4 uVar7;

  puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar5;
  iVar6 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
  puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar5;
  uVar1 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
  puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar5;
  uVar7 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
  puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar5;
  uVar4 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
  puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar5;
  uVar2 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
  puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar5;
  uVar3 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  *(undefined1 *)(param_1 + 0x4ce + iVar6 * 0xc) = uVar1;
  param_1 = param_1 + iVar6 * 0xc;
  *(undefined4 *)(param_1 + 0x4c6) = uVar7;
  *(undefined2 *)(param_1 + 0x4ca) = uVar4;
  *(undefined1 *)(param_1 + 0x4d0) = uVar2;
  *(undefined1 *)(param_1 + 0x4d1) = uVar3;
  return;
}
