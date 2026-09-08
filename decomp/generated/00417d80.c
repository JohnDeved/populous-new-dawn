/* Ghidra 12.1.3 pseudocode; entry 00417d80; FUN_00417d80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00417d80(undefined4 *param_1,short param_2)

{
  short sVar1;
  short sVar2;
  int iVar3;
  int iVar4;
  short *psVar5;
  undefined2 extraout_var;
  int iVar6;
  short *psVar7;
  int iVar8;
  undefined2 extraout_var_00;
  int iVar9;
  int iVar10;
  int iVar11;
  int local_24;
  int local_20;
  int local_1c;
  int local_10;
  int local_c;

  DAT_0089bc17 = 0;
  _DAT_0089bbff = *param_1;
  iVar3 = (int)player_tribe_num;
  cam_1_x = game_state.tribes_array[iVar3].x;
  cam_1_y = game_state.tribes_array[iVar3].y;
  if (param_2 < 0) {
    param_2 = game_state.tribes_array[iVar3].angle_1;
  }
  cam_1_angle = game_state.tribes_array[iVar3].angle_1;
  cam_1_angle_related = param_2;
  if (DAT_0059bbcc == '\0') {
    psVar7 = SHORT_ARRAY_0059bbd0;
    do {
      psVar5 = psVar7 + 1;
      *psVar7 = (short)(((int)*psVar7 << 0xc) / 100);
      psVar7 = psVar5;
    } while (psVar5 < SHORT_ARRAY_0059bbd8);
    psVar7 = SHORT_ARRAY_0059bbd8;
    do {
      psVar5 = psVar7 + 1;
      *psVar7 = (short)(((int)*psVar7 << 0xc) / 100);
      psVar7 = psVar5;
    } while (psVar5 < &DAT_0059bbee);
    DAT_0059bbcc = '\x01';
  }
  iVar3 = calc_distance_toroidal(&DAT_0089bbff,&cam_1_x);
  sVar2 = calc_angular_diff_shortest(CONCAT22(extraout_var,cam_1_angle_related),cam_1_angle);
  iVar6 = (int)sVar2;
  sVar2 = calc_abs_angular_diff(cam_1_angle_related,CONCAT22(extraout_var_00,cam_1_angle));
  if (iVar3 < 0x801) {
    iVar10 = 0x100;
  }
  else if (iVar3 < 0x1801) {
    iVar10 = 0x300;
  }
  else {
    iVar10 = 0x600;
    if (0x3800 < iVar3) {
      iVar10 = 0x800;
    }
  }
  local_24 = 0;
  psVar7 = SHORT_ARRAY_0059bbd0;
  do {
    sVar1 = *psVar7;
    psVar7 = psVar7 + 1;
    local_24 = local_24 + ((int)(sVar1 * iVar10 + (sVar1 * iVar10 >> 0x1f & 0xfffU)) >> 0xc);
  } while (psVar7 < SHORT_ARRAY_0059bbd8);
  local_20 = 0;
  psVar7 = SHORT_ARRAY_0059bbd8;
  do {
    sVar1 = *psVar7;
    psVar7 = psVar7 + 1;
    local_20 = local_20 + ((int)(sVar1 * iVar10 + (sVar1 * iVar10 >> 0x1f & 0xfffU)) >> 0xc);
  } while (psVar7 < &DAT_0059bbee);
  if ((iVar3 < local_24 + local_20) && (iVar10 != 0)) {
    do {
      local_24 = 0;
      psVar7 = SHORT_ARRAY_0059bbd0;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        local_24 = local_24 + ((int)(sVar1 * iVar10 + (sVar1 * iVar10 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < SHORT_ARRAY_0059bbd8);
      local_20 = 0;
      psVar7 = SHORT_ARRAY_0059bbd8;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        local_20 = local_20 + ((int)(sVar1 * iVar10 + (sVar1 * iVar10 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < &DAT_0059bbee);
    } while ((iVar3 <= local_24 + local_20) && (iVar10 = iVar10 + -0x10, 0 < iVar10));
  }
  local_1c = 0;
  if (iVar10 != 0) {
    local_1c = ((iVar3 - local_20) - local_24) / iVar10;
  }
  iVar9 = 0x5b;
  iVar8 = 0;
  psVar7 = SHORT_ARRAY_0059bbd0;
  do {
    sVar1 = *psVar7;
    psVar7 = psVar7 + 1;
    iVar8 = iVar8 + ((int)(sVar1 * 0x5b + (sVar1 * 0x5b >> 0x1f & 0xfffU)) >> 0xc);
  } while (psVar7 < SHORT_ARRAY_0059bbd8);
  iVar11 = 0;
  psVar7 = SHORT_ARRAY_0059bbd8;
  do {
    sVar1 = *psVar7;
    psVar7 = psVar7 + 1;
    iVar11 = iVar11 + ((int)(sVar1 * 0x5b + (sVar1 * 0x5b >> 0x1f & 0xfffU)) >> 0xc);
  } while (psVar7 < &DAT_0059bbee);
  if (iVar6 < iVar8 + iVar11) {
    do {
      iVar8 = 0;
      psVar7 = SHORT_ARRAY_0059bbd0;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        iVar8 = iVar8 + ((int)(sVar1 * iVar9 + (sVar1 * iVar9 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < SHORT_ARRAY_0059bbd8);
      iVar11 = 0;
      psVar7 = SHORT_ARRAY_0059bbd8;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        iVar11 = iVar11 + ((int)(sVar1 * iVar9 + (sVar1 * iVar9 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < &DAT_0059bbee);
    } while ((iVar6 <= iVar8 + iVar11) && (iVar9 = iVar9 + -4, 0 < iVar9));
  }
  local_c = 0;
  if (iVar9 != 0) {
    local_c = ((iVar6 - iVar11) - iVar8) / iVar9;
  }
  iVar4 = local_1c;
  if (local_1c <= local_c) {
    iVar4 = local_c;
  }
  if ((local_1c != 0) && (iVar4 != local_1c)) {
    local_10 = iVar4 * iVar10;
    while( true ) {
      local_24 = 0;
      psVar7 = SHORT_ARRAY_0059bbd0;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        local_24 = local_24 + ((int)(sVar1 * iVar10 + (sVar1 * iVar10 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < SHORT_ARRAY_0059bbd8);
      local_20 = 0;
      psVar7 = SHORT_ARRAY_0059bbd8;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        local_20 = local_20 + ((int)(sVar1 * iVar10 + (sVar1 * iVar10 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < &DAT_0059bbee);
      if (iVar3 < local_24 + local_20 + local_10) break;
      iVar10 = iVar10 + 0x10;
      local_10 = local_10 + iVar4 * 0x10;
    }
    iVar10 = iVar10 + -0x10;
    if (iVar10 < 0) {
      iVar10 = 0;
    }
  }
  if ((local_c != 0) && (iVar4 != local_c)) {
    local_10 = iVar4 * iVar9;
    while( true ) {
      iVar8 = 0;
      psVar7 = SHORT_ARRAY_0059bbd0;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        iVar8 = iVar8 + ((int)(sVar1 * iVar9 + (sVar1 * iVar9 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < SHORT_ARRAY_0059bbd8);
      iVar11 = 0;
      psVar7 = SHORT_ARRAY_0059bbd8;
      do {
        sVar1 = *psVar7;
        psVar7 = psVar7 + 1;
        iVar11 = iVar11 + ((int)(sVar1 * iVar9 + (sVar1 * iVar9 >> 0x1f & 0xfffU)) >> 0xc);
      } while (psVar7 < &DAT_0059bbee);
      if (iVar6 < iVar8 + iVar11 + local_10) break;
      iVar9 = iVar9 + 4;
      local_10 = local_10 + iVar4 * 4;
    }
    iVar9 = iVar9 + -4;
    if (iVar9 < 0) {
      iVar9 = 0;
    }
  }
  DAT_0089bc13 = (short)iVar10;
  DAT_0089bc15 = (short)iVar9 * sVar2;
  DAT_0089bc17 = 1;
  _DAT_0089bc0b = (undefined2)local_24;
  DAT_0089bc0d = (undefined2)local_20;
  DAT_0089bc1c = 0;
  DAT_0089bc0f = (short)iVar8 * sVar2;
  DAT_0089bc1d = 0;
  DAT_0089bc11 = (short)iVar11 * sVar2;
  DAT_0089bc18 = 0;
  DAT_0089bc19 = 0;
  return;
}
