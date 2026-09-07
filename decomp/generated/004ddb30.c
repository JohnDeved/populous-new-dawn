/* Ghidra 12.1.3 pseudocode; entry 004ddb30; FUN_004ddb30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004ddea8) */
/* WARNING: Removing unreachable block (ram,0x004ddeb2) */

void FUN_004ddb30(int param_1)

{
  short *psVar1;
  short *psVar2;
  char cVar3;
  unit_struct *puVar4;
  bool bVar5;
  bool bVar6;
  bool bVar7;
  short sVar8;
  ushort uVar9;
  undefined2 uVar10;
  short sVar11;
  short sVar12;
  uint uVar13;
  ushort uVar14;
  int iVar15;
  uint uVar16;
  int iVar17;
  uint uVar18;
  undefined4 uVar19;
  int iVar20;
  bool bVar21;
  undefined2 local_36;
  undefined2 local_34;
  undefined2 uStack_30;
  int local_c;
  short local_8;
  short sStack_6;
  short local_4;

  psVar1 = (short *)(param_1 + 0x49);
  bVar5 = false;
  uVar19 = *(undefined4 *)(param_1 + 0x3d);
  local_4 = *(short *)(param_1 + 0x41);
  local_8 = (short)uVar19;
  sStack_6 = (short)((uint)uVar19 >> 0x10);
  bVar6 = false;
  bVar7 = false;
  sVar11 = *(short *)(param_1 + 0x6a);
  sVar12 = *(short *)(param_1 + 0x68);
  iVar15 = (int)sVar12;
  uVar9 = *(ushort *)(param_1 + 0x99);
  uVar16 = *(uint *)(param_1 + 0xc) & 0xffffffdf;
  *(uint *)(param_1 + 0xc) = uVar16;
  cVar3 = *(char *)(param_1 + 0x67);
  bVar21 = cVar3 == '\x03';
  if ((*(char *)(param_1 + 0x2d) == '\x06') && (*(char *)(param_1 + 0xa8) == '\x02')) {
    bVar6 = true;
  }
  uVar13 = (uint)uVar9;
  switch(cVar3) {
  case '\0':
    *(uint *)(param_1 + 0xc) = uVar16 | 0x20;
    uVar13 = (uint)uVar9;
    break;
  case '\x01':
  case '\x05':
    *(uint *)(param_1 + 0xc) = uVar16 | 0x20;
    local_34 = CONCAT11((char)((uint)uVar19 >> 0x18),(char)((uint)uVar19 >> 8));
    iVar17 = find_unit_class_4_in_land_array
                       (((local_34 & 0xfe) * 2 | local_34 & 0xfe00) * 4 + 0x8a03e4);
    *(undefined2 *)(param_1 + 0x68) = 0x30;
    if (iVar17 == 0) {
      *(undefined2 *)(param_1 + 0x68) = 8;
    }
    if (*(char *)(param_1 + 0xa9) == '\0') {
      if (*(char *)(param_1 + 0x67) != '\x05') {
        uVar16 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar13 = uVar16 >> 0xd;
        game_state.pseudo_random_val = uVar13 | uVar16 * 0x80000;
        update_gs_unit_related_array_item(param_1);
        uVar16 = *(uint *)(param_1 + 0xc);
        *(uint *)(param_1 + 0xc) = uVar16 | 0x80;
        *(uint *)(param_1 + 0xc) = uVar16 | 0x1080;
        *(ushort *)(param_1 + 0x57) = (ushort)uVar13 & 0x7ff;
      }
      uVar16 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar13 = uVar16 >> 0xd;
      uVar16 = uVar13 | uVar16 * 0x80000;
      uVar18 = game_state.pseudo_random_val >> 0x10;
      game_state.pseudo_random_val = uVar16;
      sVar8 = FUN_0044e860(CONCAT22((short)(uVar16 >> 0x10),*(undefined2 *)(param_1 + 0x3d)),
                           CONCAT22((short)uVar18,*(undefined2 *)(param_1 + 0x3f)));
      *(ushort *)(param_1 + 0x6a) = *(short *)(param_1 + 0x83) + sVar8 + ((ushort)uVar13 & 0x1f);
      uVar13 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar16 = uVar13 >> 0xd;
      game_state.pseudo_random_val = uVar16 | uVar13 * 0x80000;
      *(byte *)(param_1 + 0xa9) = ((byte)uVar16 & 0xf) + 8;
      uVar13 = (uint)uVar9;
    }
    else {
      *(char *)(param_1 + 0xa9) = *(char *)(param_1 + 0xa9) + -1;
      uVar13 = (uint)uVar9;
    }
    break;
  case '\x02':
  case '\x03':
    uVar13 = 2;
    if (*(short *)(param_1 + 0x5f) != 0) {
      iVar17 = calc_distance_toroidal(param_1 + 0x3d,param_1 + 0x53);
      iVar17 = iVar17 / (int)*(short *)(param_1 + 0x5f);
      if (iVar17 < 1) {
        iVar17 = 1;
      }
      uVar13 = ((int)sVar11 - (int)*(short *)(param_1 + 0x41)) / iVar17;
      if ((int)uVar13 < 0) {
        uVar13 = -uVar13;
      }
    }
    break;
  case '\x04':
    uVar13 = (uint)uVar9;
    if (*(short *)(param_1 + 0x57) != *(short *)(param_1 + 0x5d)) {
      bVar7 = true;
      sVar8 = calc_abs_angular_diff
                        (CONCAT22(cVar3 >> 7,*(short *)(param_1 + 0x5d)),
                         CONCAT22((short)(uVar16 >> 0x10),*(short *)(param_1 + 0x57)));
      local_c = (int)sVar8;
      uVar13 = (uint)uVar9;
    }
    break;
  case '\a':
    bVar5 = true;
    *(uint *)(param_1 + 0xc) = uVar16 | 0x20;
    uVar13 = (uint)uVar9;
    break;
  case '\b':
    uVar14 = *(short *)(param_1 + 0x26) + *(char *)(param_1 + 0xaa) * 0x1c & 0x7ff;
    *(ushort *)(param_1 + 0x5d) = uVar14;
    *(ushort *)(param_1 + 0x26) = uVar14;
    uVar13 = (uint)uVar9;
  }
  uStack_30 = (undefined2)uVar13;
  if (bVar5) goto LAB_004de205;
  iVar17 = (int)*(short *)(param_1 + 0x5f);
  if (iVar17 != iVar15) {
    if (iVar17 < iVar15) {
      if (*(short *)(param_1 + 0x5f) < 4) {
        *(undefined2 *)(param_1 + 0x5f) = 4;
      }
      else {
        sVar8 = (short)((int)(iVar17 * 0x26 + (iVar17 * 0x26 >> 0x1f & 0x1fU)) >> 5);
        *(short *)(param_1 + 0x5f) = sVar8;
        if (iVar15 < sVar8) goto LAB_004dde42;
      }
    }
    else {
      sVar8 = (short)((int)(iVar17 * 0x1e + (iVar17 * 0x1e >> 0x1f & 0x1fU)) >> 5);
      *(short *)(param_1 + 0x5f) = sVar8;
      if (sVar8 < iVar15) {
LAB_004dde42:
        *(short *)(param_1 + 0x5f) = sVar12;
      }
    }
  }
  if ((*(byte *)(param_1 + 0xd) & 0x20) != 0) {
    FUN_004e9530(param_1,&local_8);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffdfff;
  }
  if ((*(uint *)(param_1 + 0xc) & 0x80000) == 0) {
    sVar12 = *(short *)(param_1 + 0x5f);
    if (sVar12 != 0) {
      if ((*(uint *)(param_1 + 0xc) & 0x80) == 0) {
        uVar16 = (uint)(ushort)(*(short *)(param_1 + 0x57) - *(short *)(param_1 + 0x3d));
        uVar18 = (uint)(ushort)(*(short *)(param_1 + 0x59) - *(short *)(param_1 + 0x3f));
        if (0x7fff < uVar16) {
          uVar16 = uVar16 - 0x10000;
        }
        if (0x7fff < uVar18) {
          uVar18 = uVar18 - 0x10000;
        }
        uVar9 = calc_angle_quadrant(uVar16,-uVar18);
        uVar9 = uVar9 & 0x7ff;
      }
      else {
        uVar9 = *(ushort *)(param_1 + 0x57);
      }
      *(ushort *)(param_1 + 0x5d) = uVar9;
      if ((*(uint *)(param_1 + 0xc) & 0x20) == 0) {
        uVar16 = (uint)(short)uVar9;
        if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
          uVar16 = uVar16 + 0x400 & 0x7ff;
        }
        uVar19 = 0x38;
        if (bVar21) {
          uVar19 = 0x70;
        }
        uVar10 = calc_angular_interpolation
                           (CONCAT22((short)(uVar16 >> 0x10),*(undefined2 *)(param_1 + 0x26)),uVar16
                            ,uVar19);
        *(undefined2 *)(param_1 + 0x26) = uVar10;
      }
      FUN_004e96f0(psVar1);
      FUN_004e96d0(psVar1);
      FUN_004e94f0(psVar1,(int)sVar12,(int)*(short *)(param_1 + 0x5d));
      sVar12 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].x;
      iVar17 = (int)sVar12;
      sVar8 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].y;
      if ((int)*psVar1 < -iVar17) {
        *psVar1 = -sVar12;
      }
      if (iVar17 < *psVar1) {
        *psVar1 = sVar12;
      }
      if ((int)*(short *)(param_1 + 0x4d) < -iVar17) {
        *(short *)(param_1 + 0x4d) = -sVar12;
      }
      if (iVar17 < *(short *)(param_1 + 0x4d)) {
        *(short *)(param_1 + 0x4d) = sVar12;
      }
      if ((int)*(short *)(param_1 + 0x4b) < -(int)sVar8) {
        *(short *)(param_1 + 0x4b) = -sVar8;
      }
      if ((int)sVar8 < (int)*(short *)(param_1 + 0x4b)) {
        *(short *)(param_1 + 0x4b) = sVar8;
      }
      local_8 = local_8 + *psVar1;
      local_4 = local_4 + *(short *)(param_1 + 0x4b);
      sStack_6 = sStack_6 + *(short *)(param_1 + 0x4d);
    }
  }
  else {
    *(undefined2 *)(param_1 + 0x4b) = 0;
    FUN_004e9650(psVar1,8);
    if (*(char *)(param_1 + 0x67) == '\b') {
      sVar12 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].x;
      iVar17 = (int)sVar12;
      sVar8 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].y;
      if ((int)*psVar1 < -iVar17) {
        *psVar1 = -sVar12;
      }
      if (iVar17 < *psVar1) {
        *psVar1 = sVar12;
      }
      psVar2 = (short *)(param_1 + 0x4d);
      if ((int)*psVar2 < -iVar17) {
        *psVar2 = -sVar12;
      }
      if (iVar17 < *psVar2) {
        *psVar2 = sVar12;
      }
      if ((int)*(short *)(param_1 + 0x4b) < -(int)sVar8) {
        *(short *)(param_1 + 0x4b) = -sVar8;
      }
      if ((int)sVar8 < (int)*(short *)(param_1 + 0x4b)) {
LAB_004de0e7:
        *(short *)(param_1 + 0x4b) = sVar8;
      }
    }
    else {
      sVar12 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].x1;
      iVar17 = (int)sVar12;
      sVar8 = unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].y1;
      if ((int)*psVar1 < -iVar17) {
        *psVar1 = -sVar12;
      }
      if (iVar17 < *psVar1) {
        *psVar1 = sVar12;
      }
      psVar2 = (short *)(param_1 + 0x4d);
      if ((int)*psVar2 < -iVar17) {
        *psVar2 = -sVar12;
      }
      if (iVar17 < *psVar2) {
        *psVar2 = sVar12;
      }
      if ((int)*(short *)(param_1 + 0x4b) < -(int)sVar8) {
        *(short *)(param_1 + 0x4b) = -sVar8;
      }
      if ((int)sVar8 < (int)*(short *)(param_1 + 0x4b)) goto LAB_004de0e7;
    }
    if ((*psVar1 == 0) && (*(short *)(param_1 + 0x4d) == 0)) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfff7ffff;
    }
    else {
      local_8 = local_8 + *psVar1;
      local_4 = local_4 + *(short *)(param_1 + 0x4b);
      sStack_6 = sStack_6 + *(short *)(param_1 + 0x4d);
    }
  }
  uVar18 = (int)sVar11 - (int)local_4;
  uVar16 = uVar18;
  if ((int)uVar18 < 0) {
    uVar16 = -uVar18;
  }
  if ((int)uVar16 <= (int)(uVar13 * 2)) {
    uVar13 = (int)uVar13 / 2;
  }
  if ((int)uVar16 <= (int)uVar13) {
    uVar13 = (int)uVar13 / 2;
  }
  uStack_30 = (undefined2)uVar13;
  if ((int)uVar13 < (int)uVar16) {
    uVar16 = uVar13;
  }
  sVar11 = (short)uVar16;
  if ((int)uVar18 < 1) {
    sVar11 = -sVar11;
  }
  local_4 = local_4 + sVar11;
  sVar11 = calc_point_height(CONCAT22(sStack_6,local_8),CONCAT22(local_4,sStack_6));
  sVar12 = FUN_0044e860(CONCAT22(sStack_6,local_8),CONCAT22(local_4,sStack_6));
  if ((bVar21) || (iVar17 = (int)sVar12, bVar6)) {
    iVar17 = (int)sVar11;
  }
  iVar17 = iVar17 + 100;
  if (local_4 <= iVar17) {
    if (iVar17 - local_4 < 0x40) {
      local_4 = (short)iVar17;
    }
    else {
      local_4 = local_4 + 0x40;
    }
  }
  if ((int)sVar11 < (int)local_4) {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
  }
  else {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    local_4 = sVar11;
  }
  add_unit_to_cell(param_1,&local_8);
