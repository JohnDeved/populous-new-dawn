/* Ghidra 12.1.3 pseudocode; entry 00491040; FUN_00491040.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00491040(undefined4 param_1,int param_2)

{
  undefined2 uVar1;
  byte bVar2;
  ushort *puVar3;
  int iVar4;
  undefined4 uVar5;
  byte bStack_7;
  short local_4;
  short local_2;

  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar4 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  bVar2 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  bStack_7 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar5 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  bStack_7 = bStack_7 & 0xfe;
  local_4 = ((bVar2 & 0xfe) + 1) * 0x100;
  local_2 = (bStack_7 + 1) * 0x100;
  if ((level_flags_1._3_1_ & 1) != 0) {
    return;
  }
  uVar1 = *(undefined2 *)(&DAT_005ae310 + iVar4 * 2);
  FUN_00430bd0(3);
  if (DAT_006841e7 == -1) {
    return;
  }
  FUN_00430e40(DAT_006841e7,uVar1);
  if (DAT_006841e7 == -1) {
LAB_004911ba:
    if (DAT_006841e7 != -1) {
      global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
           global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x1000;
      goto LAB_004911d8;
    }
  }
  else {
    FUN_00430e60(DAT_006841e7,&local_4,uVar5);
    if (DAT_006841e7 != -1) {
      FUN_00430f30(DAT_006841e7,3000);
      goto LAB_004911ba;
    }
LAB_004911d8:
    if (DAT_006841e7 == -1) goto LAB_00491214;
    global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x2000;
  }
  if (DAT_006841e7 == -1) {
    return;
  }
  global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
       global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x200;
LAB_00491214:
  if (DAT_006841e7 != -1) {
    global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x400;
  }
  return;
}
