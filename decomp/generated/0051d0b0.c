/* Ghidra 12.1.3 pseudocode; entry 0051d0b0; FUN_0051d0b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0051d80b) */

undefined4 FUN_0051d0b0(int param_1,char *param_2,undefined1 *param_3,byte param_4)

{
  byte bVar1;
  byte bVar2;
  unit_struct *puVar3;
  bool bVar4;
  ushort uVar5;
  bool bVar6;
  bool bVar7;
  bool bVar8;
  bool bVar9;
  bool bVar10;
  undefined4 *puVar11;
  undefined4 *puVar12;
  undefined4 *puVar13;
  undefined4 *puVar14;
  undefined4 *puVar15;
  undefined4 *puVar16;
  undefined4 *puVar17;
  undefined4 *puVar18;
  undefined4 *puVar19;
  undefined4 *puVar20;
  undefined4 *puVar21;
  undefined4 *puVar22;
  undefined4 *puVar23;
  undefined4 *puVar24;
  undefined4 *puVar25;
  undefined4 *puVar26;
  bool bVar27;
  char cVar28;
  undefined4 uVar29;
  uint uVar30;
  uint uVar31;
  int iVar32;
  uint uVar33;
  uint uVar34;
  undefined4 *puVar35;
  undefined2 extraout_var;
  undefined2 uVar36;
  byte bVar37;
  int iVar38;
  byte bVar39;
  undefined1 *puVar40;
  uint *puVar41;
  undefined2 local_372;
  char local_370;
  char cStack_36f;
  undefined2 local_36e;
  int local_36c;
  uint local_368;
  undefined4 *local_364;
  undefined4 *local_360;
  undefined4 *local_35c;
  undefined4 *local_358;
  undefined4 *local_354;
  undefined4 *local_350;
  undefined4 *local_34c;
  undefined4 *local_348;
  uint local_32c [3];
  undefined4 *local_320;
  undefined4 *local_31c;
  undefined4 *local_318;
  undefined4 *local_314;
  undefined4 *local_310;
  undefined4 *local_30c;
  undefined4 *local_308;
  undefined4 *local_304;
  undefined4 local_300;
  int local_2fc [2];
  undefined1 local_2f4 [756];

  bVar4 = false;
  local_350 = (undefined4 *)0x0;
  local_34c = (undefined4 *)0x0;
  local_348 = (undefined4 *)0x0;
  local_354 = (undefined4 *)0x0;
  local_358 = (undefined4 *)0x0;
  local_35c = (undefined4 *)0x0;
  local_360 = (undefined4 *)0x0;
  local_372 = 0;
  local_364 = (undefined4 *)0x0;
  local_368 = 0;
  local_36c = 0;
  bVar8 = false;
  bVar9 = false;
  bVar27 = false;
  bVar7 = false;
  bVar1 = *(byte *)(param_1 + 0x2f);
  bVar10 = false;
  *param_3 = 0;
  puVar41 = local_32c;
  for (iVar38 = 0xcb; iVar38 != 0; iVar38 = iVar38 + -1) {
    *puVar41 = 0;
    puVar41 = puVar41 + 1;
  }
  if (*(char *)(param_1 + 0x2b) == '\x06') {
    bVar27 = true;
    if ((*param_2 == '\x13') || ((param_2[1] & 2U) != 0)) {
      bVar8 = true;
    }
    if ((param_4 & 1) != 0) {
      bVar10 = true;
    }
  }
  else if (*(char *)(param_1 + 0x2b) == '\b') {
    bVar7 = true;
    bVar9 = true;
  }
  bVar2 = param_2[8];
  uVar29 = CONCAT31((int3)((uint)param_2 >> 8),bVar2);
  uVar36 = (undefined2)((uint)param_2 >> 0x10);
  local_370 = (char)*(undefined2 *)(param_2 + 6);
  cStack_36f = (char)((ushort)*(undefined2 *)(param_2 + 6) >> 8);
  cStack_36f = cStack_36f - param_2[9];
  iVar38 = (byte)param_2[9] + 1;
  uVar33 = local_32c[0];
  while ((iVar38 != 0 && (uVar36 = (undefined2)((uint)uVar29 >> 0x10), !bVar4))) {
    bVar4 = false;
    uVar34 = bVar2 + 1;
    uVar31 = bVar2 + 1;
    uVar5 = CONCAT11(cStack_36f,local_370 - bVar2);
    while ((local_36e._1_1_ = (char)(uVar5 >> 8), uVar34 != 0 && (!bVar4))) {
      uVar30 = (uVar5 & 0xfe) * 2 | uVar5 & 0xfe00;
      uVar31 = (uint)(short)(&game_state.level_data[0].unit_index)[uVar30 * 2];
      puVar3 = unit_land_array[uVar31];
      local_32c[0] = uVar33;
      while ((puVar3 != (unit_struct *)0x0 && (!bVar4))) {
        if (puVar3->unit_class == '\x01') {
          if ((puVar3->flags_2 & 0x800000) == 0) {
            if (puVar3->state == '\x17') goto LAB_0051d43c;
            bVar6 = true;
            if ((*(short *)&puVar3->field_0x6e < 1) || ((puVar3->flags_2 & 0x10000) != 0)) {
LAB_0051d30a:
              bVar6 = false;
            }
            else {
              bVar37 = *(byte *)(param_1 + 0x2f);
              if ((bVar37 == 0xff) ||
                 ((bVar39 = puVar3->tribe_index, bVar39 == 0xff || (bVar37 == bVar39)))) {
                bVar39 = 1;
              }
              else {
                bVar39 = *(byte *)((int)game_state.start_n1 + (char)bVar37 + 0x9c) &
                         '\x01' << (bVar39 & 0x1f);
              }
              if (((((bVar39 != 0) || (bVar37 == puVar3->tribe_index)) ||
                   (puVar3->tribe_index == 0xff)) ||
                  ((iVar32 = FUN_004de7b0(puVar3,(int)(char)bVar37), iVar32 != 0 ||
                   (iVar32 = FUN_004de7b0(param_1,(int)(char)puVar3->tribe_index), iVar32 != 0))))
                 || ((*(byte *)((int)&puVar3->flags_4 + 1) & 0x10) != 0)) goto LAB_0051d30a;
              cVar28 = *(char *)(param_1 + 0x2b);
              if (cVar28 == '\x04') {
                if ((((game_state._4_4_ & 2) != 0) || (puVar3->unit_type == '\x04')) ||
                   (puVar3->unit_type == '\a')) goto LAB_0051d30f;
                goto LAB_0051d30a;
              }
              if (cVar28 == '\x06') {
                if (((game_state._4_4_ & 2) != 0) && (puVar3->unit_type == '\a')) goto LAB_0051d30a;
              }
              else if ((cVar28 != '\b') && (puVar3->unit_type == '\b')) goto LAB_0051d30a;
            }
LAB_0051d30f:
            if ((!bVar6) || ((bVar27 && (cVar28 = FUN_0051f990(param_1,puVar3,0), cVar28 == '\0'))))
            goto LAB_0051d43c;
          }
          else {
            if ((!bVar7) || (iVar32 = get_adjacent_unit(puVar3,4), iVar32 == 0)) goto LAB_0051d43c;
            bVar6 = true;
            if ((*(short *)&puVar3->field_0x6e < 1) ||
               ((*(byte *)((int)&puVar3->flags_2 + 2) & 1) != 0)) {
LAB_0051d416:
              bVar6 = false;
            }
            else {
              bVar37 = *(byte *)(param_1 + 0x2f);
              if (((bVar37 == 0xff) || (bVar39 = puVar3->tribe_index, bVar39 == 0xff)) ||
                 (bVar37 == bVar39)) {
                bVar39 = 1;
              }
              else {
                bVar39 = *(byte *)((int)game_state.start_n1 + (char)bVar37 + 0x9c) &
                         '\x01' << (bVar39 & 0x1f);
              }
              if ((((bVar39 != 0) || (bVar37 == puVar3->tribe_index)) ||
                  ((puVar3->tribe_index == 0xff ||
                   ((iVar32 = FUN_004de7b0(puVar3,(int)(char)bVar37), iVar32 != 0 ||
                    (iVar32 = FUN_004de7b0(param_1,(int)(char)puVar3->tribe_index), iVar32 != 0)))))
                  ) || ((*(byte *)((int)&puVar3->flags_4 + 1) & 0x10) != 0)) goto LAB_0051d416;
              cVar28 = *(char *)(param_1 + 0x2b);
              if (cVar28 == '\x04') {
                if ((((game_state._4_4_ & 2) != 0) || (puVar3->unit_type == '\x04')) ||
                   (puVar3->unit_type == '\a')) goto LAB_0051d41b;
                goto LAB_0051d416;
              }
              if (cVar28 == '\x06') {
                if (((game_state._4_4_ & 2) != 0) && (puVar3->unit_type == '\a')) goto LAB_0051d416;
              }
              else if ((cVar28 != '\b') && (puVar3->unit_type == '\b')) goto LAB_0051d416;
            }
LAB_0051d41b:
            if (!bVar6) goto LAB_0051d43c;
          }
          local_2fc[local_32c[0] * 3] = (int)puVar3;
          local_32c[0] = local_32c[0] + 1;
          bVar4 = 0x3f < (int)local_32c[0];
        }
LAB_0051d43c:
        uVar31 = (uint)puVar3->next_unit_index;
        puVar3 = unit_land_array[uVar31];
      }
      if (((bVar8) || (bVar9)) && (!bVar4)) {
        if (((bVar1 == 0xff) ||
            (bVar37 = ((&game_state.level_data[0].c_2)[uVar30 * 4] & 0xf) - 1, bVar37 == 0xff)) ||
           (bVar37 == bVar1)) {
          uVar31 = CONCAT31((int3)(uVar31 >> 8),1);
        }
        else {
          uVar31 = (uint)(*(byte *)((int)game_state.start_n1 + (char)bVar1 + 0x9c) &
                         '\x01' << (bVar37 & 0x1f));
        }
        if ((char)uVar31 == '\0') {
          uVar31 = (&game_state.level_data[0].flags)[uVar30];
          if (((uVar31 & 0x200) != 0) || ((bVar8 && ((uVar31 & 0x400) != 0)))) {
            uVar33 = (ushort)(&game_state.level_data[0].unit_index_2)[uVar30 * 2] & 0x3ff;
            puVar3 = unit_land_array[uVar33];
            if ((((uVar31 & 0x200) != 0) ||
                (uVar33 = FUN_004baab0(puVar3,param_1), uVar31 = uVar33, (char)uVar33 != '\0')) &&
               ((!bVar27 ||
                (uVar33 = FUN_0051f990(param_1,puVar3,0), uVar31 = uVar33, (char)uVar33 != '\0'))))
            {
              puVar35 = &local_300;
              uVar31 = uVar33 & 0xffffff00;
              for (uVar33 = local_32c[0]; uVar33 != 0; uVar33 = uVar33 - 1) {
                if ((char)uVar31 != '\0') goto LAB_0051d589;
                uVar31 = CONCAT31((int3)((uint)(puVar35[1] - (int)puVar3) >> 8),
                                  puVar35[1] - (int)puVar3 == 0);
                puVar35 = puVar35 + 3;
              }
              if ((((char)uVar31 == '\0') &&
                  (((puVar3->unit_class != '\x02' || (puVar3->unit_type != '\n')) ||
                   (uVar31 = *(char *)(param_1 + 0x2f) * 0xb,
                   game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f != '\x01')))) &&
                 ((puVar3->hut_people_inside != '\0' || (bVar8)))) {
                local_2fc[local_32c[0] * 3] = (int)puVar3;
                bVar4 = 0x3f < (int)(local_32c[0] + 1);
                uVar31 = local_32c[0];
                local_32c[0] = local_32c[0] + 1;
              }
            }
          }
        }
      }
LAB_0051d589:
      local_36e._0_1_ = (char)uVar5;
      local_36e = CONCAT11(local_36e._1_1_,(char)local_36e + '\x02');
      uVar34 = uVar34 - 1;
      uVar5 = local_36e;
      uVar33 = local_32c[0];
    }
    uVar29 = CONCAT31((int3)(uVar31 >> 8),local_370 - bVar2);
    uVar36 = (undefined2)(uVar31 >> 0x10);
    iVar38 = iVar38 + -1;
    cStack_36f = local_36e._1_1_ + '\x02';
  }
  if (uVar33 == 0) goto LAB_0051dc83;
  puVar35 = &local_300;
  local_32c[0] = uVar33;
  do {
    uVar33 = uVar33 - 1;
    uVar34 = calc_distance_toroidal(param_1 + 0x3d,puVar35[1] + 0x3d);
    puVar35[2] = uVar34;
    puVar35 = puVar35 + 3;
  } while (uVar33 != 0);
  do {
    iVar38 = 1;
    puVar40 = local_2f4;
    bVar4 = true;
    bVar27 = true;
    if (1 < (int)local_32c[0]) {
      do {
        bVar4 = bVar27;
        uVar34 = *(uint *)(puVar40 + -4);
        uVar33 = *(uint *)(puVar40 + 8);
        if (uVar33 < uVar34) {
          *(uint *)(puVar40 + 8) = uVar34;
          *(uint *)(puVar40 + -4) = uVar33;
          uVar34 = *(uint *)(puVar40 + 4);
          *(undefined4 *)(puVar40 + 4) = *(undefined4 *)(puVar40 + -8);
          bVar4 = false;
          *(uint *)(puVar40 + -8) = uVar34;
        }
        iVar38 = iVar38 + 1;
        puVar40 = puVar40 + 0xc;
        bVar27 = bVar4;
      } while (iVar38 < (int)local_32c[0]);
    }
  } while (!bVar4);
  uVar33 = local_32c[0];
  for (puVar35 = &local_300;
      (uVar33 != 0 && (uVar36 = (undefined2)(uVar34 >> 0x10), (uint)puVar35[2] < 0x481));
      puVar35 = puVar35 + 3) {
    if (local_36c != 0) goto LAB_0051dbe7;
    uVar34 = puVar35[1];
    if (*(char *)(uVar34 + 0x2a) == '\x01') {
      local_36c = 6;
      local_368 = uVar34;
    }
    uVar33 = uVar33 - 1;
  }
  if (local_36c == 0) {
    puVar35 = &local_300;
    puVar11 = local_350;
    puVar12 = local_34c;
    puVar13 = local_348;
    puVar14 = local_354;
    puVar15 = local_358;
    puVar16 = local_35c;
    puVar17 = local_360;
    puVar18 = local_364;
    puVar19 = local_320;
    puVar20 = local_31c;
    puVar21 = local_318;
    puVar22 = local_314;
    puVar23 = local_310;
    puVar24 = local_30c;
    puVar25 = local_308;
    puVar26 = local_304;
    for (uVar33 = local_32c[0]; local_348 = puVar13, local_364 = puVar18, local_360 = puVar17,
        local_35c = puVar16, local_358 = puVar15, local_354 = puVar14, local_350 = puVar11,
        local_34c = puVar12, local_320 = puVar19, local_31c = puVar20, local_318 = puVar21,
        local_314 = puVar22, local_310 = puVar23, local_30c = puVar24, local_308 = puVar25,
        local_304 = puVar26, uVar33 != 0; uVar33 = uVar33 - 1) {
      *puVar35 = 0;
      iVar38 = puVar35[1];
      cVar28 = *(char *)(iVar38 + 0x2a);
      if (cVar28 == '\x01') {
        cVar28 = *(char *)(iVar38 + 0x2b);
        if (cVar28 == '\x06') {
          local_35c = puVar35;
          local_30c = puVar35;
          if (puVar16 != (undefined4 *)0x0) {
            *puVar16 = puVar35;
            local_30c = puVar24;
          }
        }
        else if (cVar28 == '\a') {
          local_360 = puVar35;
          local_308 = puVar35;
          if (puVar17 != (undefined4 *)0x0) {
            *puVar17 = puVar35;
            local_308 = puVar25;
          }
        }
        else if (cVar28 == '\b') {
          local_364 = puVar35;
          local_304 = puVar35;
          if (puVar18 != (undefined4 *)0x0) {
            *puVar18 = puVar35;
            local_304 = puVar26;
          }
        }
        else if (*(short *)(iVar38 + 0x9f) == 0) {
          local_350 = puVar35;
          local_320 = puVar35;
          if (puVar11 != (undefined4 *)0x0) {
            *puVar11 = puVar35;
            local_320 = puVar19;
          }
        }
        else if ((*(uint *)(iVar38 + 0x10) & 0x2000000) == 0) {
          local_354 = puVar35;
          local_314 = puVar35;
          if (puVar14 != (undefined4 *)0x0) {
            *puVar14 = puVar35;
            local_314 = puVar22;
          }
        }
        else {
          local_358 = puVar35;
          local_310 = puVar35;
          if (puVar15 != (undefined4 *)0x0) {
            *puVar15 = puVar35;
            local_310 = puVar23;
          }
        }
      }
      else if (cVar28 == '\x02') {
        local_34c = puVar35;
        local_31c = puVar35;
        if (puVar12 != (undefined4 *)0x0) {
          *puVar12 = puVar35;
          local_31c = puVar20;
        }
      }
      else if ((cVar28 == '\t') &&
              (local_348 = puVar35, local_318 = puVar35, puVar13 != (undefined4 *)0x0)) {
        *puVar13 = puVar35;
        local_318 = puVar21;
      }
      puVar35 = puVar35 + 3;
      puVar11 = local_350;
      puVar12 = local_34c;
      puVar13 = local_348;
      puVar14 = local_354;
      puVar15 = local_358;
      puVar16 = local_35c;
      puVar17 = local_360;
      puVar18 = local_364;
      puVar19 = local_320;
      puVar20 = local_31c;
      puVar21 = local_318;
      puVar22 = local_314;
      puVar23 = local_310;
      puVar24 = local_30c;
      puVar25 = local_308;
      puVar26 = local_304;
    }
    if (bVar10) {
      local_310 = (undefined4 *)0x0;
      local_314 = (undefined4 *)0x0;
      local_320 = (undefined4 *)0x0;
      local_31c = (undefined4 *)0x0;
      local_318 = (undefined4 *)0x0;
    }
    iVar38 = 0;
    local_36c = 0;
    do {
      if (local_36c != 0) goto LAB_0051dbf2;
      local_358 = local_310;
      local_354 = local_314;
      local_350 = local_320;
      local_34c = local_31c;
      local_348 = local_318;
      puVar35 = local_318;
      local_364 = puVar26;
      do {
        if (local_364 == (undefined4 *)0x0) break;
        if (iVar38 == 0) {
          if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
            uVar33 = *(uint *)(local_364[1] + 0x10) & 0x100000;
          }
          else {
            uVar33 = *(uint *)(local_364[1] + 0x10) & 0x200000;
          }
          puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
          if (uVar33 == 0) goto LAB_0051d8de;
          puVar35 = (undefined4 *)*local_364;
          local_364 = puVar35;
        }
        else {
LAB_0051d8de:
          local_36c = 1;
        }
      } while (local_36c == 0);
      local_360 = puVar25;
      local_35c = puVar24;
      if (local_36c == 0) {
        do {
          if (local_360 == (undefined4 *)0x0) break;
          if (iVar38 == 0) {
            if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
              uVar33 = *(uint *)(local_360[1] + 0x10) & 0x100000;
            }
            else {
              uVar33 = *(uint *)(local_360[1] + 0x10) & 0x200000;
            }
            puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
            if (uVar33 == 0) goto LAB_0051d94a;
            puVar35 = (undefined4 *)*local_360;
            local_360 = puVar35;
          }
          else {
LAB_0051d94a:
            local_36c = 2;
          }
        } while (local_36c == 0);
        if (local_36c == 0) {
          do {
            if (local_35c == (undefined4 *)0x0) break;
            if (iVar38 == 0) {
              if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0)
              {
                uVar33 = *(uint *)(local_35c[1] + 0x10) & 0x100000;
              }
              else {
                uVar33 = *(uint *)(local_35c[1] + 0x10) & 0x200000;
              }
              puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
              if (uVar33 == 0) goto LAB_0051d9b6;
              puVar35 = (undefined4 *)*local_35c;
              local_35c = puVar35;
            }
            else {
LAB_0051d9b6:
              local_36c = 3;
            }
          } while (local_36c == 0);
          goto LAB_0051d9c5;
        }
LAB_0051da31:
        if (local_36c == 0) {
          do {
            if (local_354 == (undefined4 *)0x0) break;
            if (iVar38 == 0) {
              if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0)
              {
                uVar33 = *(uint *)(local_354[1] + 0x10) & 0x100000;
              }
              else {
                uVar33 = *(uint *)(local_354[1] + 0x10) & 0x200000;
              }
              puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
              if (uVar33 == 0) goto LAB_0051da8e;
              puVar35 = (undefined4 *)*local_354;
              local_354 = puVar35;
            }
            else {
LAB_0051da8e:
              local_36c = 5;
            }
          } while (local_36c == 0);
          goto LAB_0051da9d;
        }
