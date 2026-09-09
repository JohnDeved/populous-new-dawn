/* Ghidra 12.1.3 pseudocode; entry 00503550; FUN_00503550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00503986) */
/* WARNING: Removing unreachable block (ram,0x00503990) */

void FUN_00503550(int param_1)

{
  undefined2 *puVar1;
  char cVar2;
  ushort uVar3;
  unit_struct *puVar4;
  byte bVar5;
  byte bVar6;
  ushort uVar7;
  ushort uVar8;
  ushort uVar9;
  ushort uVar10;
  ushort uVar11;
  ushort uVar12;
  char cVar13;
  ushort uVar14;
  short sVar15;
  short sVar16;
  undefined2 uVar17;
  uint uVar18;
  ushort *puVar19;
  undefined2 extraout_var;
  int iVar20;
  int iVar21;
  ushort *puVar22;
  short *psVar23;
  shape_entry *psVar24;
  uint uVar25;
  ushort *puVar26;
  undefined2 extraout_var_00;
  short *psVar27;
  undefined2 extraout_var_01;
  int iVar28;
  undefined2 uVar29;
  int *piVar30;
  byte local_94;
  byte bStack_91;
  ushort local_90;
  undefined2 local_8e;
  undefined2 local_8c;
  undefined2 local_8a;
  ushort local_88;
  ushort local_86;
  undefined4 local_84;
  undefined2 local_80;
  uint local_7c;
  byte *local_78;
  int local_74;
  undefined4 local_70;
  ushort local_6c [2];
  int local_68;
  ushort local_64;
  int local_60;
  ushort local_5c;
  int local_58;
  ushort local_54;
  int local_50;
  ushort local_4c;
  int local_48;
  ushort local_44;
  int local_40;
  ushort local_3c;
  int local_38;
  ushort local_34;
  int local_30;
  ushort local_2c;
  uint local_28;
  uint local_24;
  int local_20 [8];

  cVar13 = *(char *)(param_1 + 0xa7) + -1;
  iVar28 = 0;
  *(char *)(param_1 + 0xa7) = cVar13;
  if (cVar13 < '\x01') {
    DAT_0089c65d = 0;
    for (puVar4 = allocated_units_2; puVar4 != (unit_struct *)0x0; puVar4 = puVar4->next_unit_1) {
      if ((puVar4->unit_class == '\n') && (puVar4->unit_type == '\x10')) {
        DAT_0089c65d = DAT_0089c65d + 1;
      }
    }
    DAT_0089ce61 = 0;
    if (DAT_0089c65d < 0x21) {
      DAT_0089ce61 = 8;
    }
    if (DAT_0089c65d < 0x16) {
      DAT_0089ce61 = 4;
    }
    if (DAT_0089c65d < 0xd) {
      DAT_0089ce61 = 2;
    }
    update_after_unit_alloc(param_1);
    return;
  }
  piVar30 = local_20;
  for (iVar20 = 8; iVar20 != 0; iVar20 = iVar20 + -1) {
    *piVar30 = 0;
    piVar30 = piVar30 + 1;
  }
  get_building_coords(param_1,&local_88);
  local_88 = (local_88 & 0xfe00) + 0x100;
  local_86 = (local_86 & 0xfe00) + 0x100;
  local_70 = (ushort *)
             (CONCAT31(local_70._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) &
             0xfffffffe);
  local_70 = (ushort *)
             (CONCAT22(local_70._2_2_,
                       CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                                (undefined1)local_70)) & 0xfffffeff);
  psVar24 = shapes_mem +
            (char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                  [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  local_8e._0_1_ = (char)local_70;
  local_8e._0_1_ = (char)local_8e - psVar24->x2;
  local_8e._1_1_ = (char)((uint)local_70 >> 8);
  local_8e = CONCAT11(local_8e._1_1_ - psVar24->y2,(char)local_8e);
  local_7c = (uint)(byte)psVar24->x1;
  local_78 = psVar24->ptr;
  local_74 = 0;
  local_8c = local_8e;
  if ((byte)psVar24->y1 != 0) {
    local_24 = (uint)(byte)psVar24->y1;
    do {
      if (0 < (int)local_7c) {
        local_28 = local_7c;
        do {
          bStack_91 = (byte)(local_8c >> 8);
          bVar6 = bStack_91;
          bVar5 = (byte)local_8c;
          if ((*local_78 & 5) != 0) {
            local_74 = local_74 + 1;
            if ((*local_78 & 4) == 0) {
              iVar20 = 1;
              local_6c[0] = local_8c;
              local_70 = (ushort *)(((local_8c & 0xfe) * 2 | local_8c & 0xfe00) * 4 + 0x8a03e4);
            }
            else {
              iVar20 = 9;
              local_94 = bVar5 & 0xfe;
              bStack_91 = bStack_91 & 0xfe;
              cVar13 = bStack_91 + 2;
              local_8a = CONCAT11(cVar13,local_94 - 2);
              uVar14 = local_8a;
              local_6c[0] = local_8a;
              local_8a = CONCAT11(cVar13,bVar5) & 0xfffe;
              uVar3 = local_8a;
              local_64 = local_8a;
              cVar2 = local_94 + 2;
              local_8a = CONCAT11(cVar13,cVar2);
              uVar7 = local_8a;
              local_5c = local_8a;
              local_8a = CONCAT11(bVar6,cVar2) & 0xfeff;
              uVar8 = local_8a;
              local_54 = local_8a;
              cVar13 = bStack_91 - 2;
              local_8a = CONCAT11(cVar13,cVar2);
              uVar9 = local_8a;
              local_4c = local_8a;
              local_8a = CONCAT11(cVar13,bVar5) & 0xfffe;
              uVar10 = local_8a;
              local_44 = local_8a;
              local_8a = CONCAT11(cVar13,local_94 - 2);
              uVar11 = local_8a;
              local_3c = local_8a;
              local_8a = CONCAT11(bVar6,local_94 - 2) & 0xfeff;
              uVar12 = local_8a;
              local_34 = local_8a;
              local_8a = local_8c & 0xfefe;
              local_2c = local_8a;
              local_70 = (ushort *)(((uVar14 & 0xfe) * 2 | uVar14 & 0xfe00) * 4 + 0x8a03e4);
              local_68 = ((uVar3 & 0xfe) * 2 | uVar3 & 0xfe00) * 4 + 0x8a03e4;
              local_60 = ((uVar7 & 0xfe) * 2 | uVar7 & 0xfe00) * 4 + 0x8a03e4;
              local_58 = ((uVar8 & 0xfe) * 2 | uVar8 & 0xfe00) * 4 + 0x8a03e4;
              local_50 = ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 0x8a03e4;
              local_48 = ((uVar10 & 0xfe) * 2 | uVar10 & 0xfe00) * 4 + 0x8a03e4;
              local_40 = ((uVar11 & 0xfe) * 2 | uVar11 & 0xfe00) * 4 + 0x8a03e4;
              local_38 = ((uVar12 & 0xfe) * 2 | uVar12 & 0xfe00) * 4 + 0x8a03e4;
              local_30 = ((local_8a & 0xfe) * 2 | local_8a & 0xfe00) * 4 + 0x8a03e4;
            }
            if (iVar20 != 0) {
              piVar30 = &local_70;
              do {
                if ((*(byte *)(landscape_height_array + (*(byte *)(*piVar30 + 0xc) & 0xf)) & 2) != 0
                   ) {
                  if (piVar30 == &local_70) {
                    iVar28 = iVar28 + 1;
                  }
                  local_90 = *(ushort *)(piVar30 + 1) & 0xfefe;
                  uVar25 = (uint)(ushort)(((*(ushort *)(piVar30 + 1) & 0xfe) + 1) * 0x100 - local_88
                                         );
                  uVar18 = (uint)(ushort)(((local_90 >> 8) + 1) * 0x100 - local_86);
                  if (0x7fff < uVar25) {
                    uVar25 = uVar25 - 0x10000;
                  }
                  if (0x7fff < uVar18) {
                    uVar18 = uVar18 - 0x10000;
                  }
                  uVar14 = calc_angle_quadrant(uVar25,-uVar18);
                  local_20[((uVar14 & 0x7ff) + 0x80 & 0x700) >> 8] =
                       local_20[((uVar14 & 0x7ff) + 0x80 & 0x700) >> 8] + 1;
                }
                piVar30 = piVar30 + 2;
                iVar20 = iVar20 + -1;
              } while (iVar20 != 0);
            }
          }
          local_8c = CONCAT11(bVar6,bVar5 + 2);
          local_78 = local_78 + 1;
          local_28 = local_28 - 1;
        } while (local_28 != 0);
      }
      local_24 = local_24 - 1;
      local_8c = CONCAT11(local_8c._1_1_ + '\x02',(char)local_8e);
    } while (local_24 != 0);
  }
  iVar20 = 0;
  do {
    iVar21 = -1;
    puVar19 = local_6c + iVar20 * 2 + -2;
    puVar19[0] = 0;
    puVar19[1] = 0;
    do {
      uVar25 = iVar21 + iVar20;
      iVar21 = iVar21 + 1;
      *(int *)puVar19 = *(int *)puVar19 + local_20[uVar25 & 7];
    } while (iVar21 < 2);
    iVar20 = iVar20 + 1;
  } while (iVar20 < 8);
  uVar18 = 0;
  iVar20 = 0;
  uVar25 = (uint)local_70;
  do {
    if (iVar20 < *(int *)(local_6c + uVar18 * 2 + -2)) {
      iVar20 = *(int *)(local_6c + uVar18 * 2 + -2);
      uVar25 = uVar18;
    }
    uVar18 = uVar18 + 1;
  } while ((int)uVar18 < 8);
  if (iVar28 < local_74) {
    if (*(short *)(param_1 + 0x94) == iVar20) {
      uVar25 = (uint)*(short *)(param_1 + 0x92);
    }
    *(short *)(param_1 + 0x92) = (short)uVar25;
    *(short *)(param_1 + 0x94) = (short)iVar20;
  }
  else {
    uVar25 = (uint)*(short *)(param_1 + 0x92);
  }
  uVar14 = *(ushort *)(param_1 + 0x6c);
  local_70 = (ushort *)(param_1 + 0x6e);
  uVar3 = *local_70;
  puVar19 = local_70;
  puVar26 = (ushort *)(uint)uVar14;
  if (0x200 < uVar14) {
    puVar19 = (ushort *)(0x800 - (int)(uint)uVar14);
    puVar26 = puVar19;
  }
  puVar22 = (ushort *)(uint)uVar3;
  if (0x200 < uVar3) {
    puVar19 = (ushort *)(0x800 - (int)(uint)uVar3);
    puVar22 = puVar19;
  }
  if ((0x38 < (int)puVar26) || (0x38 < (int)puVar22)) {
    *(undefined1 *)(param_1 + 0x2d) = 2;
  }
  uVar17 = (undefined2)((uint)puVar19 >> 0x10);
  if (*(char *)(param_1 + 0x2d) == '\0') {
    uVar29 = (undefined2)(uVar25 << 8);
    *(undefined2 *)(param_1 + 0x88) = uVar29;
    *(undefined2 *)(param_1 + 0x86) = uVar29;
    *(undefined2 *)(param_1 + 0x8a) = 0;
    *(undefined1 *)(param_1 + 0x2d) = 1;
    *(undefined2 *)(param_1 + 0x8c) = 1;
    sVar15 = calc_abs_angular_diff(uVar25 << 8,CONCAT22(uVar17,*(undefined2 *)(param_1 + 0x26)));
    *(undefined2 *)(param_1 + 0x8e) = 0;
    *(short *)(param_1 + 0x90) = sVar15;
    if ((sVar15 == 0) ||
       (sVar15 = calc_angular_diff_shortest
                           (CONCAT22(extraout_var_01,*(undefined2 *)(param_1 + 0x88)),
                            CONCAT22(sVar15 >> 0xf,*(undefined2 *)(param_1 + 0x26))), 0x3ff < sVar15
       )) {
      *(ushort *)(param_1 + 0x90) = (-(ushort)((*(byte *)(param_1 + 0x2e) & 1) == 0) & 0xfffe) + 1;
    }
    goto LAB_00503db9;
  }
  if (*(char *)(param_1 + 0x2d) == '\x02') {
    sVar15 = *(short *)(param_1 + 0x8a) + 2;
    *(short *)(param_1 + 0x8a) = sVar15;
    if (sVar15 < 0) {
      *(undefined2 *)(param_1 + 0x8a) = 0;
    }
    if (0x1a < *(short *)(param_1 + 0x8a)) {
      *(undefined2 *)(param_1 + 0x8a) = 0x1a;
    }
    local_80 = 0;
    local_84._0_2_ = *(undefined2 *)(param_1 + 0x7a);
    sVar15 = *(short *)(param_1 + 0x86);
    local_84._2_2_ = *(undefined2 *)(param_1 + 0x7c);
    move_pos_angle_length(&local_84,(int)sVar15,CONCAT22(uVar17,*(undefined2 *)(param_1 + 0x8a)));
    *(undefined2 *)(param_1 + 0x7c) = local_84._2_2_;
    *(undefined2 *)(param_1 + 0x7a) = (undefined2)local_84;
    local_84 = *(undefined4 *)(param_1 + 0x3d);
    local_80 = *(undefined2 *)(param_1 + 0x41);
    move_pos_angle_length
              (&local_84,(int)sVar15,
               CONCAT22((short)((uint)local_84 >> 0x10),*(undefined2 *)(param_1 + 0x8a)));
    add_unit_to_cell(param_1,&local_84);
    uVar17 = extraout_var;
  }
  sVar15 = (short)uVar25 << 8;
  *(short *)(param_1 + 0x88) = sVar15;
  if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
    sVar16 = *(short *)(param_1 + 0x8c) + 2;
    *(short *)(param_1 + 0x8c) = sVar16;
    if (sVar16 < 0) {
      *(undefined2 *)(param_1 + 0x8c) = 0;
    }
    if (0x14 < *(short *)(param_1 + 0x8c)) {
      *(undefined2 *)(param_1 + 0x8c) = 0x14;
    }
  }
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) - *(short *)(param_1 + 0x8c);
  puVar1 = (undefined2 *)(param_1 + 0x86);
  uVar17 = calc_angular_interpolation
                     (CONCAT22(uVar17,*puVar1),CONCAT22((short)(uVar25 >> 0x10),sVar15),5);
  *puVar1 = uVar17;
  sVar15 = calc_abs_angular_diff(CONCAT22(extraout_var_00,*puVar1),*(undefined2 *)(param_1 + 0x26));
  if (sVar15 < 1) {
    if (-1 < *(short *)(param_1 + 0x90)) goto LAB_00503cd2;
    *(short *)(param_1 + 0x8e) = *(short *)(param_1 + 0x8e) + 2;
  }
  else if (*(short *)(param_1 + 0x90) < 1) {
LAB_00503cd2:
    *(short *)(param_1 + 0x8e) = *(short *)(param_1 + 0x8e) + -6;
  }
  else {
    *(short *)(param_1 + 0x8e) = *(short *)(param_1 + 0x8e) + 2;
  }
  psVar23 = (short *)(param_1 + 0x8e);
  psVar27 = (short *)(param_1 + 0x90);
  if ((*psVar23 < 1) && (*psVar27 = -*psVar27, *psVar23 < 0)) {
    *psVar23 = 0;
  }
  if (0x38 < *psVar23) {
    *psVar23 = 0x38;
  }
  uVar14 = *psVar23 * *psVar27 + *(short *)(param_1 + 0x26);
  *(ushort *)(param_1 + 0x26) = uVar14;
  *(ushort *)(param_1 + 0x26) = uVar14 & 0x7ff;
LAB_00503db9:
  FUN_00503e60(*(undefined2 *)(param_1 + 0x86),param_1 + 0x6c,local_70);
  return;
}
