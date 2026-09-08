/* Ghidra 12.1.3 pseudocode; entry 004b8470; FUN_004b8470.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __fastcall FUN_004b8470(undefined4 param_1,undefined4 param_2,int param_3)

{
  undefined2 uVar1;
  ushort uVar2;
  unit_struct *puVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  unit_related_struct_20B *puVar7;
  char cVar8;
  byte bVar9;
  int *piVar10;
  int iVar11;
  uint uVar12;
  char *pcVar13;
  ushort *puVar14;
  undefined4 extraout_EDX;
  undefined4 uVar15;
  undefined4 extraout_EDX_00;
  int *extraout_EDX_01;
  undefined2 extraout_var;
  uint uVar16;
  int *piVar17;
  int *extraout_EDX_02;
  undefined2 uVar18;
  int iVar19;
  uint uVar20;
  undefined1 *puVar21;
  uint *puVar22;
  byte *pbVar23;
  undefined8 uVar24;
  uint local_724;
  uint local_720;
  uint local_71c;
  uint local_718;
  undefined2 local_714;
  undefined2 local_712;
  undefined2 local_710;
  uint local_70c;
  int local_708 [9];
  uint local_6e4;
  int local_6e0 [20];
  int local_690 [20];
  uint local_640 [200];
  int local_320;
  undefined2 local_31c;
  undefined1 local_31a [794];

  uVar18 = (undefined2)((uint)param_2 >> 0x10);
  uVar1 = *(undefined2 *)(param_3 + 0x24);
  iVar19 = 0;
  bVar6 = false;
  bVar5 = false;
  if ((*(uint *)(param_3 + 0xc) & 4) != 0) {
    *(uint *)(param_3 + 0xc) = *(uint *)(param_3 + 0xc) & 0xfffffffb;
    local_640[0] = CONCAT31(local_640[0]._1_3_,
                            game_state.tribes_array[*(char *)(param_3 + 0x2f)].field_0xc1f == '\x01'
                           );
    FUN_004b9d50(CONCAT22((short)((uint)&local_724 >> 0x10),(ushort)*(byte *)(param_3 + 0x9b)),
                 CONCAT22((short)((uint)(*(char *)(param_3 + 0x2f) * 0x319) >> 0x10),
                          *(undefined2 *)(param_3 + 0x68)),&local_320,&local_724);
    uVar18 = (undefined2)((uint)extraout_EDX >> 0x10);
    if (0 < (int)local_724) {
      puVar21 = local_31a;
      uVar15 = extraout_EDX;
      do {
        uVar18 = (undefined2)((uint)uVar15 >> 0x10);
        if (bVar5) goto LAB_004b8b48;
        cVar8 = FUN_0044ee50(*(char *)(param_3 + 0x2f) * 0xc65 + 0x89d1c8,
                             *(undefined2 *)(puVar21 + -2),*puVar21,*(undefined1 *)(param_3 + 0x9e),
                             uVar1,local_640[0]);
        uVar18 = (undefined2)((uint)extraout_EDX_00 >> 0x10);
        if (cVar8 == '\0') {
          bVar5 = true;
        }
        puVar21 = puVar21 + 8;
        iVar19 = iVar19 + 1;
        uVar15 = extraout_EDX_00;
      } while (iVar19 < (int)local_724);
    }
  }
  if (!bVar5) {
    FUN_004ba1b0(param_3);
    bVar9 = *(byte *)(param_3 + 0x9e);
    uVar20 = (uint)*(byte *)(param_3 + 0x9a);
    piVar17 = (int *)0x0;
    uVar2 = *(ushort *)&unit_type_array_building[bVar9].field_0x12;
    local_70c = (uint)*(ushort *)&unit_type_array_building[bVar9].field_0x16;
    if (uVar20 != 0) {
      iVar19 = 0;
      local_71c = (uint)*(ushort *)&unit_type_array_building[bVar9].field_0x18;
      local_718 = (uint)*(char *)(param_3 + 0x2f);
      puVar14 = (ushort *)(param_3 + 0x6a);
      piVar17 = local_6e0;
      do {
        piVar10 = piVar17;
        if (*puVar14 != 0) {
          piVar10 = piVar17 + 1;
          iVar19 = iVar19 + 1;
          *piVar17 = (int)unit_land_array[*puVar14];
        }
        puVar14 = puVar14 + 1;
        piVar17 = piVar10;
      } while (iVar19 < (int)uVar20);
      piVar17 = local_708;
      for (iVar19 = 10; iVar19 != 0; iVar19 = iVar19 + -1) {
        *piVar17 = 0;
        piVar17 = piVar17 + 1;
      }
      FUN_004ba260(param_3,local_6e0,local_708,local_690);
      piVar17 = extraout_EDX_01;
      if (uVar20 < uVar2) {
        if (local_708[2] < (int)uVar20) {
          bVar6 = true;
          local_640[0] = 2;
        }
      }
      else if (((*(byte *)(param_3 + 0x2e) & 0xf) == 0) &&
              ((((*(byte *)(param_3 + 0x9c) & 1) != 0 || (0 < local_708[2])) ||
               ((int)uVar20 <= (int)(local_6e4 + local_708[2]))))) {
        *(byte *)(param_3 + 0x9c) = *(byte *)(param_3 + 0x9c) & 0xfe;
        puVar21 = &DAT_005a80c0;
        do {
          *puVar21 = 0;
          puVar21 = puVar21 + 2;
        } while (puVar21 < &DAT_005a80ce);
        FUN_004b9d50(CONCAT22((short)((uint)&local_724 >> 0x10),(ushort)*(byte *)(param_3 + 0x9b)),
                     *(undefined2 *)(param_3 + 0x68),&local_320,&local_724);
        if (*(char *)(param_3 + 0x9e) == '\n') {
          DAT_005a80c2 = false;
        }
        else {
          bVar4 = true;
          iVar19 = 0;
          FUN_004b9e20(CONCAT22((short)((uint)&local_720 >> 0x10),(ushort)*(byte *)(param_3 + 0x9b))
                       ,CONCAT22(extraout_var,*(undefined2 *)(param_3 + 0x68)),local_640,&local_720)
          ;
          if (0 < (int)local_720) {
            puVar22 = local_640;
            do {
              iVar11 = FUN_004043f0(param_3,puVar22);
              uVar12 = iVar11 - *(short *)(*puVar22 + 4);
              uVar16 = (int)uVar12 >> 0x1f;
              if (1 < (int)((uVar12 ^ uVar16) - uVar16)) {
                bVar4 = false;
                break;
              }
              puVar22 = puVar22 + 2;
              iVar19 = iVar19 + 1;
            } while (iVar19 < (int)local_720);
          }
          DAT_005a80c2 = !bVar4;
        }
        local_720 = local_720 & 0xffffff00;
        DAT_005a80c0 = (int)*(short *)(param_3 + 0x96) < (int)local_71c;
        if (0 < (int)local_724) {
          piVar17 = &local_320;
          local_640[0] = local_724;
          do {
            for (puVar3 = unit_land_array[*(short *)(*piVar17 + 6)]; puVar3 != (unit_struct *)0x0;
                puVar3 = unit_land_array[puVar3->next_unit_index]) {
              cVar8 = puVar3->unit_class;
              if (cVar8 == '\x01') {
                if ((int)(char)puVar3->tribe_index == local_718) {
                  iVar19 = 0;
                  bVar4 = false;
                  if (uVar20 != 0) {
                    piVar10 = local_6e0;
                    do {
                      if ((unit_struct *)*piVar10 == puVar3) {
                        bVar4 = true;
                        break;
                      }
                      piVar10 = piVar10 + 1;
                      iVar19 = iVar19 + 1;
                    } while (iVar19 < (int)uVar20);
                  }
                  if (bVar4) {
                    DAT_005a80cc = DAT_005a80cc + '\x01';
                  }
                  else {
                    DAT_005a80c6 = DAT_005a80c6 + '\x01';
                  }
                }
                else {
                  DAT_005a80c8 = DAT_005a80c8 + '\x01';
                }
              }
              else if (cVar8 == '\x03') {
                DAT_005a80ca = DAT_005a80ca + '\x01';
              }
              else if ((cVar8 == '\x05') &&
                      (DAT_005a80c4 = DAT_005a80c4 + '\x01',
                      (unit_type_array_scenery[(byte)puVar3->unit_type].flags_1 & 0x10) != 0)) {
                uVar12 = local_720 >> 8;
                local_720 = CONCAT31((int3)uVar12,1);
              }
            }
            piVar17 = piVar17 + 2;
            local_640[0] = local_640[0] - 1;
          } while (local_640[0] != 0);
        }
        local_640[0] = CONCAT31(local_640[0]._1_3_,1);
        pcVar13 = &DAT_005a80c0;
        do {
          if (*pcVar13 != '\0') {
            local_640[0] = (uint)local_640[0]._1_3_ << 8;
            break;
          }
          pcVar13 = pcVar13 + 2;
        } while (pcVar13 < &DAT_005a80ce);
        bVar4 = false;
        if ((char)local_640[0] != '\0') {
          iVar19 = 0;
          if (uVar20 != 0) {
            piVar17 = local_6e0;
            do {
              if (bVar4) goto LAB_004b8855;
              if ((*(char *)(*piVar17 + 0x2d) == '\t') && (*(char *)(*piVar17 + 0xa8) == '\x06')) {
                bVar4 = true;
              }
              piVar17 = piVar17 + 1;
              iVar19 = iVar19 + 1;
            } while (iVar19 < (int)uVar20);
          }
          if (!bVar4) {
            local_640[0] = local_640[0] & 0xffffff00;
          }
        }
LAB_004b8855:
        if ((char)local_640[0] == '\0') {
          bVar4 = false;
          if ((local_6e4 == uVar20) && (DAT_005a80cc == '\0')) {
            bVar4 = true;
          }
          piVar17 = (int *)0x0;
          pbVar23 = &DAT_005a80c1;
          local_640[0] = 0;
          do {
            if (local_708[2] == 0) break;
            if (pbVar23 == &DAT_005a80c3) {
              uVar12 = (uint)(byte)unit_type_array_building[*(byte *)(param_3 + 0x9e)].field_0x1f;
            }
            else if ((pbVar23 == &DAT_005a80c5) && ((char)local_720 != '\0')) {
              uVar12 = (uint)((byte)unit_type_array_building[*(byte *)(param_3 + 0x9e)].field_0x1f
                             >> 1);
            }
            else {
              uVar12 = 1;
            }
            local_71c = 0;
            if (uVar12 != 0) {
              do {
                if (local_708[2] == 0) break;
                uVar16 = local_718 >> 8;
                local_718 = local_718 & 0xffffff00;
                if (((piVar17 != (int *)0x6) && (pbVar23[-1] != 0)) &&
                   (local_708[*pbVar23] < (int)uVar12)) {
                  local_718 = CONCAT31((int3)uVar16,1);
                }
                if ((char)local_718 != '\0') {
                  local_708[2] = local_708[2] + -1;
                  local_708[*pbVar23] = local_708[*pbVar23] + 1;
                  uVar16 = local_640[0];
                  local_640[0] = local_640[0] + 1;
                  iVar19 = local_690[uVar16];
                  *(byte *)(iVar19 + 0x2d) = *pbVar23;
                  puVar22 = (uint *)(iVar19 + 0xc);
                  *puVar22 = *puVar22 | 0x40000000;
                }
                local_71c = local_71c + 1;
              } while ((int)local_71c < (int)uVar12);
            }
            pbVar23 = pbVar23 + 2;
            piVar17 = (int *)((int)piVar17 + 1);
          } while (pbVar23 < &DAT_005a80cf);
          if (((local_6e4 + local_708[2] == uVar20) && (DAT_005a80cc != '\0')) && (uVar20 != 0)) {
            piVar10 = local_6e0;
            uVar12 = uVar20;
            do {
              iVar19 = *piVar10;
              if (*(char *)(iVar19 + 0x2d) != '\t') {
                *(undefined1 *)(iVar19 + 0x2d) = DAT_005a80cd;
                *(uint *)(iVar19 + 0xc) = *(uint *)(iVar19 + 0xc) | 0x40000000;
              }
              piVar10 = piVar10 + 1;
              uVar12 = uVar12 - 1;
              piVar17 = (int *)0x0;
            } while (uVar12 != 0);
          }
          if (bVar4) {
            *(undefined1 *)(local_6e0[0] + 0x2d) = 2;
            *(uint *)(local_6e0[0] + 0xc) = *(uint *)(local_6e0[0] + 0xc) | 0x40000000;
          }
        }
        else {
          local_714 = *(undefined2 *)(param_3 + 0x49);
          local_712 = *(undefined2 *)(param_3 + 0x4d);
          local_710 = 0;
          unit_allocation_flag_2 = 1;
          ptr_unit_related_20B->field0_0x0 = (uint)*(byte *)(param_3 + 0x9f);
          uVar2 = *(ushort *)(param_3 + 0x24);
          ptr_unit_related_20B->field1_0x4 = (uint)uVar2;
          ptr_unit_related_20B->unit_ptr = (unit_struct *)0x1;
          ptr_unit_related_20B->field3_0xc = 0xffffffff;
          puVar7 = ptr_unit_related_20B;
          ptr_unit_related_20B->field4_0x10 = 0;
          ptr_unit_related_20B = ptr_unit_related_20B + 1;
          unit_allocation_flag = '\x01';
          uVar24 = alloc_unit(2,CONCAT31((int3)((uint)puVar7 >> 8),*(undefined1 *)(param_3 + 0x9e)),
                              CONCAT11((char)(uVar2 >> 8),*(undefined1 *)(param_3 + 0x2f)),
                              &local_714);
          piVar17 = (int *)((ulonglong)uVar24 >> 0x20);
          iVar19 = (int)uVar24;
          if (iVar19 != 0) {
            *(undefined2 *)(param_3 + 0x92) = *(undefined2 *)(iVar19 + 0x24);
            if ((*(byte *)(param_3 + 0xe) & 0x10) == 0) {
              empty_unit_function(param_3);
              *(undefined1 *)(param_3 + 0x2c) = 2;
              init_unit_class(param_3);
            }
            if (unit_allocation_flag != '\0') {
              *(uint *)(iVar19 + 0xc) = *(uint *)(iVar19 + 0xc) | 0x400;
              unit_allocation_flag = '\0';
            }
            init_unit_class(iVar19);
            *(undefined2 *)(iVar19 + 0x41) = *(undefined2 *)(param_3 + 0x41);
            piVar17 = extraout_EDX_02;
          }
          if (uVar20 != 0) {
            piVar10 = local_6e0;
            uVar12 = uVar20;
            do {
              piVar17 = (int *)*piVar10;
              piVar10 = piVar10 + 1;
              *(undefined1 *)((int)piVar17 + 0x2d) = 2;
              piVar17[3] = piVar17[3] | 0x40000000;
              *(undefined1 *)(piVar17 + 0x2a) = 0x15;
              *(byte *)((int)piVar17 + 0x76) = *(byte *)((int)piVar17 + 0x76) | 0x10;
              uVar12 = uVar12 - 1;
            } while (uVar12 != 0);
          }
        }
      }
      if ((bVar6) && (uVar20 != 0)) {
        piVar17 = local_6e0;
        uVar12 = uVar20;
        do {
          iVar19 = *piVar17;
          if ((*(byte *)(iVar19 + 0x2d) != local_640[0]) && (*(byte *)(iVar19 + 0x2d) != 1)) {
            *(char *)(iVar19 + 0x2d) = (char)local_640[0];
            *(uint *)(iVar19 + 0xc) = *(uint *)(iVar19 + 0xc) | 0x40000000;
          }
          piVar17 = piVar17 + 1;
          uVar12 = uVar12 - 1;
        } while (uVar12 != 0);
      }
    }
    uVar18 = (undefined2)((uint)piVar17 >> 0x10);
    if (((((int)uVar20 < (int)local_70c) && ((*(byte *)(param_3 + 0x2e) & 0x7f) == 0)) &&
        (uVar20 == 0)) &&
       (bVar9 = *(char *)(param_3 + 0x9d) + 1, *(byte *)(param_3 + 0x9d) = bVar9, 0x32 < bVar9)) {
      bVar5 = true;
    }
LAB_004b8b48:
    if (!bVar5) {
      return;
    }
  }
  FUN_004b9d50(CONCAT22((short)((uint)&local_724 >> 0x10),(ushort)*(byte *)(param_3 + 0x9b)),
               CONCAT22(uVar18,*(undefined2 *)(param_3 + 0x68)),&local_320,&local_724);
  local_640[0] = CONCAT22(local_640[0]._2_2_,local_31c);
  FUN_004b9190(local_640[0],0,0,*(undefined1 *)(param_3 + 0x2f),3);
  return;
}