LAB_0051db09:
        uVar36 = (undefined2)((uint)puVar35 >> 0x10);
        if (local_36c == 0) {
          do {
            if (local_34c == (undefined4 *)0x0) break;
            if (iVar38 == 0) {
              if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0)
              {
                uVar33 = *(uint *)(local_34c[1] + 0x10) & 0x100000;
              }
              else {
                uVar33 = *(uint *)(local_34c[1] + 0x10) & 0x200000;
              }
              puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
              if (uVar33 == 0) goto LAB_0051db66;
              puVar35 = (undefined4 *)*local_34c;
              local_34c = puVar35;
            }
            else {
LAB_0051db66:
              local_36c = 7;
            }
          } while (local_36c == 0);
          goto LAB_0051db75;
        }
      }
      else {
LAB_0051d9c5:
        if (local_36c == 0) {
          do {
            if (local_358 == (undefined4 *)0x0) break;
            if (iVar38 == 0) {
              if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0)
              {
                uVar33 = *(uint *)(local_358[1] + 0x10) & 0x100000;
              }
              else {
                uVar33 = *(uint *)(local_358[1] + 0x10) & 0x200000;
              }
              puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
              if (uVar33 == 0) goto LAB_0051da22;
              puVar35 = (undefined4 *)*local_358;
              local_358 = puVar35;
            }
            else {
LAB_0051da22:
              local_36c = 4;
            }
          } while (local_36c == 0);
          goto LAB_0051da31;
        }