LAB_004de205:
  if ((((byte)level_flags & 4) != 0) && (*(char *)(param_1 + 0x2f) == player_tribe_num)) {
    local_36 = CONCAT11(*(undefined1 *)(param_1 + 0x40),*(undefined1 *)(param_1 + 0x3e));
    if ((*(byte *)(&game_state.level_data[0].flags + ((local_36 & 0xfe) * 2 | local_36 & 0xfe00)) &
        8) == 0) {
      FUN_00450610(2,CONCAT22(uStack_30,
                              CONCAT11(*(undefined1 *)(param_1 + 0x40),
                                       *(undefined1 *)(param_1 + 0x3e))) & 0xfffffefe);
    }
  }
  puVar4 = unit_land_array[*(ushort *)(param_1 + 0x89)];
  if (puVar4 != (unit_struct *)0x0) {
    uVar19 = 0x45;
    if (((*(char *)(param_1 + 0x2d) != '\a') && (*(char *)(param_1 + 0x2d) != '\b')) &&
       ((bVar21 || (bVar6)))) {
      uVar19 = 0x3e;
    }
    FUN_004de440(puVar4,uVar19,0);
    add_unit_to_cell(puVar4,param_1 + 0x3d);
    uVar19 = 1;
    puVar4->flags_2 = puVar4->flags_2 & 0xfffffffb;
    puVar4->maybe_shape_angle = *(undefined2 *)(param_1 + 0x26);
    iVar17 = 0;
    if (((((*(uint *)(param_1 + 0xc) & 0x8020) == 0) && (!bVar21)) && (!bVar6)) &&
       (iVar20 = (int)*(short *)(param_1 + 0x5f), iVar20 < iVar15)) {
      iVar17 = 100;
      if (iVar15 / 3 < iVar20) {
        iVar17 = iVar15 - iVar20;
      }
      if (iVar17 < 0) {
        iVar17 = 0;
      }
      if (100 < iVar17) {
        iVar17 = 100;
      }
      iVar17 = (iVar17 * 0x1c7) / 100;
      uVar19 = 0x2d;
    }
    if ((*(char *)(param_1 + 0x2d) == '\t') && (*(char *)(param_1 + 0xa8) == '\x01')) {
      uVar19 = 0x22;
      iVar17 = 0x700;
    }
    uVar10 = calc_angular_interpolation
                       (CONCAT22((short)((uint)iVar17 >> 0x10),*(undefined2 *)&puVar4->field_0x6c),
                        iVar17,uVar19);
    *(undefined2 *)&puVar4->field_0x6c = uVar10;
    iVar15 = 0;
    if ((((*(uint *)(param_1 + 0xc) & 0x8020) == 0) && (!bVar21)) || (bVar7)) {
      if (bVar7) {
        iVar15 = 0xaa;
      }
      else {
        sVar11 = calc_angular_diff_shortest
                           (*(undefined2 *)(param_1 + 0x26),
                            CONCAT22((short)(*(uint *)(param_1 + 0xc) >> 0x10),
                                     *(undefined2 *)(param_1 + 0x5d)));
        iVar15 = (int)sVar11;
        local_c = 0;
        if (0x200 < iVar15) {
          iVar15 = iVar15 / 3;
          sVar11 = calc_abs_angular_diff
                             (*(undefined2 *)(param_1 + 0x26),
                              CONCAT22((short)((uint)iVar15 >> 0x10),*(undefined2 *)(param_1 + 0x5d)
                                      ));
          local_c = (int)sVar11;
        }
      }
      if (0x155 < iVar15) {
        iVar15 = 0x155;
      }
      iVar15 = local_c * iVar15;
    }
    uVar10 = calc_angular_interpolation(*(undefined2 *)&puVar4->field_0x6e,iVar15,0x38);
    *(undefined2 *)&puVar4->field_0x6e = uVar10;
    uVar19 = *(undefined4 *)(param_1 + 0x43);
    (puVar4->vec1).x = (short)uVar19;
    (puVar4->vec1).y = (short)((uint)uVar19 >> 0x10);
    (puVar4->vec1).z = *(undefined2 *)(param_1 + 0x47);
    puVar4->r2 = *(undefined2 *)(param_1 + 0x28);
  }
  return;
}
