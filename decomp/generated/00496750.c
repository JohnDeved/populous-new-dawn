/* Ghidra 12.1.3 pseudocode; entry 00496750; FUN_00496750.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00496f27) */
/* WARNING: Removing unreachable block (ram,0x00496e17) */
/* WARNING: Removing unreachable block (ram,0x00496e21) */
/* WARNING: Removing unreachable block (ram,0x004968e3) */
/* WARNING: Removing unreachable block (ram,0x00496f31) */
/* WARNING: Removing unreachable block (ram,0x004968ed) */

undefined1 FUN_00496750(int param_1)

{
  undefined1 *puVar1;
  short *psVar2;
  short sVar3;
  short sVar4;
  unit_struct *puVar5;
  bool bVar6;
  byte bVar7;
  byte bVar8;
  char cVar9;
  char cVar10;
  ushort uVar11;
  int iVar12;
  uint uVar13;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  undefined2 extraout_var_02;
  undefined2 uVar14;
  unit_struct *puVar15;
  unit_struct *puVar16;
  uint uVar17;
  bool bVar18;
  undefined2 local_1a;
  byte bStack_16;
  byte bStack_15;
  undefined2 uStack_14;
  undefined2 local_12;
  uint local_10;
  uint local_c;
  int local_8;
  int local_4;

  cVar10 = '\0';
  local_8 = param_1 + 0x83;
  puVar15 = unit_land_array[*(ushort *)(param_1 + 0x89)];
  puVar1 = &puVar15->unit_class;
  bVar18 = *puVar1 == '\x02';
  if (((*(byte *)(param_1 + 0xf) & 0x40) != 0) || ((*(byte *)(param_1 + 0x76) & 0x10) != 0)) {
    if (*puVar1 == '\t') {
      FUN_004b9fc0();
      uVar14 = extraout_var_01;
    }
    else {
      FUN_004044b0(puVar15,&uStack_14);
      uVar14 = extraout_var_02;
    }
    bVar7 = (byte)((ushort)uStack_14 >> 8);
    bStack_16 = bVar7 & 0xfe;
    bVar8 = (byte)((ushort)local_12 >> 8);
    bStack_15 = bVar8 & 0xfe;
    FUN_004935c0(&puVar15->field_0x66,CONCAT22(uStack_14,CONCAT11(bVar8,bVar7)) & 0xfffffefe,
                 CONCAT22(uVar14,puVar15->maybe_shape_angle),param_1);
  }
  if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
    *(undefined1 *)(param_1 + 0xa8) = 2;
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
  }
  switch(*(undefined1 *)(param_1 + 0xa8)) {
  case 1:
    if (bVar18) {
      cVar10 = FUN_00438f20();
      if (cVar10 == '\0') {
        return 0;
      }
      *(undefined1 *)(param_1 + 0xa8) = 3;
    }
    else {
      cVar10 = FUN_00438ca0(param_1,0x38);
      if (cVar10 == '\0') {
        return 0;
      }
      *(undefined1 *)(param_1 + 0xa8) = 3;
    }
    break;
  case 2:
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      if (*puVar1 == '\t') {
        FUN_004b9fc0();
      }
      else {
        FUN_004044b0(puVar15,&uStack_14);
      }
      if ((bVar18) ||
         (sVar3._0_1_ = puVar15->num_points, sVar3._1_1_ = puVar15->tex_size_type, sVar3 != 0)) {
        FUN_004d4f40(param_1);
        FUN_004e9d80(param_1,&uStack_14);
        uVar17 = (uint)(ushort)(uStack_14 - *(short *)(param_1 + 0x3d));
        uVar13 = (uint)(ushort)(local_12 - *(short *)(param_1 + 0x3f));
        if (0x7fff < uVar17) {
          uVar17 = uVar17 - 0x10000;
        }
        if (0x7fff < uVar13) {
          uVar13 = uVar13 - 0x10000;
        }
        uVar11 = calc_angle_quadrant(uVar17,-uVar13);
        uVar11 = uVar11 & 0x7ff;
        if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
          *(ushort *)(param_1 + 0x57) = uVar11;
        }
        *(ushort *)(param_1 + 0x5d) = uVar11;
        if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
          uVar11 = uVar11 + 0x400 & 0x7ff;
        }
        *(ushort *)(param_1 + 0x26) = uVar11;
      }
      else {
        cVar10 = '\x11';
      }
    }
    if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
      if (cVar10 == '\0') {
        cVar9 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x38);
        if (cVar9 != '\0') {
          cVar10 = '\x16';
        }
        goto LAB_00496962;
      }
    }
    else {
LAB_00496962:
      if (cVar10 == '\0') {
        return 0;
      }
    }
    *(char *)(param_1 + 0xa8) = cVar10;
    break;
  case 3:
    if (bVar18) {
      cVar10 = FUN_00439030();
      if (cVar10 == '\0') {
        return 0;
      }
      *(undefined1 *)(param_1 + 0xa8) = 5;
    }
    else {
      cVar10 = FUN_00438db0(param_1);
      if (cVar10 == '\0') {
        return 0;
      }
      *(undefined1 *)(param_1 + 0xa8) = 5;
    }
    break;
  case 4:
    puVar16 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar5 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar5->flags_2 & 1) == 0
        )) && (puVar5->unit_class != '\0')) {
      puVar16 = puVar5;
    }
    if (puVar16 == (unit_struct *)0x0) {
      cVar10 = '\x02';
    }
    else {
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        if ((puVar16->unit_class != '\x05') ||
           (bVar6 = true, (unit_type_array_scenery[(byte)puVar16->unit_type].flags_1 & 0x10) == 0))
        {
          bVar6 = false;
        }
        if (bVar6) {
          FUN_004d50d0(param_1);
          FUN_0048a050(param_1,1,0x10);
          *(ushort *)(param_1 + 0x70) =
               (ushort)(byte)unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x1d;
        }
        else {
          *(undefined2 *)(param_1 + 0x70) = 3;
          FUN_004d4ee0(param_1);
        }
      }
      cVar9 = FUN_004391a0(param_1);
      if (cVar9 != '\0') {
        FUN_004a7860(puVar16,param_1,
                     (int)(short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood);
        cVar10 = '\x01';
        FUN_004d3ea0(param_1);
        if (!bVar18) {
          puVar15 = unit_land_array[*(ushort *)(local_8 + 6)];
          sVar4._0_1_ = puVar15->num_points;
          sVar4._1_1_ = puVar15->tex_size_type;
          cVar10 = (-(sVar4 == 0) & 2U) + 1;
        }
        if (cVar10 == '\x01') {
          if (puVar15->unit_class == '\t') {
            FUN_004b9fc0();
          }
          else {
            FUN_004044b0(puVar15,&uStack_14);
          }
          uVar17 = (int)uStack_14 - (int)*(short *)(param_1 + 0x3d);
          uVar13 = (int)uVar17 >> 0x1f;
          if (((int)((uVar17 ^ uVar13) - uVar13) < 0xf8) &&
             (uVar17 = (int)local_12 - (int)*(short *)(param_1 + 0x3f), uVar13 = (int)uVar17 >> 0x1f
             , (int)((uVar17 ^ uVar13) - uVar13) < 0xf8)) {
            cVar10 = '\x03';
          }
        }
      }
    }
    if (cVar10 == '\0') {
      return 0;
    }
    *(char *)(param_1 + 0xa8) = cVar10;
    break;
  case 5:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 8;
    }
    cVar10 = FUN_004391a0(param_1);
    if (cVar10 == '\0') {
      return 0;
    }
    FUN_004a7860(param_1,unit_land_array[*(ushort *)(local_8 + 6)],(int)*(short *)(param_1 + 0x78));
    return 2;
  default:
    goto switchD_0049681f_caseD_6;
  case 0x11:
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      FUN_004d4ee0(param_1);
      *(undefined2 *)(param_1 + 0x70) = 8;
    }
    if (*(short *)(param_1 + 0x78) == 0) {
      if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
        if (*puVar1 == '\t') {
          FUN_004b9fc0();
          uVar14 = extraout_var;
        }
        else {
          FUN_004044b0(puVar15,&uStack_14);
          uVar14 = extraout_var_00;
        }
        FUN_004935c0(&puVar15->field_0x66,
                     CONCAT13(bStack_15,CONCAT12(bStack_16,CONCAT11(local_12._1_1_,uStack_14._1_1_))
                             ) & 0xfffffefe,CONCAT22(uVar14,puVar15->maybe_shape_angle),param_1);
        cVar9 = FUN_00493910((int)(char)puVar15->field_0x66,&local_4,param_1,1,0);
        if (cVar9 == '\0') {
          cVar10 = '\x18';
          *(undefined2 *)(param_1 + 0x72) = *(undefined2 *)(local_4 + 0x24);
          puVar15->flags_3 = puVar15->flags_3 & 0xffffefff;
        }
        else {
          if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
            uVar17 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            game_state.pseudo_random_val = uVar17 >> 0xd | uVar17 * 0x80000;
            local_c = game_state.pseudo_random_val;
            update_gs_unit_related_array_item(param_1);
            uVar17 = *(uint *)(param_1 + 0xc);
            *(uint *)(param_1 + 0xc) = uVar17 | 0x80;
            *(uint *)(param_1 + 0xc) = uVar17 | 0x1080;
            *(ushort *)(param_1 + 0x57) = (ushort)local_c & 0x7ff;
          }
          cVar9 = FUN_004391a0(param_1);
          if (cVar9 != '\0') {
            cVar10 = '\x1b';
          }
          puVar15->flags_3 = puVar15->flags_3 | 0x1000;
        }
      }
    }
    else {
      cVar10 = '\x05';
    }
    if (cVar10 == '\0') {
      return 0;
    }
    *(char *)(param_1 + 0xa8) = cVar10;
    break;
  case 0x16:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      if (*puVar1 == '\t') {
        FUN_004b9fc0();
      }
      else {
        FUN_004044b0(puVar15,&uStack_14);
      }
      local_1a = CONCAT11(local_12._1_1_,uStack_14._1_1_);
      iVar12 = FUN_00493f10(((local_1a & 0xfe) * 2 | local_1a & 0xfe00) * 4 + 0x8a03e4,
                            CONCAT31((int3)((local_1a & 0xfe00) >> 8),
                                     *(undefined1 *)(param_1 + 0x2f)));
      if (iVar12 != 0) {
        uVar14 = *(undefined2 *)(iVar12 + 0x24);
        cVar10 = '\x18';
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        *(undefined2 *)(param_1 + 0x72) = uVar14;
        *(undefined1 *)(param_1 + 0xa8) = 0x18;
      }
    }
    if (cVar10 != '\0') {
      return 0;
    }
    cVar10 = FUN_00439740(param_1);
    goto joined_r0x00496eb9;
  case 0x18:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 0x400;
      FUN_004392a0(param_1);
      if ((*(uint *)(param_1 + 0x10) & 0x10000000) == 0) {
        FUN_004a8e20(unit_land_array[*(short *)(param_1 + 0x72)]);
      }
      else {
        *(undefined1 *)(param_1 + 0xa8) = 0x1b;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
      }
    }
    psVar2 = (short *)(param_1 + 0x70);
    *psVar2 = *psVar2 + -1;
    if (*psVar2 == 0) {
LAB_00496da3:
      cVar10 = '2';
    }
    else {
      cVar9 = FUN_004392a0(param_1);
      if (cVar9 == '\x01') {
        cVar10 = '\x04';
      }
      else if (cVar9 == '\x02') goto LAB_00496da3;
    }
    if (cVar10 == '\0') {
      return 0;
    }
    *(char *)(param_1 + 0xa8) = cVar10;
    break;
  case 0x1b:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 0x10;
      if (*puVar1 == '\t') {
        FUN_004b9fc0();
      }
      else {
        FUN_004044b0(puVar15,&uStack_14);
      }
      iVar12 = calc_distance_toroidal((short *)(param_1 + 0x3d),&uStack_14);
      if (iVar12 < 0x401) {
        uVar17 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar17 = uVar17 >> 0xd | uVar17 * 0x80000;
        game_state.pseudo_random_val = uVar17;
        local_10 = uVar17;
      }
      else {
        uVar17 = (uint)(ushort)(uStack_14 - *(short *)(param_1 + 0x3d));
        uVar13 = (uint)(ushort)(local_12 - *(short *)(param_1 + 0x3f));
        if (0x7fff < uVar17) {
          uVar17 = uVar17 - 0x10000;
        }
        if (0x7fff < uVar13) {
          uVar13 = uVar13 - 0x10000;
        }
        uVar11 = calc_angle_quadrant(uVar17,-uVar13);
        uVar17 = (uint)uVar11;
      }
      update_gs_unit_related_array_item(param_1);
      *(ushort *)(param_1 + 0x57) = (ushort)uVar17 & 0x7ff;
      uVar17 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar17 | 0x80;
      *(uint *)(param_1 + 0xc) = uVar17 | 0x1080;
    }
    cVar10 = FUN_004394e0(param_1);
