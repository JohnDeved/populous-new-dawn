/* Ghidra 12.1.3 pseudocode; entry 00407860; FUN_00407860.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00407860(int param_1,char param_2,char param_3,byte param_4,int param_5,char param_6,
                int param_7,int param_8,char param_9)

{
  short sVar1;
  bool bVar2;
  ushort uVar3;
  objs0_struct *poVar4;
  byte bVar5;
  short sVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  int iVar10;
  int iVar11;
  short *psVar12;
  uint uVar13;
  uint uVar14;
  int iVar15;
  short *psVar16;
  pnts0_struct *ppVar17;
  facs0_struct *pfVar18;
  pnts_related_struct *ppVar19;
  bool bVar20;
  byte local_74;
  int local_70;
  int local_50;
  int local_4c;
  int local_48;
  short local_40;
  int local_3c;
  ushort local_38;
  ushort uStack_36;
  short sStack_34;
  int local_30;
  int local_2c;
  int local_28;
  int local_24;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  poVar4 = objs0_mem;
  if (((char)param_4 < '\0') || (param_3 == '\0')) {
    bVar2 = true;
  }
  else {
    bVar2 = false;
  }
  if ((*(byte *)(param_1 + 0x35) & 8) == 0) {
    uVar8 = (uint)*(short *)(param_1 + 0x33);
  }
  else {
    uVar8 = (uint)morph0_mem[*(char *)(param_1 + 0x3b) * 4 + 1].obj_index_2;
  }
  sVar1 = *(short *)(param_1 + 0x26);
  iVar10 = objs0_mem[uVar8].maybe_coord_scale;
  if (sVar1 != 0) {
    init_matrix3x3(&local_24);
    rotate_basis(&local_24,-*(short *)(param_1 + 0x26),2);
  }
  local_3c = (int)(short)poVar4[uVar8].pnts_num;
  ppVar19 = temp_pnts_related_array;
  ppVar17 = poVar4[uVar8].pnts0_ptr;
  if (0 < local_3c) {
    do {
      sVar6 = ppVar17->z;
      iVar9 = ppVar17->x * iVar10 >> 8;
      iVar11 = ppVar17->y * iVar10 >> 8;
      ppVar19->x = iVar9;
      iVar15 = sVar6 * iVar10 >> 8;
      ppVar19->y = iVar11;
      ppVar19->z = iVar15;
      if (sVar1 != 0) {
        ppVar19->x = local_1c * iVar15 + local_20 * iVar11 + local_24 * iVar9 >> 0xe;
        ppVar19->y = local_10 * iVar15 + local_18 * iVar9 + local_14 * iVar11 >> 0xe;
        ppVar19->z = local_4 * iVar15 + local_c * iVar9 + local_8 * iVar11 >> 0xe;
      }
      local_38 = (short)ppVar19->x * 2 + *(short *)(param_1 + 0x3d);
      uStack_36 = (short)ppVar19->z * 2 + *(short *)(param_1 + 0x3f);
      uVar3 = CONCAT11((char)(uStack_36 >> 8),(char)(local_38 >> 8));
      if (((*(byte *)((int)&game_state.level_data[0].flags +
                     ((uVar3 & 0xfe) * 2 | uVar3 & 0xfe00) * 4 + 2) & 2) != 0) &&
         ((*(byte *)(param_1 + 0x16) & 0x10) == 0)) {
        sVar6 = calc_point_height(CONCAT22(uStack_36,local_38),CONCAT22(sStack_34,uStack_36));
        ppVar19->y = ppVar19->y + ((int)sVar6 - (int)*(short *)(param_1 + 0x41));
      }
      ppVar19 = ppVar19 + 1;
      ppVar17 = ppVar17 + 1;
      local_3c = local_3c + -1;
    } while (local_3c != 0);
  }
  local_48 = 0;
  local_50 = 0;
  local_70 = 0;
  sVar1 = objs0_mem[*(short *)(param_1 + 0x33)].facs_num;
  pfVar18 = objs0_mem[*(short *)(param_1 + 0x33)].facs0_ptr;
  if (0 < sVar1) {
    do {
      if ((0 < param_7) && (param_7 <= local_70)) {
        return local_70;
      }
      if (bVar2) {
        bVar20 = true;
        local_74 = 0;
        if (((param_3 != '\0') && ((char)*(byte *)(param_1 + 0x78) < '\x04')) &&
           ((1 << (*(byte *)(param_1 + 0x78) & 0x1f) & (uint)(byte)pfVar18->flags) == 0)) {
          bVar20 = false;
        }
      }
      else {
        bVar20 = false;
        if (param_2 == '\0') {
          switch(param_4) {
          case 0:
            bVar20 = (pfVar18->flags & 1) != 0;
            local_74 = pfVar18->flags & 0x10;
            break;
          case 1:
            bVar5 = pfVar18->flags;
            if (((bVar5 & 2) == 0) || ((bVar5 & 0x20) == 0)) {
              if (((bVar5 & 1) != 0) && ((bVar5 & 0x10) != 0)) {
                local_74 = 0;
                bVar20 = true;
              }
            }
            else {
              bVar20 = true;
              local_74 = 1;
            }
            break;
          case 2:
            bVar5 = pfVar18->flags;
            if (((bVar5 & 4) == 0) || ((bVar5 & 0x40) == 0)) {
              if (((bVar5 & 2) != 0) && ((bVar5 & 0x20) != 0)) {
                local_74 = 0;
                bVar20 = true;
              }
            }
            else {
              bVar20 = true;
              local_74 = 1;
            }
            break;
          case 3:
            bVar5 = pfVar18->flags;
            if (((bVar5 & 8) == 0) || ((bVar5 & 0x80) == 0)) {
              if (((bVar5 & 4) != 0) && ((bVar5 & 0x40) != 0)) {
                local_74 = 0;
                bVar20 = true;
              }
            }
            else {
              bVar20 = true;
              local_74 = 1;
            }
            break;
          case 4:
            bVar5 = pfVar18->flags;
            if ((bVar5 & 0xf) == 0) {
              local_74 = 0;
              bVar20 = true;
            }
            else if (((bVar5 & 8) != 0) && ((bVar5 & 0x80) != 0)) {
              local_74 = 0;
              bVar20 = true;
            }
          }
        }
        else if (param_2 == '\x01') {
          if ((char)param_4 < '\x03') {
            if ((((uint)(byte)pfVar18->flags & 1 << (param_4 + 1 & 0x1f)) != 0) &&
               (((uint)(byte)pfVar18->flags & 1 << (param_4 & 0x1f)) == 0)) {
              local_74 = 0;
              bVar20 = true;
            }
          }
          else if ((1 << (param_4 & 0x1f) & (uint)(byte)pfVar18->flags) == 0) {
            local_74 = 0;
            bVar20 = true;
          }
        }
      }
      if ((bVar20) && ((local_48 = local_48 + 1, param_8 < 0 || (param_8 < local_48)))) {
        iVar10 = 0;
        local_70 = local_70 + 1;
        local_30 = 0;
        local_2c = 0;
        local_28 = 0;
        if (pfVar18->num_points != '\0') {
          psVar12 = &pfVar18->point_1;
          do {
            iVar10 = iVar10 + 1;
            local_30 = local_30 + temp_pnts_related_array[*psVar12].x;
            local_2c = local_2c + temp_pnts_related_array[*psVar12].y;
            local_28 = local_28 + temp_pnts_related_array[*psVar12].z;
            psVar12 = psVar12 + 1;
          } while (iVar10 < (int)(uint)(byte)pfVar18->num_points);
        }
        local_30 = local_30 / (int)(uint)(byte)pfVar18->num_points;
        local_2c = local_2c / (int)(uint)(byte)pfVar18->num_points;
        local_28 = local_28 / (int)(uint)(byte)pfVar18->num_points;
        local_38 = (short)local_30 * 2 + *(short *)(param_1 + 0x3d);
        sStack_34 = *(short *)(param_1 + 0x41) + (short)local_2c;
        uStack_36 = (short)local_28 * 2 + *(short *)(param_1 + 0x3f);
        iVar10 = alloc_unit(10,7,CONCAT31((int3)(CONCAT22((short)((uint)local_28 >> 0x10),uStack_36)
                                                >> 8),*(undefined1 *)(param_1 + 0x2f)),&local_38);
        if (iVar10 != 0) {
          if (param_5 != 0) {
            *(undefined2 *)(iVar10 + 0x9f) = *(undefined2 *)(param_5 + 0x24);
            *(uint *)(iVar10 + 0x10) = *(uint *)(iVar10 + 0x10) | 0x400;
            *(byte *)(iVar10 + 0x2d) = (byte)*(undefined2 *)(iVar10 + 0x24) & 7;
          }
          if (param_6 != '\0') {
            *(undefined2 *)(iVar10 + 0x5f) = 0x20;
            uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar8 = uVar7 >> 0xd;
            game_state.pseudo_random_val = uVar8 | uVar7 * 0x80000;
            *(ushort *)(iVar10 + 0x4b) = ((ushort)uVar8 & 0x1f) + 0x40;
            *(undefined2 *)(iVar10 + 0x96) = 0x18;
            uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar8 = uVar7 >> 0xd;
            game_state.pseudo_random_val = uVar8 | uVar7 * 0x80000;
            *(ushort *)(iVar10 + 0x98) = (ushort)uVar8 & 0x15;
            uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar8 = uVar7 >> 0xd;
            game_state.pseudo_random_val = uVar8 | uVar7 * 0x80000;
            *(ushort *)(iVar10 + 0x9a) = (ushort)uVar8 & 0xa9;
            uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar8 = uVar7 >> 0xd;
            game_state.pseudo_random_val = uVar8 | uVar7 * 0x80000;
            *(ushort *)(iVar10 + 0x9c) = (ushort)uVar8 & 0x15;
          }
          *(short *)(iVar10 + 0x94) = (short)(((int)pfVar18 - (int)facs0_mem) / 0x3c);
          bVar5 = local_74;
          if ((bVar2) && (param_3 != '\0')) {
            if ((char)*(byte *)(param_1 + 0x78) < '\x04') {
              bVar5 = 1 - (((uint)(byte)pfVar18->flags & 0x10 << (*(byte *)(param_1 + 0x78) & 0x1f))
                          == 0);
              goto LAB_00407f24;
            }
          }
          else {
LAB_00407f24:
            *(byte *)(iVar10 + 0x9e) = bVar5;
          }
          uVar7 = (uint)*(ushort *)(param_1 + 0x3d) - (uint)local_38;
          uVar8 = uVar7;
          if ((int)uVar7 < 0) {
            uVar8 = -uVar7;
          }
          uVar13 = uVar7;
          if (((uVar8 & 0x8000) != 0) && (uVar13 = uVar8 - 0x10000, (int)uVar7 < 1)) {
            uVar13 = 0x10000 - uVar8;
          }
          uVar7 = (uint)*(ushort *)(param_1 + 0x3f) - (uint)uStack_36;
          uVar8 = uVar7;
          if ((int)uVar7 < 0) {
            uVar8 = -uVar7;
          }
          uVar14 = uVar7;
          if (((uVar8 & 0x8000) != 0) && (uVar14 = uVar8 - 0x10000, (int)uVar7 < 1)) {
            uVar14 = 0x10000 - uVar8;
          }
          local_4c = 0;
          if (pfVar18->num_points != '\0') {
            psVar12 = &pfVar18->point_1;
            psVar16 = (short *)(iVar10 + 0x7a);
            do {
              local_4c = local_4c + 1;
              local_40 = (short)((int)uVar13 >> 1);
              *psVar16 = (short)temp_pnts_related_array[*psVar12].x + local_40;
              psVar16[1] = ((short)temp_pnts_related_array[*psVar12].y - sStack_34) +
                           *(short *)(param_1 + 0x41);
              psVar16[2] = (short)temp_pnts_related_array[*psVar12].z + (short)((int)uVar14 >> 1);
              psVar12 = psVar12 + 1;
              psVar16 = psVar16 + 3;
            } while (local_4c < (int)(uint)(byte)pfVar18->num_points);
          }
          FUN_00502660(iVar10);
          if (param_9 != '\0') {
            alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),iVar10 + 0x3d);
          }
        }
      }
      pfVar18 = pfVar18 + 1;
      local_50 = local_50 + 1;
    } while (local_50 < sVar1);
  }
  return local_70;
}
