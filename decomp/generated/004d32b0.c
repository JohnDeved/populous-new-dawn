/* Ghidra 12.1.3 pseudocode; entry 004d32b0; unit_processing_class_1_person.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_1_person(int param_1)

{
  short *psVar1;
  byte bVar2;
  unit_struct *puVar3;
  bool bVar4;
  char cVar5;
  byte bVar6;
  char cVar7;
  undefined2 uVar8;
  short sVar9;
  undefined4 uVar10;
  uint uVar11;
  unit_struct *puVar12;
  undefined2 extraout_var;
  int iVar13;
  uint uVar14;
  undefined4 local_8;
  undefined2 local_4;

  FUN_004d42a0(param_1);
  FUN_0051fed0(param_1);
  FUN_004e9050(param_1);
  FUN_004e6d00(param_1);
  if (*(short *)(param_1 + 0x9f) != 0) {
    uVar11 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar11 & 0xffffdfff;
    *(uint *)(param_1 + 0xc) = uVar11 & 0xfff7dfff;
  }
  if ((*(uint *)(param_1 + 0x14) & 0x10000) != 0) {
    puVar12 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar3->flags_2 & 1) == 0
        )) && (puVar3->unit_class != '\0')) {
      puVar12 = puVar3;
    }
    if (puVar12 == (unit_struct *)0x0) {
      *(undefined2 *)(param_1 + 0x72) = 0;
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xfffeffff;
    }
  }
  FUN_004e0270(param_1,1);
  bVar2 = *(byte *)(param_1 + 0x2b);
  if ((bVar2 == 5) && (bVar6 = *(byte *)(param_1 + 0xb2), (bVar6 & 0x3f) != 0)) {
    iVar13 = (bVar6 & 0xffffff3f) - 1;
    if (iVar13 < 0) {
      iVar13 = 0;
    }
    *(byte *)(param_1 + 0xb2) = bVar6 & 0xc0 | (byte)iVar13;
  }
  iVar13 = *(byte *)(param_1 + 0x2c) - 1;
  switch(iVar13) {
  case 0:
    cVar7 = '\0';
    sVar9 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar9;
    if ((sVar9 < 1) || ((*(uint *)(param_1 + 0xc) & 0x2004) != 0)) {
      if ((game_state.level_flags & 2) == 0) {
        cVar7 = unit_type_array_person[bVar2].next_state;
      }
      else if (bVar2 == 7) {
        cVar7 = '\'';
      }
      else {
        cVar7 = unit_type_array_person[bVar2].next_state;
      }
    }
    break;
  case 1:
    cVar7 = FUN_004d5b60(param_1);
    break;
  case 2:
    cVar7 = FUN_004d5cf0(param_1);
    break;
  case 3:
    psVar1 = (short *)(param_1 + 0x70);
    *psVar1 = *psVar1 + -1;
    if (*psVar1 < 0) {
      FUN_004d68c0(param_1);
    }
    goto switchD_004d337f_caseD_13;
  case 4:
    cVar7 = FUN_004d6970(param_1);
    break;
  case 5:
    cVar7 = '\0';
    iVar13 = FUN_004d66e0(param_1);
    if (iVar13 == 0) {
      sVar9 = *(short *)(param_1 + 0x70) + -1;
      *(short *)(param_1 + 0x70) = sVar9;
      if (sVar9 < 1) {
        cVar7 = FUN_00402e30(param_1);
      }
      else {
        iVar13 = FUN_00405050(param_1 + 0x4f);
        if ((*(byte *)(landscape_height_array + (*(byte *)(iVar13 + 0xc) & 0xf)) & 0x3c) == 0) {
          cVar7 = FUN_00402e30(param_1);
        }
        else {
          cVar5 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,2);
          if (cVar5 != '\0') {
            cVar7 = '\x10';
            FUN_004d4870(param_1);
          }
        }
      }
    }
    break;
  case 6:
    cVar7 = '\0';
    sVar9 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar9;
    if (sVar9 < 1) {
      cVar7 = FUN_00402e30(param_1);
    }
    else if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
      FUN_004e9d80(param_1,&DAT_008928ef);
    }
    break;
  case 7:
    cVar7 = FUN_004d60d0(param_1);
    break;
  case 8:
    cVar7 = FUN_004d7ee0(param_1);
    break;
  case 9:
    cVar7 = FUN_00432590(param_1);
    break;
  case 10:
    cVar7 = '\0';
    FUN_004d6b10(param_1);
    if ((*(byte *)(param_1 + 0xd) & 0x20) != 0) {
      if ((game_state.level_flags & 2) == 0) {
        cVar7 = unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
      }
      else if (*(byte *)(param_1 + 0x2b) == 7) {
        cVar7 = '\'';
      }
      else {
        cVar7 = unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
      }
    }
    break;
  case 0xb:
    cVar7 = '\0';
    FUN_004d6b10(param_1);
    if ((*(byte *)(param_1 + 0xd) & 0x20) != 0) {
      cVar7 = FUN_00402e30(param_1);
    }
    break;
  case 0xc:
    psVar1 = (short *)(param_1 + 0x70);
    *psVar1 = *psVar1 + -1;
    if (*psVar1 < 0) {
      FUN_004d68c0(param_1);
    }
    if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
      local_8 = CONCAT31(local_8._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) &
                0xfffffffe;
      local_8 = CONCAT22(local_8._2_2_,
                         CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                  (undefined1)local_8)) & 0xfffffeff;
      uVar10 = FUN_00404c50(param_1 + 0x68);
      iVar13 = FUN_00450590(local_8,uVar10);
      if (9 < iVar13) {
        FUN_004e9d80(param_1,param_1 + 0x68);
      }
    }
    goto switchD_004d337f_caseD_13;
  case 0xd:
    FUN_004d6b10(param_1);
    if (((*(byte *)(param_1 + 0x2e) & 0xf) == 0) || (((byte)land_flags_1 & 8) != 0)) {
      FUN_004eec80(param_1);
    }
    goto switchD_004d337f_caseD_13;
  case 0xe:
    cVar7 = FUN_004d6be0(param_1);
    break;
  case 0xf:
    cVar7 = FUN_004d6e40(param_1);
    break;
  case 0x10:
    cVar7 = '\0';
    if ((*(char *)(param_1 + 0x7e) == '\0') &&
       (cVar5 = FUN_004d3dd0(param_1 + 0x3d,param_1 + 0x4f), cVar5 != '\0')) {
      cVar7 = '\x13';
    }
    if (((*(uint *)(param_1 + 0xc) & 0x2004) != 0) ||
       (((*(byte *)(param_1 + 0x2e) & 0xf) == 0 && ((*(uint *)(param_1 + 0xc) & 0x800) != 0)))) {
      local_8 = *(uint *)(param_1 + 0x68);
      local_4 = 0;
      cVar5 = FUN_00518200(&local_8,0);
      if (cVar5 != '\0') {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
      }
    }
    break;
  case 0x11:
    cVar7 = '\0';
    cVar5 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x200);
    if (cVar5 != '\0') {
      cVar7 = *(char *)(param_1 + 0x7d);
    }
    break;
  case 0x12:
    cVar7 = FUN_004d73e0(param_1);
    break;
  default:
    goto switchD_004d337f_caseD_13;
  case 0x14:
    if ((*(short *)(param_1 + 0x70) != 0) &&
       (sVar9 = *(short *)(param_1 + 0x70) + -1, *(short *)(param_1 + 0x70) = sVar9, sVar9 < 1)) {
      *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 2;
    }
    if ((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x01') &&
       (sVar9 = *(short *)(param_1 + 0x83) + 1, *(short *)(param_1 + 0x83) = sVar9,
       (int)((*(ushort *)(param_1 + 0x24) & 0xff) + 0x400) <= (int)sVar9)) {
      *(undefined2 *)(param_1 + 0x83) = 0;
      FUN_004d9b50(param_1);
    }
    goto switchD_004d337f_caseD_13;
  case 0x15:
    sVar9 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar9;
    if (sVar9 < 1) {
      FUN_004e96f0(param_1 + 0x49);
      FUN_004e96d0(param_1 + 0x49);
      *(undefined2 *)(param_1 + 0x5f) = 0;
      FUN_004d31f0(param_1);
      FUN_004e9dd0(param_1,(uint *)(param_1 + 0x3d));
      if (*(char *)(param_1 + 0xa8) != '\0') {
        local_8 = *(uint *)(param_1 + 0x3d);
        FUN_00432520(param_1,&local_8);
        FUN_00402e70(param_1,&local_8);
        FUN_004d3e00(param_1,CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x5d)));
      }
      FUN_004d3e30(param_1);
    }
    goto switchD_004d337f_caseD_13;
  case 0x16:
    cVar7 = FUN_004d83b0(param_1);
    break;
  case 0x17:
    cVar7 = FUN_004d8e40(param_1);
    break;
  case 0x18:
    cVar7 = FUN_00518560(param_1);
    break;
  case 0x19:
    cVar7 = '\0';
    if ((*(byte *)(param_1 + 0x10) & 0x10) == 0) {
      FUN_0048a050(param_1,0x51,0);
    }
    psVar1 = (short *)(param_1 + 0x70);
    *psVar1 = *psVar1 + -1;
    if (*psVar1 < 0) {
      cVar7 = FUN_00402e30(param_1);
      local_8 = *(uint *)(param_1 + 0x3d);
      FUN_00432520(param_1,&local_8);
      FUN_00402e70(param_1,&local_8);
    }
    break;
  case 0x1a:
    FUN_004eec80(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffefffff;
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 3;
    init_unit_class(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffd;
    goto switchD_004d337f_caseD_13;
  case 0x1b:
    cVar7 = FUN_004db980(param_1);
    break;
  case 0x1c:
    cVar7 = FUN_00518560(param_1);
    break;
  case 0x1d:
    cVar7 = '\0';
    if (*(short *)(param_1 + 0x9f) == 0) {
      cVar7 = FUN_00402e30(param_1);
    }
    break;
  case 0x1e:
    cVar7 = FUN_004d9080(param_1);
    break;
  case 0x1f:
    cVar7 = FUN_004d9420(param_1);
    break;
  case 0x20:
    cVar7 = FUN_004d9650(param_1);
    break;
  case 0x21:
    cVar7 = '\0';
    iVar13 = FUN_004077e0(CONCAT22((short)((uint)iVar13 >> 0x10),*(undefined2 *)(param_1 + 0x72)));
    if (iVar13 == 0) {
      cVar7 = FUN_00402e30(param_1);
    }
    else {
      uVar8 = FUN_004324c0(param_1 + 0x3d,iVar13 + 0x3d);
      update_gs_unit_related_array_item(param_1);
      uVar11 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar11 | 0x80;
      *(uint *)(param_1 + 0xc) = uVar11 | 0x1080;
      *(undefined2 *)(param_1 + 0x57) = uVar8;
      sVar9 = *(short *)(param_1 + 0x70) + -1;
      *(short *)(param_1 + 0x70) = sVar9;
      if ((sVar9 < 1) || ((uVar11 & 0x2004) != 0)) {
        cVar7 = FUN_00402e30(param_1);
      }
    }
    break;
  case 0x22:
    cVar7 = '\0';
    sVar9 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar9;
    if (sVar9 < 1) {
      if ((game_state.level_flags & 2) == 0) {
        cVar7 = unit_type_array_person[bVar2].next_state;
      }
      else if (bVar2 == 7) {
        cVar7 = '\'';
      }
      else {
        cVar7 = unit_type_array_person[bVar2].next_state;
      }
    }
    break;
  case 0x23:
    cVar7 = FUN_004df220(param_1);
    break;
  case 0x24:
    cVar7 = FUN_004df450(param_1);
    break;
  case 0x25:
    cVar7 = FUN_004df670(param_1);
    break;
  case 0x26:
    cVar7 = FUN_004dfcc0(param_1);
    break;
  case 0x27:
    cVar7 = FUN_004e0760(param_1);
    break;
  case 0x28:
    cVar7 = FUN_004e0af0(param_1);
    break;
  case 0x29:
    cVar7 = FUN_004e2870(param_1);
    break;
  case 0x2a:
    cVar7 = FUN_004e2fe0(param_1);
    break;
  case 0x2b:
    bVar6 = *(char *)(param_1 + 0x2d) + 1;
    *(byte *)(param_1 + 0x2d) = bVar6;
    if (1 < bVar6) {
      if (bVar6 == 2) {
        unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[bVar2 + 0xf3]);
      }
      else if (bVar6 == 0x12) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffefffff;
        *(byte *)(param_1 + 0x7d) = *(byte *)(param_1 + 0x2c);
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 3;
        init_unit_class(param_1);
      }
    }
switchD_004d337f_caseD_13:
    cVar7 = '\0';
  }
  if (*(char *)(param_1 + 0x1e) != '\0') {
    *(char *)(param_1 + 0x1e) = *(char *)(param_1 + 0x1e) + -1;
  }
  if (*(char *)(param_1 + 0x2a) != '\0') {
    if ((cVar7 != '\0') && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
      *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
      empty_unit_function(param_1);
      *(char *)(param_1 + 0x2c) = cVar7;
      init_unit_class(param_1);
    }
    if ((unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x1 & 1) == 0) {
      FUN_004d43a0(param_1);
    }
    if (*(char *)(param_1 + 0x2f) != -1) {
      FUN_004d4690(param_1);
      FUN_004d9bd0(param_1);
      FUN_004def50(param_1);
      FUN_004da2a0(param_1);
      if (((game_state.level_flags & 2) != 0) && (game_state.some_unit != (unit_struct *)0x0)) {
        FUN_00478820(game_state.some_unit,param_1);
      }
      if (*(char *)(param_1 + 0xa4) != '\0') {
        FUN_004d9200(param_1);
      }
      if ((*(byte *)(param_1 + 0x11) & 0x40) != 0) {
        FUN_004d92b0(param_1);
      }
      uVar11 = *(uint *)(param_1 + 0x10) & 0x1000;
      if ((uVar11 != 0) && (bVar2 = *(byte *)(param_1 + 0xa3), bVar2 != 0)) {
        if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
          bVar4 = false;
          uVar14 = 0xff;
          if (bVar2 < 0x18) {
            bVar4 = true;
            uVar14 = 4;
            if (bVar2 < 0xe) {
              uVar14 = 2;
            }
            if (bVar2 < 6) {
              uVar14 = 1;
            }
          }
          if (bVar4) {
            if ((game_state.offset_counter & uVar14) == 0) {
              *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
            }
            else {
              *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 0x40;
            }
          }
        }
        if ((((*(byte *)(param_1 + 0x2e) & 7) == 0) &&
            (*(byte *)(param_1 + 0xa3) = bVar2 - 1, (byte)(bVar2 - 1) == '\0')) && (uVar11 != 0)) {
          FUN_0048a050(param_1,0x35,0);
          *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffffefff;
          if ((game_state.tribes_array[player_tribe_num].field_0x93d & 8) == 0) {
            if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
              *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
            }
            else {
              *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffef;
            }
          }
          else {
            *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
          }
        }
      }
      if (((*(char *)(param_1 + 0xa5) != '\0') && ((*(byte *)(param_1 + 0x2e) & 7) == 0)) &&
         (cVar7 = *(char *)(param_1 + 0xa5) + -1, *(char *)(param_1 + 0xa5) = cVar7, cVar7 == '\0'))
      {
        *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffff7fff;
      }
      if (((*(char *)(param_1 + 0xb1) != '\0') && ((*(byte *)(param_1 + 0x2e) & 7) == 0)) &&
         (cVar7 = *(char *)(param_1 + 0xb1) + -1, *(char *)(param_1 + 0xb1) = cVar7, cVar7 == '\0'))
      {
        *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xfff7ffff;
      }
      if ((((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x941 & 2) != 0) &&
          ((*(byte *)(param_1 + 0xe) & 0x80) != 0)) && ((*(byte *)(param_1 + 0x17) & 1) != 0)) {
        FUN_004ef180(param_1);
      }
    }
  }
  uVar11 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar11 & 0xfffffffb;
  *(uint *)(param_1 + 0xc) = uVar11 & 0xffffdffb;
  if ((*(byte *)(param_1 + 0x11) & 4) == 0) {
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0x7fff;
    return;
  }
  *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 0x80;
  return;
}
