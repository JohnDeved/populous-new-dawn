/* Ghidra 12.1.3 pseudocode; entry 00492c30; FUN_00492c30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00492c30(int param_1,int param_2)

{
  short sVar1;
  undefined1 uVar2;
  undefined1 uVar3;
  ushort *puVar4;
  short *psVar5;
  undefined2 local_2;

  puVar4 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar2 = get_tribe_data(param_1,param_2,(uint)*puVar4 * 8 + *(int *)(param_2 + 0x3100));
  puVar4 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar4;
  uVar3 = get_tribe_data(param_1,param_2,(uint)*puVar4 * 8 + *(int *)(param_2 + 0x3100));
  psVar5 = (short *)(*(int *)(param_2 + 0x3104) + 2);
  *(short **)(param_2 + 0x3104) = psVar5;
  sVar1 = *psVar5;
  if (sVar1 == 0x3fe) {
    *(uint *)(param_1 + 0x59a) = *(uint *)(param_1 + 0x59a) | 0x400;
  }
  else if (sVar1 == 0x3ff) {
    *(uint *)(param_1 + 0x59a) = *(uint *)(param_1 + 0x59a) & 0xfffffbff;
  }
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  if ((*(byte *)(param_1 + 0x59b) & 4) == 0) {
    *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffffeff;
    return;
  }
  local_2 = CONCAT11(uVar3,uVar2);
  *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 0x100;
  *(undefined2 *)(param_1 + 0x46e) = local_2;
  return;
}
