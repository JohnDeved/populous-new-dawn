/* Ghidra 12.1.3 pseudocode; entry 004314c0; FUN_004314c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004314c0(void)

{
  uint uVar1;
  bool bVar2;
  short sVar3;
  uint uVar4;
  int *piVar5;
  int iVar6;
  int iVar7;
  uint3 uVar9;
  int iVar8;
  ushort uVar10;
  char cVar11;
  global_struct_45B *pgVar12;
  undefined2 *puVar13;
  ushort local_3a;
  ushort local_38;
  ushort local_36;
  int local_34;
  uint local_30;
  int local_2c;
  int local_28;
  short local_24;
  short local_22;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  undefined4 local_4;

  DAT_00683b78 = 0x2800;
  DAT_00683b7c = 0xccc;
  DAT_00683b80 = 0x10000;
  uVar4 = parameterize_by_screen_width(0xccc);
  if ((uVar4 & 1) != 0) {
    DAT_00683b7c = DAT_00683b7c + 0x66;
  }
  DAT_0098db40 = 0;
  DAT_006841e5 = 0;
  local_30 = (uint)(game_state.offset_counter_2 != _DAT_00683b84);
  if (local_30 != 0) {
    _DAT_00683b84 = game_state.offset_counter_2;
  }
  if (DAT_006841e3 != '\0') {
    FUN_00431c40();
    piVar5 = (int *)FUN_004ffb90();
    local_2c = *piVar5;
    local_28 = piVar5[1];
    iVar6 = parameterize_by_screen_width(DAT_00683b78);
    if ((local_2c < iVar6) ||
       (iVar6 = parameterize_by_screen_width(DAT_00683b78 + DAT_00683b7c), iVar6 < local_2c)) {
      local_20 = 0;
    }
    else {
      local_20 = 1;
    }
    piVar5 = DAT_00683b74;
    uVar4 = 0xffffffff;
    local_18 = 0;
    local_34 = 0;
    iVar6 = parameterize_by_screen_width(DAT_00683b78);
    local_1c = parameterize_by_screen_width(DAT_00683b7c);
    for (; piVar5 != (int *)0x0; piVar5 = *(int **)((int)piVar5 + 0x29)) {
      if (((byte)land_flags_1 & 2) == 0) {
        if (local_30 != 0) {
          *piVar5 = *piVar5 + 1;
        }
        if ((*(byte *)((int)piVar5 + 0x23) & 0x20) != 0) {
          local_38 = ((*(ushort *)(piVar5 + 5) & 0xfe) + 1) * 0x100;
          local_3a = *(ushort *)(piVar5 + 5) & 0xfefe;
          local_36 = ((local_3a >> 8) + 1) * 0x100;
          if (((DAT_0089bc17 == '\0') || (((DAT_0089bbff ^ local_38) & 0xfe00) != 0)) ||
             (((DAT_0089bc01 ^ local_36) & 0xfe00) != 0)) {
            local_24 = game_state.tribes_array[player_tribe_num].x;
            local_22 = game_state.tribes_array[player_tribe_num].y;
            iVar7 = calc_squared_distance_toroidal(&local_24,&local_38);
            if (0xfff < iVar7) {
              *(uint *)((int)piVar5 + 0x21) = *(uint *)((int)piVar5 + 0x21) | 8;
              local_34 = 1;
            }
          }
        }
        if ((*(byte *)((int)piVar5 + 0x21) & 8) == 0) {
          if (((local_30 != 0) && ((short)piVar5[4] != 0)) &&
             (sVar3 = (short)piVar5[4] + -1, *(short *)(piVar5 + 4) = sVar3, sVar3 == 0)) {
            uVar1 = *(uint *)((int)piVar5 + 0x21);
            *(uint *)((int)piVar5 + 0x21) = uVar1 | 8;
            *(uint *)((int)piVar5 + 0x21) = uVar1 | 0x10008;
            goto LAB_004316d9;
          }
        }
        else {
LAB_004316d9:
          local_34 = 1;
        }
        if (((uVar4 == 0xffffffff) &&
            (uVar1 = *(uint *)((int)piVar5 + 0x21), (uVar1 & 0x20000) != 0)) &&
           ((uVar1 & 0xc0000) != 0)) {
          uVar4 = ((int)piVar5 + -0x683b92) / 0x2d;
          *(uint *)((int)piVar5 + 0x21) = uVar1 & 0xfffdffff;
          if ((uVar1 & 0x10) != 0) {
            sVar3 = parameterize_by_screen_height(piVar5[1]);
            local_4 = parameterize_by_screen_height(piVar5[2]);
            local_8 = 0;
            local_c = 0;
            local_10 = 0;
            local_14 = 0;
            uVar1 = *(uint *)((int)piVar5 + 0x21);
            uVar9 = (uint3)(uVar1 >> 8);
            if ((uVar1 & 0x100000) == 0) {
              if (((uVar1 & 1) == 0) || ((uVar1 & 0x200) != 0)) {
                iVar7 = (uint)uVar9 << 8;
              }
              else {
                iVar7 = CONCAT31(uVar9,2);
              }
            }
            else {
              iVar7 = CONCAT31(uVar9,1);
            }
            FUN_004af440(iVar7,(int)*(short *)((int)piVar5 + 0x12));
            local_14 = (int)(short)iVar6;
            local_c = (short)local_1c + local_14;
            local_10 = (int)sVar3;
            local_8 = (short)local_4 + local_10;
            FUN_004afac0(&local_14);
            FUN_004af630(uVar4 & 0xff);
            global_struct_45B_ARRAY_00683b92[(char)uVar4].field24_0x21 =
                 global_struct_45B_ARRAY_00683b92[(char)uVar4].field24_0x21 | 2;
          }
        }
      }
      *(uint *)((int)piVar5 + 0x21) = *(uint *)((int)piVar5 + 0x21) & 0xfffffffb;
      bVar2 = false;
      if ((((local_20 != 0) && (local_18 == 0)) &&
          ((bVar2 = true, DAT_0089bb81 == '\x02' || (DAT_0089bb81 == '\x03')))) &&
         (((int)global_struct_45B_ARRAY_00683b92 - (int)piVar5) / 0x2d + (int)DAT_0089bb85._1_1_ !=
          0)) {
        bVar2 = false;
      }
      if (bVar2) {
        iVar7 = parameterize_by_screen_height(piVar5[1]);
        iVar8 = parameterize_by_screen_height(piVar5[2]);
        if ((((iVar6 <= local_2c) && (local_2c < local_1c + iVar6)) && (iVar7 <= local_28)) &&
           (local_28 < iVar8 + iVar7)) {
          local_18 = 1;
          DAT_006841e5 = 1;
          DAT_0098db40 = (short)(((int)piVar5 + -0x683b92) / 0x2d) + 1;
          *(uint *)((int)piVar5 + 0x21) = *(uint *)((int)piVar5 + 0x21) | 4;
        }
      }
    }
    if (local_34 != 0) {
      iVar6 = 0;
      pgVar12 = global_struct_45B_ARRAY_00683b92;
      do {
        if ((pgVar12->field_0x20 != '\0') && ((pgVar12->field24_0x21 & 8) != 0)) {
          cVar11 = (char)iVar6;
          (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[cVar11].field_0x20] =
               (&DAT_00683b88)[(char)global_struct_45B_ARRAY_00683b92[cVar11].field_0x20] + -1;
          DAT_006841e3 = DAT_006841e3 + -1;
          if (((&DAT_0059cb0f)[(char)global_struct_45B_ARRAY_00683b92[cVar11].field_0x20 * 0x1c] !=
               '\0') &&
             ((*(byte *)((int)&global_struct_45B_ARRAY_00683b92[cVar11].field24_0x21 + 2) & 1) == 0)
             ) {
            FUN_00432160(global_struct_45B_ARRAY_00683b92 + cVar11);
          }
          global_struct_45B_ARRAY_00683b92[cVar11].field_0x20 = 0;
        }
        iVar6 = iVar6 + 1;
        pgVar12 = pgVar12 + 1;
      } while (iVar6 < 0x20);
      FUN_00431a80();
    }
  }
  if ((local_30 != 0) && (DAT_006841e4 != '\0')) {
    iVar6 = 0;
    puVar13 = &DAT_00684132;
    iVar7 = (int)DAT_006841e4;
    if (0 < iVar7) {
      do {
        uVar10 = puVar13[1];
        if ((uVar10 & 0x3fff) != 0) {
          iVar6 = iVar6 + 1;
          uVar10 = (uVar10 - 1 ^ uVar10) & 0x3fff ^ uVar10;
          puVar13[1] = uVar10;
          if ((uVar10 & 0x3fff) == 0) {
            DAT_006841e4 = DAT_006841e4 + -1;
          }
        }
        puVar13 = puVar13 + 2;
      } while (iVar6 < iVar7);
    }
  }
  return;
}
