/* Ghidra 12.1.3 pseudocode; entry 00430bd0; FUN_00430bd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00430bd0(char param_1)

{
  bool bVar1;
  global_struct_45B *pgVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  char local_d;
  int local_8;

  iVar4 = 0;
  pgVar2 = global_struct_45B_ARRAY_00683b92;
  bVar1 = false;
  local_d = -1;
  do {
    if (pgVar2->field_0x20 == '\0') {
      bVar1 = true;
      local_d = (char)iVar4;
      break;
    }
    iVar4 = iVar4 + 1;
    pgVar2 = pgVar2 + 1;
  } while (iVar4 < 0x20);
  iVar4 = 0;
  if (!bVar1) {
    iVar5 = 0;
    pgVar2 = global_struct_45B_ARRAY_00683b92;
    do {
      if (((pgVar2->field_0x20 != '\0') && ((pgVar2->field24_0x21 & 1) != 0)) &&
         (iVar5 < (int)pgVar2->field0_0x0)) {
        iVar5 = pgVar2->field0_0x0;
        local_8 = iVar4;
      }
      iVar4 = iVar4 + 1;
      pgVar2 = pgVar2 + 1;
    } while (iVar4 < 0x20);
    iVar4 = (int)(char)local_8;
    bVar1 = true;
    (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[iVar4].field_0x20] =
         (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[iVar4].field_0x20] + -1;
    DAT_006841e3 = DAT_006841e3 + -1;
    if (((&DAT_0059cb0f)[(char)global_struct_45B_ARRAY_00683b92[iVar4].field_0x20 * 0x1c] != '\0')
       && ((*(byte *)((int)&global_struct_45B_ARRAY_00683b92[iVar4].field24_0x21 + 2) & 1) == 0)) {
      FUN_00432160(global_struct_45B_ARRAY_00683b92 + iVar4);
    }
    global_struct_45B_ARRAY_00683b92[iVar4].field_0x20 = 0;
    local_d = (char)local_8;
  }
  iVar4 = 0;
  if (bVar1) {
    iVar6 = (int)param_1;
    iVar5 = iVar6 * 0x1c;
    if (((&DAT_0059cb03)[iVar6 * 0x1c] != '\0') &&
       ((char)(&DAT_0059cb03)[iVar6 * 0x1c] <= (char)(&DAT_00683b88)[iVar6])) {
      iVar7 = 0;
      pgVar2 = global_struct_45B_ARRAY_00683b92;
      do {
        if ((pgVar2->field_0x20 == param_1) && (iVar7 < (int)pgVar2->field0_0x0)) {
          iVar7 = pgVar2->field0_0x0;
          local_8 = iVar4;
        }
        iVar4 = iVar4 + 1;
        pgVar2 = pgVar2 + 1;
      } while (iVar4 < 0x20);
      iVar4 = (int)(char)local_8;
      (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[iVar4].field_0x20] =
           (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[iVar4].field_0x20] + -1;
      DAT_006841e3 = DAT_006841e3 + -1;
      if (((&DAT_0059cb0f)[(char)global_struct_45B_ARRAY_00683b92[iVar4].field_0x20 * 0x1c] != '\0')
         && ((*(byte *)((int)&global_struct_45B_ARRAY_00683b92[iVar4].field24_0x21 + 2) & 1) == 0))
      {
        FUN_00432160(global_struct_45B_ARRAY_00683b92 + iVar4);
      }
      global_struct_45B_ARRAY_00683b92[iVar4].field_0x20 = 0;
    }
    iVar4 = (int)local_d;
    pgVar2 = global_struct_45B_ARRAY_00683b92 + iVar4;
    for (iVar7 = 0xb; iVar7 != 0; iVar7 = iVar7 + -1) {
      pgVar2->field0_0x0 = 0;
      pgVar2 = (global_struct_45B *)&pgVar2->field_0x4;
    }
    *(undefined1 *)&pgVar2->field0_0x0 = 0;
    iVar7 = *(int *)(&DAT_0059cafc + iVar5);
    global_struct_45B_ARRAY_00683b92[iVar4].field_0x20 = param_1;
    iVar7 = (iVar7 << 0x10) / 0x1e0;
    global_struct_45B_ARRAY_00683b92[iVar4].field13_0x10 = *(undefined2 *)(&DAT_0059caf8 + iVar5);
    *(int *)&global_struct_45B_ARRAY_00683b92[iVar4].field_0x8 =
         ((int)*(short *)(&DAT_0059cb00 + iVar5) << 0x10) / 0x1e0;
    global_struct_45B_ARRAY_00683b92[iVar4].field24_0x21 = *(undefined4 *)(&DAT_0059cb10 + iVar5);
    uVar3 = pseudo_random * 0x24a1 + 0x24df;
    pseudo_random = uVar3 >> 0xd | uVar3 * 0x80000;
    *(uint *)&global_struct_45B_ARRAY_00683b92[iVar4].field_0xc =
         iVar7 + pseudo_random % (uint)(iVar7 / 2);
    *(undefined4 *)&global_struct_45B_ARRAY_00683b92[iVar4].field_0x4 = 0;
    *(short *)&global_struct_45B_ARRAY_00683b92[iVar4].field_0x1c = DAT_006841e8;
    DAT_006841e8 = DAT_006841e8 + 1;
    FUN_0048a050(0,0xe3,1);
    uVar3 = parameterize_by_screen_height
                      (*(undefined4 *)&global_struct_45B_ARRAY_00683b92[iVar4].field_0x8);
    if ((uVar3 & 1) != 0) {
      *(int *)&global_struct_45B_ARRAY_00683b92[iVar4].field_0x8 =
           *(int *)&global_struct_45B_ARRAY_00683b92[iVar4].field_0x8 + 0x88;
    }
    DAT_006841e3 = DAT_006841e3 + '\x01';
    (&DAT_00683b88)[iVar6] = (&DAT_00683b88)[iVar6] + '\x01';
    FUN_00431a80();
  }
  DAT_006841e7 = local_d;
  return;
}
