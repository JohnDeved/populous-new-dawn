/* Ghidra 12.1.3 pseudocode; entry 004e6d00; FUN_004e6d00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004e757f) */
/* WARNING: Removing unreachable block (ram,0x004e6e22) */
/* WARNING: Removing unreachable block (ram,0x004e6e2c) */
/* WARNING: Removing unreachable block (ram,0x004e7589) */

void FUN_004e6d00(int param_1)

{
  short *psVar1;
  short *psVar2;
  byte bVar3;
  undefined2 uVar4;
  undefined3 uVar5;
  char cVar6;
  ushort uVar7;
  short sVar8;
  short sVar9;
  ushort uVar10;
  uint uVar11;
  int iVar12;
  int iVar13;
  uint uVar14;
  short sVar15;
  uint uVar16;
  uint uVar17;
  int iVar18;
  undefined4 uVar19;
  undefined2 local_1c;
  undefined2 uStack_1a;
  short local_18;
  undefined4 local_14;
  short local_10;
  uint local_c;
  short *local_8;
  int local_4;

  local_c = local_c & 0xffffff00;
  if ((*(uint *)(param_1 + 0xc) & 0x4000) != 0) {
    return;
  }
  uVar19 = *(undefined4 *)(param_1 + 0x3d);
  local_1c._0_1_ = (undefined1)uVar19;
  local_1c._1_1_ = (byte)((uint)uVar19 >> 8);
  uStack_1a._0_1_ = (undefined1)((uint)uVar19 >> 0x10);
  uStack_1a._1_1_ = (byte)((uint)uVar19 >> 0x18);
  local_18 = *(short *)(param_1 + 0x41);
  bVar3 = *(byte *)(param_1 + 0x30);
  uVar17 = local_14 >> 8;
  local_14 = local_14 & 0xffffff00;
  sVar8 = (short)uVar19;
  sVar15 = (short)((uint)uVar19 >> 0x10);
  if ((*(uint *)(param_1 + 0xc) & 0x2000) != 0) {
    local_14 = CONCAT31((int3)uVar17,1);
    FUN_004e7980(param_1,param_1 + 0x49);
    local_1c = CONCAT11(local_1c._1_1_,(undefined1)local_1c) + *(short *)(param_1 + 0x49);
    local_18 = local_18 + *(short *)(param_1 + 0x4b);
    uStack_1a = CONCAT11(uStack_1a._1_1_,(undefined1)uStack_1a) + *(short *)(param_1 + 0x4d);
    *(short *)(param_1 + 0x4b) =
         *(short *)(param_1 + 0x4b) - unit_related_struct_26B_ARRAY_005a7b90[bVar3].field13_0x12;
    sVar8 = local_1c;
    sVar15 = uStack_1a;
    if ((unit_related_struct_26B_ARRAY_005a7b90[bVar3].field_0x18 & 4) == 0) {
      FUN_004e9be0(param_1,&local_1c,0);
      sVar8 = local_1c;
      sVar15 = uStack_1a;
    }
  }
  local_1c = sVar8;
  if ((char)local_14 != '\0') {
    uStack_1a = sVar15;
    if ((*(byte *)(param_1 + 0xc) & 2) == 0) {
      FUN_00463750(&local_1c);
    }
    add_unit_to_cell(param_1,&local_1c);
    sVar15 = uStack_1a;
  }
  uStack_1a._1_1_ = (byte)((ushort)sVar15 >> 8);
  uStack_1a._0_1_ = (undefined1)sVar15;
  uStack_1a = sVar15;
  if ((*(uint *)(param_1 + 0xc) & 0x80000) == 0) {
    local_c = 0;
    if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x1000;
    }
    uVar17 = *(uint *)(param_1 + 0xc);
    if (((uVar17 & 0x1000) != 0) && ((uVar17 & 0x800) == 0)) {
      if ((uVar17 & 0x80) == 0) {
        if (*(int *)(param_1 + 0x57) ==
            CONCAT13(uStack_1a._1_1_,CONCAT12((undefined1)uStack_1a,local_1c))) {
          uVar7 = *(ushort *)(param_1 + 0x5d);
        }
        else {
          uVar17 = (uint)(ushort)(*(short *)(param_1 + 0x57) - *(short *)(param_1 + 0x3d));
          uVar11 = (uint)(ushort)(*(short *)(param_1 + 0x59) - *(short *)(param_1 + 0x3f));
          if (0x7fff < uVar17) {
            uVar17 = uVar17 - 0x10000;
          }
          if (0x7fff < uVar11) {
            uVar11 = uVar11 - 0x10000;
          }
          uVar7 = calc_angle_quadrant(uVar17,-uVar11);
          uVar7 = uVar7 & 0x7ff;
          sVar15 = uStack_1a;
        }
      }
      else {
        uVar7 = *(ushort *)(param_1 + 0x57);
      }
      if (*(char *)(param_1 + 0x7e) == '\0') {
        if ((*(uint *)(param_1 + 0xc) & 0x200800) == 0) {
          iVar18 = (int)(short)uVar7 - (int)*(short *)(param_1 + 0x5d);
          iVar12 = iVar18;
          if (iVar18 < 0) {
            iVar12 = -iVar18;
          }
          if (0x400 < iVar12) {
            iVar12 = 0x800 - iVar12;
          }
          sVar8 = 0;
          if (iVar18 != 0) {
            iVar13 = iVar18;
            if (iVar18 < 0) {
              iVar13 = -iVar18;
            }
            if (0x400 < iVar13) {
              if (iVar18 < 0) {
                iVar18 = iVar18 + 0x800;
              }
              else {
                iVar18 = iVar18 + -0x800;
              }
            }
            sVar8 = 1;
            if (iVar18 < 0) {
              sVar8 = -1;
            }
          }
          local_14 = (uint)*(byte *)(param_1 + 0x30);
          sVar9 = (short)iVar12;
          if (unit_related_struct_26B_ARRAY_005a7b90[local_14].field0_0x0 < (short)iVar12) {
            local_c = 1;
            sVar9 = unit_related_struct_26B_ARRAY_005a7b90[local_14].field0_0x0;
          }
          uVar7 = sVar9 * sVar8 + *(short *)(param_1 + 0x5d) & 0x7ff;
        }
      }
      else {
        iVar18 = (int)(short)uVar7 - (int)*(short *)(param_1 + 0x5d);
        iVar12 = iVar18;
        if (iVar18 < 0) {
          iVar12 = -iVar18;
        }
        if (0x400 < iVar12) {
          iVar12 = 0x800 - iVar12;
        }
        sVar8 = 0;
        if (iVar18 != 0) {
          iVar13 = iVar18;
          if (iVar18 < 0) {
            iVar13 = -iVar18;
          }
          if (0x400 < iVar13) {
            if (iVar18 < 0) {
              iVar18 = iVar18 + 0x800;
            }
            else {
              iVar18 = iVar18 + -0x800;
            }
          }
          sVar8 = 1;
          if (iVar18 < 0) {
            sVar8 = -1;
          }
        }
        local_14 = (uint)*(byte *)(param_1 + 0x7e);
        uVar7 = (short)((int)(short)iVar12 / (int)local_14) * sVar8 + *(short *)(param_1 + 0x5d);
      }
      *(ushort *)(param_1 + 0x5d) = uVar7;
      if (local_c == 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffefff;
      }
    }
    uStack_1a._0_1_ = (undefined1)sVar15;
    if ((*(uint *)(param_1 + 0xc) & 0x20) == 0) {
      uVar7 = *(ushort *)(param_1 + 0x5d);
      if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
        uVar7 = uVar7 + 0x400 & 0x7ff;
      }
      *(ushort *)(param_1 + 0x26) = uVar7;
    }
    uVar5 = CONCAT12((undefined1)uStack_1a,local_1c);
    uStack_1a = sVar15;
    sVar8 = calc_point_height(uVar5,CONCAT22(local_18,sVar15));
    if (sVar8 < local_18) {
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
      if ((*(byte *)(param_1 + 0xe) & 4) == 0) {
        *(short *)(param_1 + 0x4b) =
             *(short *)(param_1 + 0x4b) - unit_related_struct_26B_ARRAY_005a7b90[bVar3].field13_0x12
        ;
      }
      sVar8 = *(short *)(param_1 + 0x49);
      psVar1 = (short *)(param_1 + 0x4d);
      iVar18 = (int)sVar8;
      iVar13 = (int)*psVar1;
      iVar12 = iVar18;
      if (iVar18 < 0) {
        iVar12 = -iVar18;
      }
      if (iVar12 < 2) {
        sVar8 = 0;
      }
      else if (iVar18 < 1) {
        sVar8 = sVar8 + 2;
      }
      else {
        sVar8 = sVar8 + -2;
      }
      *(short *)(param_1 + 0x49) = sVar8;
      iVar12 = iVar13;
      if (iVar13 < 0) {
        iVar12 = -iVar13;
      }
      if (iVar12 < 2) {
        *psVar1 = *psVar1 - *psVar1;
      }
      else if (iVar13 < 1) {
        *psVar1 = *psVar1 + 2;
      }
      else {
        *psVar1 = *psVar1 + -2;
      }
      sVar8 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].x;
      iVar12 = (int)sVar8;
      sVar15 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].y;
      if ((int)*(short *)(param_1 + 0x49) < -iVar12) {
        *(short *)(param_1 + 0x49) = -sVar8;
      }
      if (iVar12 < *(short *)(param_1 + 0x49)) {
        *(short *)(param_1 + 0x49) = sVar8;
      }
      if ((int)*psVar1 < -iVar12) {
        *psVar1 = -sVar8;
      }
      if (iVar12 < *psVar1) {
        *psVar1 = sVar8;
      }
      psVar2 = (short *)(param_1 + 0x4b);
      if ((int)*psVar2 < -(int)sVar15) {
        *psVar2 = -sVar15;
      }
      if ((int)sVar15 < (int)*psVar2) {
        *psVar2 = sVar15;
      }
      local_1c = local_1c + *(short *)(param_1 + 0x49);
      local_18 = local_18 + *psVar2;
      uStack_1a = uStack_1a + *psVar1;
      FUN_004e9be0(param_1,&local_1c,1);
      sVar8 = calc_point_height(CONCAT13(uStack_1a._1_1_,CONCAT12((undefined1)uStack_1a,local_1c)),
                                CONCAT22(local_18,uStack_1a));
      if (local_18 <= sVar8) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x1000;
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
      }
    }
    else {
      if ((*(byte *)(param_1 + 0x11) & 4) != 0) {
        alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),&local_1c);
      }
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
      local_14 = (uint)*(short *)(param_1 + 0x5f);
      if (((*(uint *)(param_1 + 0xc) & 0x200) != 0) && ((*(uint *)(param_1 + 0xc) & 0x80) == 0)) {
        cVar6 = FUN_004e7a10(param_1 + 0x3d,0x38,param_1 + 0x57,0x400);
        if (cVar6 != '\0') {
          iVar12 = calc_squared_distance_toroidal(param_1 + 0x57,param_1 + 0x3d);
          iVar18 = (int)*(short *)(param_1 + 0x5f) * (int)*(short *)(param_1 + 0x5f);
          if (iVar18 - iVar12 != 0 && iVar12 <= iVar18) {
            local_14 = fast_sqrt(iVar12);
          }
        }
      }
      if (local_14 != 0) {
        psVar1 = (short *)(param_1 + 0x4d);
        psVar2 = (short *)(param_1 + 0x4b);
        FUN_004e9950(param_1);
        *(undefined2 *)(param_1 + 0x49) = 0;
        *psVar1 = 0;
        if (*psVar2 < 0) {
          *psVar2 = 0;
        }
        FUN_004e93f0(param_1 + 0x49,&local_1c,local_14,(int)*(short *)(param_1 + 0x5d));
        sVar8 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].x;
        iVar12 = (int)sVar8;
        sVar15 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].y;
        if ((int)*(short *)(param_1 + 0x49) < -iVar12) {
          local_14._2_2_ = sVar8 >> 0xf;
          local_14 = CONCAT22(local_14._2_2_,-sVar8);
          *(short *)(param_1 + 0x49) = -sVar8;
        }
        if (iVar12 < *(short *)(param_1 + 0x49)) {
          *(short *)(param_1 + 0x49) = sVar8;
        }
        if ((int)*psVar1 < -iVar12) {
          *psVar1 = -sVar8;
        }
        if (iVar12 < *psVar1) {
          *psVar1 = sVar8;
        }
        if ((int)*psVar2 < -(int)sVar15) {
          *psVar2 = -sVar15;
        }
        if ((int)sVar15 < (int)*psVar2) {
          *psVar2 = sVar15;
        }
        local_1c = local_1c + *(short *)(param_1 + 0x49);
        local_18 = local_18 + *psVar2;
        sVar8 = uStack_1a + *psVar1;
        uStack_1a._0_1_ = (undefined1)sVar8;
        uStack_1a._1_1_ = (byte)((ushort)sVar8 >> 8);
        uVar19 = CONCAT13(uStack_1a._1_1_,CONCAT12((undefined1)uStack_1a,local_1c));
        uStack_1a = sVar8;
        local_18 = calc_point_height(uVar19,CONCAT22(local_18,sVar8));
        cVar6 = FUN_005178d0(param_1,&local_1c);
        if (cVar6 != '\0') {
          if (local_c == 0) {
            cVar6 = FUN_004e9720(param_1,&local_1c);
            if (cVar6 == '\0') {
              cVar6 = FUN_004e7880(param_1 + 0x3d,param_1);
              if (cVar6 != '\0') {
                *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80000;
              }
            }
          }
          else {
            uVar4 = *(undefined2 *)(param_1 + 0x3d);
            local_1c._0_1_ = (undefined1)uVar4;
            local_1c._1_1_ = (byte)((ushort)uVar4 >> 8);
            uVar4 = *(undefined2 *)(param_1 + 0x3f);
            uStack_1a._0_1_ = (undefined1)uVar4;
            uStack_1a._1_1_ = (byte)((ushort)uVar4 >> 8);
            local_18 = calc_point_height(CONCAT13(uStack_1a._1_1_,*(undefined3 *)(param_1 + 0x3d)),
                                         CONCAT22(local_18,uVar4));
          }
        }
      }
    }
    goto LAB_004e76d8;
  }
  uVar19 = CONCAT13(uStack_1a._1_1_,CONCAT12((undefined1)uStack_1a,local_1c));
  sVar8 = calc_point_height(uVar19,CONCAT22(local_18,sVar15));
  if (sVar8 < local_18) {
    if ((*(byte *)(param_1 + 0x11) & 4) == 0) {
      if (*(char *)(param_1 + 0x2b) == '\a') {
        if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
          uVar19 = 0x1a;
        }
        else {
          uVar19 = 0x89;
        }
      }
      else {
        if (*(short *)(param_1 + 0x4b) < 0x5b) goto LAB_004e7615;
        uVar19 = 0xc4;
      }
      FUN_0048a050(param_1,uVar19,0);
    }
