/* Ghidra 12.1.3 pseudocode; entry 004bb440; FUN_004bb440.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004bb622) */
/* WARNING: Removing unreachable block (ram,0x004bb62a) */

void FUN_004bb440(int param_1)

{
  short *psVar1;
  char cVar2;
  ushort uVar3;
  short sVar4;
  undefined4 uVar5;
  unit_struct *puVar6;
  bool bVar7;
  bool bVar8;
  bool bVar9;
  bool bVar10;
  ushort uVar11;
  ushort uVar12;
  short sVar13;
  uint uVar14;
  uint uVar15;
  int iVar16;
  uint uVar17;
  uint uVar18;
  int iVar19;
  int iVar20;
  ushort *puVar21;
  int iVar22;
  unit_struct *puVar23;
  ushort local_38;
  ushort uStack_36;
  undefined2 local_34;
  unit_struct *local_2c;
  int local_28;
  short local_10;
  short sStack_e;
  short local_c;
  undefined4 local_8;
  short local_4;

  bVar7 = false;
  bVar8 = false;
  bVar9 = false;
  bVar10 = true;
  local_28 = (int)*(short *)(param_1 + 0x5f);
  cVar2 = *(char *)(param_1 + 0x2d);
  uVar3 = *(ushort *)(param_1 + 0x35);
  if (cVar2 == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 1;
    bVar10 = false;
    add_unit_to_cell(param_1,param_1 + 0x70);
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x100;
    if (*(short *)(param_1 + 0x6a) < 0) {
      *(undefined2 *)(param_1 + 0x6a) = 0;
    }
    if (4 < *(short *)(param_1 + 0x6a)) {
      *(undefined2 *)(param_1 + 0x6a) = 4;
    }
    iVar22 = 0;
    if (0 < *(short *)(param_1 + 0x6a)) {
      do {
        iVar16 = alloc_unit(7,10,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
        if (iVar16 != 0) {
          *(undefined2 *)(param_1 + 0x88 + iVar22 * 2) = *(undefined2 *)(iVar16 + 0x24);
          *(undefined2 *)(iVar16 + 0x6c) = 0xffff;
          *(short *)(iVar16 + 0x33) = (short)iVar22 + 0x464;
          *(byte *)(iVar16 + 0x35) = *(byte *)(iVar16 + 0x35) | 2;
          *(uint *)(iVar16 + 0x14) = *(uint *)(iVar16 + 0x14) | 0x100;
          *(undefined4 *)(iVar16 + 0x43) = *(undefined4 *)(param_1 + 0x43);
          *(undefined2 *)(iVar16 + 0x47) = *(undefined2 *)(param_1 + 0x47);
          if ((uVar3 & 0x40) != 0) {
            *(byte *)(iVar16 + 0x35) = *(byte *)(iVar16 + 0x35) | 0x40;
          }
          if (iVar22 == 0) {
            sunlight_update_unit_landscape(iVar16,4,4,0);
          }
        }
        iVar22 = iVar22 + 1;
      } while (iVar22 < *(short *)(param_1 + 0x6a));
    }
    if (((*(byte *)(param_1 + 0x6e) & 2) != 0) &&
       (iVar22 = alloc_unit(7,0x4f,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d), iVar22 != 0)) {
      *(undefined2 *)(param_1 + 0x94) = *(undefined2 *)(iVar22 + 0x24);
    }
  }
  else if (cVar2 != '\x01') {
    if (cVar2 == '\x02') {
      bVar8 = true;
    }
    goto LAB_004bb6ff;
  }
  psVar1 = (short *)(param_1 + 0x76);
  uVar14 = (int)*psVar1 - (int)*(short *)(param_1 + 0x3d);
  uVar17 = (int)uVar14 >> 0x1f;
  if (((((int)((uVar14 ^ uVar17) - uVar17) < 0x408) &&
       (uVar14 = (int)*(short *)(param_1 + 0x7a) - (int)*(short *)(param_1 + 0x41),
       uVar17 = (int)uVar14 >> 0x1f, (int)((uVar14 ^ uVar17) - uVar17) < 0x408)) &&
      (uVar14 = (int)*(short *)(param_1 + 0x78) - (int)*(short *)(param_1 + 0x3f),
      uVar17 = (int)uVar14 >> 0x1f, (int)((uVar14 ^ uVar17) - uVar17) < 0x408)) &&
     (iVar22 = FUN_00450520(psVar1,param_1 + 0x3d), iVar22 < local_28)) {
    bVar7 = true;
    bVar9 = true;
    *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
    local_28 = iVar22;
  }
  if (bVar7) {
    local_c = *(short *)(param_1 + 0x7a);
    local_10 = (short)*(undefined4 *)psVar1;
    sStack_e = (short)((uint)*(undefined4 *)psVar1 >> 0x10);
  }
  else {
    sVar13 = *(short *)(param_1 + 0x41);
    uVar14 = (uint)(ushort)(*psVar1 - *(short *)(param_1 + 0x3d));
    sVar4 = *(short *)(param_1 + 0x7a);
    uVar17 = (uint)(ushort)(*(short *)(param_1 + 0x78) - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar14) {
      uVar14 = uVar14 - 0x10000;
    }
    if (0x7fff < uVar17) {
      uVar17 = uVar17 - 0x10000;
    }
    uVar18 = uVar14;
    if ((int)uVar14 < 0) {
      uVar18 = -uVar14;
    }
    uVar15 = uVar17;
    if ((int)uVar17 < 0) {
      uVar15 = -uVar17;
    }
    if ((int)uVar18 <= (int)uVar15) {
      uVar18 = uVar15;
    }
    uVar11 = calc_angle_quadrant(uVar14,-uVar17);
    local_38 = uVar11 & 0x7ff;
    uVar12 = calc_angle_quadrant(uVar18,((int)sVar4 - (int)sVar13) * -2);
    uStack_36 = uVar12 & 0x7ff;
    local_c = *(short *)(param_1 + 0x41);
    local_10 = (short)*(undefined4 *)(param_1 + 0x3d);
    sStack_e = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
    FUN_004e6ac0(&local_10,CONCAT22(uVar12,uVar11) & 0x7ff07ff,
                 CONCAT22(local_34,uVar12) & 0xffff07ff,local_28);
  }
  sVar13 = calc_point_height(CONCAT22(sStack_e,local_10),CONCAT22(local_c,sStack_e));
  if (local_c < sVar13) {
    local_c = sVar13;
  }
  add_unit_to_cell(param_1,&local_10);
LAB_004bb6ff:
  if (bVar8) {
    update_after_unit_alloc(param_1);
  }
  else if (bVar9) {
    puVar21 = (ushort *)(param_1 + 0x94);
    iVar22 = 2;
    FUN_004bb290(param_1);
    do {
      puVar23 = (unit_struct *)0x0;
      if (((*puVar21 != 0) && (puVar6 = unit_land_array[*puVar21], (puVar6->flags_2 & 1) == 0)) &&
         (puVar6->unit_class != '\0')) {
        puVar23 = puVar6;
      }
      if (puVar23 != (unit_struct *)0x0) {
        FUN_004ef180(puVar23);
      }
      puVar21 = puVar21 + 1;
      iVar22 = iVar22 + -1;
    } while (iVar22 != 0);
    iVar22 = 0;
    if (0 < *(short *)(param_1 + 0x6a)) {
      puVar21 = (ushort *)(param_1 + 0x88);
      do {
        puVar23 = (unit_struct *)0x0;
        if (((*puVar21 != 0) &&
            (puVar6 = unit_land_array[*puVar21], (*(byte *)&puVar6->flags_2 & 1) == 0)) &&
           (puVar6->unit_class != '\0')) {
          puVar23 = puVar6;
        }
        if (puVar23 != (unit_struct *)0x0) {
          FUN_004ef180(puVar23);
        }
        puVar21 = puVar21 + 1;
        iVar22 = iVar22 + 1;
      } while (iVar22 < *(short *)(param_1 + 0x6a));
      return;
    }
  }
  else {
    iVar22 = 0;
    iVar20 = 0;
    iVar16 = FUN_00450520((undefined4 *)(param_1 + 0x3d),param_1 + 0x70);
    if (0 < *(short *)(param_1 + 0x6a)) {
      do {
        local_2c = (unit_struct *)0x0;
        uVar11 = *(ushort *)(param_1 + 0x88 + iVar20 * 2);
        if (((uVar11 != 0) &&
            (puVar23 = unit_land_array[uVar11], (*(byte *)&puVar23->flags_2 & 1) == 0)) &&
           (puVar23->unit_class != '\0')) {
          local_2c = puVar23;
        }
        if (local_2c != (unit_struct *)0x0) {
          local_c = *(short *)(param_1 + 0x41);
          uVar5 = *(undefined4 *)(param_1 + 0x3d);
          local_10 = (short)uVar5;
          sStack_e = (short)((uint)uVar5 >> 0x10);
          iVar22 = iVar22 + *(short *)(param_1 + 0x6c);
          FUN_004e6ac0(&local_10,CONCAT22(uStack_36,local_38),CONCAT22(local_34,uStack_36),
                       -((iVar20 + 1) * (int)*(short *)(param_1 + 0x6c)));
          if (iVar22 < iVar16) {
            add_unit_to_cell(local_2c,&local_10);
          }
        }
        iVar20 = iVar20 + 1;
      } while (iVar20 < *(short *)(param_1 + 0x6a));
    }
    if ((bVar10) && ((*(byte *)(param_1 + 0x6e) & 1) != 0)) {
      iVar20 = 0;
      do {
        iVar20 = iVar20 + 1;
        local_8._0_2_ = local_10;
        local_8._2_2_ = sStack_e;
        local_4 = local_c;
        iVar22 = iVar22 + *(short *)(param_1 + 0x6c) * 2;
        FUN_004e6ac0(&local_8,CONCAT22(uStack_36,local_38),CONCAT22(local_34,uStack_36),
                     *(short *)(param_1 + 0x6c) * iVar20 * -2);
        if (iVar22 < iVar16) {
          uVar17 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar14 = uVar17 >> 0xd;
          uVar18 = (uVar14 | uVar17 * 0x80000) * 0x24a1 + 0x24df;
          uVar17 = uVar18 >> 0xd;
          uVar18 = uVar18 * 0x80000;
          game_state.pseudo_random_val = uVar17 | uVar18;
          local_34 = (undefined2)uVar17;
          local_8 = CONCAT22(local_8._2_2_ + (8 - (short)(uVar17 & 0xffff000f)),
                             (short)local_8 + (8 - ((ushort)uVar14 & 0xf)));
          iVar19 = alloc_unit(7,3,CONCAT31((uint3)((uVar17 & 0xffff000f) >> 8) |
                                           (uint3)(uVar18 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                              &local_8);
          if (iVar19 != 0) {
            if ((uVar3 & 0x40) != 0) {
              *(byte *)(iVar19 + 0x35) = *(byte *)(iVar19 + 0x35) | 0x40;
            }
            *(undefined2 *)(iVar19 + 0x6c) = 0;
            *(uint *)(iVar19 + 0x14) = *(uint *)(iVar19 + 0x14) | 0x100;
            *(undefined4 *)(iVar19 + 0x43) = *(undefined4 *)(param_1 + 0x43);
            *(undefined2 *)(iVar19 + 0x47) = *(undefined2 *)(param_1 + 0x47);
          }
        }
      } while (iVar20 < 4);
    }
    if ((*(byte *)(param_1 + 0x6e) & 2) != 0) {
      puVar23 = (unit_struct *)0x0;
      local_8 = CONCAT22(sStack_e,local_10);
      local_4 = local_c;
      if (((*(ushort *)(param_1 + 0x94) != 0) &&
          (puVar6 = unit_land_array[*(ushort *)(param_1 + 0x94)],
          (*(byte *)&puVar6->flags_2 & 1) == 0)) && (puVar6->unit_class != '\0')) {
        puVar23 = puVar6;
      }
      if (puVar23 != (unit_struct *)0x0) {
        add_unit_to_cell(puVar23,&local_8);
        puVar23->flags_3 = puVar23->flags_3 | 0x100;
        uVar5 = *(undefined4 *)(param_1 + 0x43);
        (puVar23->vec1).x = (short)uVar5;
        (puVar23->vec1).y = (short)((uint)uVar5 >> 0x10);
        (puVar23->vec1).z = *(undefined2 *)(param_1 + 0x47);
        return;
      }
    }
  }
  return;
}
