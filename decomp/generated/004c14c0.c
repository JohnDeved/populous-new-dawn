/* Ghidra 12.1.3 pseudocode; entry 004c14c0; init_unit_type_11.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_type_11(int param_1)

{
  int iVar1;
  byte *pbVar2;
  short *psVar3;
  byte bVar4;
  char cVar5;
  undefined1 uVar6;
  undefined1 uVar7;
  byte bVar8;
  char cVar9;
  short sVar10;
  int iVar11;
  unit_related_struct_20B *puVar12;
  undefined2 uVar13;
  int iVar14;
  int iVar15;
  char *pcVar16;
  byte bStack_5;
  undefined1 uStack_3;
  undefined2 uStack_2;

  iVar11 = (int)*(char *)(param_1 + 0x2f);
  iVar15 = 0;
  iVar14 = iVar11 * 0xc65;
  iVar1 = iVar14 + 0x89d1c8;
  uVar13 = 0;
  if ((*(uint *)(param_1 + 0xc) & 0x400) == 0) {
    puVar12 = (unit_related_struct_20B *)0x0;
  }
  else {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
    ptr_unit_related_20B = ptr_unit_related_20B + -1;
    puVar12 = ptr_unit_related_20B;
  }
  if (puVar12 != (unit_related_struct_20B *)0x0) {
    iVar15 = puVar12->field0_0x0;
    uVar13 = (undefined2)puVar12->field1_0x4;
  }
  *(undefined2 *)(param_1 + 0x6a) = uVar13;
  uVar6 = *(undefined1 *)(param_1 + 0x2b);
  switch(uVar6) {
  case 1:
    FUN_004c1b80(param_1);
    break;
  case 2:
    FUN_004c1b80(param_1);
    break;
  case 3:
    FUN_004c1b80(param_1);
    break;
  case 4:
    FUN_004c1b80(param_1);
    break;
  case 5:
    FUN_004c1b80(param_1);
    break;
  case 6:
    FUN_004c1b80(param_1);
    break;
  case 7:
    FUN_004c1b80(param_1);
    break;
  case 8:
    FUN_004c1b80(param_1);
    break;
  case 9:
    FUN_004c1b80(param_1);
    break;
  case 10:
    FUN_004c1b80(param_1);
    break;
  case 0xb:
    FUN_004c1b80(param_1);
    break;
  case 0xc:
    FUN_004c1b80(param_1);
    break;
  case 0xd:
    FUN_004c1b80(param_1);
    break;
  case 0xe:
    FUN_004c1b80(param_1);
    break;
  case 0xf:
    FUN_004c1b80(param_1);
    break;
  case 0x10:
    FUN_004c1b80(param_1);
    break;
  case 0x11:
    FUN_004c1b80(param_1);
    break;
  case 0x12:
    FUN_004c1b80(param_1);
    break;
  case 0x13:
    FUN_004c1b80(param_1);
    break;
  case 0x14:
    FUN_004c1b80(param_1);
    break;
  case 0x15:
    FUN_004c1b80(param_1);
    break;
  case 0x17:
    bVar8 = *(byte *)(param_1 + 0xe);
    goto joined_r0x004c1689;
  case 0x18:
    bVar8 = *(byte *)(param_1 + 0xe);
    goto joined_r0x004c1689;
  case 0x19:
    bVar8 = *(byte *)(param_1 + 0xe);
    goto joined_r0x004c1689;
  case 0x1a:
    bVar8 = *(byte *)(param_1 + 0xe);
    goto joined_r0x004c1689;
  case 0x1b:
    bVar8 = *(byte *)(param_1 + 0xe);
    goto joined_r0x004c1689;
  case 0x1c:
    bVar8 = *(byte *)(param_1 + 0xe);
    goto joined_r0x004c1689;
  case 0x1d:
    bVar8 = *(byte *)(param_1 + 0xe);
    goto joined_r0x004c1689;
  case 0x1e:
    bVar8 = *(byte *)(param_1 + 0xe);
joined_r0x004c1689:
    if ((bVar8 & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = uVar6;
      init_unit_class(param_1);
    }
    *(undefined1 *)(param_1 + 0x2d) = 5;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    *(undefined4 *)(param_1 + 0x6c) = *(undefined4 *)(param_1 + 0x3d);
    *(undefined2 *)(param_1 + 0x70) = *(undefined2 *)(param_1 + 0x41);
  }
  if ((((byte)opened_files_flags & 0x10) == 0) &&
     (game_state.tribes_array[iVar11].field_0xc1f != '\x01')) {
    game_state.tribes_array[iVar11].field_0xc5e = 0xc;
  }
  if ((game_state.tribes_array[iVar11].field_0x93d & 8) == 0) {
    add_mana(iVar1,-iVar15,0);
  }
  uVar6 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
  uVar7 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  iVar15 = (((CONCAT11(uVar7,uVar6) & 0xfefe) & 0xfe) * 2 |
           (CONCAT11(uVar7,uVar6) & 0xfefe) & 0xfe00) * 4 + 0x8a03e4;
  uStack_3 = (undefined1)((uint)iVar15 >> 8);
  uStack_2 = (undefined2)((uint)iVar15 >> 0x10);
  if (game_state.tribes_array[iVar11].field_0xc1f == '\x02') {
    iVar14 = 0;
    if (game_state._858439_1_ != '\0') {
      pcVar16 = &game_state.tribes_array[0].field_0xc1f;
      do {
        if (((*pcVar16 == '\x01') && (iVar11 = FUN_004f3ef0(pcVar16 + -0xc1f,iVar15), iVar11 != 0))
           && (iVar11 = tribe_get_shaman(iVar1), iVar11 != 0)) {
          bVar8 = (byte)((ushort)*(undefined2 *)(iVar11 + 0x3f) >> 8);
          bStack_5 = bVar8 & 0xfe;
          *(uint *)(pcVar16 + -0x681) =
               CONCAT11(bVar8,(char)((ushort)*(undefined2 *)(iVar11 + 0x3d) >> 8)) & 0xfefe;
        }
        pcVar16 = pcVar16 + 0xc65;
        iVar14 = iVar14 + 1;
      } while (iVar14 < (int)(uint)(byte)game_state._858439_1_);
    }
  }
  else {
    iVar15 = FUN_004f20d0(iVar1);
    if (iVar15 != 0) {
      if ((game_state.level_flags & 0x20) == 0) {
        bVar8 = (&DAT_005a80fd)[(uint)*(byte *)(param_1 + 0x2b) * 0x3e];
      }
      else {
        bVar8 = (&DAT_005a80fe)[(uint)*(byte *)(param_1 + 0x2b) * 0x3e];
      }
      pbVar2 = (byte *)(iVar14 + 0x89d706 + (uint)*(byte *)(param_1 + 0x2b) * 4);
      bVar4 = *pbVar2;
      if (bVar4 < bVar8) {
        *pbVar2 = bVar4 + 1;
      }
      psVar3 = (short *)(iVar14 + 0x89d708 + (uint)*(byte *)(param_1 + 0x2b) * 4);
      if (*psVar3 == 0) {
        sVar10 = FUN_004f20b0(iVar1,(uint)*(byte *)(param_1 + 0x2b));
        *psVar3 = sVar10;
      }
    }
  }
  cVar5 = *(char *)(param_1 + 0x2f);
  bVar8 = *(byte *)(param_1 + 0x2b);
  if (((cVar5 != player_tribe_num) && ((&DAT_005a8105)[(uint)bVar8 * 0x3e] != '\0')) &&
     ((((byte)level_flags_2 & 8) == 0 && (cVar9 = FUN_00430bd0(4), cVar9 != -1)))) {
    FUN_00430f70(CONCAT13(uStack_3,CONCAT12(cVar5,CONCAT11(bStack_5,cVar9))),(uint)bVar8,
                 CONCAT22(uStack_2,CONCAT11(uStack_3,cVar5)));
    FUN_00430e60(CONCAT13(uStack_3,CONCAT12(cVar5,CONCAT11(bStack_5,cVar9))),param_1 + 0x3d,
                 0xffffffff);
  }
  if (*(byte *)(param_1 + 0x2b) < 0x16) {
    pcVar16 = (char *)(*(byte *)(param_1 + 0x2b) + 0xc26 + iVar1);
    *pcVar16 = *pcVar16 + '\x01';
  }
  return;
}
