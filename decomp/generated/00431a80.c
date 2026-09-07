/* Ghidra 12.1.3 pseudocode; entry 00431a80; FUN_00431a80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00431a80(void)

{
  bool bVar1;
  global_struct_45B *pgVar2;
  global_struct_45B *pgVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  global_struct_45B *local_c;
  global_struct_45B *local_8;
  uint local_4;

  pgVar3 = global_struct_45B_ARRAY_00683b92;
  iVar4 = 0x20;
  DAT_00683b74 = (global_struct_45B *)0x0;
  do {
    *(undefined4 *)&pgVar3->field_0x29 = 0;
    pgVar3 = pgVar3 + 1;
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  local_4 = 1;
  local_8 = (global_struct_45B *)0x0;
  do {
    bVar1 = false;
    do {
      pgVar3 = global_struct_45B_ARRAY_00683b92;
      iVar6 = 0;
      iVar4 = -1;
      iVar5 = 0x20;
      do {
        if (((pgVar3->field_0x20 != '\0') &&
            ((byte)(&DAT_0059cb02)[(char)pgVar3->field_0x20 * 0x1c] == local_4)) &&
           (*(int *)&pgVar3->field_0x29 == 0)) {
          iVar6 = iVar6 + 1;
          if (iVar4 < (int)pgVar3->field0_0x0) {
            iVar4 = pgVar3->field0_0x0;
            local_c = pgVar3;
          }
        }
        pgVar3 = pgVar3 + 1;
        iVar5 = iVar5 + -1;
      } while (iVar5 != 0);
      pgVar3 = DAT_00683b74;
      pgVar2 = local_8;
      if ((iVar6 != 0) && (pgVar3 = local_c, pgVar2 = local_c, local_8 != (global_struct_45B *)0x0))
      {
        *(global_struct_45B **)&local_8->field_0x29 = local_c;
        pgVar3 = DAT_00683b74;
        pgVar2 = local_c;
      }
      local_8 = pgVar2;
      DAT_00683b74 = pgVar3;
      if (iVar6 < 2) {
        bVar1 = true;
      }
    } while (!bVar1);
    local_4 = local_4 + 1;
  } while ((int)local_4 < 2);
  pgVar3 = global_struct_45B_ARRAY_00683b92;
  iVar4 = 0x20;
  do {
    *(undefined4 *)&pgVar3->field_0x25 = 0;
    pgVar3 = pgVar3 + 1;
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  DAT_00683b70 = (global_struct_45B *)0x0;
  for (pgVar3 = DAT_00683b74; pgVar3 != (global_struct_45B *)0x0;
      pgVar3 = *(global_struct_45B **)&pgVar3->field_0x29) {
    *(global_struct_45B **)&pgVar3->field_0x25 = DAT_00683b70;
    DAT_00683b70 = pgVar3;
  }
  return;
}
