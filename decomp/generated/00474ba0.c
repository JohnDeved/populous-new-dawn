/* Ghidra 12.1.3 pseudocode; entry 00474ba0; FUN_00474ba0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_00474ba0(uint *param_1,int param_2,int param_3,undefined4 *param_4,undefined4 *param_5,
                uint param_6)

{
  undefined1 uVar1;
  short sVar2;
  bool bVar3;
  char cVar4;
  char cVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  byte bVar9;
  ushort uVar10;
  uint uVar11;
  undefined4 *puVar12;
  undefined4 *puVar13;
  byte bVar14;
  byte local_7;
  undefined2 local_6;
  int local_4;

  local_4 = 0;
  local_7 = 0;
  if ((param_2 == 0) && (param_3 == 0)) {
    return 0;
  }
  uVar10 = (ushort)((int)(param_1 + -0x2280f9) >> 4);
  sVar2 = ((uVar10 & 0xff80) * 2 | uVar10 & 0x7f) * 2;
  local_6._1_1_ = (char)((ushort)sVar2 >> 8);
  cVar5 = local_6._1_1_;
  local_6._0_1_ = (char)sVar2;
  cVar4 = (char)local_6;
  local_6 = CONCAT11(local_6._1_1_ + -2,(char)local_6);
  bVar14 = ((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) ==
           0;
  local_6 = CONCAT11(cVar5 + '\x02',(char)local_6);
  if (((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) == 0) {
    bVar14 = bVar14 | 4;
  }
  local_6 = CONCAT11(cVar5,(char)local_6 + '\x02');
  if (((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) == 0) {
    bVar14 = bVar14 | 2;
  }
  local_6 = CONCAT11(cVar5,cVar4 + -2);
  if (((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) == 0) {
    bVar14 = bVar14 | 8;
  }
  switch(bVar14) {
  case 3:
    local_7 = 3;
    uVar11 = 6;
    break;
  default:
    uVar11 = 5;
    local_7 = 4;
    if ((bVar14 & 1) == 0) {
      if ((bVar14 & 2) == 0) {
        if ((bVar14 & 4) == 0) {
          if ((bVar14 & 8) != 0) {
            local_7 = 1;
          }
        }
        else {
          local_7 = 0;
        }
      }
      else {
        local_7 = 3;
      }
    }
    else {
      local_7 = 2;
    }
    if (local_7 == 4) {
      local_6 = CONCAT11(cVar5 + -2,cVar4 + -2);
      if (((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) ==
          0) {
        bVar14 = bVar14 | 0x10;
      }
      local_6 = CONCAT11(cVar5 + -2,cVar4 + '\x02');
      if (((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) ==
          0) {
        bVar14 = bVar14 | 0x20;
      }
      local_6 = CONCAT11(cVar5 + '\x02',cVar4 + '\x02');
      if (((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) ==
          0) {
        bVar14 = bVar14 | 0x80;
      }
      local_6 = CONCAT11(cVar5 + '\x02',cVar4 + -2);
      if (((&game_state.level_data[0].flags)[(local_6 & 0xfe) * 2 | local_6 & 0xfe00] & param_6) ==
          0) {
        bVar14 = bVar14 | 0x40;
      }
      switch(bVar14) {
      case 0x10:
        local_7 = 2;
        uVar11 = 4;
        break;
      default:
        local_7 = 0;
        uVar11 = 0xf;
        break;
      case 0x20:
        local_7 = 3;
        uVar11 = 4;
        break;
      case 0x30:
        local_7 = 2;
        uVar11 = 0;
        break;
      case 0x40:
        local_7 = 1;
        uVar11 = 4;
        break;
      case 0x50:
        local_7 = 1;
        uVar11 = 0;
        break;
      case 0x80:
        local_7 = 0;
        uVar11 = 4;
        break;
      case 0xa0:
        local_7 = 3;
        uVar11 = 0;
        break;
      case 0xc0:
        uVar11 = 0;
        local_7 = 0;
        break;
      case 0xf0:
        local_7 = 0;
        uVar11 = 1;
      }
    }
    break;
  case 5:
    local_7 = 1;
    uVar11 = 2;
    break;
  case 6:
    local_7 = 0;
    uVar11 = 6;
    break;
  case 7:
    local_7 = 1;
    uVar11 = 3;
    break;
  case 9:
    local_7 = 2;
    uVar11 = 6;
    break;
  case 10:
    local_7 = 0;
    uVar11 = 2;
    break;
  case 0xb:
    local_7 = 0;
    uVar11 = 3;
    break;
  case 0xc:
    local_7 = 1;
    uVar11 = 6;
    break;
  case 0xd:
    uVar11 = 3;
    local_7 = 3;
    break;
  case 0xe:
    local_7 = 2;
    uVar11 = 3;
    break;
  case 0xf:
    uVar11 = 7;
  }
  uVar6 = *param_1 & 1;
  if (uVar6 != 0) {
    local_7 = local_7 + 3 & 3;
  }
  if ((param_6 & 0x1000) == 0) {
    if ((param_6 & 0x400) == 0) {
      if ((param_6 & 0x100) == 0) {
        if ((param_6 & 0x80) != 0) goto LAB_00474f1a;
      }
      else {
        uVar11 = uVar11 + 0x40;
      }
    }
    else {
LAB_00474f1a:
      uVar11 = uVar11 + 0x30;
    }
  }
  if ((*param_1 & 0x800) != 0) {
    bVar14 = ((uVar6 == 0) - (&DAT_005a885a)[DAT_00895de0 * 0x12]) + 5;
    if ((param_2 != 0) && (iVar7 = add_polygon_type_8(param_2,0xf2,0,0), iVar7 != 0)) {
      bVar9 = bVar14 & 3;
      *(undefined1 *)(iVar7 + 0x43) = 0x1f;
      local_4 = 1;
      *(undefined4 *)(iVar7 + 0xe) = uv_mapping_24B_ARRAY_005a2f30[bVar9].u1;
      *(undefined4 *)(iVar7 + 0x12) = uv_mapping_24B_ARRAY_005a2f30[bVar9].v1;
      *(undefined4 *)(iVar7 + 0x22) = uv_mapping_24B_ARRAY_005a2f30[bVar9].u2;
      *(undefined4 *)(iVar7 + 0x26) = uv_mapping_24B_ARRAY_005a2f30[bVar9].v2;
      *(undefined4 *)(iVar7 + 0x36) = uv_mapping_24B_ARRAY_005a2f30[bVar9].u3;
      *(undefined4 *)(iVar7 + 0x3a) = uv_mapping_24B_ARRAY_005a2f30[bVar9].v3;
    }
    if ((param_3 != 0) && (iVar7 = add_polygon_type_8(param_3,0xf2,0,0), iVar7 != 0)) {
      local_4 = local_4 + 1;
      uVar11 = bVar14 + 2 & 3;
      *(undefined1 *)(iVar7 + 0x43) = 0x1f;
      *(undefined4 *)(iVar7 + 0xe) = uv_mapping_24B_ARRAY_005a2f30[uVar11].u1;
      *(undefined4 *)(iVar7 + 0x12) = uv_mapping_24B_ARRAY_005a2f30[uVar11].v1;
      *(undefined4 *)(iVar7 + 0x22) = uv_mapping_24B_ARRAY_005a2f30[uVar11].u2;
      *(undefined4 *)(iVar7 + 0x26) = uv_mapping_24B_ARRAY_005a2f30[uVar11].v2;
      *(undefined4 *)(iVar7 + 0x36) = uv_mapping_24B_ARRAY_005a2f30[uVar11].u3;
      *(undefined4 *)(iVar7 + 0x3a) = uv_mapping_24B_ARRAY_005a2f30[uVar11].v3;
    }
    goto LAB_004750fa;
  }
  bVar3 = false;
  uVar6 = uVar11;
  if ((0x3f < uVar11) && (uVar11 < 0x50)) {
    bVar3 = true;
    uVar6 = uVar11 - 0x10;
  }
  if (param_2 == 0) {
LAB_0047507d:
    iVar7 = 0;
  }
  else {
    uVar1 = *(undefined1 *)(param_2 + 0x45);
    *(byte *)(param_2 + 0x45) = local_7;
    iVar7 = add_polygon_type_8(param_2,uVar6,0,0);
    if (iVar7 == 0) {
      *(undefined1 *)(param_2 + 0x45) = uVar1;
      goto LAB_0047507d;
    }
    *(undefined1 *)(iVar7 + 0x43) = 0x1f;
    *(undefined1 *)(param_2 + 0x45) = uVar1;
    if (bVar3) {
      *(undefined4 *)(iVar7 + 0x16) = 0xffff2020;
      *(undefined4 *)(iVar7 + 0x2a) = 0xffff2020;
      *(undefined4 *)(iVar7 + 0x3e) = 0xffff2020;
    }
    iVar7 = 1;
  }
  bVar3 = false;
  if ((0x3f < uVar11) && (uVar11 < 0x50)) {
    bVar3 = true;
    uVar11 = uVar11 - 0x10;
  }
  if (param_3 == 0) {
LAB_004750f2:
    local_4 = 0;
  }
  else {
    uVar1 = *(undefined1 *)(param_3 + 0x45);
    *(byte *)(param_3 + 0x45) = local_7 + 2 & 3;
    iVar8 = add_polygon_type_8(param_3,uVar11,0,0);
    if (iVar8 == 0) {
      *(undefined1 *)(param_3 + 0x45) = uVar1;
      goto LAB_004750f2;
    }
    *(undefined1 *)(iVar8 + 0x43) = 0x1f;
    *(undefined1 *)(param_3 + 0x45) = uVar1;
    if (bVar3) {
      *(undefined4 *)(iVar8 + 0x16) = 0xffff2020;
      *(undefined4 *)(iVar8 + 0x2a) = 0xffff2020;
      *(undefined4 *)(iVar8 + 0x3e) = 0xffff2020;
    }
    local_4 = 1;
  }
  local_4 = local_4 + iVar7;
LAB_004750fa:
  if ((param_6 & 0x400) == 0) {
    if (_DAT_0087cb5c < (float)param_4[3]) {
      puVar12 = param_4;
      puVar13 = &DAT_0087cb50;
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
    if ((float)param_4[3] < (float)facs0_struct_0087cb03._49_4_) {
      puVar12 = param_4;
      puVar13 = (undefined4 *)((int)&facs0_struct_0087cb03.point_4_v + 1);
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
    if (_DAT_0087cb5c < (float)param_4[0xb]) {
      puVar12 = param_4 + 8;
      puVar13 = &DAT_0087cb50;
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
    if ((float)param_4[0xb] < (float)facs0_struct_0087cb03._49_4_) {
      puVar12 = param_4 + 8;
      puVar13 = (undefined4 *)((int)&facs0_struct_0087cb03.point_4_v + 1);
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
    if (_DAT_0087cb5c < (float)param_5[3]) {
      puVar12 = param_5;
      puVar13 = &DAT_0087cb50;
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
    if ((float)param_5[3] < (float)facs0_struct_0087cb03._49_4_) {
      puVar12 = param_5;
      puVar13 = (undefined4 *)((int)&facs0_struct_0087cb03.point_4_v + 1);
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
    if (_DAT_0087cb5c < (float)param_5[0xb]) {
      puVar12 = param_5 + 8;
      puVar13 = &DAT_0087cb50;
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
    if ((float)param_5[0xb] < (float)facs0_struct_0087cb03._49_4_) {
      puVar12 = param_5 + 8;
      puVar13 = (undefined4 *)((int)&facs0_struct_0087cb03.point_4_v + 1);
      for (iVar7 = 8; iVar7 != 0; iVar7 = iVar7 + -1) {
        *puVar13 = *puVar12;
        puVar12 = puVar12 + 1;
        puVar13 = puVar13 + 1;
      }
    }
  }
  return local_4;
}
