/* Ghidra 12.1.3 pseudocode; entry 00479f00; FUN_00479f00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00479f00(byte param_1,ushort param_2,int param_3)

{
  bool bVar1;
  char cVar2;
  int iVar3;
  uint uVar4;
  int iVar5;
  uint uVar6;
  vconfig_struct *pvVar7;
  int *piVar8;
  vconfig_struct *pvVar9;
  char local_101;
  wchar_t local_100 [128];

  bVar1 = false;
  uVar6 = (uint)param_2;
LAB_00479f1d:
  iVar3 = param_1 - 1;
  local_101 = (char)uVar6;
  switch(iVar3) {
  case 0:
  case 1:
    if (((land_flags_1 & 8) != 0) && ((level_hdr_mem.level_flags & 4) != 0)) {
      return;
    }
    if ((land_flags_1 & 0x100000) != 0) {
      return;
    }
    if (param_1 == 1) {
      bVar1 = true;
      if ((ushort)uVar6 == 0) {
        if ((uint)screen_resolutions_number_1 - (uint)screen_resolution_index_current == 1) {
          screen_resolution_index_current = 0;
        }
        else {
          screen_resolution_index_current = screen_resolution_index_current + 1;
        }
      }
      else if (screen_resolution_index_current == 0) {
        screen_resolution_index_current = screen_resolutions_number_1 - 1;
      }
      else {
        screen_resolution_index_current = screen_resolution_index_current - 1;
      }
      uVar6 = (uint)screen_resolution_index_current;
    }
    else {
      uVar6 = uVar6 & 0xffff;
    }
    change_screen_mode(screen_resolutions[uVar6].width,screen_resolutions[uVar6].height,
                       screen_resolutions[uVar6].bits);
    reload_hspr_sprites();
    FUN_005009b0();
    set_font_polypool_mem_ptr();
    if (!bVar1) {
      return;
    }
    _swprintf(local_100,u__d_x__d_x__d_0059dec4,(int)screen_width,(int)screen_height,
              (int)screen_pixel_bits);
    _DAT_008922ee = _DAT_008922ee | 1;
    _wcsncpy(u__008922f2,local_100,0x50);
    DAT_00892394 = 0xff;
    u__008922f2[0x4f] = L'\0';
    DAT_008922ec = 0x30;
    _DAT_008922f0 = 0;
    return;
  case 2:
  case 3:
    if ((param_1 == 3) && (DAT_0089c6c3 < 0x20)) {
      iVar3 = FUN_00417270((char)DAT_0089c6c3 + '\x01',1);
    }
    if ((param_1 == 4) && (0 < DAT_0089c6c3)) {
      FUN_00417270(CONCAT31((int3)(CONCAT22((short)((uint)iVar3 >> 0x10),DAT_0089c6c3) >> 8),
                            (char)DAT_0089c6c3 + -1),1);
    }
    update_surface_mem_offset();
    if (DAT_0089c6c3 == 0) {
      if (vconfig_dat_mem[vconfig_index * 5 + (int)vconfig_index_start].field_0x55 == '\0') {
        level_flags_2 = level_flags_2 | 0x8000;
        return;
      }
      level_flags_2 = level_flags_2 & 0xffff7fff;
      return;
    }
    level_flags_2 = level_flags_2 & 0xffff7fff;
    return;
  case 4:
  case 9:
    if (param_1 == 5) {
      FUN_004b00b0((uVar6 & 0xffff) * 0xc65 + 0x89d1c8);
    }
    cVar2 = (char)((land_flags_1 & 2) >> 1);
    if (param_1 == 10) {
      if (param_3 == 0) {
        land_flags_1 = land_flags_1 & 0xfffffffd;
      }
      else {
        land_flags_1 = land_flags_1 | 2;
      }
    }
    else {
      land_flags_1 = land_flags_1 ^ 2;
    }
    uVar4 = land_flags_1 & 2;
    if (uVar4 == 0) {
      call_sound_func();
      _DAT_008922ee = _DAT_008922ee & 0xfffd;
      _DAT_00892397 = 0;
      _DAT_00892395 = 0;
      if (cVar2 == '\0') {
        _DAT_00892395 = 0;
        _DAT_00892397 = 0;
        return;
      }
      measure_time(0);
      return;
    }
    call_sound_func_2();
    _DAT_008922ee = _DAT_008922ee | 2;
    _wcsncpy((wchar_t *)&DAT_00892397,DAT_00972f44,0x50);
    _DAT_00892435 = 0;
    if (player_tribe_num == local_101) {
      local_101 = -1;
    }
    else if (local_101 != -1) {
      local_101 = (&DAT_008956ab)[local_101];
    }
    DAT_00892439 = local_101;
    _DAT_00892395 = 0;
    if ((char)('\x01' - (uVar4 == 0)) == cVar2) {
      _DAT_00892395 = 0;
      _DAT_00892435 = 0;
      return;
    }
    measure_time(1);
    if (param_1 != 10) {
      return;
    }
    FUN_004b00b0((uVar6 & 0xffff) * 0xc65 + 0x89d1c8);
    return;
  case 5:
    DAT_0089ce5b = local_101;
    land_flags_1 = land_flags_1 | 0x80000000;
    DAT_0089ce5a = 2;
    return;
  case 6:
    DAT_0089ce5b = local_101;
    land_flags_1 = land_flags_1 | 0x80000000;
    DAT_0089ce5a = 3;
    return;
  case 7:
    if ((((byte)opened_files_flags & 8) == 0) && ((game_state.level_flags & 2) == 0)) {
      if (param_3 == 0) {
        land_flags_1 = land_flags_1 ^ 4;
        goto LAB_0047a3a2;
      }
      if (param_3 < 1) {
        land_flags_1 = land_flags_1 & 0xfffffffb;
        goto LAB_0047a3a2;
      }
    }
    land_flags_1 = land_flags_1 | 4;
LAB_0047a3a2:
    FUN_00417270(CONCAT22((short)((uint)iVar3 >> 0x10),DAT_0089c6c3),1);
    return;
  case 8:
    land_flags_1 = land_flags_1 ^ 0x400;
    if ((land_flags_1 & 0x400) != 0) {
      return;
    }
    u__008922f2[0] = L'\0';
    _DAT_008922f0 = 0;
    DAT_008922ec = 0;
    _DAT_008922ee = _DAT_008922ee & 0xfffe;
    return;
  case 10:
    land_flags_1 = land_flags_1 ^ 0x10000;
    return;
  case 0xb:
    if (param_3 == 0) {
      land_flags_1 = land_flags_1 | 0x100000;
      DAT_0089c6eb = vconfig_index_start;
      vconfig_index_start = local_101;
      if (local_101 < '\0') {
        vconfig_index_start = '\x04';
      }
      if ('\x04' < vconfig_index_start) {
        vconfig_index_start = '\0';
      }
      DAT_0089ce34 = FUN_004174b0(0);
      pvVar7 = &vconfig_struct_0088f004;
      piVar8 = &DAT_0088f062;
      for (iVar3 = 0x17; iVar3 != 0; iVar3 = iVar3 + -1) {
        *piVar8 = pvVar7->field0_0x0;
        pvVar7 = (vconfig_struct *)&pvVar7->field1_0x4;
        piVar8 = piVar8 + 1;
      }
      *(short *)piVar8 = (short)pvVar7->field0_0x0;
      return;
    }
    vconfig_index_start = local_101;
    update_vfconfig();
    return;
  case 0xc:
    if ((ushort)uVar6 < 2) {
      return;
    }
    iVar3 = is_resolution_640_480(screen_resolution_index_current);
    pvVar7 = vconfig_dat_mem + iVar3 * 5;
    pvVar9 = vconfig_dat_mem + (uVar6 & 0xffff) + iVar3 * 5;
    for (iVar5 = 0x17; iVar5 != 0; iVar5 = iVar5 + -1) {
      pvVar9->field0_0x0 = pvVar7->field0_0x0;
      pvVar7 = (vconfig_struct *)&pvVar7->field1_0x4;
      pvVar9 = (vconfig_struct *)&pvVar9->field1_0x4;
    }
    *(short *)&pvVar9->field0_0x0 = (short)pvVar7->field0_0x0;
    update_vfconfig();
    return;
  case 0xd:
    vconfig_index = local_101;
    if (local_101 < '\0') {
      vconfig_index = '\t';
    }
    if (vconfig_index < '\n') {
      return;
    }
    vconfig_index = 0;
    return;
  case 0xe:
    break;
  default:
    return;
  }
  uVar6 = 0xffffffff;
  if (param_3 < 1) {
    if (draw_mode != 2) {
      if (vconfig_index_start == '\0') {
        uVar6 = 2;
      }
      else if (vconfig_index_start == '\x02') {
        FUN_00418890();
      }
      else if (vconfig_index_start == '\x03') goto LAB_00479fa0;
    }
  }
  else if (draw_mode == 2) {
    DAT_0089c6eb = 2;
    FUN_00418890();
  }
  else if (vconfig_index_start == '\0') {
    uVar6 = 3;
  }
  else if (vconfig_index_start == '\x02') {
LAB_00479fa0:
    uVar6 = 0;
  }
  if ((int)uVar6 < 0) {
    return;
  }
  param_1 = 0xc;
  param_3 = 0;
  goto LAB_00479f1d;
}
