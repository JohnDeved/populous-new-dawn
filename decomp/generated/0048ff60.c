/* Ghidra 12.1.3 pseudocode; entry 0048ff60; FUN_0048ff60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0048ff60(int param_1,int param_2)

{
  undefined1 uVar1;
  undefined1 uVar2;
  ushort *puVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  undefined4 local_10;
  undefined4 local_c;

  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar4 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar1 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar2 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  local_10 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  local_c = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar5 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar6 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  if (local_10 < 0) {
    local_10 = 0;
  }
  else if (100 < local_10) {
    local_10 = 100;
  }
  if (local_c < 0) {
    local_c = 0;
  }
  else if (100 < local_c) {
    local_c = 100;
  }
  if (iVar5 < 0) {
    iVar5 = 0;
  }
  else if (100 < iVar5) {
    iVar5 = 100;
  }
  if (iVar6 < 0) {
    iVar6 = 0;
  }
  else if (100 < iVar6) {
    iVar6 = 100;
  }
  param_1 = param_1 + iVar4 * 8;
  *(undefined1 *)(param_1 + 0x476) = uVar1;
  *(undefined1 *)(param_1 + 0x477) = uVar2;
  *(undefined1 *)(param_1 + 0x478) = (undefined1)local_10;
  *(undefined1 *)(param_1 + 0x479) = (undefined1)local_c;
  *(char *)(param_1 + 0x47a) = (char)iVar5;
  *(char *)(param_1 + 0x47b) = (char)iVar6;
  return;
}
