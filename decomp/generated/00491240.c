/* Ghidra 12.1.3 pseudocode; entry 00491240; FUN_00491240.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00491240(undefined4 param_1,int param_2)

{
  byte bVar1;
  undefined1 uVar2;
  ushort *puVar3;
  undefined4 uVar4;
  short sVar5;
  ushort local_8;
  short local_4;
  short local_2;

  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  bVar1 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar2 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar4 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  local_8 = CONCAT11(uVar2,bVar1) & 0xfefe;
  local_4 = ((bVar1 & 0xfe) + 1) * 0x100;
  sVar5 = (local_8 >> 8) + 1;
  local_2 = sVar5 * 0x100;
  if (((level_flags_1._3_1_ & 1) == 0) && (DAT_006841e7 != -1)) {
    FUN_00430e60(CONCAT11((char)sVar5,DAT_006841e7),&local_4,uVar4);
  }
  return;
}