LAB_004e7615:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
    if ((*(byte *)(param_1 + 0xe) & 4) == 0) {
      *(short *)(param_1 + 0x4b) =
           *(short *)(param_1 + 0x4b) - unit_related_struct_26B_ARRAY_005a7b90[bVar3].field13_0x12;
    }
    sVar8 = *(short *)(param_1 + 0x49);
    psVar1 = (short *)(param_1 + 0x4d);
    iVar18 = (int)sVar8;
    iVar13 = (int)*psVar1;
    iVar12 = iVar18;
    if (iVar18 < 0) {
      iVar12 = -iVar18;
    }
    if (iVar12 < 2) {
      sVar8 = 0;
    }
    else if (iVar18 < 1) {
      sVar8 = sVar8 + 2;
    }
    else {
      sVar8 = sVar8 + -2;
    }
    *(short *)(param_1 + 0x49) = sVar8;
    iVar12 = iVar13;
    if (iVar13 < 0) {
      iVar12 = -iVar13;
    }
    if (iVar12 < 2) {
      *psVar1 = *psVar1 - *psVar1;
    }
    else if (iVar13 < 1) {
      *psVar1 = *psVar1 + 2;
    }
    else {
      *psVar1 = *psVar1 + -2;
    }
    FUN_004e78f0(param_1,param_1 + 0x49);
    local_1c = local_1c + *(short *)(param_1 + 0x49);
    local_18 = local_18 + *(short *)(param_1 + 0x4b);
    uStack_1a = uStack_1a + *psVar1;
    uVar7 = *(short *)(param_1 + 0x5d) + 0x93U & 0x7ff;
    *(ushort *)(param_1 + 0x5d) = uVar7;
  }
  else {
    if ((*(uint *)(param_1 + 0x10) & 0x400) != 0) {
      local_c = CONCAT31(local_c._1_3_,1);
    }
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    if ((char)local_c != '\0') {
      if (*(short *)(param_1 + 0x4b) < -99) {
        local_14._0_2_ = CONCAT11(uStack_1a._1_1_,local_1c._1_1_);
        if ((*(byte *)(landscape_height_array +
                      ((&game_state.level_data[0].c_3)
                       [(((ushort)local_14 & 0xfe) * 2 | (ushort)local_14 & 0xfe00) * 4] & 0xf)) & 2
            ) == 0) {
          if (*(short *)(param_1 + 0x4b) < -199) {
            FUN_004da080(param_1,0xffffffff,DAT_005aa534,1);
          }
          if (0 < *(short *)(param_1 + 0x6e)) {
            if (*(char *)(param_1 + 0x2b) == '\a') {
              uVar19 = 0x1b;
            }
            else {
              if (*(char *)(param_1 + 0x2b) == '\x01') goto LAB_004e73de;
              uVar19 = 9;
            }
            FUN_0048a050(param_1,uVar19,0);
          }
        }
      }
LAB_004e73de:
      if (*(char *)(param_1 + 0x2a) == '\x01') {
        FUN_004d3ea0(param_1);
      }
      alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),&local_1c);
    }
    psVar1 = (short *)(param_1 + 0x4b);
    FUN_004ebc20(&local_1c,&local_14);
    *(short *)(param_1 + 0x49) = *(short *)(param_1 + 0x49) + (ushort)local_14;
    psVar2 = (short *)(param_1 + 0x4d);
    *psVar1 = *psVar1 + local_14._2_2_;
    sVar8 = *psVar2 + local_10;
    local_4 = CONCAT22(local_4._2_2_,sVar8);
    *psVar2 = sVar8;
    local_c = (uint)uStack_1a._1_1_ * 0x100 + (uint)local_1c._1_1_;
    local_14 = game_state._841980_4_;
    if ((*(byte *)(game_state._841980_4_ + ((int)local_c >> 3)) & '\x01' << ((byte)local_c & 7)) !=
        0) {
      local_14._0_2_ = CONCAT11(uStack_1a._1_1_,local_1c._1_1_);
      if ((*(byte *)(landscape_height_array +
                    ((&game_state.level_data[0].c_3)
                     [(((ushort)local_14 & 0xfe) * 2 | (ushort)local_14 & 0xfe00) * 4] & 0xf)) &
          0x3e) == 0) {
        sVar15 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[bVar3].field_0x14;
      }
      else {
        sVar15 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[bVar3].field_0x16;
      }
      sVar9 = *(short *)(param_1 + 0x49);
      iVar12 = (int)sVar8;
      uVar17 = (uint)sVar9;
      local_14 = uVar17;
      if ((int)uVar17 < 0) {
        local_14 = -uVar17;
      }
      if ((int)local_14 < (int)sVar15) {
        sVar9 = 0;
      }
      else if ((int)uVar17 < 1) {
        sVar9 = sVar9 + sVar15;
      }
      else {
        sVar9 = sVar9 - sVar15;
      }
      *(short *)(param_1 + 0x49) = sVar9;
      iVar18 = iVar12;
      if (iVar12 < 0) {
        iVar18 = -iVar12;
      }
      if (iVar18 < sVar15) {
        *psVar2 = *psVar2 - sVar8;
      }
      else if (iVar12 < 1) {
        *psVar2 = *psVar2 + sVar15;
      }
      else {
        *psVar2 = *psVar2 - sVar15;
      }
    }
    local_8 = psVar1;
    FUN_004e78f0(param_1,param_1 + 0x49);
    local_1c = local_1c + *(short *)(param_1 + 0x49);
    local_18 = local_18 + *local_8;
    uStack_1a = uStack_1a + *psVar2;
    uVar17 = (uint)(ushort)(local_1c - *(short *)(param_1 + 0x3d));
    uVar11 = (uint)(ushort)(uStack_1a - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar17) {
      uVar17 = uVar17 - 0x10000;
    }
    if (0x7fff < uVar11) {
      uVar11 = uVar11 - 0x10000;
    }
    uVar10 = calc_angle_quadrant(uVar17,-uVar11);
    uVar10 = uVar10 & 0x7ff;
    uVar7 = uVar10;
    if ((*(byte *)(param_1 + 0xd) & 0x80) != 0) {
      uVar7 = uVar10 + 0x400 & 0x7ff;
    }
    *(ushort *)(param_1 + 0x5d) = uVar10;
  }
  *(ushort *)(param_1 + 0x26) = uVar7;
  FUN_004e9be0(param_1,&local_1c,1);
  FUN_004e9160(param_1,&local_1c);
