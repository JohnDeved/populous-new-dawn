/* Ghidra 12.1.3 pseudocode; entry 00478ee0; unit_processing_class_7_effect_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_7_effect_2(int param_1)

{
  int iVar1;
  undefined1 uVar2;
  unit_struct *puVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  bool bVar7;
  bool bVar8;
  unit_related_struct_20B *puVar9;
  char cVar10;
  char cVar11;
  char cVar12;
  byte bVar13;
  byte bVar14;
  ushort uVar15;
  uint uVar16;
  uint uVar17;
  int iVar18;
  short sVar19;
  unit_struct *puVar20;
  int iVar21;
  gs_struct_6B *pgVar22;
  undefined4 local_1c;
  char local_16;
  char cStack_15;
  undefined1 uStack_14;
  undefined1 uStack_13;
  undefined2 uStack_12;
  int local_10;
  char local_c;
  byte bStack_b;
  short sStack_a;
  undefined2 uStack_8;
  int local_4;

  bVar4 = false;
  bVar5 = false;
  bVar6 = false;
  bVar8 = false;
  bVar7 = false;
  local_1c = CONCAT31(local_1c._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) &
             0xfffffffe;
  local_1c = CONCAT22(local_1c._2_2_,
                      CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                               (undefined1)local_1c)) & 0xfffffeff;
  local_c = (char)local_1c;
  bStack_b = (byte)(local_1c >> 8);
  cVar10 = local_c + -0x18;
  cStack_15 = bStack_b - 0x18;
  switch(*(undefined1 *)(param_1 + 0x2d)) {
  case 0:
    bVar8 = true;
    bVar5 = true;
    bVar6 = true;
    if ((*(byte *)(param_1 + 0x10) & 0x10) == 0) {
      FUN_0048a050(param_1,0xaf,2);
    }
    FUN_004ee4f0(param_1);
    *(char *)(param_1 + 0x72) = *(char *)(param_1 + 0x2f);
    *(undefined2 *)(param_1 + 0x6c) = 0;
    *(undefined2 *)(param_1 + 0x1c) = 0xfbb4;
    if (*(char *)(param_1 + 0x2f) == -1) {
      *(undefined1 *)(param_1 + 0x72) = 0;
    }
    iVar21 = 0x19;
    do {
      iVar18 = 1;
      do {
        if ((*(char *)(iVar21 + 0x96a4bf + iVar18) != '\0') &&
           (iVar1 = iVar21 + iVar18, *(char *)(iVar21 + 0x96a4bf + iVar18) != -1)) {
          if ((&game_state.start_18[0x1e].field_0x16)[iVar1] == '\0') {
            (&game_state.start_18[0x1e].field_0x16)[iVar1] = 0xff;
          }
          if ((&game_state.start_18[0x1e].field_0x17)[iVar1] == '\0') {
            (&game_state.start_18[0x1e].field_0x17)[iVar1] = 0xff;
          }
          if (*(char *)((int)&game_state.start_18[0x1f].field0_0x0 + iVar1) == '\0') {
            *(undefined1 *)((int)&game_state.start_18[0x1f].field0_0x0 + iVar1) = 0xff;
          }
          if ((&game_state.start_18[0x1f].field_0x17)[iVar1] == '\0') {
            (&game_state.start_18[0x1f].field_0x17)[iVar1] = 0xff;
          }
          if (*(char *)((int)(game_state.start_18 + 0x20) + iVar1 + 1) == '\0') {
            *(undefined1 *)((int)(game_state.start_18 + 0x20) + iVar1 + 1) = 0xff;
          }
          if (*(char *)((int)(game_state.start_18 + 0x21) + iVar1) == '\0') {
            *(undefined1 *)((int)(game_state.start_18 + 0x21) + iVar1) = 0xff;
          }
          if (*(char *)((int)(game_state.start_18 + 0x21) + iVar1 + 1) == '\0') {
            *(undefined1 *)((int)(game_state.start_18 + 0x21) + iVar1 + 1) = 0xff;
          }
          if (*(char *)((int)(game_state.start_18 + 0x21) + iVar1 + 2) == '\0') {
            *(undefined1 *)((int)(game_state.start_18 + 0x21) + iVar1 + 2) = 0xff;
          }
        }
        iVar18 = iVar18 + 1;
      } while (iVar18 < 0x18);
      iVar21 = iVar21 + 0x19;
    } while (iVar21 < 600);
    *(undefined1 *)(param_1 + 0x2d) = 1;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    break;
  case 1:
    bVar4 = true;
    pgVar22 = game_state.start_20;
    bVar7 = true;
    bVar5 = true;
    local_4 = 0x32;
    do {
      if (*(char *)pgVar22 != '\0') {
        iVar18 = 0;
        local_10 = 0;
        local_1c = CONCAT13(pgVar22->field_0x4 + cStack_15,
                            CONCAT12(pgVar22->field_0x2 + cVar10,(undefined2)local_1c)) & 0xfefeffff
        ;
        local_c = '\0';
        bStack_b = local_1c._2_1_;
        sStack_a = (ushort)local_1c._3_1_ << 8;
        uStack_8 = calc_point_height((uint)CONCAT21(sStack_a,local_1c._2_1_) << 8,
                                     (uint)CONCAT21(uStack_8,local_1c._3_1_) << 8);
        iVar21 = (uint)(byte)pgVar22->field_0x5 * 0x10;
        if (*(char *)pgVar22 == '\x02') {
          ptr_unit_related_20B->field0_0x0 = iVar21 >> 9;
          ptr_unit_related_20B->field1_0x4 = 0;
          ptr_unit_related_20B->unit_ptr = (unit_struct *)0x6;
          ptr_unit_related_20B->field3_0xc = 0xffffffff;
          puVar9 = ptr_unit_related_20B;
          ptr_unit_related_20B->field4_0x10 = 0;
          ptr_unit_related_20B = ptr_unit_related_20B + 1;
          unit_allocation_flag = 1;
          iVar18 = alloc_unit(2,CONCAT31((int3)((uint)puVar9 >> 8),pgVar22->field_0x1),
                              *(undefined1 *)(param_1 + 0x72),&local_c);
          if (iVar18 != 0) {
            *(undefined2 *)(iVar18 + 0xa4) = *(undefined2 *)(param_1 + 0x24);
            FUN_0040baf0(iVar18,1);
            uStack_14 = 0;
            uStack_13 = 0;
            uStack_12 = 0;
            if (((*(ushort *)(iVar18 + 0x94) != 0) &&
                (puVar20 = unit_land_array[*(ushort *)(iVar18 + 0x94)],
                (*(byte *)&puVar20->flags_2 & 1) == 0)) && (puVar20->unit_class != '\0')) {
              uStack_14 = SUB41(puVar20,0);
              uStack_13 = (undefined1)((uint)puVar20 >> 8);
              uStack_12 = (undefined2)((uint)puVar20 >> 0x10);
            }
            local_10 = CONCAT22(uStack_12,CONCAT11(uStack_13,uStack_14));
            if (local_10 != 0) {
              if ((*(byte *)(local_10 + 0xe) & 0x10) == 0) {
                empty_unit_function(local_10);
                iVar21 = CONCAT22(uStack_12,CONCAT11(uStack_13,uStack_14));
                *(undefined1 *)(iVar21 + 0x2c) = 10;
                init_unit_class(iVar21);
              }
              *(undefined2 *)(CONCAT22(uStack_12,CONCAT11(uStack_13,uStack_14)) + 0xa4) =
                   *(undefined2 *)(param_1 + 0x24);
            }
            FUN_00406e90(iVar18);
            FUN_00498140(iVar18);
            puVar20 = (unit_struct *)0x0;
            if (((*(ushort *)(iVar18 + 0x82) != 0) &&
                (puVar3 = unit_land_array[*(ushort *)(iVar18 + 0x82)],
                (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
              puVar20 = puVar3;
            }
            if (puVar20 != (unit_struct *)0x0) {
              FUN_004ba2c0(puVar20,-(uint)*(ushort *)
                                           &unit_type_array_building[*(byte *)(iVar18 + 0x2b)].
                                            field_0x1c);
            }
            goto LAB_004792bf;
          }
LAB_004792c3:
          if (local_10 == 0) goto LAB_0047932c;
        }
        else {
          if ((*(char *)pgVar22 == '\x05') &&
             ((unit_type_array_scenery[(byte)pgVar22->field_0x1].field14_0x16 & 0x40) == 0)) {
            iVar18 = alloc_unit(5,pgVar22->field_0x1,0xff,&local_c);
            if (iVar18 == 0) goto LAB_004792c3;
            *(short *)(iVar18 + 0x26) = (short)iVar21;
            if ((*(byte *)(iVar18 + 0xe) & 0x10) == 0) {
              empty_unit_function(iVar18);
              *(undefined1 *)(iVar18 + 0x2c) = 0xd;
              init_unit_class(iVar18);
            }
            *(undefined2 *)(iVar18 + 0x95) = *(undefined2 *)(param_1 + 0x24);
          }
LAB_004792bf:
          if (iVar18 == 0) goto LAB_004792c3;
        }
        pgVar22->field_0x5 = 0xff;
        if (iVar18 != 0) {
          bVar13 = pgVar22->field_0x3;
          *(ushort *)(iVar18 + 0x1c) = (ushort)bVar13;
          *(ushort *)(iVar18 + 0x41) = *(short *)(param_1 + 0x1c) + (ushort)bVar13;
        }
        if (local_10 != 0) {
          bVar13 = *(byte *)((uint)((byte)pgVar22->field_0x4 >> 1) * 0x19 + 0x96a4bf +
                            (uint)((byte)pgVar22->field_0x2 >> 1));
          uVar15 = (ushort)bVar13;
          if (bVar13 == 0xff) {
            uVar15 = 0;
          }
          *(ushort *)(local_10 + 0x1c) = uVar15;
          *(ushort *)(local_10 + 0x41) = *(short *)(param_1 + 0x1c) + uVar15;
        }
      }
LAB_0047932c:
      pgVar22 = pgVar22 + 1;
      local_4 = local_4 + -1;
    } while (local_4 != 0);
    *(undefined1 *)(param_1 + 0x2d) = 3;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    local_4 = 0;
    break;
  case 3:
    bVar4 = true;
    sVar19 = *(short *)(param_1 + 0x1c) + 4;
    bVar7 = true;
    *(short *)(param_1 + 0x1c) = sVar19;
    bVar5 = true;
    if (-1 < sVar19) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      *(undefined2 *)(param_1 + 0x1c) = 0;
      *(undefined1 *)(param_1 + 0x2d) = 4;
    }
    break;
  case 4:
    local_10 = 0x96a730;
    local_4 = 0x32;
    do {
      if (*(char *)(local_10 + 5) == -1) {
        cVar11 = *(char *)(local_10 + 2) + cVar10;
        cVar12 = *(char *)(local_10 + 4) + cStack_15;
        uVar16 = (CONCAT11(cVar12,cVar11) & 0xfe) * 2 | CONCAT11(cVar12,cVar11) & 0xfe00;
        uVar17 = local_1c;
        for (puVar20 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar16 * 2]];
            local_1c = uVar17, puVar20 != (unit_struct *)0x0;
            puVar20 = unit_land_array[puVar20->next_unit_index]) {
          if ((*(byte *)((int)&puVar20->flags_3 + 1) & 0x40) != 0) {
            if (puVar20->unit_class == '\x02') {
              FUN_004f1590(puVar20,&puVar20->field_0xa4);
              FUN_0040baf0(puVar20,0);
              if ((puVar20->flags_2 & 0x100000) == 0) {
                empty_unit_function(puVar20);
                puVar20->state = 1;
LAB_00479478:
                init_unit_class(puVar20);
              }
            }
            else if (puVar20->unit_class == '\x05') {
              FUN_004f1590(puVar20,(undefined1 *)((int)&puVar20->facs0_index + 1));
              uVar2 = unit_type_array_scenery[(byte)puVar20->unit_type].field9_0x11;
              local_1c._3_1_ = (byte)(uVar17 >> 0x18);
              local_1c._0_2_ = (undefined2)uVar17;
              local_1c._0_3_ = CONCAT12(uVar2,(undefined2)local_1c);
              if ((puVar20->flags_2 & 0x100000) == 0) {
                empty_unit_function(puVar20);
                puVar20->state = uVar2;
                goto LAB_00479478;
              }
            }
          }
          uVar17 = local_1c;
        }
        uVar15 = (&game_state.level_data[0].unit_index_2)[uVar16 * 2] & 0x3ff;
        if ((uVar15 != 0) &&
           (puVar20 = unit_land_array[uVar15], (*(byte *)((int)&puVar20->flags_3 + 1) & 0x40) != 0))
        {
          if (puVar20->unit_class == '\x02') {
            FUN_004f1590(puVar20,&puVar20->field_0xa4);
            FUN_0040baf0(puVar20,0);
            if ((puVar20->flags_2 & 0x100000) == 0) {
              empty_unit_function(puVar20);
              puVar20->state = 1;
LAB_00479534:
              init_unit_class(puVar20);
            }
          }
          else if (puVar20->unit_class == '\x05') {
            FUN_004f1590(puVar20,(undefined1 *)((int)&puVar20->facs0_index + 1));
            uVar2 = unit_type_array_scenery[(byte)puVar20->unit_type].field9_0x11;
            if ((puVar20->flags_2 & 0x100000) == 0) {
              empty_unit_function(puVar20);
              puVar20->state = uVar2;
              goto LAB_00479534;
            }
          }
        }
      }
      local_10 = local_10 + 6;
      local_4 = local_4 + -1;
    } while (local_4 != 0);
    local_4 = 0x32;
    pgVar22 = game_state.start_20;
    do {
      if ((*(char *)pgVar22 != '\0') && (pgVar22->field_0x5 != -1)) {
        bVar13 = pgVar22->field_0x2 + cVar10;
        bVar14 = pgVar22->field_0x4 + cStack_15;
        bStack_b = bVar13 & 0xfe;
        local_c = '\0';
        sStack_a = (ushort)(bVar14 & 0xfe) << 8;
        uStack_8 = calc_point_height((CONCAT21(sStack_a,bVar13) & 0xfffffe) << 8,
                                     (uint)(CONCAT21(uStack_8,bVar14) & 0xfffffe) << 8);
        bVar13 = pgVar22->field_0x5;
        iVar21 = alloc_unit(CONCAT31((int3)((uint)&local_c >> 8),*(char *)pgVar22),
                            pgVar22->field_0x1,*(undefined1 *)(param_1 + 0x72),&local_c);
        if (iVar21 != 0) {
          *(short *)(iVar21 + 0x26) = (short)((int)((uint)bVar13 * 0x10) >> 9);
        }
      }
      pgVar22 = pgVar22 + 1;
      local_4 = local_4 + -1;
    } while (local_4 != 0);
    *(undefined1 *)(param_1 + 0x2d) = 5;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    local_4 = 0;
    break;
  case 5:
    bVar8 = true;
    update_after_unit_alloc(param_1);
  }
  if (((bVar5) || (bVar6)) || (bVar4)) {
    local_10 = 0x19;
    uStack_14 = 0xbf;
    uStack_13 = 0xa4;
    uStack_12 = 0x96;
    do {
      local_16 = cVar10;
      for (local_4 = 0x19; local_4 != 0; local_4 = local_4 + -1) {
        uVar17 = (CONCAT11(cStack_15,local_16) & 0xfe) * 2 | CONCAT11(cStack_15,local_16) & 0xfe00;
        if ((bVar5) &&
           (bVar13 = *(byte *)CONCAT22(uStack_12,CONCAT11(uStack_13,uStack_14)), bVar13 != 0)) {
          iVar21 = (int)*(short *)(param_1 + 0x1c);
          if (bVar13 != 0xff) {
            iVar21 = iVar21 + (uint)bVar13;
          }
          if (iVar21 < 0) {
            iVar21 = 0;
          }
          if ((bVar7) && ((short)(&game_state.level_data[0].height)[uVar17 * 2] != iVar21)) {
            land_level_processing_1
                      (CONCAT13(uStack_13,CONCAT12(uStack_14,CONCAT11(cStack_15,local_16))),2,1);
          }
          (&game_state.level_data[0].height)[uVar17 * 2] = (short)iVar21;
          if ((0 < (short)iVar21) && (*(short *)(param_1 + 0x70) == 0)) {
            *(undefined2 *)(param_1 + 0x70) = 1;
            FUN_0048a050(param_1,0xb0,0);
          }
        }
        if ((bVar6) || (bVar4)) {
          for (puVar20 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar17 * 2]];
              puVar20 != (unit_struct *)0x0; puVar20 = unit_land_array[puVar20->next_unit_index]) {
            if ((puVar20->flags_4 & 0x40000000) == 0) {
              cVar11 = puVar20->unit_class;
              if (cVar11 == '\x02') {
                if (!bVar4) {
                  if ((*(byte *)((int)&puVar20->flags_2 + 2) & 0x10) == 0) {
                    empty_unit_function(puVar20);
                    puVar20->state = 3;
                    init_unit_class(puVar20);
                  }
                  puVar20->state_2 = 1;
                  puVar20->flags_2 = puVar20->flags_2 | 0x40000000;
                }
              }
              else if (cVar11 == '\x05') {
                if ((*(byte *)((int)&puVar20->flags_3 + 1) & 0x40) == 0) goto LAB_0047976a;
              }
              else if ((cVar11 == '\t') && (!bVar4)) {
LAB_0047976a:
                FUN_004ef180(puVar20);
              }
            }
          }
        }
        iVar21 = CONCAT22(uStack_12,CONCAT11(uStack_13,uStack_14)) + 1;
        uStack_14 = (undefined1)iVar21;
        uStack_13 = (undefined1)((uint)iVar21 >> 8);
        uStack_12 = (undefined2)((uint)iVar21 >> 0x10);
        local_16 = local_16 + '\x02';
      }
      local_10 = local_10 + -1;
      cStack_15 = cStack_15 + '\x02';
    } while (local_10 != 0);
  }
  if (bVar8) {
    land_level_processing_1(local_1c,0xe,1);
  }
  sVar19 = *(short *)(param_1 + 0x6c) + 1;
  *(short *)(param_1 + 0x6c) = sVar19;
  if (sVar19 < 0x23) {
    iVar18 = (int)sVar19;
    iVar21 = 0x22;
  }
  else {
    iVar21 = 0x20;
    if (sVar19 < 0xcf) goto LAB_00479808;
    iVar18 = 0x113 - sVar19;
    iVar21 = 0x45;
  }
  iVar21 = (iVar18 << 5) / iVar21;
LAB_00479808:
  load_level_flags = load_level_flags | 0x40;
  if ((int)(uint)DAT_0089ce82 < iVar21) {
    DAT_0089ce82 = (byte)iVar21;
  }
  return;
}
