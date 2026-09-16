/* Ghidra 12.1.3 pseudocode; entry 004919e0; FUN_004919e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004919e0(undefined4 param_1,int param_2)

{
  ushort uVar1;
  ushort *puVar2;
  int iVar3;
  undefined4 uVar4;

  puVar2 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar2;
  uVar1 = *puVar2;
  if ((uVar1 < 0x45e) || (0x461 < uVar1)) {
    iVar3 = get_tribe_data(param_1,param_2,*(int *)(param_2 + 0x3100) + (uint)uVar1 * 8);
    iVar3 = iVar3 * 0xc65 + 0x89d1c8;
  }
  else {
    iVar3 = (uint)uVar1 * 0xc65 + 0x53b0b2;
  }
  puVar2 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar2;
  uVar4 = get_tribe_data(param_1,param_2,(uint)*puVar2 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  add_mana(iVar3,uVar4,0);
  return;
}
