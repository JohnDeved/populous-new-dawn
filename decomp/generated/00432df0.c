/* Ghidra 12.1.3 pseudocode; entry 00432df0; FUN_00432df0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00432df0(int param_1)

{
  undefined1 *puVar1;
  short sVar2;
  bool bVar3;
  undefined4 uVar4;
  ushort uVar6;
  char cVar5;
  uint uVar7;
  uint uVar8;
  int iVar9;
  unit_struct *puVar10;
  unit_struct *puVar11;
  uint *puVar12;
  byte *pbVar13;
  undefined4 local_10;
  undefined4 local_c;
  undefined1 local_8 [4];
  undefined2 local_4;

  uVar6 = *(ushort *)(param_1 + 0x76);
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x200;
  *(ushort *)(param_1 + 0x76) = uVar6 & 0xfdff;
  pbVar13 = (byte *)0x0;
  *(ushort *)(param_1 + 0x76) = uVar6 & 0xfdbf;
  FUN_004e9b40(param_1);
  uVar7 = (uint)*(ushort *)(param_1 + 0x9b);
  if ((uVar7 != 0) ||
     (uVar7 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar7 != 0))
  {
    pbVar13 = (byte *)((int)(game_state.sunlight_array + 0x32) + uVar7 * 10);
  }
  if ((pbVar13 == (byte *)0x0) || ((pbVar13[1] & 1) != 0)) goto LAB_00433396;
  uVar7 = *(uint *)(&DAT_005a7dca + (uint)*pbVar13 * 0x16);
  if ((uVar7 & 0x1000) == 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x2000000;
  }
  else {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfdffffff;
  }
  if (*(char *)(param_1 + 0x2b) == '\x06') {
LAB_00432e96:
    if ((uVar7 & 0x100000) != 0) goto LAB_00432e9e;
LAB_00432eaa:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xf7ffffff;
  }
  else {
    if ((uVar7 & 0x4000) == 0) {
      if (*(char *)(param_1 + 0x2b) == '\x06') goto LAB_00432e96;
      goto LAB_00432eaa;
    }
LAB_00432e9e:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x8000000;
  }
  puVar12 = (uint *)(param_1 + 0x10);
  if ((*puVar12 & 0x8000000) == 0) {
    if ((*(short *)(param_1 + 0x9f) == 0) || (bVar3 = true, (*puVar12 & 0x2000000) == 0)) {
      bVar3 = false;
    }
    if (bVar3) {
      FUN_004389c0(pbVar13,param_1 + 0x53);
    }
  }
  if (((&DAT_005a7dcc)[(uint)*pbVar13 * 0x16] & 4) == 0) {
    *puVar12 = *puVar12 & 0xfffffff7;
  }
  else {
    uVar8 = *puVar12;
    if ((uVar8 & 8) == 0) {
      if (*(ushort *)(param_1 + 0x9f) == 0) {
        *puVar12 = uVar8 | 8;
      }
      else {
        puVar10 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
        puVar11 = (unit_struct *)0x0;
        if (((*(byte *)&puVar10->flags_2 & 1) == 0) && (puVar10->unit_class != '\0')) {
          puVar11 = puVar10;
        }
        if (puVar11 == (unit_struct *)0x0) {
          *puVar12 = uVar8 | 8;
        }
        else {
          cVar5 = FUN_00466f30(puVar11,1,0);
          if ((cVar5 != '\0') && (cVar5 = FUN_00466c80(param_1,0), cVar5 != '\0')) {
            *puVar12 = *puVar12 | 8;
          }
        }
      }
    }
  }
  switch(*pbVar13) {
  case 6:
    puVar10 = unit_land_array[*(ushort *)(pbVar13 + 6)];
    sVar2._0_1_ = puVar10->num_points;
    sVar2._1_1_ = puVar10->tex_size_type;
    if (sVar2 == 0) {
      FUN_004ba130(puVar10,&local_c);
    }
    else {
      FUN_004b9fc0();
    }
    local_10 = CONCAT31(local_10._1_3_,(char)(local_c >> 8)) & 0xfffffffe;
    local_10 = CONCAT22(local_10._2_2_,CONCAT11((char)(local_c >> 0x18),(undefined1)local_10)) &
               0xfffffeff;
    *(undefined2 *)(pbVar13 + 8) = (undefined2)local_10;
    break;
  case 7:
    if ((*(byte *)(param_1 + 0x77) & 0x80) == 0) {
      FUN_004d58c0(param_1,0);
    }
    break;
  case 10:
    puVar10 = unit_land_array[*(ushort *)(pbVar13 + 6)];
    if (puVar10->unit_class == '\t') {
      uVar6._0_1_ = puVar10->num_points;
      uVar6._1_1_ = puVar10->tex_size_type;
      *(ushort *)(pbVar13 + 6) = uVar6;
      puVar10 = unit_land_array[uVar6];
    }
    FUN_004044b0(puVar10,&local_c);
    local_10 = CONCAT31(local_10._1_3_,(char)(local_c >> 8)) & 0xfffffffe;
    local_10 = CONCAT22(local_10._2_2_,CONCAT11((char)(local_c >> 0x18),(undefined1)local_10)) &
               0xfffffeff;
    *(undefined2 *)(pbVar13 + 8) = (undefined2)local_10;
    break;
  case 0xb:
  case 0x13:
  case 0x15:
  case 0x19:
    if ((*(char *)(param_1 + 0x2f) == player_tribe_num) && (((byte)land_flags_1 & 8) == 0)) {
      game_state._800570_1_ = game_state._800570_1_ | 8;
    }
    if (*pbVar13 == 0xb) {
      if ((game_state.level_flags & 2) == 0) {
        pbVar13[8] = 6;
        pbVar13[9] = 6;
      }
      if (*(short *)(pbVar13 + 4) == 0) {
        ptr_unit_related_20B->field0_0x0 = (uint)*(ushort *)(pbVar13 + 6);
        ptr_unit_related_20B->field1_0x4 = (uint)pbVar13[8];
        ptr_unit_related_20B->unit_ptr = (unit_struct *)(uint)pbVar13[9];
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        iVar9 = alloc_unit(10,10,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
        if (iVar9 != 0) {
          *(undefined2 *)(pbVar13 + 4) = *(undefined2 *)(iVar9 + 0x24);
        }
      }
    }
    else if ((*pbVar13 == 0x13) &&
            (uVar8 = (*(ushort *)(pbVar13 + 6) & 0xfe) * 2 | *(ushort *)(pbVar13 + 6) & 0xfe00,
            (*(byte *)((int)&game_state.level_data[0].flags + uVar8 * 4 + 1) & 2) != 0)) {
      puVar10 = (unit_struct *)0x0;
      uVar6 = (&game_state.level_data[0].unit_index_2)[uVar8 * 2] & 0x3ff;
      if ((uVar6 != 0) &&
         ((puVar11 = unit_land_array[uVar6], (*(byte *)&puVar11->flags_2 & 1) == 0 &&
          (puVar11->unit_class != '\0')))) {
        puVar10 = puVar11;
      }
      if ((puVar10 != (unit_struct *)0x0) && (puVar10->unit_type == '\x13')) {
        pbVar13[1] = pbVar13[1] | 4;
      }
    }
    break;
  case 0x12:
    *puVar12 = *puVar12 | 0x80;
    break;
  case 0x1c:
    FUN_004389c0(pbVar13,&local_c);
    local_10 = local_c;
    iVar9 = FUN_00405050(&local_10);
    if ((*(byte *)(iVar9 + 1) & 2) != 0) {
      FUN_004044b0(unit_land_array[*(ushort *)(iVar9 + 8) & 0x3ff],&local_10);
    }
    *(uint *)(param_1 + 0x68) = local_10;
    FUN_00405090((uint *)(param_1 + 0x68));
    puVar10 = (unit_struct *)0x0;
    *(byte *)(param_1 + 0x82) = *(byte *)(param_1 + 0x82) & 0xf0;
    *(undefined1 *)(param_1 + 0x82) = 0;
    if (((*(ushort *)(pbVar13 + 6) != 0) &&
        (puVar11 = unit_land_array[*(ushort *)(pbVar13 + 6)], (*(byte *)&puVar11->flags_2 & 1) == 0)
        ) && (puVar11->unit_class != '\0')) {
      puVar10 = puVar11;
    }
    if ((puVar10 != (unit_struct *)0x0) && (puVar10->unit_type == '\x05')) {
      FUN_004de7f0(puVar10);
    }
    break;
  case 0x1f:
    iVar9 = get_adjacent_unit(param_1,0);
    if (iVar9 != 0) {
      get_building_coords(iVar9,&local_c);
      local_4 = *(undefined2 *)(param_1 + 0x41);
      if ((*(byte *)(param_1 + 0xe) & 2) == 0) {
        *(uint *)(param_1 + 0x3d) = local_c;
        *(undefined2 *)(param_1 + 0x41) = local_4;
      }
      else {
        add_unit_to_cell(param_1,local_8);
      }
      *(undefined2 *)(param_1 + 0x43) = 0;
      *(undefined2 *)(param_1 + 0x47) = 0;
      *(undefined2 *)(param_1 + 0x45) = 0;
    }
  case 0x1e:
    cVar5 = *(char *)(param_1 + 0x2f);
    game_state.tribes_array[cVar5].field_0x91b = 1;
    puVar1 = &game_state.tribes_array[cVar5].field_0x917;
    *(short *)puVar1 = *(short *)puVar1 + 1;
  }
  if ((uVar7 & 1) == 0) {
    if ((uVar7 & 4) == 0) {
      if ((uVar7 & 0x800) == 0) {
        if ((uVar7 & 0x242) != 0) goto LAB_00433354;
      }
      else if ((uVar7 & 0x200000) == 0) {
        uVar6 = *(ushort *)(pbVar13 + 6);
        local_10 = CONCAT22(local_10._2_2_,uVar6);
        uVar4 = local_10;
        local_10._0_1_ = (undefined1)uVar6;
        local_10._1_3_ = SUB43(uVar4,1);
        local_10 = CONCAT31(local_10._1_3_,(undefined1)local_10) & 0xfffffefe;
        local_c = CONCAT22((ushort)local_10._1_1_ << 8,(uVar6 & 0xfe) << 8);
        FUN_004e9d80(param_1,&local_c);
      }
    }
    else {
LAB_00433354:
      *(undefined2 *)(param_1 + 0x72) = *(undefined2 *)(pbVar13 + 6);
    }
  }
  else if ((uVar7 & 0x200000) == 0) {
    FUN_004e9d80(param_1,pbVar13 + 6);
  }
  *(byte *)(param_1 + 0xa7) = *pbVar13;
  FUN_00501be0(param_1);
  FUN_005016f0(param_1);
  if (((&DAT_005a7dca)[(uint)*pbVar13 * 0x16] & 0x10) == 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfff7;
  }
  else {
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 8;
  }
LAB_00433396:
  if (((*(short *)(param_1 + 0xa1) == 0) && (*(short *)(param_1 + 0x9f) != 0)) &&
     (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x02')) {
    *(short *)(param_1 + 0xa1) = *(short *)(param_1 + 0x9f);
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  uVar6 = *(ushort *)(param_1 + 0x76) & 0x7fff;
  *(undefined1 *)(param_1 + 0x2d) = 0;
  *(ushort *)(param_1 + 0x76) = uVar6;
  *(undefined1 *)(param_1 + 0xa8) = 0;
  *(undefined2 *)(param_1 + 0x89) = 0;
  *(ushort *)(param_1 + 0x76) = uVar6 | 0x10;
  *(undefined1 *)(param_1 + 0xa9) = 0;
  *(ushort *)(param_1 + 0x76) = CONCAT11((char)(uVar6 >> 8),(char)(uVar6 | 0x10)) | 0x100;
  if (*(ushort *)(param_1 + 0x9f) != 0) {
    puVar10 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
    puVar11 = (unit_struct *)0x0;
    if (((*(byte *)&puVar10->flags_2 & 1) == 0) && (puVar10->unit_class != '\0')) {
      puVar11 = puVar10;
    }
    if (puVar11 != (unit_struct *)0x0) {
      uVar7._0_1_ = puVar11->num_points;
      uVar7._1_1_ = puVar11->tex_size_type;
      uVar7._2_2_ = puVar11->facs0_index;
      uVar7 = uVar7 & 0xfffffdff;
      puVar11->num_points = (char)uVar7;
      puVar11->tex_size_type = (char)(uVar7 >> 8);
      puVar11->facs0_index = (short)(uVar7 >> 0x10);
    }
  }
  return;
}
