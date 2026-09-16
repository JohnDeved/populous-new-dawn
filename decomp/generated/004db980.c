/* Ghidra 12.1.3 pseudocode; entry 004db980; FUN_004db980.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004db980(int param_1)

{
  byte *pbVar1;
  ushort *puVar2;
  vector_48b *pvVar3;
  char *pcVar4;
  byte bVar5;
  undefined2 uVar6;
  undefined2 uVar7;
  bool bVar8;
  bool bVar9;
  bool bVar10;
  bool bVar11;
  bool bVar12;
  bool bVar13;
  bool bVar14;
  objs0_struct *poVar15;
  char cVar16;
  undefined2 uVar17;
  short sVar18;
  unit_struct *puVar19;
  int iVar20;
  unit_struct **ppuVar21;
  undefined4 uVar22;
  short sVar26;
  undefined3 uVar25;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  uint uVar23;
  int iVar24;
  short *psVar27;
  uint uVar28;
  byte bVar29;
  undefined2 extraout_var_02;
  undefined2 extraout_var_03;
  undefined2 extraout_var_04;
  undefined2 extraout_var_05;
  unit_struct *puVar30;
  unit_struct **ppuVar31;
  unit_struct *puVar32;
  ushort uVar33;
  unit_obj *puVar34;
  bool bVar35;
  bool bVar36;
  undefined2 local_52;
  unit_struct *local_50;
  unit_struct **local_4c;
  unit_struct **local_38;
  undefined4 local_34;
  uint local_30;
  uint local_2c;
  uint local_28;
  uint local_24;
  uint local_20;
  unit_struct *local_1c;
  undefined1 *local_18;
  uint local_14;
  undefined2 local_10;
  undefined2 uStack_e;
  short local_c;
  undefined4 local_8;
  short local_4;

  uVar17 = (undefined2)((uint)&local_10 >> 0x10);
  bVar12 = true;
  uVar22 = *(undefined4 *)(param_1 + 0x3d);
  local_c = *(undefined2 *)(param_1 + 0x41);
  local_10 = (undefined2)uVar22;
  uStack_e = (undefined2)((uint)uVar22 >> 0x10);
  local_50 = (unit_struct *)0x0;
  uVar33 = *(ushort *)(param_1 + 0x89);
  puVar19 = (unit_struct *)CONCAT22((short)((uint)(param_1 + 0x3d) >> 0x10),uVar33);
  bVar13 = false;
  bVar14 = false;
  bVar11 = false;
  if (((uVar33 != 0) && (puVar19 = unit_land_array[uVar33], (*(byte *)&puVar19->flags_2 & 1) == 0))
     && (puVar19->unit_class != '\0')) {
    local_50 = puVar19;
  }
  if (local_50 == (unit_struct *)0x0) {
    *(undefined2 *)(param_1 + 0x89) = 0;
    local_50 = (unit_struct *)alloc_unit(6,8,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    puVar19 = (unit_struct *)0x0;
    uVar17 = extraout_var_02;
    if (local_50 != (unit_struct *)0x0) {
      FUN_004de440(local_50,0x45,1);
      *(undefined2 *)(param_1 + 0x89) = local_50->unit_index;
      uVar28 = local_50->flags_3;
      local_50->flags_3 = uVar28 | 0x100000;
      puVar19 = (unit_struct *)(uVar28 | 0x100100);
      local_50->flags_3 = puVar19;
      uVar17 = extraout_var_03;
    }
  }
  if (*(short *)(param_1 + 0x37) == 0) {
    puVar19 = (unit_struct *)FUN_0048a050(param_1,0xdb,0);
    uVar17 = extraout_var_04;
  }
  if (local_50 == (unit_struct *)0x0) goto LAB_004dd66d;
  cVar16 = *(char *)(param_1 + 0x2d);
  if (((cVar16 == '\0') || (cVar16 == '\n')) || (cVar16 == '\r')) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfdffffff;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(undefined1 *)(param_1 + 0xa9) = 0;
    *(char *)(param_1 + 0x2d) = cVar16 + '\x01';
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
  psVar27 = (short *)(param_1 + 0x6e);
  if (*(char *)(param_1 + 0x7c) == '\0') {
    if (*psVar27 < 3) {
      *(byte *)(param_1 + 0x93) = *(byte *)(param_1 + 0x93) | 1;
    }
  }
  else {
    *psVar27 = 16000;
  }
  if (*(short *)(param_1 + 99) == 0) {
    if (*(short *)(param_1 + 0x97) != 0) {
      *(short *)(param_1 + 0x97) = *(short *)(param_1 + 0x97) + -1;
    }
  }
  else {
    *psVar27 = 16000;
  }
  bVar36 = *(short *)(param_1 + 0x95) != 0;
  if (bVar36) {
    FUN_0048a050(param_1,0xdc,0);
    *(short *)(param_1 + 0x95) = *(short *)(param_1 + 0x95) + -1;
    uVar17 = extraout_var_05;
  }
  if ((*(ushort *)(param_1 + 0x93) & 2) != 0) {
    cVar16 = *(char *)(param_1 + 0x2d);
    *(ushort *)(param_1 + 0x93) = *(ushort *)(param_1 + 0x93) & 0xfffd;
    if (((cVar16 != '\x01') && (cVar16 != '\v')) &&
       ((cVar16 != '\f' &&
        ((((cVar16 != '\x0e' && (cVar16 != '\x10')) && (cVar16 != '\a')) && (cVar16 != '\b')))))) {
      bVar8 = true;
      if ((cVar16 == '\x06') && (*(char *)(param_1 + 0xa8) != '\0')) {
        bVar8 = false;
      }
      if (bVar8) {
        *(undefined1 *)(param_1 + 0x2d) = 0x10;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
    }
  }
  if ((*(uint *)(param_1 + 0xc) & 0x2000) == 0) {
    if ((*(char *)(param_1 + 0x7b) != '\0') && ((*(byte *)(param_1 + 0x2e) & 7) == 0)) {
      *(char *)(param_1 + 0x7b) = *(char *)(param_1 + 0x7b) + -1;
    }
  }
  else {
    cVar16 = *(char *)(param_1 + 0x2d);
    if ((((cVar16 != '\x01') && (cVar16 != '\x06')) && (cVar16 != '\v')) &&
       (((cVar16 != '\f' && (cVar16 != '\x0e')) &&
        ((cVar16 != '\x10' && ((cVar16 != '\a' && (cVar16 != '\b')))))))) {
      *(undefined1 *)(param_1 + 0x2d) = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
  }
  if (((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) || ((*(byte *)(param_1 + 0x76) & 0x10) != 0)) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
  }
  puVar19 = (unit_struct *)(*(byte *)(param_1 + 0x2d) - 1);
  switch(puVar19) {
  case (unit_struct *)0x0:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      sVar18 = calc_point_height(CONCAT22(uVar17,*(undefined2 *)(param_1 + 0x3d)),
                                 *(undefined2 *)(param_1 + 0x3f));
      if (*(short *)(param_1 + 0x41) < sVar18) {
        *(short *)(param_1 + 0x41) = sVar18;
      }
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 100;
      local_50->coord_scale_4 = 0;
      pbVar1 = (byte *)((int)&(local_50->object).flags + 1);
      *pbVar1 = *pbVar1 | 2;
      FUN_0048a050(param_1,0xb2,0);
    }
    iVar24 = 2;
    do {
      local_c = *(undefined2 *)(param_1 + 0x41);
      local_10 = (undefined2)*(undefined4 *)(param_1 + 0x3d);
      uStack_e = (undefined2)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
      uVar23 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar28 = uVar23 >> 0xd;
      local_20 = uVar28 | uVar23 * 0x80000;
      uVar23 = local_20 * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar23 >> 0xd | uVar23 * 0x80000;
      local_24 = game_state.pseudo_random_val;
      move_pos_angle_length(&local_10,uVar28 & 0x7ff,game_state.pseudo_random_val % 0x280);
      local_c = calc_point_height(CONCAT22(uStack_e,local_10),CONCAT22(local_c,uStack_e));
      iVar20 = alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),&local_10);
      if (iVar20 != 0) {
        *(short *)(iVar20 + 0x41) = *(short *)(iVar20 + 0x41) + -0x28;
        *(undefined2 *)(iVar20 + 0x6c) = 0x12;
        unit_set_object(iVar20 + 0x33,0x2b,0x4ba);
      }
      iVar24 = iVar24 + -1;
    } while (iVar24 != 0);
    uVar28 = *(uint *)(param_1 + 0xc);
    if ((uVar28 & 0x40000000) != 0) {
      uVar28 = uVar28 & 0xbfffffff;
      *(undefined1 *)(param_1 + 0xa9) = 0;
      *(undefined1 *)(param_1 + 0x67) = 1;
      *(undefined2 *)(param_1 + 0x70) = 0x24;
      *(undefined2 *)(param_1 + 0x99) = 8;
      *(undefined2 *)(param_1 + 0x83) = 600;
      *(uint *)(param_1 + 0xc) = uVar28;
    }
    sVar18 = *(short *)(param_1 + 0x70) + -1;
    puVar19 = (unit_struct *)CONCAT22((short)(uVar28 >> 0x10),sVar18);
    *(short *)(param_1 + 0x70) = sVar18;
    if (sVar18 < 1) {
      puVar2 = &(local_50->object).flags;
      *puVar2 = *puVar2 & 0xfdff;
      if ((((byte)land_flags_1 & 8) == 0) && (((byte)opened_files_flags & 0x10) == 0)) {
        *(undefined1 *)(param_1 + 0x2d) = 9;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
      else {
        *(undefined1 *)(param_1 + 0x2d) = 4;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
    }
    else {
      puVar19 = (unit_struct *)(int)sVar18;
      iVar24 = 0x22 - (int)puVar19;
      if (iVar24 < 0x18) {
        if (0 < iVar24) {
          puVar19 = (unit_struct *)
                    ((objs0_mem[(short)(local_50->object).obj_index].maybe_coord_scale * iVar24) /
                    0x18);
          local_50->coord_scale_4 = (int)puVar19;
        }
      }
      else {
        puVar2 = &(local_50->object).flags;
        *puVar2 = *puVar2 & 0xfdff;
      }
    }
    break;
  case (unit_struct *)0x1:
    if ((*(byte *)(param_1 + 0xf) & 0x40) != 0) {
      *(undefined1 *)(param_1 + 0xaa) = 0;
    }
    cVar16 = *(char *)(param_1 + 0xaa) + -1;
    *(char *)(param_1 + 0xaa) = cVar16;
    if (cVar16 < '\x01') {
      uVar23 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar28 = uVar23 >> 0xd;
      local_28 = uVar28 | uVar23 * 0x80000;
      game_state.pseudo_random_val = local_28;
      *(byte *)(param_1 + 0xaa) = ((byte)uVar28 & 7) + 8;
      uVar23 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar28 = uVar23 >> 0xd;
      local_2c = uVar28 | uVar23 * 0x80000;
      game_state.pseudo_random_val = local_2c;
      *(ushort *)(param_1 + 0x5d) = (ushort)uVar28 & 0x7ff;
    }
    bVar11 = true;
    uVar23 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar28 = uVar23 >> 0xd;
    local_30 = uVar28 | uVar23 * 0x80000;
    game_state.pseudo_random_val = local_30;
    if (((byte)uVar28 & 0x3f) == 1) {
      *(undefined2 *)(param_1 + 0x95) = 3;
    }
    uVar28 = *(uint *)(param_1 + 0xc);
    if ((uVar28 & 0x40000000) != 0) {
      uVar28 = uVar28 & 0xbfffffff;
      *(undefined1 *)(param_1 + 0xa9) = 0;
      *(undefined1 *)(param_1 + 0x67) = 1;
      *(undefined2 *)(param_1 + 0x70) = 0x28;
      *(undefined2 *)(param_1 + 0x99) = 0x10;
      *(undefined2 *)(param_1 + 0x83) = 600;
      *(uint *)(param_1 + 0xc) = uVar28;
    }
    sVar18 = *(short *)(param_1 + 0x70) + -1;
    puVar19 = (unit_struct *)CONCAT22((short)(uVar28 >> 0x10),sVar18);
    *(short *)(param_1 + 0x70) = sVar18;
    if (sVar18 < 1) {
      *(undefined1 *)(param_1 + 0x2d) = 4;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    break;
  case (unit_struct *)0x3:
    iVar24 = 0;
    if (*(short *)(param_1 + 99) == 0) {
      psVar27 = (short *)&game_state.tribes_array[0].field_0xa37;
      bVar11 = true;
      *(undefined1 *)(param_1 + 0x67) = 1;
      bVar8 = false;
      local_4c = (unit_struct **)0x0;
      do {
        if (bVar8) goto LAB_004dbf6d;
        if ((*(char *)(param_1 + 0x2f) != iVar24) && (*psVar27 != 0)) {
          bVar8 = true;
        }
        psVar27 = (short *)((int)psVar27 + 0xc65);
        iVar24 = iVar24 + 1;
      } while (psVar27 < &game_state.level_data[0x9a].ph_2);
      if (bVar8) {
LAB_004dbf6d:
        local_34 = *(undefined4 *)(param_1 + 0x3d);
        iVar24 = 0xfffffff;
        local_4c = (unit_struct **)0x0;
        for (puVar19 = allocated_units; puVar19 != (unit_struct *)0x0;
            puVar19 = puVar19->next_unit_1) {
          if ((((puVar19->unit_class == '\x01') && (puVar19->unit_type == '\b')) &&
              (puVar19->tribe_index != *(char *)(param_1 + 0x2f))) &&
             (iVar20 = calc_distance_toroidal(&local_34,&puVar19->pos), iVar20 < iVar24)) {
            iVar24 = iVar20;
            local_4c = &puVar19->prev_unit;
          }
        }
      }
      if (local_4c == (unit_struct **)0x0) {
        local_34 = *(undefined4 *)(param_1 + 0x3d);
        ppuVar31 = (unit_struct **)0xfffffff;
        local_18 = (undefined1 *)0x0;
        local_4c = (unit_struct **)0x0;
        local_38 = &game_state.tribes_array[0].person_units;
        do {
          ppuVar21 = (unit_struct **)(int)*(char *)(param_1 + 0x2f);
          if (ppuVar21 != (unit_struct **)local_18) {
            ppuVar21 = local_38;
            for (puVar19 = *local_38; puVar19 != (unit_struct *)0x0; puVar19 = puVar19->next_unit) {
              if ((puVar19->unit_class == '\x01') && (puVar19->state != '\x17')) {
                bVar8 = true;
                if ((*(short *)&puVar19->field_0x6e < 1) ||
                   (((uint)puVar19->flags_2 & 0x10000) != 0)) {
LAB_004dc07f:
                  bVar8 = false;
                }
                else {
                  bVar5 = *(byte *)(param_1 + 0x2f);
                  ppuVar21 = (unit_struct **)CONCAT31((int3)((uint)ppuVar21 >> 8),bVar5);
                  if (((bVar5 == 0xff) || (bVar29 = puVar19->tribe_index, bVar29 == 0xff)) ||
                     (bVar29 == bVar5)) {
                    bVar29 = 1;
                  }
                  else {
                    bVar29 = *(byte *)((int)game_state.start_n1 + (char)bVar5 + 0x9c) &
                             '\x01' << (bVar29 & 0x1f);
                  }
                  if (((bVar29 != 0) || (bVar29 = puVar19->tribe_index, bVar29 == bVar5)) ||
                     (bVar29 == 0xff)) goto LAB_004dc07f;
                  cVar16 = puVar19->unit_type;
                  if (cVar16 == '\x05') {
                    if ((puVar19->field_0xb2 & 0x3f) == 0) {
                      local_14 = (uint)((byte)puVar19->field_0xb2 >> 6);
                      if (local_14 != (int)(char)bVar5) goto LAB_004dc0e8;
                    }
                    else if (bVar29 != bVar5) goto LAB_004dc0e8;
                    goto LAB_004dc07f;
                  }
LAB_004dc0e8:
                  if (*(char *)(param_1 + 0x2b) == '\x05') {
                    if ((*(byte *)(param_1 + 0xb2) & 0x3f) == 0) {
                      ppuVar21 = (unit_struct **)(uint)(*(byte *)(param_1 + 0xb2) >> 6);
                      if (ppuVar21 != (unit_struct **)(int)(char)bVar29) goto LAB_004dc114;
                    }
                    else if (bVar29 != bVar5) goto LAB_004dc114;
                    goto LAB_004dc07f;
                  }
LAB_004dc114:
                  if ((*(byte *)((int)&puVar19->flags_4 + 1) & 0x10) != 0) goto LAB_004dc07f;
                  if (*(char *)(param_1 + 0x2b) == '\x04') {
                    if ((((game_state._4_4_ & 2) != 0) || (cVar16 == '\x04')) || (cVar16 == '\a'))
                    goto LAB_004dc084;
                    goto LAB_004dc07f;
                  }
                  if (*(char *)(param_1 + 0x2b) == '\x06') {
                    if (((game_state._4_4_ & 2) != 0) && (cVar16 == '\a')) goto LAB_004dc07f;
                  }
                  else if ((*(char *)(param_1 + 0x2b) != '\b') && (cVar16 == '\b'))
                  goto LAB_004dc07f;
                }
LAB_004dc084:
                if ((bVar8) &&
                   (ppuVar21 = (unit_struct **)calc_distance_toroidal(&local_34,&puVar19->pos),
                   (int)ppuVar21 < (int)ppuVar31)) {
                  ppuVar31 = ppuVar21;
                  local_4c = &puVar19->prev_unit;
                }
              }
            }
          }
          local_38 = (unit_struct **)((int)local_38 + 0xc65);
          local_18 = local_18 + 1;
        } while (local_38 < (undefined1 *)((int)&game_state.level_data[0x7f].unit_index_2 + 1));
        goto LAB_004dc1a4;
      }
LAB_004dc1ab:
      puVar19 = (unit_struct *)CONCAT31((int3)((uint)local_4c >> 8),5);
      *(undefined4 *)(param_1 + 0x4f) = *(undefined4 *)((int)local_4c + 0x3d);
    }
    else {
      ppuVar21 = *(unit_struct ***)
                  ((int)&game_state + (uint)(*(char *)(param_1 + 0x2f) == '\x01') * -0xc65 + 0x1552)
      ;
      local_4c = ppuVar21;
LAB_004dc1a4:
      if (local_4c != (unit_struct **)0x0) goto LAB_004dc1ab;
      puVar19 = (unit_struct *)CONCAT31((int3)((uint)ppuVar21 >> 8),2);
    }
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    *(char *)(param_1 + 0x2d) = (char)puVar19;
    break;
  case (unit_struct *)0x4:
    bVar11 = true;
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      *(undefined2 *)(param_1 + 0x83) = 600;
      *(undefined1 *)(param_1 + 0xa8) = 0;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
    }
    puVar19 = (unit_struct *)(uint)*(byte *)(param_1 + 0xa8);
    if (puVar19 == (unit_struct *)0x0) {
      puVar19 = (unit_struct *)FUN_004dd7a0(param_1);
      if ((char)puVar19 != '\0') {
        *(undefined1 *)(param_1 + 0xa8) = 1;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      }
    }
    else if ((puVar19 == (unit_struct *)0x1) &&
            (puVar19 = (unit_struct *)FUN_004dab60(param_1), (char)puVar19 != '\0')) {
      uVar23 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar28 = uVar23 >> 0xd;
      game_state.pseudo_random_val = uVar28 | uVar23 * 0x80000;
      if (((byte)uVar28 & 0x3f) == 1) {
        *(undefined2 *)(param_1 + 0x95) = 3;
      }
      uVar22 = FUN_004dac20(param_1);
      *(short *)(param_1 + 0x72) = (short)uVar22;
      if ((short)uVar22 == 0) {
        uVar28 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar23 = (int)uVar28 >> 0x1f;
        iVar24 = (uVar28 ^ uVar23) - uVar23;
        if ((iVar24 < 0x438) &&
           (uVar28 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar23 = (int)uVar28 >> 0x1f, iVar24 = (uVar28 ^ uVar23) - uVar23, iVar24 < 0x438)) {
          puVar19 = (unit_struct *)CONCAT31((int3)((uint)iVar24 >> 8),2);
        }
        else {
          puVar19 = (unit_struct *)CONCAT31((int3)((uint)iVar24 >> 8),5);
        }
      }
      else {
        puVar19 = (unit_struct *)CONCAT31((int3)((uint)uVar22 >> 8),6);
      }
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      *(char *)(param_1 + 0x2d) = (char)puVar19;
    }
    break;
  case (unit_struct *)0x5:
    uVar33 = *(ushort *)(param_1 + 0x72);
    puVar19 = (unit_struct *)CONCAT22((short)((uint)puVar19 >> 0x10),uVar33);
    puVar30 = (unit_struct *)0x0;
    bVar8 = false;
    bVar12 = false;
    if (((uVar33 != 0) && (puVar19 = unit_land_array[uVar33], (*(byte *)&puVar19->flags_2 & 1) == 0)
        ) && (puVar19->unit_class != '\0')) {
      puVar30 = puVar19;
    }
    local_1c = puVar30;
    if (puVar30 == (unit_struct *)0x0) {
LAB_004dc7bc:
      bVar8 = true;
    }
    else {
      bVar35 = puVar30->unit_type == '\b';
      iVar24 = get_adjacent_unit(puVar30,0);
      if (((*(byte *)((int)&puVar30->flags_2 + 2) & 0x80) != 0) &&
         (puVar19 = (unit_struct *)0x0, iVar24 == 0)) goto LAB_004dc7bc;
      if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
        *(undefined1 *)(param_1 + 0xa8) = 0;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      }
      if ((iVar24 == 0) || (bVar10 = true, puVar30->field36_0x5f != 0)) {
        bVar10 = false;
      }
      puVar19 = (unit_struct *)(uint)*(byte *)(param_1 + 0xa8);
      if (puVar19 == (unit_struct *)0x0) {
        bVar11 = true;
        bVar12 = true;
        uVar23 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar28 = uVar23 >> 0xd;
        game_state.pseudo_random_val = uVar28 | uVar23 * 0x80000;
        if (((byte)uVar28 & 0x3f) == 1) {
          *(undefined2 *)(param_1 + 0x95) = 3;
        }
        puVar19 = (unit_struct *)FUN_004dada0(param_1,puVar30);
        if ((char)puVar19 == '\0') {
          if (6 < *(byte *)(param_1 + 0x7b)) {
            *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
            *(undefined2 *)(param_1 + 0x95) = 8;
            *(undefined1 *)(param_1 + 0x7b) = 0;
            *(undefined1 *)(param_1 + 0xa8) = 1;
          }
        }
        else {
          *(undefined1 *)(param_1 + 0xa8) = 1;
          *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        }
      }
      else if (puVar19 == (unit_struct *)0x1) {
        if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
          *(undefined1 *)(param_1 + 0x67) = 2;
          *(undefined2 *)(param_1 + 0x70) = 2;
          *(undefined2 *)(param_1 + 0x99) = 0x400;
          *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
          if (bVar35) {
LAB_004dc4bb:
            *(undefined2 *)(param_1 + 0x68) = 200;
          }
          else {
            bVar9 = false;
            if ((*(byte *)((int)&puVar30->flags_2 + 2) & 0x80) != 0) {
              local_52 = CONCAT11((char)((ushort)(puVar30->pos).y >> 8),
                                  (char)((ushort)(puVar30->pos).x >> 8));
              uVar28 = (local_52 & 0xfe) * 2 | local_52 & 0xfe00;
              if ((((*(byte *)((int)&game_state.level_data[0].flags + uVar28 * 4 + 1) & 2) != 0) &&
                  (unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)[uVar28 * 2] & 0x3ff]->unit_type
                   == '\x04')) &&
                 (unit_land_array
                  [(ushort)(&game_state.level_data[0].unit_index_2)[uVar28 * 2] & 0x3ff]->state ==
                  '\x02')) {
                bVar9 = true;
              }
            }
            if ((bVar9) || (bVar10)) goto LAB_004dc4bb;
            *(undefined2 *)(param_1 + 0x68) = 0xa0;
          }
          *(short *)(param_1 + 0x5f) = *(short *)(param_1 + 0x68) / 2;
        }
        if ((*(short *)(param_1 + 0x70) != 0) &&
           (sVar18 = *(short *)(param_1 + 0x70) + -1, *(short *)(param_1 + 0x70) = sVar18,
           sVar18 == 0)) {
          if ((!bVar35) && (puVar30->unit_land_array_index == 0)) {
            FUN_004db5e0(param_1,puVar30);
          }
          *(undefined1 *)(param_1 + 0x67) = 3;
        }
        uVar28 = *(uint *)(param_1 + 0xc);
        if ((uVar28 & 0x2000) != 0) {
          *(uint *)(param_1 + 0xc) = uVar28 & 0xffffdfff;
          *(uint *)(param_1 + 0xc) = uVar28 & 0xfff7dfff;
          unit_clear_vec_2(param_1);
        }
        *(undefined1 *)(param_1 + 0x7b) = 0;
        pvVar3 = &puVar30->pos;
        *(undefined2 *)(param_1 + 0x6a) = puVar30->mid2 + (puVar30->pos).z;
        *(undefined4 *)(param_1 + 0x53) = *(undefined4 *)pvVar3;
        FUN_004e9e50(param_1,pvVar3);
        if (bVar35) {
          uVar28 = (int)(short)pvVar3->x - (int)*(short *)(param_1 + 0x3d);
          uVar23 = (int)uVar28 >> 0x1f;
          puVar19 = (unit_struct *)((uVar28 ^ uVar23) - uVar23);
          if (((int)puVar19 < 0x138) &&
             (uVar28 = (int)(short)(puVar30->pos).y - (int)*(short *)(param_1 + 0x3f),
             uVar23 = (int)uVar28 >> 0x1f, puVar19 = (unit_struct *)((uVar28 ^ uVar23) - uVar23),
             (int)puVar19 < 0x138)) {
            bVar12 = true;
            *(short *)(param_1 + 0x5f) = *(short *)(param_1 + 0x5f) << 1;
            puVar19 = (unit_struct *)FUN_004e0830(param_1,puVar30);
            *(undefined1 *)(param_1 + 0xa8) = 2;
            *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
          }
        }
        else {
          uVar28 = (int)(short)pvVar3->x - (int)*(short *)(param_1 + 0x3d);
          uVar23 = (int)uVar28 >> 0x1f;
          puVar19 = (unit_struct *)((uVar28 ^ uVar23) - uVar23);
          if (((int)puVar19 < 0x1f8) &&
             (uVar28 = (int)(short)(puVar30->pos).y - (int)*(short *)(param_1 + 0x3f),
             uVar23 = (int)uVar28 >> 0x1f, puVar19 = (unit_struct *)((uVar28 ^ uVar23) - uVar23),
             (int)puVar19 < 0x1f8)) {
            puVar19 = (unit_struct *)
                      CONCAT22((short)((uint)puVar19 >> 0x10),*(short *)(param_1 + 0x24));
            *(short *)(param_1 + 0x5f) = *(short *)(param_1 + 0x5f) << 1;
            puVar30->coord_scale_2 = *(short *)(param_1 + 0x24);
            if ((*(byte *)((int)&puVar30->flags_2 + 2) & 0x10) == 0) {
              *(undefined1 *)((int)&puVar30->loc_1_y + 1) = puVar30->state;
              empty_unit_function(puVar30);
              puVar30->state = 0x28;
              puVar19 = (unit_struct *)init_unit_class(puVar30);
            }
            *(undefined1 *)(param_1 + 0xa8) = 2;
            *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
          }
        }
      }
      else if (puVar19 == (unit_struct *)0x2) {
        uVar28 = 0;
        if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
          *(undefined2 *)(param_1 + 0x70) = 0x1c;
          *(undefined2 *)(param_1 + 0x99) = 0x30;
          *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
          *(short *)(param_1 + 0x6a) = *(short *)(param_1 + 0x41) + 800;
          sVar18 = *(short *)(param_1 + 0x5f) / 2;
          *(short *)(param_1 + 0x5f) = sVar18;
          iVar24 = sVar18 * 0x1e;
          *(short *)(param_1 + 0x5f) = (short)((int)(iVar24 + (iVar24 >> 0x1f & 0x1fU)) >> 5);
          cVar16 = FUN_004db420(param_1,*(undefined2 *)(param_1 + 0x5d));
          if (cVar16 == '\0') {
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x8000;
            *(undefined1 *)(param_1 + 0x67) = 0;
            uVar33 = *(short *)(param_1 + 0x5d) + 0x400U & 0x7ff;
            *(undefined2 *)(param_1 + 0x68) = 0;
          }
          else {
            *(undefined1 *)(param_1 + 0x67) = 4;
            uVar33 = *(ushort *)(param_1 + 0x5d);
            *(short *)(param_1 + 0x68) = *(short *)(param_1 + 0x5f) / 2;
          }
          update_gs_unit_related_array_item(param_1);
          *(ushort *)(param_1 + 0x57) = uVar33;
          uVar28 = *(uint *)(param_1 + 0xc);
          *(uint *)(param_1 + 0xc) = uVar28 | 0x80;
          uVar28 = uVar28 | 0x1080;
          *(uint *)(param_1 + 0xc) = uVar28;
        }
        if ((*(byte *)(param_1 + 0xd) & 0x80) == 0) {
          if ((*(byte *)&puVar30->unit_index & 1) == 0) {
            uVar33 = *(short *)(param_1 + 0x5d) - 0x16;
          }
          else {
            uVar33 = *(short *)(param_1 + 0x5d) + 0x16;
          }
          uVar28 = FUN_004db420(param_1,uVar33 & 0x7ff);
          if ((char)uVar28 != '\0') {
            update_gs_unit_related_array_item(param_1);
            *(ushort *)(param_1 + 0x57) = uVar33 & 0x7ff;
            uVar28 = *(uint *)(param_1 + 0xc);
            *(uint *)(param_1 + 0xc) = uVar28 | 0x80;
            uVar28 = uVar28 | 0x1080;
            *(uint *)(param_1 + 0xc) = uVar28;
          }
        }
        sVar18 = *(short *)(param_1 + 0x70) + -1;
        puVar19 = (unit_struct *)CONCAT22((short)(uVar28 >> 0x10),sVar18);
        *(undefined1 *)(param_1 + 0x7b) = 0;
        *(short *)(param_1 + 0x70) = sVar18;
        if ((!bVar35) && (bVar13 = true, sVar18 < 9)) {
          puVar19 = (unit_struct *)(int)sVar18;
          if (puVar19 == (unit_struct *)0x7) {
            *(undefined2 *)(param_1 + 0x95) = 4;
            *(undefined2 *)(param_1 + 0x68) = 0;
            bVar13 = false;
            uVar28 = *(uint *)(param_1 + 0xc);
            *(uint *)(param_1 + 0xc) = uVar28 | 0x2000;
            *(uint *)(param_1 + 0xc) = uVar28 | 0x82000;
            puVar19 = (unit_struct *)
                      FUN_004e94f0(param_1 + 0x49,0x100,
                                   (int)*(short *)(param_1 + 0x26) + 0x400U & 0x7ff);
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
          }
          else if (puVar19 == (unit_struct *)0x8) {
            puVar30->state_2 = 1;
            puVar19 = (unit_struct *)FUN_004e0a30(param_1,puVar30);
            bVar14 = true;
          }
          else {
            bVar13 = false;
          }
        }
        if (*(short *)(param_1 + 0x70) < 1) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
          goto LAB_004dc7bc;
        }
      }
    }
    if (bVar8) {
      bVar12 = true;
      sVar18 = FUN_004dac20(param_1);
      *(short *)(param_1 + 0x72) = sVar18;
      uVar28 = *(uint *)(param_1 + 0xc) & 0xffff7fff;
      *(uint *)(param_1 + 0xc) = uVar28;
      puVar19 = (unit_struct *)(uVar28 | 0x40000000);
      *(byte *)(param_1 + 0x2d) = (-(sVar18 == 0) & 0xfcU) + 6;
      *(unit_struct **)(param_1 + 0xc) = puVar19;
    }
    break;
  case (unit_struct *)0x6:
    bVar12 = false;
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(undefined2 *)(param_1 + 0x5f) = 0;
      *(undefined2 *)(param_1 + 0x68) = 0;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      *(undefined1 *)(param_1 + 0x67) = 1;
      *(undefined2 *)(param_1 + 0x83) = 500;
      *(undefined2 *)(param_1 + 0x99) = 0xc;
      *(undefined2 *)(param_1 + 0x70) = 0x10;
      pbVar1 = (byte *)((int)&(local_50->object).flags + 1);
      *pbVar1 = *pbVar1 | 2;
    }
    iVar24 = objs0_mem[(short)(local_50->object).obj_index].maybe_coord_scale *
             (int)*(short *)(param_1 + 0x70);
    iVar24 = iVar24 + (iVar24 >> 0x1f & 0xfU);
    local_50->coord_scale_4 = iVar24 >> 4;
    sVar18 = *(short *)(param_1 + 0x70) + -1;
    puVar19 = (unit_struct *)CONCAT22((short)(iVar24 >> 0x14),sVar18);
    *(short *)(param_1 + 0x70) = sVar18;
    if (sVar18 == 0) {
      *(undefined1 *)(param_1 + 0x2d) = 8;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    break;
  case (unit_struct *)0x7:
    bVar12 = false;
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(undefined2 *)(param_1 + 0x68) = 0;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      *(undefined1 *)(param_1 + 0x67) = 0;
    }
    FUN_0048a050(0,0xb2,0);
    if ((*(ushort *)(param_1 + 0x93) & 1) == 0) {
      ptr_unit_related_20B->field0_0x0 = 0x28;
      ptr_unit_related_20B->field1_0x4 = 6;
      ptr_unit_related_20B->unit_ptr = (unit_struct *)&DAT_00000040;
      ptr_unit_related_20B->field3_0xc = 0;
      ptr_unit_related_20B->field4_0x10 = 1;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      alloc_unit(7,9,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    }
    puVar19 = (unit_struct *)FUN_004ef180(param_1);
    break;
  case (unit_struct *)0x8:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(undefined1 *)(param_1 + 0xa8) = 0;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
    }
    puVar19 = (unit_struct *)(uint)*(byte *)(param_1 + 0xa8);
    switch(puVar19) {
    case (unit_struct *)0x0:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined1 *)(param_1 + 0xaa) = 0x78;
        *(undefined2 *)(param_1 + 0x5f) = 0x38;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        (local_50->vec3).x = game_state.tribes_array[player_tribe_num].x;
        (local_50->vec3).y = game_state.tribes_array[player_tribe_num].y;
        sVar18 = (short)(player_tribe_num >> 7);
        local_50->field36_0x5f = game_state.tribes_array[player_tribe_num].angle_1;
        local_10 = (local_50->vec3).x;
        uStack_e = (local_50->vec3).y;
        local_c = 0;
        move_pos_angle_length
                  (&local_10,CONCAT22(sVar18,local_50->field36_0x5f + 0x400) & 0xffff07ff,0x1a00);
        *(undefined2 *)(param_1 + 0x53) = local_10;
        *(undefined2 *)(param_1 + 0x55) = uStack_e;
        FUN_004e9e50(param_1,(undefined2 *)(param_1 + 0x53));
        *(undefined1 *)(param_1 + 0x67) = 6;
        *(undefined2 *)(param_1 + 0x68) = 0xa0;
        *(undefined2 *)(param_1 + 0x6a) = 0xb00;
        *(undefined2 *)(param_1 + 0x99) = 0x1c;
      }
      *(char *)(param_1 + 0xaa) = *(char *)(param_1 + 0xaa) + -1;
      puVar19 = (unit_struct *)calc_distance_toroidal(param_1 + 0x3d,(short *)(param_1 + 0x53));
      bVar8 = false;
      if ((*(char *)(param_1 + 0xaa) < '\x01') || (0x3000 < (int)puVar19)) {
LAB_004dcadb:
        bVar8 = true;
      }
      else {
        iVar24 = (int)player_tribe_num;
        sVar18 = (local_50->vec3).x;
        sVar26 = (short)(player_tribe_num >> 7);
        puVar19 = (unit_struct *)CONCAT22(sVar26,sVar18);
        if ((game_state.tribes_array[iVar24].x != sVar18) ||
           ((sVar18 = (local_50->vec3).y, puVar19 = (unit_struct *)CONCAT22(sVar26,sVar18),
            game_state.tribes_array[iVar24].y != sVar18 ||
            (puVar19 = (unit_struct *)CONCAT22(sVar26,local_50->field36_0x5f),
            game_state.tribes_array[iVar24].angle_1 != local_50->field36_0x5f)))) goto LAB_004dcadb;
      }
      if (bVar8) {
        *(undefined1 *)(param_1 + 0xa8) = 2;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      }
      else {
        uVar28 = (int)*(short *)(param_1 + 0x53) - (int)*(short *)(param_1 + 0x3d);
        uVar23 = (int)uVar28 >> 0x1f;
        puVar19 = (unit_struct *)((uVar28 ^ uVar23) - uVar23);
        if (((int)puVar19 < 0x238) &&
           (uVar28 = (int)*(short *)(param_1 + 0x55) - (int)*(short *)(param_1 + 0x3f),
           uVar23 = (int)uVar28 >> 0x1f, puVar19 = (unit_struct *)((uVar28 ^ uVar23) - uVar23),
           (int)puVar19 < 0x238)) {
          *(undefined1 *)(param_1 + 0xa8) = 1;
          *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        }
      }
      break;
    case (unit_struct *)0x1:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        sVar18 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
        *(undefined1 *)(param_1 + 0x67) = 1;
        *(undefined2 *)(param_1 + 0x70) = 0x20;
        *(short *)(param_1 + 0x83) = 0xb00 - sVar18;
        *(undefined2 *)(param_1 + 0x68) = 0;
        *(undefined1 *)(param_1 + 0xa9) = 0;
        *(undefined2 *)(param_1 + 0x99) = 0x18;
      }
      sVar18 = *(short *)(param_1 + 0x70);
      if ((sVar18 < 0x13) && (9 < sVar18)) {
        *(undefined2 *)(param_1 + 0x95) = 4;
      }
      if (sVar18 != 0) {
        *(short *)(param_1 + 0x70) = sVar18 + -1;
      }
      if ((*(short *)(param_1 + 0x70) == 0) &&
         (uVar28 = (int)*(short *)(param_1 + 0x41) - (int)*(short *)(param_1 + 0x6a),
         uVar23 = (int)uVar28 >> 0x1f, (int)((uVar28 ^ uVar23) - uVar23) < 0x21)) {
        *(undefined1 *)(param_1 + 0xa8) = 2;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      }
      *(undefined1 *)(param_1 + 0x67) = 5;
      uVar17 = FUN_004eebc0(player_tribe_num,param_1 + 0x3d);
      update_gs_unit_related_array_item(param_1);
      *(undefined2 *)(param_1 + 0x57) = uVar17;
      uVar28 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar28 | 0x80;
      puVar19 = (unit_struct *)(uVar28 | 0x1080);
      *(unit_struct **)(param_1 + 0xc) = puVar19;
      break;
    case (unit_struct *)0x2:
      uVar33 = *(ushort *)(param_1 + 0x76);
      puVar19 = (unit_struct *)(uint)uVar33;
      if ((uVar33 & 0x10) != 0) {
        *(undefined1 *)(param_1 + 0xaa) = 0x20;
        *(undefined1 *)(param_1 + 0x67) = 6;
        *(undefined2 *)(param_1 + 0x95) = 0;
        *(undefined2 *)(param_1 + 0x5f) = 0x20;
        *(undefined2 *)(param_1 + 0x68) = 0xa0;
        *(undefined2 *)(param_1 + 0x6a) = 0x300;
        *(undefined2 *)(param_1 + 0x99) = 0x24;
        *(ushort *)(param_1 + 0x76) = uVar33 & 0xffef;
        if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
          uVar33 = *(short *)(param_1 + 0x26) + 0x2ab;
        }
        else {
          uVar33 = *(short *)(param_1 + 0x26) + 0x555;
        }
        update_gs_unit_related_array_item(param_1);
        *(ushort *)(param_1 + 0x57) = uVar33 & 0x7ff;
        uVar28 = *(uint *)(param_1 + 0xc);
        *(uint *)(param_1 + 0xc) = uVar28 | 0x80;
        puVar19 = (unit_struct *)(uVar28 | 0x1080);
        *(unit_struct **)(param_1 + 0xc) = puVar19;
      }
      pcVar4 = (char *)(param_1 + 0xaa);
      *pcVar4 = *pcVar4 + -1;
      if (*pcVar4 == '\0') {
        *(undefined1 *)(param_1 + 0xa8) = 3;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      }
      break;
    case (unit_struct *)0x3:
      *(undefined1 *)(param_1 + 0x2d) = 4;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    break;
  case (unit_struct *)0xa:
    uVar28 = *(uint *)(param_1 + 0xc);
    if ((uVar28 & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = uVar28 & 0xbfffffff;
      sVar18 = calc_point_height(CONCAT22(uVar17,*(undefined2 *)(param_1 + 0x3d)),
                                 *(undefined2 *)(param_1 + 0x3f));
      *(short *)(param_1 + 0x41) = sVar18;
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
      *(undefined1 *)(param_1 + 0xa8) = 5;
      *(short *)(param_1 + 0x41) = sVar18 + 600;
      *(short *)(param_1 + 0x6a) = sVar18 + 600;
      *(undefined1 *)(param_1 + 0x67) = 7;
      *(undefined2 *)(param_1 + 0x68) = 0;
      FUN_004de440(local_50,0x45,1);
      uVar28 = set_unit_anim(local_50,0x4a,0x4a,1);
      *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 4;
    }
    cVar16 = *(char *)(param_1 + 0xa8);
    uVar25 = (undefined3)(uVar28 >> 8);
    puVar19 = (unit_struct *)CONCAT31(uVar25,cVar16);
    uVar17 = (undefined2)(uVar28 >> 0x10);
    switch(cVar16) {
    case '\x01':
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined1 *)(param_1 + 0xa9) = 0;
        *(undefined1 *)(param_1 + 0x67) = 1;
        *(undefined2 *)(param_1 + 0x70) = 0x12;
        *(undefined2 *)(param_1 + 0x99) = 4;
        *(undefined2 *)(param_1 + 0x83) = 600;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      }
      sVar18 = *(short *)(param_1 + 0x70) + -1;
      puVar19 = (unit_struct *)CONCAT22(uVar17,sVar18);
      *(short *)(param_1 + 0x70) = sVar18;
      if (sVar18 < 1) {
        *(undefined1 *)(param_1 + 0x2d) = 0xc;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
      break;
    case '\x02':
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      puVar19 = (unit_struct *)CONCAT31(uVar25,cVar16 + -1);
      *(char *)(param_1 + 0xa8) = cVar16 + -1;
      break;
    case '\x03':
      uVar33 = *(ushort *)(param_1 + 0x99) >> 2;
      *(ushort *)(param_1 + 0x99) = uVar33;
      if (uVar33 < 4) {
        *(undefined2 *)(param_1 + 0x99) = 4;
      }
      puVar19 = (unit_struct *)CONCAT22(uVar17,*(short *)(param_1 + 0x99));
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + *(short *)(param_1 + 0x99);
      break;
    case '\x04':
      puVar34 = &local_50->object;
      *(char *)(param_1 + 0xa8) = cVar16 + -1;
      unit_set_object(puVar34,4,0x45);
      local_50->coord_scale_2 = 0x198;
      local_50->obj_index_anim_prev_2 = 0x4a;
      (local_50->object).f1 = 0x20;
      uVar33 = (local_50->object).flags;
      (local_50->object).flags = uVar33 & 0xefff;
      (local_50->object).flags = uVar33 & 0xebff;
      poVar15 = objs0_mem;
      (local_50->object).morph_index = objs0_mem[(short)puVar34->obj_index].morph_index;
      uVar33 = (local_50->object).flags;
      uVar28 = CONCAT22((short)((uint)poVar15 >> 0x10),uVar33) | 0x8000;
      (local_50->object).flags = (ushort)uVar28;
      puVar19 = (unit_struct *)(CONCAT31((int3)(uVar28 >> 8),(char)uVar33) | 0x80);
      (local_50->object).flags = (ushort)puVar19;
      local_50->loc_1_x = puVar34->obj_index;
      *(undefined1 *)&local_50->loc_1_y = 0;
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 0x40;
      *(undefined2 *)(param_1 + 0x99) = 0x20;
    }
    break;
  case (unit_struct *)0xb:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(undefined1 *)(param_1 + 0xa9) = 0;
      *(undefined1 *)(param_1 + 0x67) = 1;
      *(undefined1 *)(param_1 + 0x7c) = 1;
      *(undefined1 *)(param_1 + 0xa8) = 0;
      *(undefined2 *)(param_1 + 0x70) = 10;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      *(undefined2 *)(param_1 + 0x99) = 4;
      *(undefined2 *)(param_1 + 0x83) = 600;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      game_state._4_4_ = game_state._4_4_ & 0xffffff7f;
    }
    puVar19 = (unit_struct *)(uint)*(byte *)(param_1 + 0xa8);
    uVar17 = 0;
    switch(puVar19) {
    case (unit_struct *)0x0:
    case (unit_struct *)0x3:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 0x10;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      }
      uVar33 = *(short *)(param_1 + 0x70) - 1;
      puVar19 = (unit_struct *)(uint)uVar33;
      *(ushort *)(param_1 + 0x70) = uVar33;
      if ((short)uVar33 < 1) {
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        uVar28 = CONCAT11((char)(uVar33 >> 8),-(*(byte *)(param_1 + 0xa8) == 0)) & 0xfffffffd;
        cVar16 = (char)uVar28 + '\x04';
        puVar19 = (unit_struct *)CONCAT31((int3)(uVar28 >> 8),cVar16);
        *(char *)(param_1 + 0xa8) = cVar16;
      }
      break;
    case (unit_struct *)0x1:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        *(undefined2 *)(param_1 + 0x70) = 8;
        create_aod(param_1,2);
        create_aod(param_1,3);
        uVar17 = extraout_var;
      }
      sVar18 = *(short *)(param_1 + 0x70) + -1;
      puVar19 = (unit_struct *)CONCAT22(uVar17,sVar18);
      *(short *)(param_1 + 0x70) = sVar18;
      if (sVar18 < 1) {
        *(undefined1 *)(param_1 + 0xa8) = 2;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      }
      break;
    case (unit_struct *)0x2:
    case (unit_struct *)0x5:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 8;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      }
      iVar24 = 0;
      do {
        uVar28 = -(uint)(*(char *)(param_1 + 0xa8) == '\x02') & 0xfffffffe;
        iVar20 = uVar28 + 4;
        for (puVar19 = allocated_units;
            (puVar30 = (unit_struct *)0x0, puVar19 != (unit_struct *)0x0 &&
            ((((puVar19->unit_class != '\x01' || (puVar19->unit_type != '\b')) ||
              (uVar28 = (uint)(char)puVar19->tribe_index, uVar28 != (int)*(char *)(param_1 + 0x2f)))
             || (uVar28 = (uint)*(byte *)&puVar19->loc_1_y, puVar30 = puVar19,
                uVar28 != iVar20 + iVar24)))); puVar19 = puVar19->next_unit_1) {
        }
        uVar17 = (undefined2)(uVar28 >> 0x10);
        if (puVar30 != (unit_struct *)0x0) {
          uVar6 = (puVar30->pos).x;
          uVar7 = (puVar30->pos).y;
          local_c = (puVar30->pos).z;
          local_10 = uVar6;
          uStack_e = uVar7;
          move_pos_angle_length
                    (&local_10,
                     (int)(short)puVar30->maybe_shape_angle +
                     (-(uint)(iVar24 == 0) & 0xfffffc00) + 0x200 & 0x7ff,0x74);
          add_unit_to_cell(puVar30,&local_10);
          uVar17 = extraout_var_00;
        }
        iVar24 = iVar24 + 1;
      } while (iVar24 < 2);
      sVar18 = *(short *)(param_1 + 0x70) + -1;
      puVar19 = (unit_struct *)CONCAT22(uVar17,sVar18);
      *(short *)(param_1 + 0x70) = sVar18;
      if (sVar18 < 1) {
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        uVar28 = CONCAT31((int3)((uint)puVar19 >> 8),-(*(char *)(param_1 + 0xa8) == '\x02')) &
                 0xfffffffd;
        cVar16 = (char)uVar28 + '\x06';
        puVar19 = (unit_struct *)CONCAT31((int3)(uVar28 >> 8),cVar16);
        *(char *)(param_1 + 0xa8) = cVar16;
      }
      break;
    case (unit_struct *)0x4:
      uVar17 = 0;
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 8;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        for (puVar19 = allocated_units;
            (puVar30 = (unit_struct *)0x0, puVar19 != (unit_struct *)0x0 &&
            (((puVar19->unit_class != '\x01' || (puVar19->unit_type != '\b')) ||
             ((puVar19->tribe_index != *(char *)(param_1 + 0x2f) ||
              (puVar30 = puVar19, *(char *)&puVar19->loc_1_y != '\x02'))))));
            puVar19 = puVar19->next_unit_1) {
        }
        if (puVar30 != (unit_struct *)0x0) {
          create_aod(puVar30,4);
        }
        for (puVar19 = allocated_units;
            (puVar30 = (unit_struct *)0x0, puVar19 != (unit_struct *)0x0 &&
            (((puVar19->unit_class != '\x01' || (puVar19->unit_type != '\b')) ||
             ((puVar19->tribe_index != *(char *)(param_1 + 0x2f) ||
              (puVar30 = puVar19, *(char *)&puVar19->loc_1_y != '\x03'))))));
            puVar19 = puVar19->next_unit_1) {
        }
        uVar17 = (undefined2)((uint)puVar19 >> 0x10);
        if (puVar30 != (unit_struct *)0x0) {
          create_aod(puVar30,5);
          uVar17 = extraout_var_01;
        }
      }
      sVar18 = *(short *)(param_1 + 0x70) + -1;
      puVar19 = (unit_struct *)CONCAT22(uVar17,sVar18);
      *(short *)(param_1 + 0x70) = sVar18;
      if (sVar18 < 1) {
        *(undefined1 *)(param_1 + 0xa8) = 5;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      }
      break;
    case (unit_struct *)0x6:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 0x10;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      }
      uVar33 = *(short *)(param_1 + 0x70) - 1;
      puVar19 = (unit_struct *)(uint)uVar33;
      *(ushort *)(param_1 + 0x70) = uVar33;
      if (uVar33 == 8) {
        iVar24 = 0;
        do {
          puVar19 = (unit_struct *)(int)*(char *)(param_1 + 0x2f);
          puVar30 = allocated_units;
          while ((puVar32 = (unit_struct *)0x0, puVar30 != (unit_struct *)0x0 &&
                 ((((puVar30->unit_class != '\x01' || (puVar30->unit_type != '\b')) ||
                   ((unit_struct *)(int)(char)puVar30->tribe_index != puVar19)) ||
                  (puVar32 = puVar30, (uint)*(byte *)&puVar30->loc_1_y - iVar24 != 2))))) {
            puVar30 = puVar30->next_unit_1;
          }
          if (puVar32 != (unit_struct *)0x0) {
            puVar32->state_2 = 0x11;
            puVar32->flags_2 = puVar32->flags_2 | 0x40000000;
          }
          iVar24 = iVar24 + 1;
        } while (iVar24 < 4);
      }
      else if ((short)uVar33 < 1) {
        sVar18 = *(short *)(param_1 + 0x26);
        update_gs_unit_related_array_item(param_1);
        *(ushort *)(param_1 + 0x57) = sVar18 + 0x200U & 0x7ff;
        *(undefined1 *)(param_1 + 0x2d) = 4;
        uVar28 = *(uint *)(param_1 + 0xc);
        *(uint *)(param_1 + 0xc) = uVar28 | 0x80;
        *(uint *)(param_1 + 0xc) = uVar28 | 0x1080;
        puVar19 = (unit_struct *)(uVar28 | 0x40001080);
        *(unit_struct **)(param_1 + 0xc) = puVar19;
      }
    }
    break;
  case (unit_struct *)0xf:
    uVar28 = *(uint *)(param_1 + 0xc);
    if ((uVar28 & 0x40000000) != 0) {
      *(undefined1 *)(param_1 + 0x67) = 8;
      *(undefined2 *)(param_1 + 0x6a) = 0x600;
      *(undefined2 *)(param_1 + 0x99) = 0x40;
      *(uint *)(param_1 + 0xc) = uVar28 & 0xbfffffff;
      uVar23 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar28 = uVar23 >> 0xd;
      game_state.pseudo_random_val = uVar28 | uVar23 * 0x80000;
      FUN_004e94f0(param_1 + 0x49,0xa00,uVar28 & 0x7ff);
      *(undefined1 *)(param_1 + 0xaa) = 0x10;
      uVar28 = *(uint *)(param_1 + 0xc) & 0xffff7fff;
      *(uint *)(param_1 + 0xc) = uVar28;
      uVar28 = uVar28 | 0x80000;
      *(uint *)(param_1 + 0xc) = uVar28;
    }
    cVar16 = *(char *)(param_1 + 0xaa) + -1;
    puVar19 = (unit_struct *)CONCAT31((int3)(uVar28 >> 8),cVar16);
    *(char *)(param_1 + 0xaa) = cVar16;
    if (cVar16 < '\x01') {
      uVar28 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar28 & 0xfff7ffff;
      *(uint *)(param_1 + 0xc) = uVar28 & 0xfff77fff;
      puVar19 = (unit_struct *)unit_clear_vec_2(param_1);
      *(undefined1 *)(param_1 + 0x2d) = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    break;
  case (unit_struct *)0x10:
    uVar28 = *(uint *)(param_1 + 0xc);
    if ((uVar28 & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = uVar28 & 0xbfffffff;
      sVar18 = (ushort)*(byte *)(param_1 + 0x7c) << 4;
      uVar28 = CONCAT22((short)((uVar28 & 0xbfffffff) >> 0x10),sVar18);
      *(short *)(param_1 + 0x70) = sVar18;
    }
    sVar18 = *(short *)(param_1 + 0x70) + -1;
    puVar19 = (unit_struct *)CONCAT22((short)(uVar28 >> 0x10),sVar18);
    *(short *)(param_1 + 0x70) = sVar18;
    if (sVar18 < 1) {
      uVar28 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar23 = uVar28 >> 0xd;
      game_state.pseudo_random_val = uVar23 | uVar28 * 0x80000;
      update_gs_unit_related_array_item(param_1);
      uVar28 = *(uint *)(param_1 + 0xc);
      *(ushort *)(param_1 + 0x57) = (ushort)uVar23 & 0x7ff;
      *(undefined1 *)(param_1 + 0x2d) = 4;
      *(uint *)(param_1 + 0xc) = uVar28 | 0x80;
      *(uint *)(param_1 + 0xc) = uVar28 | 0x1080;
      puVar19 = (unit_struct *)(uVar28 | 0x40001080);
      *(unit_struct **)(param_1 + 0xc) = puVar19;
    }
  }
  if ((bVar11) && (*(char *)(param_1 + 0x7c) == '\x01')) {
    if ((land_flags_1._3_1_ & 6) == 0) {
      if (*(short *)(param_1 + 99) == 0) {
        *(undefined2 *)(param_1 + 99) = 1;
        puVar19 = (unit_struct *)FUN_004af0a0(2);
        if (game_state._838940_1_ == '\0') {
          FUN_00419a60(0,0,0);
          if (game_state._838930_2_ != *(short *)(param_1 + 0x24)) {
            game_state._838943_1_ = game_state._838943_1_ & 0xfd;
            game_state._838940_1_ = 0;
            game_state._838930_2_ = *(short *)(param_1 + 0x24);
          }
          puVar19 = (unit_struct *)FUN_00419a20(0);
        }
      }
    }
    else {
      *(undefined1 *)(param_1 + 0x7c) = 6;
      *(undefined2 *)(param_1 + 99) = 0;
    }
  }
  if ((bVar12) && (*(char *)(param_1 + 0x7c) == '\0')) {
    if ((*(short *)(param_1 + 0x97) == 0) ||
       (puVar19 = (unit_struct *)(uint)*(byte *)(param_1 + 0xb2), DAT_005aa5a0 <= (int)puVar19)) {
      *(undefined1 *)(param_1 + 0x2d) = 7;
    }
    else {
      if ((*(byte *)(param_1 + 0x93) & 1) == 0) goto LAB_004dd482;
      FUN_00407860(unit_land_array[*(ushort *)(param_1 + 0x89)],0,0,0xffffffff,0,0,0xffffffff,
                   0xffffffff,0);
      iVar24 = alloc_unit(7,1,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      puVar19 = (unit_struct *)0x0;
      if (iVar24 != 0) {
        puVar19 = (unit_struct *)FUN_0050b6f0(iVar24,3,2,5,0x62,0x8c,1,0);
      }
      *(undefined1 *)(param_1 + 0x2d) = 8;
    }
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  }
LAB_004dd482:
  if ((*(char *)(param_1 + 0x2a) != '\0') &&
     (((puVar19 = (unit_struct *)FUN_004ddb30(param_1), bVar13 || (bVar36)) || (bVar14)))) {
    puVar19 = (unit_struct *)trans_obj_vertex_to_world_space(local_50,&local_8,6);
    if (bVar36) {
      local_10 = (undefined2)local_8;
      uStack_e = (undefined2)((uint)local_8 >> 0x10);
      local_c = local_4 + -0x2e;
      move_pos_angle_length
                (&local_10,CONCAT22((short)((uint)&local_10 >> 0x10),local_50->maybe_shape_angle),
                 0x80);
      iVar24 = alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),&local_10);
      puVar19 = (unit_struct *)0x0;
      if (iVar24 != 0) {
        *(short *)(iVar24 + 0x5f) = *(short *)(param_1 + 0x5f) + 0x28;
        sVar18 = *(short *)&local_50->field_0x6c;
        *(undefined2 *)(iVar24 + 0x57) = *(undefined2 *)(param_1 + 0x26);
        *(ushort *)(iVar24 + 0x59) = sVar18 + 0x293U & 0x7ff;
        uVar28 = *(uint *)(iVar24 + 0xc);
        *(uint *)(iVar24 + 0xc) = uVar28 | 0x1000;
        *(uint *)(iVar24 + 0xc) = uVar28 | 0x1080;
        *(undefined2 *)(iVar24 + 0x6c) = 0xc;
        *(uint *)(iVar24 + 0x10) = *(uint *)(iVar24 + 0x10) | 0x200;
        unit_set_object(iVar24 + 0x33,0x1f,0x454);
        uVar28 = *(uint *)(iVar24 + 0x14);
        *(uint *)(iVar24 + 0x14) = uVar28 | 0x100;
        *(uint *)(iVar24 + 0x14) = uVar28 | 0x40100;
        *(undefined4 *)(iVar24 + 0x43) = *(undefined4 *)(param_1 + 0x43);
        puVar19 = (unit_struct *)
                  CONCAT22((short)((uint)(param_1 + 0x43) >> 0x10),*(undefined2 *)(param_1 + 0x47));
        *(undefined2 *)(iVar24 + 0x47) = *(undefined2 *)(param_1 + 0x47);
      }
    }
    if (bVar13) {
      local_10 = (undefined2)local_8;
      uStack_e = (undefined2)((uint)local_8 >> 0x10);
      local_c = local_4 + -0x2e;
      sVar18 = calc_point_height(local_8,CONCAT22(local_4,uStack_e));
      if (local_c < sVar18) {
        local_c = sVar18;
      }
      add_unit_to_cell(local_1c,&local_10);
      uVar22 = *(undefined4 *)(param_1 + 0x43);
      (local_1c->vec1).x = (short)uVar22;
      (local_1c->vec1).y = (short)((uint)uVar22 >> 0x10);
      puVar19 = (unit_struct *)
                CONCAT22((short)((uint)(param_1 + 0x43) >> 0x10),*(undefined2 *)(param_1 + 0x47));
      (local_1c->vec1).z = *(undefined2 *)(param_1 + 0x47);
    }
    if ((bVar14) && (((byte)land_flags_1 & 8) == 0)) {
      local_10 = (undefined2)local_8;
      uStack_e = (undefined2)((uint)local_8 >> 0x10);
      local_c = local_4 + -0x2e;
      puVar19 = (unit_struct *)alloc_unit(7,0x27,*(undefined1 *)(param_1 + 0x2f),&local_10);
      if (puVar19 != (unit_struct *)0x0) {
        (puVar19->pos).z = local_c;
      }
    }
  }
LAB_004dd66d:
  return (uint)puVar19 & 0xffffff00;
}