LAB_004e76d8:
  if ((*(byte *)(param_1 + 0xc) & 2) == 0) {
    sVar8 = calc_point_height(CONCAT12((undefined1)uStack_1a,local_1c),CONCAT22(local_18,uStack_1a))
    ;
    if (local_18 < sVar8) {
      local_18 = sVar8;
    }
  }
  iVar12 = add_unit_to_cell(param_1,&local_1c);
  if (*(short *)(param_1 + 0x1c) != 0) {
    local_14._0_2_ =
         CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                  (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    uVar17 = ((ushort)local_14 & 0xfe) * 2 | (ushort)local_14 & 0xfe00;
    if (((*(byte *)((int)&game_state.level_data[0].flags + uVar17 * 4 + 1) & 2) == 0) ||
       (*(short *)&unit_type_array_building
                   [(byte)unit_land_array
                          [(ushort)(&game_state.level_data[0].unit_index_2)[uVar17 * 2] & 0x3ff]->
                          unit_type].field_0x26 == 0)) {
      *(undefined2 *)(param_1 + 0x1c) = 0;
    }
  }
  if (((((byte)level_flags & 4) != 0) && (iVar18 = 0, iVar12 != 0)) &&
     (*(char *)(param_1 + 0x2f) == player_tribe_num)) {
    uVar11 = (uint)local_8 >> 8;
    local_8 = (short *)((uint)local_8 & 0xffffff00);
    uVar17 = *(uint *)(param_1 + 0x3d);
    local_10 = *(short *)(param_1 + 0x41);
    uVar14 = *(ushort *)(param_1 + 0x5d) & 0x7ff;
    uVar16 = (maybe_sin[uVar14] << 9) >> 0x10;
    iVar12 = (maybe_cos[uVar14] << 9) >> 0x10;
    local_14._2_2_ = (short)(uVar17 >> 0x10);
    local_14._0_2_ = (ushort)uVar17;
    sVar8 = (ushort)local_14;
    sVar15 = local_14._2_2_;
    local_14 = uVar17;
    do {
      local_14._0_2_ = CONCAT11((char)((ushort)sVar15 >> 8),(char)((ushort)sVar8 >> 8));
      if ((*(byte *)(&game_state.level_data[0].flags +
                    (((ushort)local_14 & 0xfe) * 2 | (ushort)local_14 & 0xfe00)) & 8) == 0) {
        local_8 = (short *)CONCAT31((int3)uVar11,1);
        break;
      }
      local_c._0_2_ = (short)((uint)(maybe_sin[uVar14] << 9) >> 0x10);
      sVar8 = sVar8 + (short)local_c;
      iVar18 = iVar18 + 1;
      local_4._0_2_ = (short)((uint)(maybe_cos[uVar14] << 9) >> 0x10);
      sVar15 = sVar15 + (short)local_4;
    } while (iVar18 < 5);
    local_c = uVar16;
    local_4 = iVar12;
    if ((char)local_8 != '\0') {
      local_14 = CONCAT31(local_14._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) &
                 0xfffffffe;
      local_14 = CONCAT22(local_14._2_2_,
                          CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                   (char)local_14)) & 0xfffffeff;
      FUN_00450610(2,local_14);
    }
  }
  FUN_004eadc0(param_1);
  return;
}