LAB_0051da9d:
        if (local_36c == 0) {
          do {
            if (local_350 == (undefined4 *)0x0) break;
            if (iVar38 == 0) {
              if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0)
              {
                uVar33 = *(uint *)(local_350[1] + 0x10) & 0x100000;
              }
              else {
                uVar33 = *(uint *)(local_350[1] + 0x10) & 0x200000;
              }
              puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
              if (uVar33 == 0) goto LAB_0051dafa;
              puVar35 = (undefined4 *)*local_350;
              local_350 = puVar35;
            }
            else {
LAB_0051dafa:
              local_36c = 6;
            }
          } while (local_36c == 0);
          goto LAB_0051db09;
        }
LAB_0051db75:
        uVar36 = (undefined2)((uint)puVar35 >> 0x10);
        while ((local_36c == 0 &&
               (uVar36 = (undefined2)((uint)puVar35 >> 0x10), local_348 != (undefined4 *)0x0))) {
          if (iVar38 == 0) {
            if ((*(ushort *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
              uVar33 = *(uint *)(local_348[1] + 0x10) & 0x100000;
            }
            else {
              uVar33 = *(uint *)(local_348[1] + 0x10) & 0x200000;
            }
            puVar35 = (undefined4 *)CONCAT31((int3)(uVar33 >> 8),uVar33 == 0);
            if (uVar33 == 0) goto LAB_0051dbce;
            puVar35 = (undefined4 *)*local_348;
            local_348 = puVar35;
          }
          else {
LAB_0051dbce:
            local_36c = 8;
          }
          uVar36 = (undefined2)((uint)puVar35 >> 0x10);
        }
      }
      iVar38 = iVar38 + 1;
    } while (iVar38 < 2);
LAB_0051dbe7:
    if (local_36c == 0) goto LAB_0051dc83;
  }
LAB_0051dbf2:
  if (local_36c == 7) {
    *param_3 = 3;
  }
  else if (local_36c == 8) {
    *param_3 = 4;
  }
  else {
    *param_3 = 2;
  }
  if (local_368 == 0) {
    switch(local_36c) {
    case 1:
      local_348 = local_364;
      break;
    case 2:
      local_348 = local_360;
      break;
    case 3:
      local_348 = local_35c;
      break;
    case 4:
      local_348 = local_358;
      break;
    case 5:
      local_348 = local_354;
      break;
    case 6:
      local_348 = local_350;
      break;
    case 7:
      local_348 = local_34c;
      break;
    case 8:
      break;
    default:
      goto switchD_0051dc2c_caseD_8;
    }
    local_368 = local_348[1];
  }
switchD_0051dc2c_caseD_8:
  local_372 = *(undefined2 *)(local_368 + 0x24);
  FUN_0051fe40(local_368,param_1);
  uVar36 = extraout_var;
LAB_0051dc83:
  return CONCAT22(uVar36,local_372);
}
