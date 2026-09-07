/* Ghidra 12.1.3 pseudocode; entry 00497030; FUN_00497030.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00497030(int param_1)

{
  short *psVar1;
  char cVar2;
  short sVar3;
  unit_struct *puVar4;
  bool bVar5;
  ushort uVar6;
  ushort uVar7;
  char cVar8;
  undefined2 uVar9;
  int iVar10;
  uint uVar11;
  int iVar12;
  undefined4 uVar13;
  ushort *puVar14;
  undefined2 extraout_var;
  uint uVar15;
  byte bVar16;
  ushort *puVar17;
  undefined2 local_4b8;
  undefined2 local_4b6;
  uint local_4b4;
  short local_4b0;
  short local_4ae;
  uint local_4ac;
  int local_4a8;
  int local_4a4;
  int local_4a0;
  ushort local_49c;
  int local_498;
  ushort local_494 [2];
  int local_490;
  ushort local_48c;
  int local_488;
  ushort local_484;
  int local_480;
  ushort local_47c;
  byte local_47a [1146];

  uVar11 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar11 & 0xfffffdff;
  *(uint *)(param_1 + 0xc) = uVar11 & 0xffdffdff;
  if ((uVar11 & 0x40000000) != 0) {
    *(undefined1 *)(param_1 + 0xa8) = 4;
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(uint *)(param_1 + 0xc) = uVar11 & 0xbfdffdff;
  }
  switch(*(undefined1 *)(param_1 + 0xa8)) {
  case 4:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 8;
    }
    cVar8 = FUN_004391a0(param_1);
    if (cVar8 == '\0') {
      return 0;
    }
    *(undefined1 *)(param_1 + 0xa8) = 7;
    break;
  default:
    goto switchD_00497095_caseD_5;
  case 7:
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x200000;
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      puVar4 = unit_land_array[*(ushort *)(param_1 + 0x89)];
      FUN_004b9e20(CONCAT22((short)((uint)&local_4b4 >> 0x10),(ushort)(byte)puVar4->field_0x9b),
                   (short)puVar4->coord_scale_4,&local_480,&local_4b4);
      iVar12 = 0;
      uVar11 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      local_4ac = uVar11 >> 0xd | uVar11 * 0x80000;
      bVar5 = false;
      uVar11 = local_4ac % local_4b4;
      game_state.pseudo_random_val = local_4ac;
      if (0 < (int)local_4b4) {
        do {
          if ((int)local_4b4 <= (int)uVar11) {
            uVar11 = 0;
          }
          if (puVar4->field_0x9e == '\n') {
            sVar3 = *(short *)((&local_480)[uVar11 * 2] + 4);
            if (((puVar4->pos).z != sVar3) && (*(short *)&puVar4->field_0x98 != sVar3))
            goto LAB_00497198;
          }
          else {
            iVar10 = (int)*(short *)((&local_480)[uVar11 * 2] + 4) - (int)(short)(puVar4->pos).z;
            if (iVar10 < 0) {
              iVar10 = -iVar10;
            }
            if (1 < iVar10) {
LAB_00497198:
              bVar5 = true;
              *(char *)(param_1 + 0xaa) = (char)uVar11;
              break;
            }
          }
          iVar12 = iVar12 + 1;
          uVar11 = uVar11 + 1;
        } while (iVar12 < (int)local_4b4);
      }
      if (!bVar5) {
        return 2;
      }
      local_4b6 = *(ushort *)(local_47a + *(char *)(param_1 + 0xaa) * 8 + -2) & 0xfffe;
      uVar6 = local_4b6;
      local_4b6._1_1_ = (byte)(local_4b6 >> 8) & 0xfe;
      local_4b0 = uVar6 << 8;
      local_4ae = (ushort)local_4b6._1_1_ << 8;
      iVar12 = *(char *)(param_1 + 0xaa) * 8;
      if ((local_47a[iVar12] & 1) == 0) {
        local_49c = *(ushort *)(local_47a + iVar12 + -2);
        local_4b8._1_1_ = (char)(local_49c >> 8);
        cVar8 = local_4b8._1_1_;
        local_4b8._1_1_ = local_4b8._1_1_ + -2;
        local_4b8._0_1_ = (char)local_49c;
        uVar6 = local_4b8;
        local_494[0] = local_4b8;
        local_4b8._0_1_ = (char)local_4b8 + -2;
        uVar7 = local_4b8;
        local_48c = local_4b8;
        local_4b8 = CONCAT11(cVar8,(char)local_4b8);
        local_484 = local_4b8;
        local_4a0 = ((local_49c & 0xfe) * 2 | local_49c & 0xfe00) * 4 + 0x8a03e4;
        local_498 = ((uVar6 & 0xfe) * 2 | uVar6 & 0xfe00) * 4 + 0x8a03e4;
        local_490 = ((uVar7 & 0xfe) * 2 | uVar7 & 0xfe00) * 4 + 0x8a03e4;
        puVar17 = local_494;
        local_4a8 = 0;
        local_488 = ((local_4b8 & 0xfe) * 2 | local_4b8 & 0xfe00) * 4 + 0x8a03e4;
        iVar12 = 0x43800;
        do {
          if (local_4a8 != 0) break;
          iVar10 = 0;
          if (0 < (int)local_4b4) {
            puVar14 = &local_47c;
            do {
              if ((*puVar14 == *puVar17) && ((puVar14[1] & 1) != 0)) {
                local_4a4 = iVar12 / 0x168;
                local_4a8 = 1;
                break;
              }
              puVar14 = puVar14 + 4;
              iVar10 = iVar10 + 1;
            } while (iVar10 < (int)local_4b4);
          }
          iVar12 = iVar12 + 0x2d000;
          puVar17 = puVar17 + 4;
        } while (puVar17 < &local_47c);
      }
      else {
        local_4a4 = 0x100;
      }
      move_pos_angle_length(&local_4b0,local_4a4,0x80);
      FUN_004e9dd0(param_1,&local_4b0);
      FUN_004d4f40(param_1);
    }
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x200;
    uVar11 = (int)*(short *)(param_1 + 0x3d) - (int)*(short *)(param_1 + 0x4f);
    uVar15 = (int)uVar11 >> 0x1f;
    iVar12 = (uVar11 ^ uVar15) - uVar15;
    if (0x7fff < iVar12) {
      iVar12 = 0xffff - iVar12;
    }
    if (0x1f < iVar12) {
      return 0;
    }
    uVar11 = (int)*(short *)(param_1 + 0x3f) - (int)*(short *)(param_1 + 0x51);
    uVar15 = (int)uVar11 >> 0x1f;
    iVar12 = (uVar11 ^ uVar15) - uVar15;
    if (0x7fff < iVar12) {
      iVar12 = 0xffff - iVar12;
    }
    if (0x1f < iVar12) {
      return 0;
    }
    *(undefined1 *)(param_1 + 0xa8) = 0x15;
    break;
  case 8:
    *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 0x30;
    goto LAB_00497631;
  case 9:
    FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
    uVar11 = (int)*(short *)(param_1 + 0x3d) - (int)*(short *)(param_1 + 0x4f);
    uVar15 = (int)uVar11 >> 0x1f;
    iVar12 = (uVar11 ^ uVar15) - uVar15;
    if (0x7fff < iVar12) {
      iVar12 = 0xffff - iVar12;
    }
    if (iVar12 < 0x20) {
      uVar11 = (int)*(short *)(param_1 + 0x3f) - (int)*(short *)(param_1 + 0x51);
      iVar12 = (uVar11 ^ (int)uVar11 >> 0x1f) - ((int)uVar11 >> 0x1f);
      if (0x7fff < iVar12) {
        iVar12 = 0xffff - iVar12;
      }
      if (iVar12 < 0x20) {
        puVar4 = unit_land_array[*(ushort *)(param_1 + 0x89)];
        FUN_004b9e20(CONCAT22((short)((uint)&local_4b4 >> 0x10),(ushort)(byte)puVar4->field_0x9b),
                     CONCAT22((short)((int)uVar11 >> 0x1f),(short)puVar4->coord_scale_4),&local_480,
                     &local_4b4);
        uVar13 = FUN_004043f0(puVar4,&local_480 + *(char *)(param_1 + 0xaa) * 2);
        cVar8 = FUN_0044fde0((&local_480)[*(char *)(param_1 + 0xaa) * 2],uVar13,
                             *(undefined2 *)
                              &unit_type_array_building[(byte)puVar4->field_0x9e].field_0x42,1);
        if (cVar8 == '\0') {
          *(undefined1 *)(param_1 + 0xa8) = 0x15;
        }
        else {
          *(undefined1 *)(param_1 + 0xa8) = 4;
        }
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        puVar4->flags_2 = puVar4->flags_2 & 0xfffffffb;
        uVar9 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                                  *(undefined2 *)(param_1 + 0x3f));
        *(undefined2 *)(param_1 + 0x41) = uVar9;
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
        FUN_0048a050(param_1,2,0);
        return 0;
      }
    }
    *(undefined1 *)(param_1 + 0xa8) = 7;
    break;
  case 0x15:
    if ((*(char *)(param_1 + 0x2b) == '\a') || (*(short *)(param_1 + 0x78) != 0)) {
      if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 6;
      }
      if (*(short *)(param_1 + 0x70) == 2) {
        FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
      }
      cVar8 = FUN_00439240(param_1);
      if (cVar8 == '\0') {
        return 0;
      }
      *(undefined1 *)(param_1 + 0xa8) = 8;
    }
    else {
      if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 3;
      }
      cVar8 = FUN_00439240(param_1);
      if (cVar8 == '\0') {
        return 0;
      }
      *(undefined1 *)(param_1 + 0xa8) = 0x1c;
    }
    break;
  case 0x1c:
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      if (*(short *)(param_1 + 0x78) == 0) {
        bVar16 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x3f);
        unit_set_object_upper(param_1,bVar16);
        *(undefined1 *)(param_1 + 0x39) = 0;
        *(short *)(param_1 + 0x37) =
             (short)(char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3].f1;
      }
      else {
        bVar16 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x24);
        unit_set_object_upper(param_1,bVar16);
      }
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x80;
      cVar8 = obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2;
      cVar2 = vstart_related[(short)obj_indexes_table[(uint)bVar16 * 2]].frame_counter;
      *(undefined2 *)(param_1 + 0x5f) = 0;
      *(ushort *)(param_1 + 0x70) = (short)cVar2 * (short)(char)(cVar8 + '\x01') & 0xff;
    }
    psVar1 = (short *)(param_1 + 0x70);
    *psVar1 = *psVar1 + -1;
    if (*psVar1 != 0) {
      return 0;
    }
LAB_00497631:
    *(undefined1 *)(param_1 + 0xa8) = 9;
  }
  *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
switchD_00497095_caseD_5:
  return 0;
}
