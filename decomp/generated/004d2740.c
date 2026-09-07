/* Ghidra 12.1.3 pseudocode; entry 004d2740; init_unit_class_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_class_1(int param_1)

{
  uint *puVar1;
  undefined1 *puVar2;
  char cVar3;
  byte bVar4;
  short sVar5;
  ulonglong uVar6;
  short sVar7;
  undefined2 uVar8;
  ushort uVar9;
  int iVar10;
  uint uVar11;
  uint uVar12;

  *(undefined2 *)(param_1 + 0x87) = 0;
  cVar3 = *(char *)(param_1 + 0x7d);
  if (cVar3 == '\x0e') {
    iVar10 = *(int *)&game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x92d;
    if (iVar10 != 0) {
      *(int *)&game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x92d = iVar10 + -1;
    }
    FUN_00445750(param_1,0,0);
  }
  else if (cVar3 == '\x13') {
    *(undefined2 *)(param_1 + 0x87) = 0;
  }
  else if (cVar3 == '\x18') {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffbfff;
    *(undefined2 *)(param_1 + 0x89) = 0;
  }
  if ((*(byte *)(param_1 + 0x2c) != *(byte *)(param_1 + 0x7d)) &&
     ((unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x7d)].field_0x2 & 1) != 0)) {
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x800;
  }
  if ((*(byte *)(param_1 + 0x14) & 0x20) != 0) {
    FUN_00409d40(param_1);
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfcdefddd;
  *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xfeff;
  if (*(char *)(param_1 + 0x2b) == '\a') {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x100;
    *(byte *)(param_1 + 0xb2) = *(byte *)(param_1 + 0xb2) | 4;
  }
  puVar1 = (uint *)(param_1 + 0x10);
  if (*(char *)(param_1 + 0x2b) == '\b') {
    *puVar1 = *puVar1 & 0xffff7fff;
  }
  else {
    *puVar1 = *puVar1 & 0xffff7f7f;
  }
  *puVar1 = *puVar1 & 0xfffffff7;
  *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xf51f;
  uVar12 = *(uint *)&unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x1;
  if ((uVar12 & 0x10) == 0) {
    FUN_004a3940(param_1);
  }
  *puVar1 = *puVar1 & 0xfffefff8;
  FUN_004d47d0(param_1);
  uVar11 = *(uint *)(param_1 + 0xc);
  sVar5 = *(short *)(param_1 + 0x5f);
  *(uint *)(param_1 + 0xc) = uVar11 & 0xffff7fff;
  *(uint *)(param_1 + 0xc) = uVar11 & 0xfffb7fff;
  if ((uVar12 & 0x200) == 0) {
    uVar12 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].
                             field_0x4 >> 2;
    if (uVar12 == 0) {
      uVar12 = 1;
    }
    uVar11 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    game_state.pseudo_random_val = uVar11 >> 0xd | uVar11 * 0x80000;
    sVar7 = (short)((int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                    [*(byte *)(param_1 + 0x30)].field_0x4 +
                   game_state.pseudo_random_val % uVar12);
    *(short *)(param_1 + 0x5f) = sVar7;
    if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
      *(short *)(param_1 + 0x5f) = sVar7 * 2;
    }
  }
  uVar12 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar12 | 0x40000000;
  *(undefined1 *)(param_1 + 0x2d) = 0;
  *(undefined2 *)(param_1 + 0x70) = 0;
  switch(*(undefined1 *)(param_1 + 0x2c)) {
  case 1:
    uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar12 = uVar12 >> 0xd | uVar12 * 0x80000;
    game_state.pseudo_random_val = uVar12;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(short *)(param_1 + 0x70) = (short)((ulonglong)uVar12 % 0x32) + 0x32;
    break;
  case 2:
    FUN_004ef100(param_1);
    *(undefined2 *)(param_1 + 0x5f) = 0;
    unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0xea]);
    FUN_0048a050(param_1,0x11,0);
    alloc_unit(7,0x41,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x100000;
    break;
  case 3:
    FUN_004d5c70(param_1);
    break;
  case 4:
    uVar11 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar12 = uVar11 >> 0xd;
    game_state.pseudo_random_val = uVar12 | uVar11 * 0x80000;
    *(ushort *)(param_1 + 0x70) = ((ushort)uVar12 & 0x3f) + 0x20;
    uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar11 = uVar12 >> 0xd;
    game_state.pseudo_random_val = uVar11 | uVar12 * 0x80000;
    update_gs_unit_related_array_item(param_1);
    uVar12 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar12 | 0x80;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x1080;
    *(ushort *)(param_1 + 0x57) = (ushort)uVar11 & 0x7ff;
    break;
  case 5:
    FUN_004e9b40(param_1);
    *(undefined2 *)(param_1 + 0x72) = 0;
    *(undefined2 *)(param_1 + 0x70) = 0x80;
    break;
  case 6:
    FUN_004e9b40(param_1);
    *(undefined2 *)(param_1 + 0x70) = 0x80;
    break;
  case 7:
    *(undefined2 *)(param_1 + 0x70) = 0x32;
    FUN_004e9b40(param_1);
    FUN_004e9d80(param_1,&DAT_008928ef);
    break;
  case 8:
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(undefined2 *)(param_1 + 0x72) = 0;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x40000000;
    break;
  case 9:
    *(undefined2 *)(param_1 + 0x72) = 0;
    break;
  case 10:
    FUN_00432260(param_1);
    break;
  case 0xb:
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(undefined1 *)(param_1 + 0xa8) = 1;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x41000000;
    break;
  case 0xc:
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(undefined1 *)(param_1 + 0xa8) = 1;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x41000000;
    break;
  case 0xd:
    FUN_00432520(param_1,param_1 + 0x68);
    FUN_004d68c0(param_1);
    break;
  case 0xe:
    puVar2 = &game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x92d;
    *(int *)puVar2 = *(int *)puVar2 + 1;
    bVar4 = *(byte *)(param_1 + 0x7a);
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfffb;
    *puVar1 = *puVar1 & 0xfffbffff;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(byte *)(param_1 + 0x7a) = bVar4 | 1;
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xfffffffe;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x1000000;
    *(byte *)(param_1 + 0x7a) = bVar4 | 0x81;
    FUN_004eec80(param_1);
    FUN_004958d0(param_1,1);
    break;
  case 0xf:
    uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    game_state.pseudo_random_val = uVar12 >> 0xd | uVar12 * 0x80000;
    uVar6 = (ulonglong)game_state.pseudo_random_val;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(short *)(param_1 + 0x70) = (short)(uVar6 % 0x32) + 0x32;
    FUN_004a79f0(unit_land_array[*(short *)(param_1 + 0x72)],0xffffffff,0xffffffff);
    break;
  case 0x10:
    FUN_004d6d70(param_1);
    break;
  case 0x11:
    FUN_004d6f90(param_1);
    break;
  case 0x13:
    FUN_004d7330(param_1);
    break;
  case 0x15:
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 1;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    uVar8 = FUN_004d3250(param_1);
    *(undefined2 *)(param_1 + 0x70) = uVar8;
    FUN_004d80e0(param_1,0);
    update_gs_unit_related_array_item(param_1);
    if ((*(char *)(param_1 + 0x2b) == '\x04') &&
       (iVar10 = get_adjacent_unit(param_1,4), iVar10 != 0)) {
      FUN_004deff0(param_1);
    }
    break;
  case 0x16:
    *(undefined2 *)(param_1 + 0x5f) = 0;
    FUN_004e96f0(param_1 + 0x49);
    FUN_004e96d0(param_1 + 0x49);
    if ((*(short *)(param_1 + 0x9f) == 0) && (iVar10 = get_adjacent_unit(param_1,0), iVar10 == 0)) {
      unit_set_object_upper(param_1,0x6d);
      *(undefined2 *)(param_1 + 0x70) = 10;
    }
    else {
      FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
      *(undefined2 *)(param_1 + 0x70) = 10;
    }
    break;
  case 0x17:
    FUN_004d8300(param_1);
    break;
  case 0x18:
    FUN_00466c80(param_1,1);
    uVar12 = *puVar1;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *puVar1 = uVar12 | 0x400;
    *puVar1 = uVar12 | 0x480;
    FUN_00445750(param_1,0,0);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x4000;
    uVar11 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar12 = uVar11 >> 0xd;
    game_state.pseudo_random_val = uVar12 | uVar11 * 0x80000;
    *(byte *)(param_1 + 0x2d) = (byte)uVar12 & 7;
    break;
  case 0x19:
    FUN_005184e0(param_1);
    break;
  case 0x1a:
    unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0xe1]);
    *puVar1 = *puVar1 | 0x80;
    *(undefined2 *)(param_1 + 0x5f) = 0x6e;
    FUN_00445750(param_1,0,0);
    *(undefined2 *)(param_1 + 0x70) = 0x40;
    uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar11 = uVar12 >> 0xd;
    game_state.pseudo_random_val = uVar11 | uVar12 * 0x80000;
    update_gs_unit_related_array_item(param_1);
    uVar12 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar12 | 0x80;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x1080;
    *(ushort *)(param_1 + 0x57) = (ushort)uVar11 & 0x7ff;
    break;
  case 0x1b:
    FUN_004ef100(param_1);
    *(undefined2 *)(param_1 + 0x5f) = 0;
    unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0xea]);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x100000;
    break;
  case 0x1c:
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(undefined1 *)(param_1 + 0xb2) = 0;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x40000000;
    *(short *)(param_1 + 0x97) = (short)DAT_005aa5a4;
    break;
  case 0x1d:
    FUN_00518480(param_1);
    break;
  case 0x1e:
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 1;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    update_gs_unit_related_array_item(param_1);
    break;
  case 0x1f:
    FUN_004d8fc0(param_1);
    break;
  case 0x20:
    uVar11 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar12 = uVar11 >> 0xd;
    game_state.pseudo_random_val = uVar12 | uVar11 * 0x80000;
    uVar9 = ((ushort)uVar12 & 7) + 4;
    *(ushort *)(param_1 + 0x70) = uVar9;
    iVar10 = (-(uint)((uVar9 & 1) == 0) & 0xfeac) + 0xaa;
    FUN_00401ae0(param_1,CONCAT22((short)((uint)iVar10 >> 0x10),
                                  (short)iVar10 + *(short *)(param_1 + 0x26)) & 0xffff07ff);
    *(undefined2 *)(param_1 + 0x5f) = 0;
    FUN_004d31f0(param_1);
    break;
  case 0x21:
    FUN_004d9580(param_1);
    break;
  case 0x22:
    *(undefined2 *)(param_1 + 0x5f) = 0;
    FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
    uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    game_state.pseudo_random_val = uVar12 >> 0xd | uVar12 * 0x80000;
    *(short *)(param_1 + 0x70) = (short)((ulonglong)game_state.pseudo_random_val % 100) + 100;
    break;
  case 0x23:
    *(undefined2 *)(param_1 + 0x70) = 0x18;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
    FUN_004eee50(param_1);
    break;
  case 0x25:
    *puVar1 = *puVar1 | 0x80;
    FUN_00445750(param_1,0,0);
    uVar12 = *(uint *)(param_1 + 0xc);
    *puVar1 = *puVar1 | 0x2000;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x4000;
    if ((uVar12 & 0x20000) != 0) {
      FUN_004ee4f0(param_1);
    }
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    break;
  case 0x26:
    if ((uVar12 & 0x800000) != 0) {
      iVar10 = FUN_00405050(param_1 + 0x3d,param_1);
      remove_person_from_hut(unit_land_array[*(ushort *)(iVar10 + 8) & 0x3ff]);
    }
    *(undefined1 *)(param_1 + 0x2d) = 0;
    uVar12 = *(uint *)(param_1 + 0xc) & 0xffffffef;
    *(uint *)(param_1 + 0xc) = uVar12;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x40000000;
    break;
  case 0x27:
    FUN_004dfac0(param_1);
    break;
  case 0x28:
    FUN_004e05e0(param_1);
    break;
  case 0x29:
    if (*(char *)(param_1 + 0x2b) != '\a') {
      *puVar1 = *puVar1 | 0x80;
      FUN_00445750(param_1,0,0);
    }
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    FUN_004e0af0(param_1);
    break;
  case 0x2a:
    FUN_004e2770(param_1);
    break;
  case 0x2b:
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x40000000;
    break;
  case 0x2c:
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(uint *)(param_1 + 0xc) = uVar12 | 0x40100000;
  case 0x24:
    *(undefined1 *)(param_1 + 0x2d) = 0;
  }
  if ((*(byte *)(param_1 + 0x36) & 1) == 0) {
    FUN_004d3ea0(param_1);
  }
  if ((((sVar5 == 0) && (*(char *)(param_1 + 0x2b) == '\x06')) && (*(short *)(param_1 + 0x9f) != 0))
     && (*(char *)(param_1 + 0xa7) == '\x15')) {
    *(undefined2 *)(param_1 + 0x5f) = 0;
  }
  cVar3 = *(char *)(param_1 + 0x2f);
  if (cVar3 != -1) {
    uVar12 = *(uint *)&game_state.tribes_array[cVar3].field_0x941;
    if (((uVar12 & 0x40) != 0) &&
       ((unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x2 & 0x20) == 0)) {
      *(uint *)&game_state.tribes_array[cVar3].field_0x941 = uVar12 | 0x400;
    }
  }
  return;
}
