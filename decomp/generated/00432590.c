/* Ghidra 12.1.3 pseudocode; entry 00432590; FUN_00432590.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00432590(int param_1)

{
  bool bVar1;
  bool bVar2;
  char cVar3;
  undefined1 uVar4;
  int iVar5;
  uint uVar6;
  uint uVar7;
  unit_struct *puVar8;
  uint uVar9;
  byte *pbVar10;
  undefined1 local_11;
  uint local_10;
  uint local_c;
  uint local_8;
  int local_4;

  uVar9 = 0;
  pbVar10 = (byte *)0x0;
  bVar2 = false;
  local_11 = 0;
  uVar7 = (uint)*(ushort *)(param_1 + 0x9b);
  local_4 = 0;
  local_8 = 0;
  uVar6 = uVar7;
  if ((uVar7 != 0) ||
     (uVar6 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar6 != 0))
  {
    pbVar10 = (byte *)((int)(game_state.sunlight_array + 0x32) + uVar6 * 10);
  }
  if (pbVar10 == (byte *)0x0) {
    bVar2 = true;
    goto LAB_00432a5d;
  }
  if ((pbVar10[1] & 1) == 0) {
    if ((*(byte *)(param_1 + 0x13) & 0x10) != 0) {
      bVar2 = true;
      local_4 = 1;
    }
  }
  else {
    uVar9 = 1;
  }
  if (uVar9 != 0) goto LAB_00432a65;
  uVar9 = 0;
  if (bVar2) goto LAB_00432a5d;
  if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
    if ((*(uint *)(param_1 + 0x14) & 0x80) != 0) {
      if (*(short *)(param_1 + 0x9f) != 0) {
        local_c = 0;
        if (uVar7 == 0) {
          local_10 = (uint)*(byte *)(param_1 + 0xa6);
          uVar7 = (uint)*(ushort *)(param_1 + 0x8b + local_10 * 2);
          if (uVar7 != 0) goto LAB_00432663;
        }
        else {
LAB_00432663:
          local_c = uVar7 * 10 + 0x938830;
        }
        if (local_c != 0) {
          FUN_004389c0(local_c,&local_10);
          cVar3 = FUN_00435550(param_1,&local_10,0);
          if (cVar3 != '\0') {
            *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffff7f;
          }
          goto LAB_004326b0;
        }
      }
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffff7f;
    }
LAB_004326b0:
    if (((&DAT_005a7dcc)[(uint)*(byte *)(param_1 + 0xa7) * 0x16] & 4) == 0) {
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffff7;
    }
    else if ((*(uint *)(param_1 + 0x10) & 8) == 0) {
      if (*(short *)(param_1 + 0x9f) == 0) {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 8;
      }
      else {
        iVar5 = FUN_004077e0(*(short *)(param_1 + 0x9f));
        if (iVar5 == 0) {
          *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 8;
        }
        else {
          cVar3 = FUN_00466f30(iVar5,1,0);
          if ((cVar3 != '\0') && (cVar3 = FUN_00466c80(param_1,0), cVar3 != '\0')) {
            *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 8;
          }
        }
      }
    }
  }
  uVar6 = local_10;
  switch(*pbVar10 - 3) {
  case 0:
    uVar9 = FUN_004336c0(param_1,pbVar10);
    break;
  case 1:
    uVar9 = FUN_00433800(param_1,pbVar10);
    break;
  case 2:
    uVar9 = 1;
    goto switchD_00432731_caseD_9;
  case 3:
    uVar9 = FUN_00495520(param_1,pbVar10);
    break;
  case 4:
    uVar9 = FUN_004340a0(param_1,pbVar10);
    break;
  case 5:
    uVar9 = FUN_00434610(param_1,pbVar10);
    break;
  case 6:
    local_10 = local_10 & 0xffffff00;
    if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
      uVar9 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
      uVar7 = (int)uVar9 >> 0x1f;
      local_10._1_3_ = SUB43(uVar6,1);
      if (((int)((uVar9 ^ uVar7) - uVar7) < 0x70) &&
         (uVar6 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
         uVar9 = (int)uVar6 >> 0x1f, (int)((uVar6 ^ uVar9) - uVar9) < 0x70)) {
        local_10 = CONCAT31(local_10._1_3_,1);
      }
      else {
        local_10 = (uint)local_10._1_3_ << 8;
      }
      if ((char)local_10 != '\0') {
        FUN_004d58c0(param_1,0);
      }
    }
    uVar9 = local_10 & 0xff;
    goto switchD_00432731_caseD_9;
  case 7:
    uVar9 = FUN_00497a30(param_1,pbVar10);
    break;
  case 8:
    uVar9 = FUN_00519f10(param_1,pbVar10);
    break;
  default:
    goto switchD_00432731_caseD_9;
  case 10:
    uVar9 = FUN_00439a00(param_1,pbVar10);
    break;
  case 0xb:
    uVar9 = 1;
    goto switchD_00432731_caseD_9;
  case 0xc:
    uVar9 = FUN_00439d30(param_1,pbVar10);
    break;
  case 0xd:
    FUN_004de760(param_1,pbVar10[6]);
    if ((*(ushort *)(param_1 + 0x9f) != 0) &&
       (puVar8 = unit_land_array[*(ushort *)(param_1 + 0x9f)], puVar8 != (unit_struct *)0x0)) {
      uVar4 = FUN_004de740(param_1);
      puVar8->tribe_index = uVar4;
    }
    uVar9 = 1;
    goto switchD_00432731_caseD_9;
  case 0xe:
    uVar9 = FUN_0043a4d0(param_1,pbVar10);
    break;
  case 0xf:
    uVar9 = FUN_00433a10(param_1,pbVar10);
    break;
  case 0x10:
    uVar9 = FUN_0051a2a0(param_1,pbVar10);
    break;
  case 0x11:
    uVar9 = 1;
    goto switchD_00432731_caseD_9;
  case 0x12:
    uVar9 = FUN_0051a2a0(param_1,pbVar10);
    break;
  case 0x13:
    uVar9 = FUN_00435160(param_1,pbVar10);
    break;
  case 0x14:
    uVar9 = 1;
    FUN_00435550(param_1,pbVar10 + 6,1);
    goto switchD_00432731_caseD_9;
  case 0x15:
    uVar9 = 1;
    goto switchD_00432731_caseD_9;
  case 0x16:
    local_c = local_c & 0xffffff00;
    cVar3 = FUN_004336c0(param_1,pbVar10);
    if (cVar3 != '\0') {
      local_c = CONCAT31(local_c._1_3_,1);
      FUN_004389c0(pbVar10,&local_10);
      iVar5 = FUN_00405050(&local_10);
      puVar8 = unit_land_array[*(short *)(iVar5 + 6)];
      if (puVar8 != (unit_struct *)0x0) {
        do {
          if ((puVar8->unit_class == '\n') && (puVar8->unit_type == '\x10')) {
            puVar8->coord_scale_3 = 0;
            puVar8->coord_scale_1 = 0;
            goto LAB_00432934;
          }
          puVar8 = unit_land_array[puVar8->next_unit_index];
        } while (puVar8 != (unit_struct *)0x0);
        uVar9 = local_c & 0xff;
        goto switchD_00432731_caseD_9;
      }
    }
LAB_00432934:
    uVar9 = local_c & 0xff;
    goto switchD_00432731_caseD_9;
  case 0x17:
    uVar9 = 1;
    goto switchD_00432731_caseD_9;
  case 0x18:
    uVar9 = FUN_0043bcc0(param_1,pbVar10);
    break;
  case 0x19:
    uVar9 = FUN_0051fce0(param_1,pbVar10);
    break;
  case 0x1a:
    puVar8 = unit_land_array[*(ushort *)(pbVar10 + 6)];
    if (*(char *)(param_1 + 0x2d) == '\0') {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      local_10._0_2_ = (puVar8->pos).x;
      local_10._2_2_ = (puVar8->pos).y;
      local_c = local_10;
      iVar5 = FUN_00405050(&local_c);
      if ((*(byte *)(iVar5 + 1) & 2) != 0) {
        FUN_004044b0(unit_land_array[*(ushort *)(iVar5 + 8) & 0x3ff],&local_c);
      }
      FUN_00402e70(param_1,&local_c);
      FUN_004e9d80(param_1,&local_10);
    }
    if (((*(byte *)(param_1 + 0x2e) & 1) == 0) &&
       (cVar3 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x38), cVar3 != '\0')) {
      FUN_004d4ee0(param_1);
    }
    uVar9 = (uint)(puVar8->loc_1_x != 0);
    goto switchD_00432731_caseD_9;
  case 0x1b:
    uVar9 = FUN_0043daa0(param_1,pbVar10);
    break;
  case 0x1c:
    uVar9 = FUN_0043a4d0(param_1,pbVar10);
    break;
  case 0x1d:
    uVar9 = FUN_0043a4d0(param_1,pbVar10);
    break;
  case 0x1e:
    uVar9 = FUN_0043c7a0(param_1,pbVar10);
  }
  uVar9 = uVar9 & 0xff;
switchD_00432731_caseD_9:
  if (((level_flags_2._2_1_ & 4) == 0) && ((*(byte *)(param_1 + 0x76) & 8) != 0)) {
    add_unit_to_formation(param_1);
  }
LAB_00432a5d:
  if (uVar9 != 0) {
LAB_00432a65:
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xfffffffe;
    local_c = *(uint *)(param_1 + 0x3d);
    local_8 = 1;
    if (pbVar10 == (byte *)0x0) {
      local_10 = local_c;
      iVar5 = FUN_00405050(&local_10);
      if ((*(byte *)(iVar5 + 1) & 2) != 0) {
        FUN_004044b0(unit_land_array[*(ushort *)(iVar5 + 8) & 0x3ff],&local_10);
      }
LAB_00432b4f:
      FUN_00402e70(param_1,&local_10);
    }
    else if ((*(uint *)(&DAT_005a7dca + (uint)*pbVar10 * 0x16) & 0x100) == 0) {
      if ((*(uint *)(&DAT_005a7dca + (uint)*pbVar10 * 0x16) & 0x20) == 0) {
        local_10 = local_c;
        iVar5 = FUN_00405050(&local_10);
        if ((*(byte *)(iVar5 + 1) & 2) != 0) {
          FUN_004044b0(unit_land_array[*(ushort *)(iVar5 + 8) & 0x3ff],&local_10);
        }
      }
      else {
        FUN_004389c0(pbVar10,&local_c);
        local_10 = local_c;
        FUN_00432520(param_1,&local_10);
      }
      goto LAB_00432b4f;
    }
    bVar1 = true;
    if (*(short *)(param_1 + 0x9b) == 0) {
      if (((&DAT_005a7dcb)[(uint)*(byte *)(param_1 + 0xa7) * 0x16] & 0x80) == 0) {
        uVar4 = *(undefined1 *)(param_1 + 0xa6);
      }
      else {
        bVar1 = false;
        uVar4 = (char)local_10;
      }
    }
    else {
      uVar4 = 0xff;
    }
    if (bVar1) {
      FUN_004364d0(param_1,uVar4);
    }
    cVar3 = FUN_004366b0(param_1);
    if (cVar3 == '\0') {
      bVar2 = true;
    }
  }
  if (!bVar2) {
    return 0;
  }
  if (local_8 == 0) {
    local_8 = *(uint *)(param_1 + 0x3d);
    if (pbVar10 == (byte *)0x0) {
      local_10 = local_8;
      iVar5 = FUN_00405050(&local_10);
      if ((*(byte *)(iVar5 + 1) & 2) != 0) {
        FUN_004044b0(unit_land_array[*(ushort *)(iVar5 + 8) & 0x3ff],&local_10);
      }
    }
    else {
      if ((*(uint *)(&DAT_005a7dca + (uint)*pbVar10 * 0x16) & 0x100) != 0) goto LAB_00432ca8;
      if ((*(uint *)(&DAT_005a7dca + (uint)*pbVar10 * 0x16) & 0x20) == 0) {
        local_10 = local_8;
        iVar5 = FUN_00405050(&local_10);
        if ((*(byte *)(iVar5 + 1) & 2) != 0) {
          FUN_004044b0(unit_land_array[*(ushort *)(iVar5 + 8) & 0x3ff],&local_10);
        }
      }
      else {
        FUN_004389c0(pbVar10,&local_8);
        local_10 = local_8;
        FUN_00432520(param_1,&local_10);
      }
    }
    FUN_00402e70(param_1,&local_10);
  }
LAB_00432ca8:
  if (((*(byte *)(param_1 + 0x17) & 0x10) != 0) ||
     ((((pbVar10 != (byte *)0x0 && ((pbVar10[1] & 0x40) != 0)) && ((pbVar10[1] & 0x80) == 0)) &&
      (*pbVar10 != 0x16)))) {
    FUN_00466c80(param_1,0);
  }
  *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xefffffff;
  if (local_4 == 0) {
    local_11 = FUN_004e32a0(param_1);
  }
  else if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x21;
    init_unit_class(param_1);
  }
  return local_11;
}
