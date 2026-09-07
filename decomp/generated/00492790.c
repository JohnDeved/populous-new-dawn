/* Ghidra 12.1.3 pseudocode; entry 00492790; FUN_00492790.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00492790(undefined4 param_1,int param_2)

{
  ushort uVar1;
  int iVar2;
  ushort *puVar3;
  int iVar4;
  int iVar5;

  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar1 = *puVar3;
  if ((uVar1 < 0x45e) || (0x461 < uVar1)) {
    iVar4 = get_tribe_data(param_1,param_2,(uint)uVar1 * 8 + *(int *)(param_2 + 0x3100));
  }
  else {
    iVar4 = uVar1 - 0x45e;
  }
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar5 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  iVar2 = *(int *)(param_2 + 0x3104);
  *(int *)(param_2 + 0x3104) = iVar2 + 2;
  uVar1 = *(ushort *)(iVar2 + 2);
  *(int *)(param_2 + 0x3104) = iVar2 + 4;
  *(uint *)(param_2 + 0x3000 + *(int *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8) * 4) =
       (uint)*(byte *)(iVar4 * 0xc65 + 0x89ddee + iVar5);
  return;
}
