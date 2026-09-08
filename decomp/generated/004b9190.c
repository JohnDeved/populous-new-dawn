/* Ghidra 12.1.3 pseudocode; entry 004b9190; FUN_004b9190.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b9190(uint param_1,uint param_2,byte param_3,undefined4 param_4,char param_5)

{
  ushort *puVar1;
  byte *pbVar2;
  undefined1 *puVar3;
  uint *puVar4;
  byte bVar5;
  undefined2 uVar6;
  ushort uVar7;
  unit_struct *puVar8;
  undefined4 uVar9;
  bool bVar10;
  bool bVar11;
  int iVar12;
  char cVar13;
  char cVar14;
  uint uVar15;
  uint uVar16;
  int iVar17;
  int iVar18;
  int iVar19;
  shape_entry *psVar20;
  byte *pbVar21;
  int iVar22;
  char cStack_3a;
  byte bStack_38;
  byte bStack_37;
  byte bStack_36;
  byte bStack_35;
  undefined2 uStack_34;
  undefined2 uStack_32;
  int local_30;
  unit_struct *local_2c;
  int local_24;
  byte bStack_1f;
  unit_struct *local_1c;
  undefined4 local_18;
  int local_10;
  int local_c;
  short local_8;
  short local_6;

  psVar20 = (shape_entry *)CONCAT22(uStack_32,uStack_34);
  cStack_3a = '\x01';
  bVar11 = true;
  iVar17 = (int)(char)param_4;
  bVar10 = false;
  local_c = 0;
  local_24 = 0;
  iVar22 = iVar17 * 0xc65 + 0x89d1c8;
  puVar3 = &game_state.tribes_array[iVar17].field_0x93d;
  *(uint *)puVar3 = *(uint *)puVar3 & 0x803fffff;
  iVar12 = DAT_005aa4e4;
  iVar18 = DAT_005aa4e4 + 1;
  cVar14 = game_state.tribes_array[iVar17].field_0xc1f;
  local_1c = (unit_struct *)(param_2 & 0xff);
  if (local_1c == (unit_struct *)0x4) {
LAB_004b9211:
    local_24 = 1;
  }
  else {
    if (local_1c == (unit_struct *)0xa) {
      local_24 = 1;
      local_18 = 0;
      cStack_3a = '\0';
      goto LAB_004b922f;
    }
    if (local_1c == (unit_struct *)0xb) goto LAB_004b9211;
  }
  local_18 = (uint)param_3;
LAB_004b922f:
  bStack_38 = (byte)param_1;
  bStack_37 = (byte)(param_1 >> 8);
  iVar19 = (int)(char)(&objs0_mem[*(ushort *)(unit_type_array_building + (int)local_1c)].
                        shapes_index)[local_18];
  switch(param_5) {
  case '\0':
  case '\x01':
    psVar20 = shapes_mem + iVar19;
    bStack_38 = bStack_38 - psVar20->x2;
    bStack_37 = bStack_37 - psVar20->y2;
    break;
  case '\x02':
    local_8 = (ushort)bStack_38 << 8;
    local_6 = (ushort)bStack_37 << 8;
    FUN_004ba7a0(param_1,param_2,local_18,param_4,1);
    psVar20 = shapes_mem + iVar19;
    bStack_38 = bStack_38 - psVar20->x2;
    bStack_37 = bStack_37 - psVar20->y2;
    ptr_unit_related_20B->field0_0x0 = iVar19;
    ptr_unit_related_20B->field1_0x4 = (uint)CONCAT11(bStack_37,bStack_38);
    ptr_unit_related_20B->unit_ptr = local_1c;
    ptr_unit_related_20B->field3_0xc = local_18;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    local_2c = (unit_struct *)alloc_unit(9,1,param_4,&local_8);
    if (local_2c == (unit_struct *)0x0) {
      bVar10 = true;
    }
    else {
      puVar3 = &game_state.array_56b_4[iVar17].field_0xc;
      *(uint *)puVar3 = *(uint *)puVar3 & ~(1 << ((byte)param_2 & 0x1f));
      FUN_004ba9b0(iVar22,0,local_2c,0);
      FUN_004e3300(param_4,&local_2c->pos,4);
    }
    break;
  case '\x03':
    local_2c = unit_land_array
               [(ushort)(&game_state.level_data[0].unit_index_2)
                        [((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2] & 0x3ff];
    uVar6 = (undefined2)local_2c->coord_scale_4;
    bStack_38 = (byte)uVar6;
    bStack_37 = (byte)((ushort)uVar6 >> 8);
    psVar20 = shapes_mem + (byte)local_2c->field_0x9b;
    FUN_004ef180(local_2c);
    break;
  case '\x04':
    local_2c = unit_land_array
               [(ushort)(&game_state.level_data[0].unit_index_2)
                        [((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2] & 0x3ff];
    uVar6 = (undefined2)local_2c->coord_scale_4;
    bStack_38 = (byte)uVar6;
    bStack_37 = (byte)((ushort)uVar6 >> 8);
    psVar20 = shapes_mem + (byte)local_2c->field_0x9b;
  }
  uStack_34 = SUB42(psVar20,0);
  if (!bVar10) {
    local_10 = 0;
    bStack_35 = bStack_37;
    pbVar21 = psVar20->ptr;
    local_18 = (uint)(byte)psVar20->x1;
    bVar5 = psVar20->y1;
    if (bVar5 != 0) {
      do {
        bStack_36 = bStack_38;
        for (local_30 = 0; local_30 < (int)local_18; local_30 = local_30 + 1) {
          uVar15 = (CONCAT11(bStack_35,bStack_36) & 0xfe) * 2 |
                   CONCAT11(bStack_35,bStack_36) & 0xfe00;
          iVar19 = uVar15 * 4;
          puVar4 = &game_state.level_data[0].flags + uVar15;
          if ((param_5 == '\0') || (param_5 == '\x01')) {
            if ((((int)(char)psVar20->field6_0x6 << 5) >> 8 == local_30) &&
               (((int)(char)psVar20->field7_0x7 << 5) >> 8 == local_10)) {
              if (param_5 == '\0') {
                *puVar4 = *puVar4 | 0x800;
              }
              else {
                *puVar4 = *puVar4 & 0xfffff7ff;
              }
            }
            if (((param_5 == '\0') && ((*pbVar21 & 4) != 0)) &&
               (cVar13 = FUN_0044fa50(CONCAT22(uStack_34,CONCAT11(bStack_35,bStack_36))),
               cVar13 != '\0')) {
              local_c = 1;
              puVar3 = &game_state.tribes_array[iVar17].field_0x93d;
              *(uint *)puVar3 = *(uint *)puVar3 | 0x20000000;
            }
          }
          if ((*pbVar21 & 1) == 0) goto switchD_004b958d_caseD_5;
          switch(param_5) {
          case '\0':
            uVar16 = *puVar4;
            *puVar4 = uVar16 | 0x90;
            *puVar4 = uVar16 & 0xfffffeff | 0x90;
            if (((local_24 == 0) &&
                (local_24 = FUN_0044eca0(CONCAT22(uStack_34,CONCAT11(bStack_35,bStack_36)),iVar17,
                                         iVar18), (byte)param_2 == 0xd)) && (local_24 == 0)) {
              local_24 = FUN_0044eca0(CONCAT22(uStack_34,CONCAT11(bStack_35,bStack_36)),iVar17,
                                      iVar12 + 3);
            }
            uVar9 = CONCAT13(bStack_38,CONCAT12(1,CONCAT11(cStack_3a,cVar14 == '\x01')));
            cVar13 = FUN_0044ee50(iVar22,CONCAT22(uStack_34,CONCAT11(bStack_35,bStack_36)),
                                  CONCAT31((int3)((uint)uVar9 >> 8),*pbVar21) & 0xfffffff8,param_2,0
                                  ,uVar9);
            if ((cVar13 == '\0') || (cVar13 = FUN_0041b4c0(param_4), cVar13 == '\0')) {
              land_flags_1 = land_flags_1 | 0x200000;
              *puVar4 = *puVar4 | 0x100;
            }
            if ((*(byte *)((int)&game_state.level_data[0].flags + iVar19 + 1) & 1) == 0) {
              for (puVar8 = unit_land_array
                            [(short)(&game_state.level_data[0].unit_index)[uVar15 * 2]];
                  puVar8 != (unit_struct *)0x0; puVar8 = unit_land_array[puVar8->next_unit_index]) {
                if ((puVar8->unit_class == '\n') && (puVar8->unit_type == '\x10')) {
                  land_flags_1 = land_flags_1 | 0x200000;
                  *puVar4 = *puVar4 | 0x100;
                  puVar3 = &game_state.tribes_array[iVar17].field_0x93d;
                  *(uint *)puVar3 = *(uint *)puVar3 | 0x20000000;
                  break;
                }
              }
            }
            break;
          case '\x01':
            uVar15 = *puVar4;
            uVar16 = uVar15 & 0xffffff7f;
            *puVar4 = uVar16;
            *puVar4 = uVar16 | 0x10;
            uVar15 = uVar15 & 0xfffffe7f;
            goto LAB_004b96fe;
          case '\x02':
            uVar7 = (&game_state.level_data[0].unit_index_2)[uVar15 * 2];
            (&game_state.level_data[0].unit_index_2)[uVar15 * 2] =
                 (local_2c->unit_index ^ uVar7) & 0x3ff ^ uVar7;
            (&game_state.level_data[0].c_2)[iVar19] =
                 (&game_state.level_data[0].c_2)[iVar19] & 0xf0 | (char)param_4 + 1U;
            *puVar4 = *puVar4 | 0x410;
            break;
          case '\x03':
            puVar1 = &game_state.level_data[0].unit_index_2 + uVar15 * 2;
            *puVar1 = *puVar1 & 0xfc00;
            pbVar2 = &game_state.level_data[0].c_2 + iVar19;
            *pbVar2 = *pbVar2 & 0xf0;
            goto LAB_004b96eb;
          case '\x04':
            puVar1 = &game_state.level_data[0].unit_index_2 + uVar15 * 2;
            *puVar1 = *puVar1 & 0xfc00;
LAB_004b96eb:
            uVar15 = *puVar4;
            uVar16 = uVar15 & 0xfffffbff;
            *puVar4 = uVar16;
            *puVar4 = uVar16 | 0x10;
            uVar15 = uVar15 & 0xffffbbff;
LAB_004b96fe:
            *puVar4 = uVar15 | 0x10;
          }
switchD_004b958d_caseD_5:
          pbVar21 = pbVar21 + 1;
          bStack_36 = bStack_36 + 2;
        }
        local_10 = local_10 + 1;
        bStack_35 = bStack_35 + 2;
      } while (local_10 < (int)(uint)bVar5);
    }
    if (param_5 == '\0') {
      if (cStack_3a != '\0') {
        bStack_1f = bStack_37 & 0xfe;
        local_18 = CONCAT22((ushort)bStack_1f * 0x100 + (char)psVar20->field7_0x7 * 0x40,
                            (bStack_38 & 0xfe) * 0x100 + (char)psVar20->field6_0x6 * 0x40);
        cVar14 = FUN_00518200(&local_18,0);
        if (cVar14 != '\0') {
          bVar11 = false;
          switch(cVar14) {
          case '\x01':
            puVar3 = &game_state.tribes_array[iVar17].field_0x93d;
            *(uint *)puVar3 = *(uint *)puVar3 | 0x800000;
            break;
          case '\x02':
            puVar3 = &game_state.tribes_array[iVar17].field_0x93d;
            *(uint *)puVar3 = *(uint *)puVar3 | 0x20000000;
            break;
          case '\x03':
            puVar3 = &game_state.tribes_array[iVar17].field_0x93d;
            *(uint *)puVar3 = *(uint *)puVar3 | 0x10000000;
            break;
          case '\x04':
            puVar3 = &game_state.tribes_array[iVar17].field_0x93d;
            *(uint *)puVar3 = *(uint *)puVar3 | 0x1000000;
          }
        }
      }
      if ((((local_24 == 0) || (!bVar11)) && (local_c = 1, local_24 == 0)) &&
         (uVar15 = *(uint *)&game_state.tribes_array[iVar17].field_0x93d, (uVar15 & 0x800000) == 0))
      {
        *(uint *)&game_state.tribes_array[iVar17].field_0x93d = uVar15 | 0x400000;
      }
      if (local_c != 0) {
        land_flags_1 = land_flags_1 | 0x200000;
        pbVar21 = psVar20->ptr;
        bVar5 = psVar20->x1;
        for (uVar15 = (uint)(byte)psVar20->y1; uVar15 != 0; uVar15 = uVar15 - 1) {
          bStack_36 = bStack_38;
          for (iVar22 = 0; iVar22 < (int)(uint)bVar5; iVar22 = iVar22 + 1) {
            puVar4 = &game_state.level_data[0].flags +
                     ((CONCAT11(bStack_37,bStack_36) & 0xfe) * 2 |
                     CONCAT11(bStack_37,bStack_36) & 0xfe00);
            if ((*pbVar21 & 1) != 0) {
              *puVar4 = *puVar4 | 0x100;
            }
            pbVar21 = pbVar21 + 1;
            bStack_36 = bStack_36 + 2;
          }
          bStack_37 = bStack_37 + 2;
        }
      }
    }
  }
  return;
}
