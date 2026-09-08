/* Ghidra 12.1.3 pseudocode; entry 00418270; FUN_00418270.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0041830d) */
/* WARNING: Removing unreachable block (ram,0x00418317) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00418270(void)

{
  undefined2 *puVar1;
  ushort uVar2;
  short sVar3;
  uint uVar4;
  int iVar5;
  int iVar6;
  short sVar7;
  uint uVar8;
  int iVar9;
  short *psVar10;
  uint uVar11;
  short *psVar12;
  int iVar13;
  undefined4 *puVar14;
  bool bVar15;
  int local_24;
  int local_20;
  short local_1c;
  short local_1a;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  uint local_4;

  local_14 = 0;
  local_8 = 0;
  local_c = 0;
  if (DAT_0089bc17 != '\0') {
    if (draw_mode == 2) {
      local_14 = 2;
    }
    else {
      local_1c = game_state.tribes_array[player_tribe_num].x;
      local_1a = game_state.tribes_array[player_tribe_num].y;
      local_24 = calc_distance_toroidal(&local_1c,&DAT_0089bbff);
      if (local_24 < 4) {
        local_24 = 0;
      }
      uVar11 = (uint)(ushort)(DAT_0089bbff - local_1c);
      uVar4 = (uint)(ushort)(DAT_0089bc01 - local_1a);
      if (0x7fff < uVar11) {
        uVar11 = uVar11 - 0x10000;
      }
      if (0x7fff < uVar4) {
        uVar4 = uVar4 - 0x10000;
      }
      uVar2 = calc_angle_quadrant(uVar11,-uVar4);
      local_4 = uVar2 & 0x7ff;
      sVar3 = calc_angular_diff_shortest
                        (CONCAT22((short)((uint)(player_tribe_num * 0xb) >> 0x10),
                                  cam_1_angle_related),
                         CONCAT22(player_tribe_num >> 7,
                                  game_state.tribes_array[player_tribe_num].angle_1));
      local_18 = (int)sVar3;
      sVar3 = calc_abs_angular_diff
                        (CONCAT22((short)((uint)(player_tribe_num * 0xb) >> 0x10),
                                  cam_1_angle_related),
                         CONCAT22(player_tribe_num >> 7,
                                  game_state.tribes_array[player_tribe_num].angle_1));
      local_10 = (int)sVar3;
      if (DAT_0089bc1c == '\0') {
        iVar13 = (int)DAT_0089bc13 * (int)SHORT_ARRAY_0059bbd0[DAT_0089bc1d];
        local_20 = (int)(iVar13 + (iVar13 >> 0x1f & 0xfffU)) >> 0xc;
        iVar13 = (int)DAT_0089bc15 * (int)SHORT_ARRAY_0059bbd0[DAT_0089bc1d];
        DAT_0089bc1d = DAT_0089bc1d + '\x01';
        iVar13 = (int)(iVar13 + (iVar13 >> 0x1f & 0xfffU)) >> 0xc;
        if ('\x03' < DAT_0089bc1d) {
          DAT_0089bc1d = '\0';
          DAT_0089bc1c = '\x01';
        }
      }
      else {
        iVar13 = local_20;
        if (DAT_0089bc1c == '\x01') {
          if (DAT_0089bc1d == '\0') {
            puVar14 = &DAT_005fe250;
            for (iVar13 = 0xb; iVar13 != 0; iVar13 = iVar13 + -1) {
              *puVar14 = 0;
              puVar14 = puVar14 + 1;
            }
            puVar14 = &DAT_005fe280;
            for (iVar13 = 0xb; iVar13 != 0; iVar13 = iVar13 + -1) {
              *puVar14 = 0;
              puVar14 = puVar14 + 1;
            }
            if (DAT_0089bc13 != 0) {
              puVar14 = &DAT_005fe250;
              iVar6 = (int)DAT_0089bc13;
              iVar9 = (int)DAT_0089bc0d;
              psVar12 = SHORT_ARRAY_0059bbd8;
              iVar13 = local_24;
              do {
                iVar5 = (int)(*psVar12 * iVar6 + (*psVar12 * iVar6 >> 0x1f & 0xfffU)) >> 0xc;
                if (iVar5 < 4) {
                  iVar5 = 4;
                }
                sVar7 = 0;
                for (; (0 < iVar13 && (iVar5 <= iVar13 - iVar9)); iVar13 = iVar13 - iVar5) {
                  sVar7 = sVar7 + 1;
                }
                *(short *)puVar14 = (short)iVar5;
                iVar9 = iVar9 - iVar5;
                *(short *)((int)puVar14 + 2) = sVar7;
                puVar14 = puVar14 + 1;
                psVar12 = psVar12 + 1;
              } while (psVar12 < &DAT_0059bbee);
            }
            if (DAT_0089bc15 != 0) {
              uVar11 = (uint)DAT_0089bc15;
              uVar4 = (int)uVar11 >> 0x1f;
              psVar10 = SHORT_ARRAY_0059bbd8;
              uVar8 = (int)DAT_0089bc11 >> 0x1f;
              iVar6 = ((int)DAT_0089bc11 ^ uVar8) - uVar8;
              psVar12 = (short *)&DAT_005fe280;
              iVar13 = local_18;
              do {
                iVar9 = (int)*psVar10 * ((uVar11 ^ uVar4) - uVar4);
                iVar9 = (int)(iVar9 + (iVar9 >> 0x1f & 0xfffU)) >> 0xc;
                if (iVar9 < 2) {
                  iVar9 = 2;
                }
                sVar7 = 0;
                for (; (0 < iVar13 && (iVar9 <= iVar13 - iVar6)); iVar13 = iVar13 - iVar9) {
                  sVar7 = sVar7 + 1;
                }
                iVar6 = iVar6 - iVar9;
                *psVar12 = (short)iVar9 * sVar3;
                psVar10 = psVar10 + 1;
                psVar12[1] = sVar7;
                psVar12 = psVar12 + 2;
              } while (psVar10 < &DAT_0059bbee);
            }
            DAT_0089bc18 = '\0';
            DAT_0089bc19 = '\0';
            DAT_0089bc1a = '\0';
            DAT_0089bc1b = '\0';
          }
          DAT_0089bc1d = DAT_0089bc1d + '\x01';
          sVar3 = *(short *)((int)&DAT_005fe250 + DAT_0089bc18 * 4 + 2);
          while ((sVar3 == 0 && (DAT_0089bc18 < '\n'))) {
            DAT_0089bc18 = DAT_0089bc18 + '\x01';
            sVar3 = *(short *)((int)&DAT_005fe250 + DAT_0089bc18 * 4 + 2);
          }
          DAT_0089bc1a = DAT_0089bc1a + '\x01';
          local_20 = (int)*(short *)(&DAT_005fe250 + DAT_0089bc18);
          if ((*(short *)((int)&DAT_005fe250 + DAT_0089bc18 * 4 + 2) <= (short)DAT_0089bc1a) &&
             (DAT_0089bc1a = '\0', DAT_0089bc18 < '\n')) {
            DAT_0089bc18 = DAT_0089bc18 + '\x01';
          }
          sVar3 = *(short *)((int)&DAT_005fe280 + DAT_0089bc19 * 4 + 2);
          while ((sVar3 == 0 && (DAT_0089bc19 < '\n'))) {
            DAT_0089bc19 = DAT_0089bc19 + '\x01';
            sVar3 = *(short *)((int)&DAT_005fe280 + DAT_0089bc19 * 4 + 2);
          }
          DAT_0089bc1b = DAT_0089bc1b + '\x01';
          iVar13 = (int)*(short *)(&DAT_005fe280 + DAT_0089bc19);
          if ((*(short *)((int)&DAT_005fe280 + DAT_0089bc19 * 4 + 2) <= (short)DAT_0089bc1b) &&
             (DAT_0089bc1b = '\0', DAT_0089bc19 < '\n')) {
            DAT_0089bc19 = DAT_0089bc19 + '\x01';
          }
        }
      }
      if ((local_24 < local_20) && (local_20 = local_24, local_24 < 5)) {
        local_c = 1;
      }
      iVar6 = iVar13;
      if (iVar13 < 0) {
        iVar6 = -iVar13;
      }
      if (local_18 < iVar6) {
        iVar13 = local_10 * local_18;
        iVar6 = iVar13;
        if (iVar13 < 0) {
          iVar6 = -iVar13;
        }
        if (iVar6 < 3) {
          local_8 = 1;
        }
      }
      if (((local_20 == 0) && (iVar13 == 0)) || ((local_c != 0 && (local_8 != 0)))) {
        local_14 = 1;
      }
      else {
        if (local_20 != 0) {
          move_pos_angle_length(player_tribe_num * 0xc65 + 0x89d1ec,local_4,local_20);
        }
        if (iVar13 != 0) {
          puVar1 = &game_state.tribes_array[player_tribe_num].angle_1;
          _render_state_flags = _render_state_flags | 0x80;
          uVar2 = *puVar1 + (short)iVar13;
          *puVar1 = uVar2;
          *puVar1 = uVar2 & 0x7ff;
        }
      }
    }
    sVar3 = DAT_0089bc01;
    if (local_14 != 0) {
      DAT_0089bc17 = '\0';
      if ((DAT_0089bc0f == 0) && (DAT_0089bc11 == 0)) {
        cam_1_angle_related = game_state.tribes_array[player_tribe_num].angle_1;
      }
      iVar13 = (int)player_tribe_num;
      psVar12 = &game_state.tribes_array[iVar13].x;
      bVar15 = -1 < cam_1_angle_related;
      *psVar12 = DAT_0089bbff;
      game_state.tribes_array[iVar13].y = sVar3;
      if (bVar15) {
        game_state.tribes_array[iVar13].angle_1 = cam_1_angle_related;
      }
      set_tex_struct_globe_x_y(psVar12);
      does_water_texture_exists = 1;
    }
  }
  return;
}
