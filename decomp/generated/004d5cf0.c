/* Ghidra 12.1.3 pseudocode; entry 004d5cf0; FUN_004d5cf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004d5cf0(int param_1)

{
  undefined1 *puVar1;
  undefined4 in_EAX;
  uint3 uVar3;
  uint uVar2;
  char cVar4;
  int iVar5;
  bool bVar6;
  bool bVar7;
  undefined4 uVar8;
  undefined4 uVar9;
  undefined4 local_8;
  undefined2 local_4;

  bVar7 = false;
  uVar3 = (uint3)((uint)in_EAX >> 8);
  bVar6 = *(char *)(param_1 + 0x2b) == '\a';
  uVar2 = CONCAT31(uVar3,1);
  if (*(char *)(param_1 + 0x2d) != '\0') {
    *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + -1;
    goto LAB_004d5fd5;
  }
  if (bVar6) {
    if ((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x93f & 1) != 0) {
      uVar2 = (uint)uVar3 << 8;
    }
    if (((byte)land_flags_1 & 8) != 0) {
      iVar5 = (int)*(char *)(param_1 + 0x2f);
      cVar4 = game_state.tribes_array[iVar5].field_0xc5b;
      if (((cVar4 != '\0') &&
          (cVar4 = cVar4 + -1, game_state.tribes_array[iVar5].field_0xc5b = cVar4, cVar4 == '\0'))
         && ((game_state.tribes_array[iVar5].field_0x93f & 1) == 0)) {
        local_8 = 0;
        cVar4 = *(char *)(param_1 + 0x2f);
        local_4 = 0;
        ptr_unit_related_20B->field0_0x0 = (int)cVar4;
        ptr_unit_related_20B->field1_0x4 = 0;
        ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        alloc_unit(7,0x4d,CONCAT31(cVar4 >> 7,*(undefined1 *)(param_1 + 0x2f)),&local_8);
        uVar2 = FUN_0044ff80(iVar5 * 0xc65 + 0x89dad9,0xffffffff,0);
        uVar2 = uVar2 & 0xffffff00;
        puVar1 = &game_state.tribes_array[iVar5].field_0x93d;
        *(uint *)puVar1 = *(uint *)puVar1 | 0x10000;
      }
    }
  }
  if ((char)uVar2 == '\0') {
LAB_004d5e88:
    bVar7 = true;
  }
  else {
    ptr_unit_related_20B->field0_0x0 = param_1;
    ptr_unit_related_20B->field1_0x4 = 0;
    ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
    ptr_unit_related_20B->field3_0xc = 0;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    uVar2 = alloc_unit(10,0xc,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    if ((!bVar6) || (uVar2 != 0)) goto LAB_004d5e88;
  }
  if (!bVar7) {
LAB_004d5fd5:
    return uVar2 & 0xffffff00;
  }
  if (!bVar6) goto LAB_004d5f7c;
  if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
    if (((game_state.level_flags & 2) == 0) && ((game_state.tribes_array[0]._2367_1_ & 1) == 0)) {
      uVar9 = 0x251;
      uVar8 = 0x1000;
      goto LAB_004d5eda;
    }
  }
  else if (*(char *)(param_1 + 0xb0) == player_tribe_num) {
    uVar9 = 0x24c;
    uVar8 = 0x400;
LAB_004d5eda:
    FUN_00499d90(uVar8,uVar9);
  }
  if ((*(byte *)(param_1 + 0x13) & 0x80) != 0) {
    bVar7 = *(char *)(param_1 + 0x2f) != player_tribe_num;
    if (bVar7) {
      game_state._800570_1_ = game_state._800570_1_ | 1;
      level_copy_3(level_number + -1);
    }
    FUN_0041c9b0(bVar7);
  }
  FUN_004d5fe0(param_1);
  FUN_0041b550(*(undefined1 *)(param_1 + 0x2f),8,1);
  FUN_0041b550(*(undefined1 *)(param_1 + 0xb0),5,1);
  if ((*(char *)(param_1 + 0x2f) == player_tribe_num) && (DAT_0089c6e7 == '\r')) {
    FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
  }
LAB_004d5f7c:
  if ((*(char *)(param_1 + 0x2f) != -1) && (!bVar6)) {
    FUN_0041b550(*(char *)(param_1 + 0x2f),6,1);
    FUN_0041b550(*(undefined1 *)(param_1 + 0xb0),3,1);
  }
  if (*(char *)(param_1 + 0xb0) != -1) {
    FUN_004a3960((int)*(char *)(param_1 + 0xb0),param_1);
  }
  uVar2 = FUN_004d4b50(param_1);
  return uVar2 & 0xffffff00;
}
