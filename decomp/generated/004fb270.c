/* Ghidra 12.1.3 pseudocode; entry 004fb270; FUN_004fb270.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004fbc3f) */
/* WARNING: Type propagation algorithm not settling */

void FUN_004fb270(int param_1)

{
  undefined4 *puVar1;
  byte bVar2;
  undefined4 uVar3;
  unit_struct *puVar4;
  bool bVar5;
  bool bVar6;
  byte bVar7;
  char cVar8;
  short sVar9;
  int iVar10;
  int iVar11;
  short *psVar12;
  uint uVar13;
  int iVar14;
  ushort uVar15;
  int iVar16;
  undefined2 extraout_var;
  unit_struct *puVar17;
  unit_struct *puVar18;
  ushort *puVar19;
  bool bVar20;
  undefined2 local_34;
  undefined2 local_32;
  undefined2 local_30;
  ushort local_2e;
  unit_struct *local_2c;
  int local_24;
  unit_struct *local_18;
  ushort *local_14;
  ushort uStack_e;
  ushort local_c;
  ushort local_a;
  undefined4 local_8;
  int local_4;

  local_18 = (unit_struct *)0x0;
  local_24 = 0;
  bVar20 = false;
  bVar6 = false;
  if ((game_state.level_flags & 0x20) != 0) {
    return;
  }
  if (*(char *)(param_1 + 0x6e) != '\0') {
    FUN_004fbd20(param_1,0,0,0);
    if (1 < *(byte *)(param_1 + 0x6e)) {
      bVar2 = *(byte *)(param_1 + 0x6d);
      if ((bVar2 & 1) == 0) {
        bVar7 = bVar2 & 0xfe;
      }
      else {
        bVar7 = bVar2 | 1;
      }
      *(byte *)(param_1 + 0x6d) = bVar7;
      if ((*(byte *)(param_1 + 0x6d) & 1) != 0) {
        *(undefined1 *)(param_1 + 0x6e) = 1;
      }
      FUN_004fbd20(param_1,0,0,bVar2 & 1);
    }
    *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) & 0xfd;
    *(undefined1 *)(param_1 + 0x6e) = 0;
    *(undefined4 *)(param_1 + 0x96) = 0;
    *(undefined4 *)(param_1 + 0x86) = 0;
    *(undefined4 *)(param_1 + 0x8a) = 0;
  }
  if ((*(byte *)(param_1 + 0x6d) & 1) == 0) {
    if (*(short *)(param_1 + 0x90) == 0) {
      return;
    }
    sVar9 = *(short *)(param_1 + 0x90) + -1;
    *(short *)(param_1 + 0x90) = sVar9;
    if (sVar9 != 0) {
      return;
    }
    *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) | 1;
    *(undefined1 *)(param_1 + 0x6e) = 1;
    FUN_004fbd20(param_1,0,0,1);
    return;
  }
  cVar8 = *(char *)(param_1 + 0x68);
  switch(cVar8) {
  case '\0':
  case '\x03':
  case '\x05':
    if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
      local_2c = (unit_struct *)0x0;
      *(undefined1 *)(param_1 + 0xa0) = 0xff;
      *(undefined4 *)(param_1 + 0x86) = 0;
      *(undefined4 *)(param_1 + 0x8a) = 0;
      bVar2 = *(byte *)(param_1 + 0x69);
      iVar14 = (uint)bVar2 * 2 + 1;
      local_2e = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
      local_32._0_1_ = (char)local_2e;
      local_32._0_1_ = (char)local_32 + bVar2 * -2;
      local_32._1_1_ = (char)(local_2e >> 8);
      local_32._1_1_ = local_32._1_1_ + bVar2 * -2;
      iVar16 = iVar14;
      local_34 = local_32;
      if (*(int *)(param_1 + 0x9a) == 0) {
        for (; iVar11 = iVar14, iVar16 != 0; iVar16 = iVar16 + -1) {
          for (; iVar11 != 0; iVar11 = iVar11 + -1) {
            for (puVar4 = unit_land_array
                          [(short)(&game_state.level_data[0].unit_index)
                                  [((local_34 & 0xfe) * 2 | local_34 & 0xfe00) * 2]];
                puVar4 != (unit_struct *)0x0; puVar4 = unit_land_array[puVar4->next_unit_index]) {
              if ((puVar4->unit_class == '\x01') &&
                 ((((cVar8 != '\x03' && (cVar8 != '\x05')) || (puVar4->unit_type == '\a')) &&
                  (((puVar4->flags_4 & 0x800) == 0 && (puVar4->tribe_index != -1)))))) {
                psVar12 = (short *)(param_1 + 0x86 + (char)puVar4->tribe_index * 2);
                *psVar12 = *psVar12 + 1;
              }
            }
            local_34 = CONCAT11(local_34._1_1_,(char)local_34 + '\x02');
          }
          local_34 = CONCAT11(local_34._1_1_ + '\x02',(char)local_32);
        }
        iVar16 = 0;
        iVar14 = 0;
        *(undefined1 *)(param_1 + 0xa0) = 0;
        do {
          iVar11 = (int)*(short *)(param_1 + 0x86 + iVar16 * 2);
          if (iVar14 < iVar11) {
            *(char *)(param_1 + 0xa0) = (char)iVar16;
            iVar14 = iVar11;
          }
          iVar16 = iVar16 + 1;
        } while (iVar16 < 4);
      }
      else {
        if (((*(ushort *)(param_1 + 0x92) != 0) &&
            (puVar4 = unit_land_array[*(ushort *)(param_1 + 0x92)],
            (*(byte *)&puVar4->flags_2 & 1) == 0)) && (puVar4->unit_class != '\0')) {
          local_2c = puVar4;
        }
        if (local_2c == (unit_struct *)0x0) {
          uVar3 = *(undefined4 *)(param_1 + 0x3d);
          puVar4 = head_units;
          do {
            puVar17 = puVar4;
            local_2c = (unit_struct *)0x0;
            if (puVar17 == (unit_struct *)0x0) break;
            puVar4 = puVar17->next_unit;
          } while (((((puVar17->flags_2 & 1) != 0) || (puVar17->state == '\f')) ||
                   ((puVar17->flags_2 & 0x20000) == 0)) ||
                  ((local_8._0_2_ = (ushort)uVar3,
                   (((puVar17->pos).x ^ (ushort)local_8) & 0xfe00) != 0 ||
                   (local_8._2_2_ = (ushort)((uint)uVar3 >> 0x10), local_2c = puVar17,
                   (((puVar17->pos).y ^ local_8._2_2_) & 0xfe00) != 0))));
          local_8 = uVar3;
          if (local_2c != (unit_struct *)0x0) {
            *(undefined2 *)(param_1 + 0x92) = local_2c->unit_index;
          }
        }
        if (local_2c != (unit_struct *)0x0) {
          switch(((int)(short)local_2c->maybe_shape_angle + 0x400U & 0x600) >> 9) {
          case 0:
            local_32 = CONCAT11(local_32._1_1_ + bVar2 * '\x02',(char)local_32);
            local_34 = local_32;
            break;
          case 1:
            local_32 = CONCAT11(local_32._1_1_,(char)local_32 + bVar2 * '\x02');
            local_34 = local_32;
            break;
          case 2:
            local_32 = CONCAT11(local_32._1_1_ + bVar2 * -2,(char)local_32);
            local_34 = local_32;
            break;
          case 3:
            local_32 = CONCAT11(local_32._1_1_,(char)local_32 + bVar2 * -2);
            local_34 = local_32;
          }
        }
        for (; iVar11 = iVar14, iVar16 != 0; iVar16 = iVar16 + -1) {
          for (; iVar11 != 0; iVar11 = iVar11 + -1) {
            for (puVar4 = unit_land_array
                          [(short)(&game_state.level_data[0].unit_index)
                                  [((local_34 & 0xfe) * 2 | local_34 & 0xfe00) * 2]];
                puVar4 != (unit_struct *)0x0; puVar4 = unit_land_array[puVar4->next_unit_index]) {
              if ((((puVar4->unit_class == '\x01') &&
                   ((((cVar8 != '\x03' && (cVar8 != '\x05')) || (puVar4->unit_type == '\a')) &&
                    ((((*(byte *)((int)&puVar4->flags_4 + 1) & 8) == 0 &&
                      (puVar4->tribe_index != -1)) &&
                     (iVar10 = FUN_004f62c0(puVar4,0x1b), iVar10 != 0)))))) &&
                  ((puVar4->field36_0x5f == 0 || (local_2c == (unit_struct *)0x0)))) &&
                 (puVar4->state_2 != '\0')) {
                psVar12 = (short *)(param_1 + 0x86 + (char)puVar4->tribe_index * 2);
                *psVar12 = *psVar12 + 1;
                local_18 = puVar4;
              }
            }
            local_34 = CONCAT11(local_34._1_1_,(char)local_34 + '\x02');
          }
          local_34 = CONCAT11(local_34._1_1_ + '\x02',(char)local_32);
        }
        iVar16 = 0;
        iVar14 = 0;
        *(undefined1 *)(param_1 + 0xa0) = 0;
        do {
          iVar11 = (int)*(short *)(param_1 + 0x86 + iVar16 * 2);
          if (iVar14 < iVar11) {
            *(char *)(param_1 + 0xa0) = (char)iVar16;
            iVar14 = iVar11;
          }
          iVar16 = iVar16 + 1;
        } while (iVar16 < 4);
        if (local_2c != (unit_struct *)0x0) {
          FUN_00509290(local_2c);
          if ((iVar14 == 0) || (local_18->tribe_index == player_tribe_num)) {
            *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) & 0xbf;
          }
          else if ((*(byte *)(param_1 + 0x6d) & 0x40) == 0) {
            if ((((byte)level_flags_2 & 8) == 0) && (cVar8 = FUN_00430bd0(6), cVar8 != -1)) {
              FUN_00430fc0(cVar8,CONCAT31((int3)((uint)local_18 >> 8),local_18->tribe_index));
              FUN_00430e60(cVar8,&local_2c->pos,CONCAT22(extraout_var,local_2c->maybe_shape_angle));
            }
            *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) | 0x40;
          }
        }
      }
      if (*(char *)(param_1 + 0x6f) == '\0') {
        iVar11 = 0;
        psVar12 = (short *)(param_1 + 0x86);
        iVar16 = 4;
        do {
          if (*psVar12 != 0) {
            iVar11 = iVar11 + 1;
          }
          psVar12 = psVar12 + 1;
          iVar16 = iVar16 + -1;
        } while (iVar16 != 0);
        if (1 < iVar11) {
          *(undefined1 *)(param_1 + 0x6f) = 8;
        }
      }
      else {
        *(char *)(param_1 + 0x6f) = *(char *)(param_1 + 0x6f) + -1;
      }
      iVar11 = (int)*(short *)(param_1 + 0x8e);
      iVar16 = iVar11 * iVar11;
      if (iVar14 == 0) {
        if ((*(int *)(param_1 + 0x96) != 0) &&
           (iVar16 = *(int *)(param_1 + 0x96) - iVar16, *(int *)(param_1 + 0x96) = iVar16,
           iVar16 < 0)) {
          *(undefined4 *)(param_1 + 0x96) = 0;
        }
        if ((*(byte *)(param_1 + 0x6d) & 8) != 0) {
          *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) & 0xf7;
          FUN_004fbd20(param_1,0,0,0);
        }
      }
      else {
        if (iVar11 < iVar14) {
          iVar14 = iVar11;
        }
        iVar14 = (iVar11 - iVar14) + 1;
        iVar14 = iVar16 / (iVar14 * iVar14) + *(int *)(param_1 + 0x96);
        iVar16 = *(int *)(param_1 + 0x9a) * iVar16;
        *(int *)(param_1 + 0x96) = iVar14;
        bVar20 = iVar16 - iVar14 == 0 || iVar16 < iVar14;
        if (bVar20) {
          *(int *)(param_1 + 0x96) = iVar16;
        }
        if ((*(byte *)(param_1 + 0x6d) & 8) == 0) {
          *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) | 8;
          FUN_004fbd20(param_1,0,0,0);
        }
      }
    }
    break;
  case '\x01':
    sVar9 = *(short *)(param_1 + 0x86) + 1;
    *(short *)(param_1 + 0x86) = sVar9;
    if (*(short *)(param_1 + 0x8e) <= sVar9) {
      bVar20 = true;
    }
    break;
  case '\x02':
    cVar8 = FUN_00419480((int)*(short *)(param_1 + 0x8e));
    if (cVar8 != '\0') {
      bVar20 = true;
    }
    break;
  case '\x04':
    *(char *)(param_1 + 0xa0) = player_tribe_num;
    if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
      puVar17 = (unit_struct *)0x0;
      bVar5 = false;
      puVar4 = game_state.tribes_array[player_tribe_num].shaman;
      if (((puVar4 != (unit_struct *)0x0) && (puVar4->state == '\n')) && (puVar4->field_0xa7 == '!')
         ) {
        if (((*(ushort *)(param_1 + 0x92) != 0) &&
            (puVar18 = unit_land_array[*(ushort *)(param_1 + 0x92)],
            (*(byte *)&puVar18->flags_2 & 1) == 0)) && (puVar18->unit_class != '\0')) {
          puVar17 = puVar18;
        }
        if (puVar17 == (unit_struct *)0x0) {
          local_30 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                              (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
          uVar15 = (&game_state.level_data[0].unit_index_2)
                   [((local_30 & 0xfe) * 2 | local_30 & 0xfe00) * 2] & 0x3ff;
          puVar17 = unit_land_array[uVar15];
          if ((puVar17 == (unit_struct *)0x0) ||
             (*(ushort *)(param_1 + 0x92) = uVar15, puVar17 == (unit_struct *)0x0))
          goto LAB_004fb92c;
        }
        FUN_00509290(puVar17);
        iVar14 = get_adjacent_unit(puVar4,0x12);
        if ((iVar14 != 0) ||
           ((FUN_004044b0(puVar17,&local_c), (((puVar4->pos).x ^ local_c) & 0xfe00) == 0 &&
            ((((puVar4->pos).y ^ local_a) & 0xfe00) == 0)))) {
          bVar5 = true;
        }
      }
LAB_004fb92c:
      *(undefined2 *)(param_1 + 0x86 + player_tribe_num * 2) = 0;
      if (bVar5) {
        *(undefined2 *)(param_1 + 0x86 + player_tribe_num * 2) = 1;
        if (*(int *)(param_1 + 0x96) < *(int *)(param_1 + 0x9a)) {
          iVar14 = *(int *)(param_1 + 0x96) + 1;
LAB_004fb971:
          *(int *)(param_1 + 0x96) = iVar14;
        }
      }
      else if (*(int *)(param_1 + 0x96) != 0) {
        iVar14 = *(int *)(param_1 + 0x96) + -1;
        goto LAB_004fb971;
      }
    }
  }
  if ((*(byte *)(param_1 + 0x6d) & 2) == 0) {
    if (bVar20) {
      if (*(char *)(param_1 + 0x6a) != '\0') {
        uVar13 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        game_state.pseudo_random_val = uVar13 >> 0xd | uVar13 * 0x80000;
        bVar20 = game_state.pseudo_random_val % (uint)*(byte *)(param_1 + 0x6a) == 0;
      }
      goto LAB_004fb9db;
    }
  }
  else {
    bVar20 = true;
LAB_004fb9db:
    if ((bVar20) && (*(short *)(param_1 + 0x9e) == 0)) {
      if (*(char *)(param_1 + 0x68) == '\x03') {
        *(undefined2 *)(param_1 + 0x9e) = 0x33;
        uStack_e = (ushort)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
        puVar4 = head_units;
        do {
          puVar17 = puVar4;
          puVar18 = (unit_struct *)0x0;
          if (puVar17 == (unit_struct *)0x0) break;
          puVar4 = puVar17->next_unit;
        } while (((((puVar17->flags_2 & 1) != 0) || (puVar17->state == '\f')) ||
                 ((puVar17->flags_2 & 0x20000) == 0)) ||
                (((((puVar17->pos).x ^ (ushort)*(undefined4 *)(param_1 + 0x3d)) & 0xfe00) != 0 ||
                 (puVar18 = puVar17, (((puVar17->pos).y ^ uStack_e) & 0xfe00) != 0))));
        if (puVar18 != (unit_struct *)0x0) {
          FUN_004fbd20(param_1,puVar18,1,0);
        }
      }
      else {
        *(undefined2 *)(param_1 + 0x9e) = 0;
      }
    }
  }
  if (*(short *)(param_1 + 0x9e) != 0) {
    sVar9 = *(short *)(param_1 + 0x9e) + -1;
    *(short *)(param_1 + 0x9e) = sVar9;
    bVar20 = sVar9 < 1;
  }
  if (!bVar20) {
    return;
  }
  local_4 = 10;
  local_14 = (ushort *)(param_1 + 0x72);
  do {
    if (*local_14 != 0) {
      bVar20 = true;
      puVar4 = unit_land_array[*local_14];
      cVar8 = FUN_004f0d20(puVar4->unit_type,puVar4->unit_class);
      if ((cVar8 == '\0') && (iVar14 = FUN_004f0d50(puVar4), iVar14 != 0)) {
        if ((*(char *)(iVar14 + 0x2a) == '\x06') && (*(char *)(iVar14 + 0x2b) == '\x06')) {
          *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) | 1;
          *(undefined1 *)(param_1 + 0x6e) = 1;
          FUN_004fbd20(param_1,0,0,1);
        }
        else {
          bVar20 = false;
        }
      }
      if (bVar20) {
        if ((*(char *)(param_1 + 0x71) == '\0') || (cVar8 = *(char *)(param_1 + 0xa0), cVar8 == -1))
        {
          cVar8 = puVar4->tribe_index;
        }
        iVar14 = alloc_unit(puVar4->unit_class,puVar4->unit_type,(int)cVar8,&puVar4->pos);
        if (iVar14 != 0) {
          FUN_004ede10(iVar14,puVar4);
          if ((*(char *)(param_1 + 0x71) != '\0') && (*(char *)(param_1 + 0xa0) != -1)) {
            *(char *)(iVar14 + 0x2f) = cVar8;
          }
          maybe_unit_state_processing_1(iVar14);
          cVar8 = *(char *)(param_1 + 0xa0);
          if ((((cVar8 != -1) && (*(char *)(iVar14 + 0x2a) == '\x06')) &&
              (*(char *)(iVar14 + 0x2b) == '\x02')) && (*(char *)(iVar14 + 0x7d) == '\x01')) {
            *(undefined2 *)(iVar14 + 0x7a) = 0x52;
            *(char *)(iVar14 + 0x7e) = cVar8;
            *(undefined1 *)(iVar14 + 0x7f) = 6;
            FUN_0048a050(0,0x70,1);
          }
        }
      }
    }
    local_14 = local_14 + 1;
    local_4 = local_4 + -1;
  } while (local_4 != 0);
  *(undefined4 *)(param_1 + 0x96) = 0;
  cVar8 = *(char *)(param_1 + 0x6b);
  if (cVar8 != '\0') {
    if (cVar8 < '\x01') {
      local_24 = 1;
      goto LAB_004fbc07;
    }
    *(char *)(param_1 + 0x6b) = cVar8 + -1;
    if ((char)(cVar8 + -1) == '\0') {
      bVar6 = true;
      goto LAB_004fbc07;
    }
  }
  local_24 = *(short *)(param_1 + 0x94) + 1;
LAB_004fbc07:
  if (local_24 != 0) {
    if ((*(byte *)(param_1 + 0x6d) & 4) == 0) {
      *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) | 4;
      *(int *)(param_1 + 0x9a) =
           *(int *)(param_1 + 0x9a) +
           (int)(short)((int)((int)*(short *)(param_1 + 0xa2) +
                             ((int)*(short *)(param_1 + 0xa2) >> 0x1f & 3U)) >> 2);
    }
    *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) & 0xfe;
    FUN_004fbd20(param_1,0,0,0);
    *(short *)(param_1 + 0x90) = (short)local_24 + -1;
  }
  if (!bVar6) {
    return;
  }
  puVar19 = (ushort *)(param_1 + 0x72);
  iVar14 = 10;
  do {
    if ((*puVar19 != 0) && (cVar8 = FUN_004fc290(param_1,*puVar19), cVar8 == '\0')) {
      puVar4 = unit_land_array[*puVar19];
      puVar1 = &puVar4->flags_3;
      *puVar1 = *puVar1 | 0x40;
      FUN_004ef180(puVar4);
    }
    puVar19 = puVar19 + 1;
    iVar14 = iVar14 + -1;
  } while (iVar14 != 0);
  FUN_004ef180(param_1);
  return;
}
