/* Ghidra 12.1.3 pseudocode; entry 0051c4c0; FUN_0051c4c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0051c4c0(int param_1,char *param_2,undefined1 *param_3)

{
  byte bVar1;
  char cVar2;
  ushort uVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  bool bVar7;
  undefined4 *puVar8;
  undefined4 *puVar9;
  undefined4 *puVar10;
  undefined4 *puVar11;
  undefined4 *puVar12;
  undefined4 *puVar13;
  undefined4 *puVar14;
  byte bVar15;
  uint uVar16;
  undefined4 *puVar17;
  int iVar18;
  undefined4 *puVar19;
  undefined4 uVar20;
  undefined4 *puVar21;
  undefined4 *puVar22;
  unit_struct *puVar23;
  undefined2 uVar24;
  byte bVar25;
  int iVar26;
  undefined4 *puVar27;
  undefined1 *puVar28;
  unit_struct *puVar29;
  uint uVar30;
  undefined4 *puVar31;
  undefined4 *puVar32;
  undefined4 **ppuVar33;
  undefined4 *puVar34;
  undefined2 local_356;
  char local_354;
  char cStack_353;
  undefined2 local_352;
  int local_350;
  undefined4 *local_34c;
  undefined4 *local_348;
  undefined4 *local_344;
  undefined4 *local_338;
  undefined4 *local_32c [4];
  undefined4 *local_31c;
  undefined4 *local_318;
  undefined4 local_300;
  int local_2fc [2];
  undefined1 local_2f4 [756];

  local_338 = (undefined4 *)0x0;
  local_356 = 0;
  local_34c = (undefined4 *)0x0;
  local_348 = (undefined4 *)0x0;
  local_350 = 0;
  bVar1 = *(byte *)(param_1 + 0x2f);
  bVar4 = false;
  bVar6 = false;
  bVar7 = false;
  if ((*param_2 == '\x13') || ((param_2[1] & 2U) != 0)) {
    bVar6 = true;
  }
  if ((*param_2 == '\x13') || ((param_2[1] & 0x10U) != 0)) {
    bVar7 = true;
  }
  *param_3 = 0;
  ppuVar33 = local_32c;
  for (iVar26 = 0xcb; iVar26 != 0; iVar26 = iVar26 + -1) {
    *ppuVar33 = (undefined4 *)0x0;
    ppuVar33 = ppuVar33 + 1;
  }
  cStack_353 = (char)((ushort)*(undefined2 *)(param_2 + 6) >> 8);
  cStack_353 = cStack_353 - param_2[9];
  local_354 = (char)*(undefined2 *)(param_2 + 6);
  uVar16 = (uint)(byte)param_2[8];
  local_354 = local_354 - param_2[8];
  puVar34 = (undefined4 *)(uVar16 + 1);
  iVar26 = (byte)param_2[9] + 1;
  local_344 = local_32c[0];
  while ((iVar26 != 0 && (!bVar4))) {
    bVar4 = false;
    puVar21 = puVar34;
    puVar17 = puVar34;
    uVar3 = CONCAT11(cStack_353,local_354);
    while ((local_352._1_1_ = (char)(uVar3 >> 8), puVar21 != (undefined4 *)0x0 && (!bVar4))) {
      uVar16 = (uVar3 & 0xfe) * 2 | uVar3 & 0xfe00;
      puVar17 = (undefined4 *)(int)(short)(&game_state.level_data[0].unit_index)[uVar16 * 2];
      puVar23 = unit_land_array[(int)puVar17];
      local_32c[0] = local_344;
      while ((puVar23 != (unit_struct *)0x0 && (!bVar4))) {
        if ((puVar23->unit_class == '\n') && (puVar23->unit_type == '\b')) {
LAB_0051c734:
          local_2fc[(int)local_32c[0] * 3] = (int)puVar23;
          local_32c[0] = (undefined4 *)((int)local_32c[0] + 1);
          bVar4 = 0x3f < (int)local_32c[0];
        }
        else if ((puVar23->unit_class == '\x01') &&
                ((*(byte *)((int)&puVar23->flags_2 + 2) & 0x80) == 0)) {
          bVar5 = false;
          if ((*(short *)&puVar23->field_0x9d != 0) &&
             (unit_land_array[*(short *)&puVar23->field_0x9d]->unit_type != '\t')) {
            bVar5 = true;
          }
          if ((((!bVar5) && (puVar23->unit_land_array_index == 0)) && (puVar23->state != 0x17)) &&
             ((unit_type_related_1_ARRAY_005a6f78[(byte)puVar23->state].field_0x2 & 4) == 0)) {
            bVar5 = true;
            if ((*(short *)&puVar23->field_0x6e < 1) ||
               ((*(byte *)((int)&puVar23->flags_2 + 2) & 1) != 0)) {
LAB_0051c71a:
              bVar5 = false;
            }
            else {
              bVar25 = *(byte *)(param_1 + 0x2f);
              if ((bVar25 == 0xff) ||
                 ((bVar15 = puVar23->tribe_index, bVar15 == 0xff || (bVar25 == bVar15)))) {
                bVar15 = 1;
              }
              else {
                bVar15 = *(byte *)((int)game_state.start_n1 + (char)bVar25 + 0x9c) &
                         '\x01' << (bVar15 & 0x1f);
              }
              if ((((bVar15 != 0) || (bVar25 == puVar23->tribe_index)) ||
                  (puVar23->tribe_index == 0xff)) ||
                 (((iVar18 = FUN_004de7b0(puVar23,(int)(char)bVar25), iVar18 != 0 ||
                   (iVar18 = FUN_004de7b0(param_1,(int)(char)puVar23->tribe_index), iVar18 != 0)) ||
                  ((*(byte *)((int)&puVar23->flags_4 + 1) & 0x10) != 0)))) goto LAB_0051c71a;
              cVar2 = *(char *)(param_1 + 0x2b);
              if (cVar2 == '\x04') {
                if ((((game_state.level_flags & 2) != 0) || (puVar23->unit_type == '\x04')) ||
                   (puVar23->unit_type == '\a')) goto LAB_0051c71f;
                goto LAB_0051c71a;
              }
              if (cVar2 == '\x06') {
                if (((game_state.level_flags & 2) != 0) && (puVar23->unit_type == '\a'))
                goto LAB_0051c71a;
              }
              else if ((cVar2 != '\b') && (puVar23->unit_type == '\b')) goto LAB_0051c71a;
            }
LAB_0051c71f:
            if ((bVar5) && ((*(byte *)((int)&puVar23->flags_4 + 1) & 4) == 0)) goto LAB_0051c734;
          }
        }
        puVar17 = (undefined4 *)(uint)puVar23->next_unit_index;
        puVar23 = unit_land_array[(int)puVar17];
      }
      if ((bVar6) && (!bVar4)) {
        if ((bVar1 == 0xff) ||
           ((bVar25 = ((&game_state.level_data[0].c_2)[uVar16 * 4] & 0xf) - 1, bVar25 == 0xff ||
            (bVar25 == bVar1)))) {
          puVar17 = (undefined4 *)CONCAT31((int3)((uint)puVar17 >> 8),1);
        }
        else {
          puVar17 = (undefined4 *)
                    (uint)(*(byte *)((int)game_state.start_n1 + (char)bVar1 + 0x9c) &
                          '\x01' << (bVar25 & 0x1f));
        }
        if ((char)puVar17 == '\0') {
          puVar17 = (undefined4 *)(&game_state.level_data[0].flags)[uVar16];
          if ((((uint)puVar17 & 0x200) != 0) || (((uint)puVar17 & 0x400) != 0)) {
            puVar19 = (undefined4 *)
                      ((ushort)(&game_state.level_data[0].unit_index_2)[uVar16 * 2] & 0x3ff);
            puVar23 = unit_land_array[(int)puVar19];
            if ((((uint)puVar17 & 0x200) != 0) ||
               (puVar19 = (undefined4 *)FUN_004baab0(puVar23,param_1), puVar17 = puVar19,
               (char)puVar19 != '\0')) {
              puVar27 = &local_300;
              puVar17 = (undefined4 *)((uint)puVar19 & 0xffffff00);
              for (puVar19 = local_32c[0]; puVar19 != (undefined4 *)0x0;
                  puVar19 = (undefined4 *)((int)puVar19 + -1)) {
                if ((char)puVar17 != '\0') goto LAB_0051c860;
                puVar17 = (undefined4 *)
                          CONCAT31((int3)((uint)(puVar27[1] - (int)puVar23) >> 8),
                                   puVar27[1] - (int)puVar23 == 0);
                puVar27 = puVar27 + 3;
              }
              if (((char)puVar17 == '\0') &&
                 (((puVar23->unit_class != '\x02' || (puVar23->unit_type != '\n')) ||
                  (puVar17 = (undefined4 *)(int)*(char *)(param_1 + 0x2f),
                  game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f != '\x01')))) {
                local_2fc[(int)local_32c[0] * 3] = (int)puVar23;
                bVar4 = 0x3f < (int)local_32c[0] + 1;
                puVar17 = local_32c[0];
                local_32c[0] = (undefined4 *)((int)local_32c[0] + 1);
              }
            }
          }
        }
      }
LAB_0051c860:
      local_352._0_1_ = (char)uVar3;
      local_352 = CONCAT11(local_352._1_1_,(char)local_352 + '\x02');
      puVar21 = (undefined4 *)((int)puVar21 + -1);
      uVar3 = local_352;
      local_344 = local_32c[0];
    }
    uVar16 = CONCAT31((int3)((uint)puVar17 >> 8),local_354);
    iVar26 = iVar26 + -1;
    cStack_353 = local_352._1_1_ + '\x02';
  }
  uVar24 = (undefined2)(uVar16 >> 0x10);
  if (local_344 == (undefined4 *)0x0) goto LAB_0051ce02;
  puVar34 = &local_300;
  local_32c[0] = local_344;
  do {
    uVar20 = calc_distance_toroidal(param_1 + 0x3d,puVar34[1] + 0x3d);
    local_344 = (undefined4 *)((int)local_344 + -1);
    puVar34[2] = uVar20;
    puVar34 = puVar34 + 3;
  } while (local_344 != (undefined4 *)0x0);
  do {
    iVar26 = 1;
    puVar28 = local_2f4;
    bVar4 = true;
    bVar6 = true;
    if (1 < (int)local_32c[0]) {
      do {
        bVar4 = bVar6;
        uVar16 = *(uint *)(puVar28 + 8);
        if (uVar16 < *(uint *)(puVar28 + -4)) {
          bVar4 = false;
          *(uint *)(puVar28 + 8) = *(uint *)(puVar28 + -4);
          *(uint *)(puVar28 + -4) = uVar16;
          uVar20 = *(undefined4 *)(puVar28 + 4);
          *(undefined4 *)(puVar28 + 4) = *(undefined4 *)(puVar28 + -8);
          *(undefined4 *)(puVar28 + -8) = uVar20;
        }
        iVar26 = iVar26 + 1;
        puVar28 = puVar28 + 0xc;
        bVar6 = bVar4;
      } while (iVar26 < (int)local_32c[0]);
    }
  } while (!bVar4);
  puVar34 = &local_300;
  for (puVar21 = local_32c[0]; puVar21 != (undefined4 *)0x0;
      puVar21 = (undefined4 *)((int)puVar21 + -1)) {
    puVar34[2] = (uint)(puVar34[2] - local_2fc[1]) >> 9;
    puVar34 = puVar34 + 3;
  }
  puVar34 = &local_300;
  puVar17 = (undefined4 *)0x0;
  puVar19 = (undefined4 *)0x0;
  puVar27 = local_338;
  puVar22 = local_32c[0];
  for (puVar21 = local_32c[0]; puVar21 != (undefined4 *)0x0;
      puVar21 = (undefined4 *)((int)puVar21 + -1)) {
    *puVar34 = 0;
    bVar1 = *(byte *)(puVar34[1] + 0x2a);
    puVar22 = (undefined4 *)(bVar1 - 1);
    puVar31 = puVar17;
    puVar32 = puVar19;
    puVar8 = local_34c;
    puVar9 = local_348;
    local_338 = puVar27;
    puVar10 = local_32c[1];
    puVar11 = local_32c[2];
    puVar12 = local_32c[3];
    puVar13 = local_31c;
    puVar14 = local_318;
    switch(bVar1) {
    case 1:
      puVar32 = puVar34;
      puVar12 = puVar34;
      if (puVar19 != (undefined4 *)0x0) {
        *puVar19 = puVar34;
        puVar12 = local_32c[3];
      }
      break;
    case 2:
      puVar8 = puVar34;
      puVar13 = puVar34;
      if (local_34c != (undefined4 *)0x0) {
        *local_34c = puVar34;
        puVar13 = local_31c;
      }
      break;
    case 9:
      puVar9 = puVar34;
      puVar14 = puVar34;
      if (local_348 != (undefined4 *)0x0) {
        *local_348 = puVar34;
        puVar14 = local_318;
      }
      break;
    case 10:
      puVar22 = (undefined4 *)FUN_0051dcc0(puVar34[1],param_1);
      puVar10 = local_32c[1];
      puVar11 = local_32c[2];
      puVar12 = local_32c[3];
      puVar13 = local_31c;
      puVar14 = local_318;
      if ((char)puVar22 == '\0') {
        local_338 = puVar34;
        puVar11 = puVar34;
        if (puVar27 != (undefined4 *)0x0) {
          *puVar27 = puVar34;
          puVar22 = puVar27;
          puVar11 = local_32c[2];
        }
      }
      else {
        puVar31 = puVar34;
        puVar10 = puVar34;
        if (puVar17 != (undefined4 *)0x0) {
          *puVar17 = puVar34;
          puVar10 = local_32c[1];
        }
      }
    }
    local_318 = puVar14;
    local_31c = puVar13;
    local_32c[3] = puVar12;
    local_32c[2] = puVar11;
    local_32c[1] = puVar10;
    local_348 = puVar9;
    local_34c = puVar8;
    puVar34 = puVar34 + 3;
    puVar17 = puVar31;
    puVar19 = puVar32;
    puVar27 = local_338;
  }
  uVar24 = (undefined2)((uint)puVar22 >> 0x10);
  if (((local_32c[1] != (undefined4 *)0x0) || (local_32c[3] != (undefined4 *)0x0)) ||
     ((local_31c != (undefined4 *)0x0 || (local_318 != (undefined4 *)0x0)))) {
    iVar18 = 0;
    iVar26 = 0;
    do {
      if (iVar26 != 0) goto LAB_0051cd11;
      uVar16 = 0;
      puVar17 = local_32c[1];
      puVar19 = local_32c[3];
      local_34c = local_31c;
      local_348 = local_318;
      do {
        if (((puVar17 == (undefined4 *)0x0) && (puVar19 == (undefined4 *)0x0)) &&
           ((local_34c == (undefined4 *)0x0 && (local_348 == (undefined4 *)0x0)))) break;
        if (iVar26 == 0) {
          do {
            if ((puVar17 == (undefined4 *)0x0) || (uVar16 < (uint)puVar17[2])) break;
            if (iVar18 == 0) {
              if ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
                uVar30 = *(uint *)(puVar17[1] + 0x10) & 0x100000;
              }
              else {
                uVar30 = *(uint *)(puVar17[1] + 0x10) & 0x200000;
              }
              if (uVar30 == 0) goto LAB_0051cbc8;
              puVar17 = (undefined4 *)*puVar17;
            }
            else {
LAB_0051cbc8:
              iVar26 = 1;
            }
          } while (iVar26 == 0);
          if (iVar26 != 0) goto joined_r0x0051cc93;
          do {
            if ((puVar19 == (undefined4 *)0x0) || (uVar16 < (uint)puVar19[2])) break;
            if (iVar18 == 0) {
              if ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
                uVar30 = *(uint *)(puVar19[1] + 0x10) & 0x100000;
              }
              else {
                uVar30 = *(uint *)(puVar19[1] + 0x10) & 0x200000;
              }
              if (uVar30 == 0) goto LAB_0051cc1f;
              puVar19 = (undefined4 *)*puVar19;
            }
            else {
LAB_0051cc1f:
              iVar26 = 2;
            }
          } while (iVar26 == 0);
        }
        if (iVar26 == 0) {
          do {
            if ((local_34c == (undefined4 *)0x0) || (uVar16 < (uint)local_34c[2])) break;
            if (iVar18 == 0) {
              if ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
                uVar30 = *(uint *)(local_34c[1] + 0x10) & 0x100000;
              }
              else {
                uVar30 = *(uint *)(local_34c[1] + 0x10) & 0x200000;
              }
              if (uVar30 == 0) goto LAB_0051cc88;
              local_34c = (undefined4 *)*local_34c;
            }
            else {
LAB_0051cc88:
              iVar26 = 3;
            }
          } while (iVar26 == 0);
joined_r0x0051cc93:
          do {
            if (((iVar26 != 0) || (local_348 == (undefined4 *)0x0)) || (uVar16 < (uint)local_348[2])
               ) break;
            if (iVar18 == 0) {
              if ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
                uVar30 = *(uint *)(local_348[1] + 0x10) & 0x100000;
              }
              else {
                uVar30 = *(uint *)(local_348[1] + 0x10) & 0x200000;
              }
              if (uVar30 == 0) goto LAB_0051cced;
              local_348 = (undefined4 *)*local_348;
            }
            else {
LAB_0051cced:
              iVar26 = 4;
            }
          } while( true );
        }
        uVar16 = uVar16 + 1;
      } while (iVar26 == 0);
      iVar18 = iVar18 + 1;
    } while (iVar18 < 2);
    uVar24 = 0;
    if (iVar26 != 0) {
LAB_0051cd11:
      switch(iVar26) {
      case 1:
        local_350 = puVar17[1];
        *param_3 = 1;
        break;
      case 2:
        local_350 = puVar19[1];
        *param_3 = 2;
        break;
      case 3:
        local_350 = local_34c[1];
        *param_3 = 3;
        break;
      case 4:
        local_350 = local_348[1];
        *param_3 = 4;
      }
      if (iVar26 == 1) {
        puVar29 = (unit_struct *)0x0;
        puVar23 = (unit_struct *)0x0;
        if (((*(ushort *)(local_350 + 0x6c) != 0) &&
            (puVar23 = unit_land_array[*(ushort *)(local_350 + 0x6c)],
            (*(byte *)&puVar23->flags_2 & 1) == 0)) && (puVar23->unit_class != '\0')) {
          puVar29 = puVar23;
        }
        if (puVar29 != (unit_struct *)0x0) {
          puVar23 = (unit_struct *)
                    ((uint)(ushort)unit_type_array_person[(byte)puVar29->unit_type].fight_damage /
                     (uint)unit_type_array_person[2].fight_damage + 4);
          if ((unit_struct *)(uint)*(byte *)(local_350 + 0x31) < puVar23) {
            *(undefined1 *)(local_350 + 0x32) = 0x20;
            *(char *)(local_350 + 0x31) = *(char *)(local_350 + 0x31) + '\x01';
          }
          else {
            *(uint *)(local_350 + 0x10) = *(uint *)(local_350 + 0x10) | 0x100000;
          }
        }
      }
      else {
        puVar23 = (unit_struct *)FUN_0051fe40(local_350,param_1);
      }
      local_356 = *(undefined2 *)(local_350 + 0x24);
      uVar24 = (undefined2)((uint)puVar23 >> 0x10);
    }
    goto LAB_0051ce02;
  }
  if (local_32c[2] == (undefined4 *)0x0) goto LAB_0051ce02;
  bVar4 = false;
  puVar21 = (undefined4 *)0x0;
  uVar24 = 0;
  puVar34 = local_32c[2];
  do {
    if (puVar34 == (undefined4 *)0x0) break;
    if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
      uVar16 = *(uint *)(puVar34[1] + 0x10) & 0x100000;
    }
    else {
      uVar16 = *(uint *)(puVar34[1] + 0x10) & 0x200000;
    }
    if (uVar16 == 0) {
      bVar4 = true;
    }
    else {
      puVar34 = (undefined4 *)*puVar34;
    }
  } while (!bVar4);
  if (bVar4) {
    local_350 = puVar34[1];
LAB_0051caa2:
    uVar24 = (undefined2)((uint)puVar21 >> 0x10);
  }
  else if (bVar7) {
    local_350 = local_32c[2][1];
    puVar21 = local_32c[2];
    goto LAB_0051caa2;
  }
  if (local_350 != 0) {
    puVar29 = (unit_struct *)0x0;
    uVar3 = *(ushort *)(local_350 + 0x6c);
    puVar23 = (unit_struct *)CONCAT22(uVar24,uVar3);
    if (((uVar3 != 0) && (puVar23 = unit_land_array[uVar3], (*(byte *)&puVar23->flags_2 & 1) == 0))
       && (puVar23->unit_class != '\0')) {
      puVar29 = puVar23;
    }
    if (puVar29 != (unit_struct *)0x0) {
      puVar23 = (unit_struct *)
                ((uint)(ushort)unit_type_array_person[(byte)puVar29->unit_type].fight_damage /
                 (uint)unit_type_array_person[2].fight_damage + 4);
      if ((unit_struct *)(uint)*(byte *)(local_350 + 0x31) < puVar23) {
        *(undefined1 *)(local_350 + 0x32) = 0x20;
        *(char *)(local_350 + 0x31) = *(char *)(local_350 + 0x31) + '\x01';
      }
      else {
        *(uint *)(local_350 + 0x10) = *(uint *)(local_350 + 0x10) | 0x100000;
      }
    }
    local_356 = *(undefined2 *)(local_350 + 0x24);
    uVar24 = (undefined2)((uint)puVar23 >> 0x10);
    *param_3 = 1;
  }
LAB_0051ce02:
  return CONCAT22(uVar24,local_356);
}