joined_r0x00496eb9:
    if (cVar10 == '\0') {
      return 0;
    }
LAB_00496fb4:
    *(undefined1 *)(param_1 + 0xa8) = 0x11;
    break;
  case 0x32:
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      if (*puVar1 == '\t') {
        FUN_004b9fc0();
      }
      else {
        FUN_004044b0(puVar15,&uStack_14);
      }
      FUN_004d4f40(param_1);
      FUN_004e9d80(param_1,&uStack_14);
      uVar17 = (uint)(ushort)(uStack_14 - *(short *)(param_1 + 0x3d));
      uVar13 = (uint)(ushort)(local_12 - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar17) {
        uVar17 = uVar17 - 0x10000;
      }
      if (0x7fff < uVar13) {
        uVar13 = uVar13 - 0x10000;
      }
      uVar11 = calc_angle_quadrant(uVar17,-uVar13);
      uVar11 = uVar11 & 0x7ff;
      if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
        *(ushort *)(param_1 + 0x57) = uVar11;
      }
      *(ushort *)(param_1 + 0x5d) = uVar11;
      if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
        uVar11 = uVar11 + 0x400 & 0x7ff;
      }
      *(ushort *)(param_1 + 0x26) = uVar11;
    }
    if ((*(byte *)(param_1 + 0x2e) & 3) != 0) {
      return 0;
    }
    uVar17 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar13 = (int)uVar17 >> 0x1f;
    if (0x437 < (int)((uVar17 ^ uVar13) - uVar13)) {
      return 0;
    }
    uVar17 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f);
    uVar13 = (int)uVar17 >> 0x1f;
    if (0x437 < (int)((uVar17 ^ uVar13) - uVar13)) {
      return 0;
    }
    goto LAB_00496fb4;
  }
  *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
switchD_0049681f_caseD_6:
  return 0;
}
