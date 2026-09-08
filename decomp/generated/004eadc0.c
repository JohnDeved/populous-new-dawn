/* Ghidra 12.1.3 pseudocode; entry 004eadc0; FUN_004eadc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004eaed3) */
/* WARNING: Removing unreachable block (ram,0x004eb8be) */

void FUN_004eadc0(int param_1)

{
  undefined2 *puVar1;
  unit_struct *puVar2;
  undefined4 uVar3;
  bool bVar4;
  bool bVar5;
  byte bVar6;
  bool bVar7;
  bool bVar8;
  undefined2 uVar9;
  bool bVar10;
  game_state_unit_struct_1 *pgVar11;
  ushort uVar14;
  char cVar12;
  ushort uVar13;
  int iVar15;
  uint uVar16;
  uint uVar17;
  int iVar18;
  short sVar19;
  ushort *puVar20;
  int iVar21;
  unit_struct *puVar22;
  unit_struct *puVar23;
  int iVar24;
  bool bVar25;
  byte local_1f;
  char local_1e;
  char local_1d;
  undefined4 local_1c;
  undefined4 local_18;
  undefined4 local_14;
  undefined4 local_10;
  int local_c;
  undefined2 local_8;
  short local_6;

  puVar23 = (unit_struct *)0x0;
  if (*(short *)(param_1 + 99) == 0) {
    return;
  }
  local_1e = '\0';
  local_1f = 0;
  local_1d = '\0';
  bVar7 = false;
  bVar4 = false;
  bVar10 = false;
  bVar8 = false;
  if ((*(byte *)(param_1 + 0xe) & 8) != 0) {
    return;
  }
  if ((*(short *)(param_1 + 0x9f) == 0) || (bVar5 = true, (*(byte *)(param_1 + 0x13) & 2) != 0)) {
    bVar5 = false;
  }
  iVar15 = (int)*(short *)(param_1 + 99);
  iVar24 = (int)*(char *)(param_1 + 0x67);
  iVar18 = iVar15 * 0x6d;
  local_c = iVar18 + 0x955c35;
  bVar25 = game_state.unit_related_array_1[iVar15].sub_array_counter == '\0';
  if (bVar25) {
    pgVar11 = game_state.unit_related_array_1 + iVar15;
    iVar21._0_1_ = pgVar11->coord_1;
    iVar21._1_1_ = pgVar11->coord_2;
    iVar21._2_2_ = *(undefined2 *)&pgVar11->field_0x6;
  }
  else {
    iVar21 = *(int *)(local_c + iVar24 * 4);
  }
  uVar17 = (uint)(byte)game_state.unit_related_array_1[iVar15].sub_array_counter;
  local_1c._2_1_ = (char)((uint)iVar21 >> 0x10);
  if (iVar24 < (int)(uVar17 - 1)) {
    cVar12 = '\x02' - (local_1c._2_1_ == '\0');
    if (iVar24 + 1 < (int)uVar17) {
      local_1e = '\x02' - (*(char *)(iVar18 + 0x955c3b + iVar24 * 4) == '\0');
    }
    else if ((game_state.unit_related_array_1[iVar15].flag & 2) == 0) {
      local_1e = '\x02' - (*(char *)(iVar18 + 0x955c3b + iVar24 * 4) == '\0');
    }
    else {
      local_1e = '\x03';
    }
  }
  else {
    bVar8 = true;
    cVar12 = '\x03';
    if ((game_state.unit_related_array_1[iVar15].flag & 2) == 0) {
      cVar12 = '\x02' - (local_1c._2_1_ == '\0');
    }
  }
  local_1c = iVar21;
  if (!bVar5) {
    if (cVar12 != '\x01') {
      if (cVar12 == '\x02') {
        local_1d = '\x02';
      }
      else {
        if (cVar12 != '\x03') goto LAB_004eaf59;
        local_1d = '\x03';
      }
      goto LAB_004eaf51;
    }
    local_1c = 0xe0;
    if (local_1e == '\x02') {
      local_1f = 1;
      local_1d = '\x02';
      goto LAB_004eaf51;
    }
  }
  else {
    puVar23 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
    if (cVar12 == '\x01') {
      bVar7 = true;
    }
    else {
      if ((cVar12 != '\x02') || (local_1c = 0xe0, local_1e == '\x02')) goto LAB_004eaf59;
      bVar4 = true;
    }
LAB_004eaf51:
    local_1c = 0x240;
  }
LAB_004eaf59:
  if (bVar25) {
    uVar14._0_1_ = game_state.unit_related_array_1[iVar15].coord_1;
    uVar14._1_1_ = game_state.unit_related_array_1[iVar15].coord_2;
    local_18 = uVar14 & 0xfffffffe;
    uVar14 = (ushort)local_18;
    bVar6 = (byte)(local_18 >> 8);
  }
  else {
    local_18 = *(ushort *)(local_c + ((uint)local_1f + iVar24) * 4) & 0xfffffffe;
    uVar14 = (ushort)local_18;
    bVar6 = (byte)(local_18 >> 8);
  }
  uVar14 = ((uVar14 & 0xff) + 1) * 0x100;
  uVar13 = ((bVar6 & 0xfe) + 1) * 0x100;
  local_14 = CONCAT22(uVar13,uVar14);
  if (puVar23 == (unit_struct *)0x0) {
    local_18 = *(undefined4 *)(param_1 + 0x3d);
  }
  else {
    local_18._0_2_ = (puVar23->pos).x;
    local_18._2_2_ = (puVar23->pos).y;
    uVar17._0_1_ = puVar23->num_points;
    uVar17._1_1_ = puVar23->tex_size_type;
    uVar17._2_2_ = puVar23->facs0_index;
    uVar16 = uVar17 & 0xfffffffe;
    puVar23->num_points = (char)uVar16;
    puVar23->tex_size_type = (char)(uVar16 >> 8);
    puVar23->facs0_index = (short)(uVar16 >> 0x10);
    uVar17 = uVar17 & 0xfffffefe;
    puVar23->num_points = (char)uVar17;
    puVar23->tex_size_type = (char)(uVar17 >> 8);
    puVar23->facs0_index = (short)(uVar17 >> 0x10);
    uVar14 = (uVar14 & 0xfe00) + 0x100;
    uVar13 = (uVar13 & 0xfe00) + 0x100;
    local_14 = CONCAT22(uVar13,uVar14);
    if (bVar4) {
      uVar17 = (int)(short)local_18 - (int)(short)uVar14 >> 0x1f;
      iVar18 = ((int)(short)local_18 - (int)(short)uVar14 ^ uVar17) - uVar17;
      if (0x7fff < iVar18) {
        iVar18 = 0xffff - iVar18;
      }
      if (iVar18 < 0x281) {
        uVar17 = (int)local_18._2_2_ - (int)(short)uVar13 >> 0x1f;
        iVar18 = ((int)local_18._2_2_ - (int)(short)uVar13 ^ uVar17) - uVar17;
        if (0x7fff < iVar18) {
          iVar18 = 0xffff - iVar18;
        }
        if (iVar18 < 0x281) {
          puVar23->pos_x1 = uVar14;
          puVar23->pos_y1 = uVar13;
          uVar16._0_1_ = puVar23->num_points;
          uVar16._1_1_ = puVar23->tex_size_type;
          uVar16._2_2_ = puVar23->facs0_index;
          uVar17 = uVar16 | 1;
          puVar23->num_points = (char)uVar17;
          puVar23->tex_size_type = (char)(uVar17 >> 8);
          puVar23->facs0_index = (short)(uVar17 >> 0x10);
          if ((((uVar14 ^ (short)local_18) & 0xfe00) == 0) &&
             (((uVar13 ^ local_18._2_2_) & 0xfe00) == 0)) {
            uVar16 = uVar16 | 0x101;
            puVar23->num_points = (char)uVar16;
            puVar23->tex_size_type = (char)(uVar16 >> 8);
            puVar23->facs0_index = (short)(uVar16 >> 0x10);
          }
        }
      }
    }
  }
  uVar17 = (int)(short)local_18 - (int)(short)local_14 >> 0x1f;
  iVar18 = ((int)(short)local_18 - (int)(short)local_14 ^ uVar17) - uVar17;
  if (0x7fff < iVar18) {
    iVar18 = 0xffff - iVar18;
  }
  iVar21 = local_1c + 1;
  local_1c = iVar21;
  if (iVar21 <= iVar18) {
LAB_004eb8b4:
    if (!bVar5) {
      if (((*(byte *)(param_1 + 0x2e) & 0xf) == 0) &&
         (cVar12 = FUN_004ebab0(param_1), cVar12 == '\0')) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80000000;
        return;
      }
    }
    else if (((bVar4) && ((*(byte *)(param_1 + 0x2e) & 3) == 0)) &&
            (cVar12 = FUN_004650d0(puVar23,&local_14), cVar12 == '\0')) {
      if ((bVar8) && (cVar12 = FUN_00464ce0(puVar23,&local_14,&local_1c), cVar12 != '\0')) {
        *(uint *)(param_1 + 0x4f) = local_1c;
      }
      iVar18 = (int)(char)unit_type_array_vehicle[(byte)puVar23->unit_type].field_0x8;
      if (0 < iVar18) {
        puVar20 = &puVar23->loc_1_x;
        do {
          puVar23 = (unit_struct *)0x0;
          if (((*puVar20 != 0) && (puVar22 = unit_land_array[*puVar20], (puVar22->flags_2 & 1) == 0)
              ) && (puVar22->unit_class != '\0')) {
            puVar23 = puVar22;
          }
          if (puVar23 != (unit_struct *)0x0) {
            puVar23->flags_2 = puVar23->flags_2 | 0x80000000;
          }
          puVar20 = puVar20 + 1;
          iVar18 = iVar18 + -1;
        } while (iVar18 != 0);
      }
    }
    return;
  }
  uVar17 = (int)local_18._2_2_ - (int)local_14._2_2_ >> 0x1f;
  iVar18 = ((int)local_18._2_2_ - (int)local_14._2_2_ ^ uVar17) - uVar17;
  if (0x7fff < iVar18) {
    iVar18 = 0xffff - iVar18;
  }
  if (iVar21 <= iVar18) goto LAB_004eb8b4;
  bVar4 = (int)((byte)game_state.unit_related_array_1[iVar15].sub_array_counter - 1) <=
          (int)((uint)local_1f + iVar24);
  local_18 = CONCAT31(local_18._1_3_,bVar4);
  local_1c._2_2_ = (undefined2)((uint)iVar21 >> 0x10);
  if (local_1d != '\0') {
    local_1c._0_2_ = CONCAT11((char)((uint)local_14 >> 0x18),(char)((uint)local_14 >> 8));
    if (local_1d == '\x02') {
      iVar18 = FUN_004663c0();
    }
    else {
      iVar18 = FUN_004664c0(param_1,(((ushort)local_1c & 0xfe) * 2 | (ushort)local_1c & 0xfe00) * 4
                                    + 0x8a03e4);
    }
    if ((iVar18 == 0) || (cVar12 = FUN_004657d0(param_1,iVar18), cVar12 == '\0')) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80000000;
    }
    uVar17 = *(uint *)(param_1 + 0xc);
    if ((uVar17 & 0x80000000) != 0) {
      return;
    }
    if ((char)local_18 == '\0') {
      cVar12 = *(char *)(param_1 + 0x67);
      *(char *)(param_1 + 0x67) = cVar12 + '\x01';
      if (local_1f != 0) {
        *(char *)(param_1 + 0x67) = cVar12 + '\x02';
      }
      local_8._1_1_ =
           game_state.unit_related_array_1[*(short *)(param_1 + 99)].sub_array
           [*(char *)(param_1 + 0x67)].field_0x1 & 0xfe;
      *(ushort *)(param_1 + 0x53) =
           ((*(byte *)(*(short *)(param_1 + 99) * 0x6d + 0x955c35 + *(char *)(param_1 + 0x67) * 4) &
            0xfe) + 1) * 0x100;
      *(ushort *)(param_1 + 0x55) = (local_8._1_1_ + 1) * 0x100;
      *(undefined4 *)(param_1 + 0x57) = *(undefined4 *)(param_1 + 0x53);
      *(uint *)(param_1 + 0xc) = uVar17 | 0x1000;
      *(uint *)(param_1 + 0xc) = uVar17 & 0xffffff7f | 0x1000;
      return;
    }
    if ((local_1d != '\x03') &&
       ((*(char *)(param_1 + 0x50) != local_14._1_1_ ||
        (*(char *)(param_1 + 0x52) != local_14._3_1_)))) {
      *(uint *)(param_1 + 0xc) = uVar17 | 0x80000000;
      return;
    }
    iVar18 = (int)*(short *)(param_1 + 99);
    if (iVar18 != 0) {
      *(undefined2 *)(param_1 + 99) = 0;
      *(undefined1 *)(param_1 + 0x67) = 0;
      sVar19 = game_state.unit_related_array_1[iVar18].counter;
      if (((0 < sVar19) &&
          (sVar19 = sVar19 + -1, game_state.unit_related_array_1[iVar18].counter = sVar19,
          sVar19 < 1)) &&
         (game_state._755256_2_ = game_state._755256_2_ + -1,
         (game_state.unit_related_array_1[iVar18].flag & 4) == 0)) {
        game_state.unit_related_array_1[iVar18].flag = 0;
      }
    }
    *(undefined4 *)(param_1 + 0x53) = *(undefined4 *)(param_1 + 0x4f);
    return;
  }
  if (bVar7) {
    *(char *)(param_1 + 0x67) = *(char *)(param_1 + 0x67) + '\x01';
    puVar1 = (undefined2 *)(local_c + iVar24 * 4);
    if (local_1e == '\x01') {
      uVar9 = puVar1[2];
      local_1c = CONCAT22(local_1c._2_2_,uVar9);
      uVar3 = local_1c;
      local_1c._0_1_ = (byte)uVar9;
      local_1c._1_3_ = SUB43(uVar3,1);
      local_1c = CONCAT31(local_1c._1_3_,(byte)local_1c) & 0xfffffefe;
    }
    else {
      uVar9 = *puVar1;
      local_1c = CONCAT22(local_1c._2_2_,uVar9);
      uVar3 = local_1c;
      local_1c._0_1_ = (byte)uVar9;
      local_1c._1_3_ = SUB43(uVar3,1);
      local_1c = CONCAT31(local_1c._1_3_,(byte)local_1c) & 0xfffffefe;
    }
    local_8 = ((byte)local_1c + 1) * 0x100;
    local_6 = (local_1c._1_1_ + 1) * 0x100;
    local_10 = CONCAT22(local_6,local_8);
    cVar12 = FUN_00518200(&local_8,1);
    if (cVar12 != '\0') {
      FUN_00466190(puVar23,&local_10);
    }
    *(undefined4 *)(param_1 + 0x53) = local_10;
    sVar19 = *(short *)(param_1 + 99);
    iVar18 = (int)(char)unit_type_array_vehicle[(byte)puVar23->unit_type].field_0x8;
    if (0 < iVar18) {
      puVar20 = &puVar23->loc_1_x;
      do {
        puVar22 = (unit_struct *)0x0;
        if (((*puVar20 != 0) &&
            (puVar2 = unit_land_array[*puVar20], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
           (puVar2->unit_class != '\0')) {
          puVar22 = puVar2;
        }
        if ((puVar22 != (unit_struct *)0x0) && (puVar22->index_to_array == sVar19)) {
          puVar22->field_0x67 = *(undefined1 *)(param_1 + 0x67);
          *(undefined4 *)&(puVar22->vec3).z = *(undefined4 *)(param_1 + 0x53);
          uVar3 = *(undefined4 *)(param_1 + 0x53);
          puVar22->pos_x1 = (short)uVar3;
          puVar22->pos_y1 = (short)((uint)uVar3 >> 0x10);
          uVar17 = puVar22->flags_2;
          puVar22->flags_2 = uVar17 | 0x1000;
          puVar22->flags_2 = uVar17 & 0xffffff7f | 0x1000;
        }
        puVar20 = puVar20 + 1;
        iVar18 = iVar18 + -1;
      } while (iVar18 != 0);
    }
    if ((*(byte *)(param_1 + 0xf) & 8) != 0) {
      iVar18 = (int)(char)unit_type_array_vehicle[(byte)puVar23->unit_type].field_0x8;
      if (iVar18 < 1) {
        return;
      }
      puVar20 = &puVar23->loc_1_x;
      do {
        puVar23 = (unit_struct *)0x0;
        if (((*puVar20 != 0) && (puVar22 = unit_land_array[*puVar20], (puVar22->flags_2 & 1) == 0))
           && (puVar22->unit_class != '\0')) {
          puVar23 = puVar22;
        }
        if ((puVar23 != (unit_struct *)0x0) && ((puVar23->flags_2 & 0x8000000) != 0)) {
          iVar15 = (int)puVar23->index_to_array;
          if (iVar15 != 0) {
            puVar23->index_to_array = 0;
            puVar23->field_0x67 = 0;
            sVar19 = game_state.unit_related_array_1[iVar15].counter;
            if (((0 < sVar19) &&
                (sVar19 = sVar19 + -1, game_state.unit_related_array_1[iVar15].counter = sVar19,
                sVar19 < 1)) &&
               (game_state._755256_2_ = game_state._755256_2_ + -1,
               (game_state.unit_related_array_1[iVar15].flag & 4) == 0)) {
              game_state.unit_related_array_1[iVar15].flag = 0;
            }
          }
          FUN_00436ca0(puVar23);
        }
        puVar20 = puVar20 + 1;
        iVar18 = iVar18 + -1;
      } while (iVar18 != 0);
      return;
    }
    do {
      local_1c = local_1c & 0xffffff00;
      iVar18 = (int)(char)unit_type_array_vehicle[(byte)puVar23->unit_type].field_0x8;
      if (0 < iVar18) {
        puVar20 = &puVar23->loc_1_x;
        do {
          puVar22 = (unit_struct *)0x0;
          if (((*puVar20 != 0) &&
              (puVar2 = unit_land_array[*puVar20], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
             (puVar2->unit_class != '\0')) {
            puVar22 = puVar2;
          }
          if (puVar22 != (unit_struct *)0x0) {
            if (puVar22->index_to_array == *(short *)(param_1 + 99)) {
              local_1c = CONCAT31(local_1c._1_3_,1);
              FUN_004659d0(puVar23,puVar22,&local_10);
            }
            else {
              puVar22->flags_2 = puVar22->flags_2 | 0x80000000;
            }
          }
          puVar20 = puVar20 + 1;
          iVar18 = iVar18 + -1;
        } while (iVar18 != 0);
      }
    } while ((byte)local_1c != '\0');
    return;
  }
  if (bVar4) {
    if (puVar23 == (unit_struct *)0x0) {
LAB_004eb238:
      local_1c._0_2_ =
           CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x51) >> 8),
                    (char)((ushort)*(undefined2 *)(param_1 + 0x4f) >> 8));
    }
    else {
      local_18._0_1_ = '\x01';
      cVar12 = FUN_004650d0(puVar23,&local_14);
      if (cVar12 == '\0') {
        local_18._0_1_ = '\0';
        if ((bVar8) && (cVar12 = FUN_00464ce0(puVar23,&local_14,&local_1c), cVar12 != '\0')) {
          *(uint *)(param_1 + 0x4f) = local_1c;
        }
        iVar18 = (int)(char)unit_type_array_vehicle[(byte)puVar23->unit_type].field_0x8;
        if (0 < iVar18) {
          puVar20 = &puVar23->loc_1_x;
          do {
            puVar22 = (unit_struct *)0x0;
            if (((*puVar20 != 0) &&
                (puVar2 = unit_land_array[*puVar20], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
               (puVar2->unit_class != '\0')) {
              puVar22 = puVar2;
            }
            if (puVar22 != (unit_struct *)0x0) {
              puVar22->flags_2 = puVar22->flags_2 | 0x80000000;
            }
            puVar20 = puVar20 + 1;
            iVar18 = iVar18 + -1;
          } while (iVar18 != 0);
        }
      }
      if ((char)local_18 == '\0') goto LAB_004eb373;
      if (puVar23 == (unit_struct *)0x0) goto LAB_004eb238;
      bVar10 = true;
      local_1c._0_2_ =
           (ushort)*(undefined4 *)
                    (local_c + -4 +
                    (uint)(byte)game_state.unit_related_array_1[iVar15].sub_array_counter * 4);
    }
    local_1c._0_2_ = (ushort)local_1c & 0xfefe;
    if ((((byte)((uint)local_14 >> 8) & 0xfe) != (byte)local_1c) ||
       (local_1c._1_1_ != ((byte)((uint)local_14 >> 0x18) & 0xfe))) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80000000;
      goto LAB_004eb373;
    }
    iVar18 = (int)*(short *)(param_1 + 99);
    if (iVar18 != 0) {
      *(undefined2 *)(param_1 + 99) = 0;
      *(undefined1 *)(param_1 + 0x67) = 0;
      sVar19 = game_state.unit_related_array_1[iVar18].counter;
      if (((0 < sVar19) &&
          (sVar19 = sVar19 + -1, game_state.unit_related_array_1[iVar18].counter = sVar19,
          sVar19 < 1)) &&
         (game_state._755256_2_ = game_state._755256_2_ + -1,
         (game_state.unit_related_array_1[iVar18].flag & 4) == 0)) {
        game_state.unit_related_array_1[iVar18].flag = 0;
      }
    }
    if (bVar10) {
      *(undefined4 *)(param_1 + 0x4f) = local_14;
    }
    else {
      local_14 = *(undefined4 *)(param_1 + 0x4f);
    }
    *(undefined4 *)(param_1 + 0x53) = local_14;
    *(undefined4 *)(param_1 + 0x57) = *(undefined4 *)(param_1 + 0x53);
  }
  else {
    cVar12 = *(char *)(param_1 + 0x67) + '\x01';
    *(char *)(param_1 + 0x67) = cVar12;
    local_1c = CONCAT11(game_state.unit_related_array_1[*(short *)(param_1 + 99)].sub_array[cVar12].
                        field_0x1,
                        *(undefined1 *)(*(short *)(param_1 + 99) * 0x6d + 0x955c35 + cVar12 * 4)) &
               0xfffffffe;
    uVar14 = (ushort)local_1c;
    local_1c._1_1_ = (byte)(local_1c >> 8) & 0xfe;
    *(ushort *)(param_1 + 0x53) = ((uVar14 & 0xff) + 1) * 0x100;
    *(ushort *)(param_1 + 0x55) = (local_1c._1_1_ + 1) * 0x100;
    *(undefined4 *)(param_1 + 0x57) = *(undefined4 *)(param_1 + 0x53);
  }
  uVar17 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar17 | 0x1000;
  *(uint *)(param_1 + 0xc) = uVar17 & 0xffffff7f | 0x1000;
LAB_004eb373:
  if (puVar23 == (unit_struct *)0x0) {
    return;
  }
  iVar18 = (int)(char)unit_type_array_vehicle[(byte)puVar23->unit_type].field_0x8;
  if (iVar18 < 1) {
    return;
  }
  puVar20 = &puVar23->loc_1_x;
  do {
    puVar23 = (unit_struct *)0x0;
    if (((*puVar20 != 0) && (puVar22 = unit_land_array[*puVar20], (puVar22->flags_2 & 1) == 0)) &&
       (puVar22->unit_class != '\0')) {
      puVar23 = puVar22;
    }
    if (puVar23 != (unit_struct *)0x0) {
      if ((*(byte *)(param_1 + 0xf) & 0x80) == 0) {
        if (*(short *)(param_1 + 99) == 0) {
          iVar15 = (int)puVar23->index_to_array;
          if (iVar15 != 0) {
            puVar23->index_to_array = 0;
            puVar23->field_0x67 = 0;
            sVar19 = game_state.unit_related_array_1[iVar15].counter;
            if (((0 < sVar19) &&
                (sVar19 = sVar19 + -1, game_state.unit_related_array_1[iVar15].counter = sVar19,
                sVar19 < 1)) &&
               (game_state._755256_2_ = game_state._755256_2_ + -1,
               (game_state.unit_related_array_1[iVar15].flag & 4) == 0)) {
              game_state.unit_related_array_1[iVar15].flag = 0;
            }
          }
        }
        else if (puVar23->index_to_array == *(short *)(param_1 + 99)) {
          puVar23->field_0x67 = *(undefined1 *)(param_1 + 0x67);
          *(undefined4 *)&(puVar23->vec3).z = *(undefined4 *)(param_1 + 0x53);
          uVar3 = *(undefined4 *)(param_1 + 0x53);
          puVar23->pos_x1 = (short)uVar3;
          puVar23->pos_y1 = (short)((uint)uVar3 >> 0x10);
          uVar17 = puVar23->flags_2;
          puVar23->flags_2 = uVar17 | 0x1000;
          puVar23->flags_2 = uVar17 & 0xffffff7f | 0x1000;
        }
      }
      else {
        puVar23->flags_2 = puVar23->flags_2 | 0x80000000;
      }
    }
    puVar20 = puVar20 + 1;
    iVar18 = iVar18 + -1;
  } while (iVar18 != 0);
  return;
}
