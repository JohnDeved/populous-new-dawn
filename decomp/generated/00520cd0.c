/* Ghidra 12.1.3 pseudocode; entry 00520cd0; init_d3d_hw_card.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Unknown calling convention */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

uint init_d3d_hw_card(void)

{
  int iVar1;
  uint uVar2;
  int iVar3;
  HRESULT HVar4;
  int iVar5;
  uint uVar6;
  undefined4 *puVar7;
  int *piVar8;
  undefined4 *unaff_FS_OFFSET;
  bool bVar9;
  char *pcVar10;
  undefined4 local_844 [256];
  tagDDDEVICEIDENTIFIER local_444;
  LPDIRECTDRAW4 local_1c;
  undefined4 *local_18;
  int local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_00520e2d;
  *unaff_FS_OFFSET = &local_10;
  debug_log(s_Creating_global_palette_005ddbc0);
  puVar7 = local_844;
  for (iVar5 = 0x100; iVar5 != 0; iVar5 = iVar5 + -1) {
    *puVar7 = 0;
    puVar7 = puVar7 + 1;
  }
  uVar2 = (**(code **)(**(int **)(local_14 + 4) + 0x14))
                    (*(int **)(local_14 + 4),0xc,local_844,local_14 + 0x6c0,0);
  if (uVar2 != 0) goto LAB_005218bf;
  if (*(int *)(local_14 + 0x510) != 0) {
    debug_log(s_Creating_3d_device_005ddbac);
    local_18 = (undefined4 *)(local_14 + 0x648);
    uVar2 = (**(code **)(**(int **)(local_14 + 0x644) + 0x20))
                      (*(int **)(local_14 + 0x644),*(undefined4 *)(local_14 + 0x518),
                       direct_draw_surface_back,local_18);
    if ((int)uVar2 < 0) {
      debug_log(s____Failed_with_code__x_0059c344,uVar2);
      goto LAB_005218bf;
    }
    debug_log(s____Passed_0059c338);
    *(undefined4 *)(local_14 + 0x640) = 0;
    iVar5 = FUN_00521af0(ui_struct->direct_draw,*local_18);
    if (iVar5 == 0) {
      debug_log(s_Not_detected_PowerVR_PCX1_or_2_005ddb70);
    }
    else {
      *(undefined4 *)(local_14 + 0x640) = 1;
      debug_log(s_Detected_PowerVR_PCX1_or_2_005ddb90);
      FUN_0052a480();
      local_8 = 0;
      iVar5 = FUN_00529f00(s_HKEY_LOCAL_MACHINE_SOFTWARE_Powe_005dd4f4);
      if (iVar5 == 0) {
        FUN_0052a2b0(s_SglTransSort_005dd4e0,&DAT_005dd4f0);
        reg_close_key();
      }
      local_8 = 0xffffffff;
      Unwind_00520e37();
    }
    iVar5 = *(int *)(local_14 + 0x1214);
    iVar3 = (**(code **)**(undefined4 **)(local_14 + 4))
                      (*(undefined4 **)(local_14 + 4),IID_IDirectDraw4,&local_1c);
    if (iVar3 < 0) {
      debug_log(s_No_DDraw4_interface___can_t_get_d_005dd8ec);
    }
    else {
      HVar4 = (*local_1c->lpVtbl->GetDeviceIdentifier)
                        (local_1c,&local_444,SUB14(*(int *)(local_14 + 0x640) != 1,0));
      if (HVar4 < 0) {
        debug_log(s_Driver_information_query_failed_005dd920);
      }
      else {
        debug_log(s_Driver_information___005ddb58);
        debug_log(s_Driver_name____s_005ddb44,&local_444);
        debug_log(s_Driver_description____s_005ddb28,local_444.szDescription);
        debug_log(s_Driver_version____d__d__d__d_005ddb08,
                  (uint)local_444.liDriverVersion.field0.HighPart >> 0x10,
                  local_444.liDriverVersion.field0.HighPart & 0xffff,
                  local_444.liDriverVersion.field0.LowPart >> 0x10,
                  local_444.liDriverVersion.field0.LowPart & 0xffff);
        if (local_444.dwVendorId == 0) {
          debug_log(s_Driver_vendor_ID_unknown_005ddad0);
        }
        else {
          debug_log(s_Driver_vendor_ID___0x_x_005ddaec,local_444.dwVendorId);
        }
        if (local_444.dwDeviceId == 0) {
          debug_log(s_Driver_chipset_ID_unknown_005dda98);
        }
        else {
          debug_log(s_Driver_chipset_ID___0x_x_005ddab4,local_444.dwDeviceId);
        }
        if (local_444.dwSubSysId == 0) {
          debug_log(s_Driver_subsystem_ID_unknown_005dda5c);
        }
        else {
          debug_log(s_Driver_subsystem_ID___0x_x_005dda7c,local_444.dwSubSysId);
        }
        if (local_444.dwRevision == 0) {
          debug_log(s_Driver_chipset_revision_ID_unkno_005dda14);
        }
        else {
          debug_log(s_Driver_chipset_revision_ID___0x__005dda38,local_444.dwRevision);
        }
        _sprintf(&DAT_00afc300,s____8X___4X___4X___2X__2X___2X__2_005dd9e0,
                 local_444.guidDeviceIdentifier.Data1,local_444.guidDeviceIdentifier._4_4_ & 0xffff,
                 (uint)local_444.guidDeviceIdentifier._4_4_ >> 0x10,
                 local_444.guidDeviceIdentifier.Data4._0_4_ & 0xff,
                 (uint)local_444.guidDeviceIdentifier.Data4._0_4_ >> 8 & 0xff,
                 (uint)local_444.guidDeviceIdentifier.Data4._0_4_ >> 0x10 & 0xff,
                 (uint)local_444.guidDeviceIdentifier.Data4._0_4_ >> 0x18,
                 local_444.guidDeviceIdentifier.Data4._4_4_ & 0xff,
                 (uint)local_444.guidDeviceIdentifier.Data4._4_4_ >> 8 & 0xff,
                 (uint)local_444.guidDeviceIdentifier.Data4._4_4_ >> 0x10 & 0xff,
                 (uint)local_444.guidDeviceIdentifier.Data4._4_4_ >> 0x18);
        debug_log(s_Driver_GUID____s_005dd9cc,&DAT_00afc300);
        if ((local_444.dwVendorId == 0x12d2) && (local_444.dwDeviceId == 0x18)) {
          debug_log(s_Riva_128_detected_005dd9b8);
          *(undefined4 *)(local_14 + 0x640) = 2;
        }
        if ((local_444.dwVendorId == 0x10de) &&
           (((local_444.dwDeviceId == 0x20 || (local_444.dwDeviceId == 0x28)) ||
            (local_444.dwDeviceId == 0x2c)))) {
          debug_log(s_Riva_TNT_detected_005dd9a4);
          *(undefined4 *)(local_14 + 0x640) = 3;
        }
        uVar2 = *(uint *)(iVar5 + 0x8c) & 8;
        *(uint *)(local_14 + 0xd08) = uVar2;
        uVar6 = *(uint *)(iVar5 + 0x8c) & 4;
        *(uint *)(local_14 + 0xd0c) = uVar6;
        if (((local_444.dwVendorId == 0x1002) && (uVar6 != 0)) && (uVar2 == 0)) {
          debug_log(s_Rage_Pro_detected_005dd990);
          *(undefined4 *)(local_14 + 0x640) = 4;
        }
        if ((local_444.dwVendorId == 0x121a) && (local_444.dwDeviceId == 2)) {
          debug_log(s_Voodoo2_detected_005dd97c);
          *(undefined4 *)(local_14 + 0x640) = 5;
        }
        if ((local_444.dwVendorId == 0x102b) && (local_444.dwDeviceId == 0x521)) {
          debug_log(s_G200_detected_005dd96c);
          *(undefined4 *)(local_14 + 0x640) = 7;
        }
        if (((local_444.dwVendorId == 0x104c) && (local_444.dwDeviceId == 0x3d07)) ||
           ((local_444.dwVendorId == 0x3d3d &&
            ((local_444.dwDeviceId == 7 || (local_444.dwDeviceId == 9)))))) {
          debug_log(s_Permedia2_detected_005dd958);
          *(undefined4 *)(local_14 + 0x640) = 8;
        }
        if ((local_444.dwVendorId == 0x121a) && (local_444.dwDeviceId == 3)) {
          debug_log(s_Banshee_detected_005dd944);
          *(undefined4 *)(local_14 + 0x640) = 9;
        }
      }
      if (local_1c != (LPDIRECTDRAW4)0x0) {
        (*local_1c->lpVtbl->Release)(local_1c);
        local_1c = (LPDIRECTDRAW4)0x0;
      }
    }
    uVar2 = clear_vram_state(*local_18);
    if (uVar2 != 0) goto LAB_005218bf;
    *(undefined4 *)(local_14 + 0x121c) = 0;
    debug_log(s_Enumerating_texture_formats_005dd8d0);
    uVar2 = (**(code **)(*(int *)*local_18 + 0x24))((int *)*local_18,add_pixel_format,local_14);
    if ((int)uVar2 < 0) {
      debug_log(s____Failed_with_code__x_0059c344,uVar2);
      goto LAB_005218bf;
    }
    debug_log(s____Passed_0059c338);
    puVar7 = (undefined4 *)(local_14 + 0xd20);
    uVar2 = (**(code **)(**(int **)(local_14 + 0x644) + 0x14))(*(int **)(local_14 + 0x644),puVar7,0)
    ;
    if (uVar2 != 0) goto LAB_005218bf;
    uVar2 = 0;
    if (DAT_005dd3e4 != 0) {
      pcVar10 = local_444.szDescription + 0x1d8;
      for (iVar3 = 0x14; iVar3 != 0; iVar3 = iVar3 + -1) {
        pcVar10[0] = '\0';
        pcVar10[1] = '\0';
        pcVar10[2] = '\0';
        pcVar10[3] = '\0';
        pcVar10 = pcVar10 + 4;
      }
      local_444.szDescription[0x1d8] = 'P';
      local_444.szDescription[0x1d9] = '\0';
      local_444.szDescription[0x1da] = '\0';
      local_444.szDescription[0x1db] = '\0';
      local_444.szDescription[0x1dc] = '\0';
      local_444.szDescription[0x1dd] = '\0';
      local_444.szDescription[0x1de] = '\0';
      local_444.szDescription[0x1df] = '\0';
      local_444.szDescription[0x1e0] = '\0';
      local_444.szDescription[0x1e1] = '\0';
      local_444.szDescription[0x1e2] = '\0';
      local_444.szDescription[0x1e3] = '\0';
      local_444.szDescription[0x1e4] = '\0';
      local_444.szDescription[0x1e5] = '\0';
      local_444.szDescription[0x1e6] = '\0';
      local_444.szDescription[0x1e7] = '\0';
      local_444.szDescription[0x1e8] = '\0';
      local_444.szDescription[0x1e9] = '\0';
      local_444.szDescription[0x1ea] = -0x80;
      local_444.szDescription[0x1eb] = '?';
      local_444.szDescription[0x1ec] = '\0';
      local_444.szDescription[0x1ed] = '\0';
      local_444.szDescription[0x1ee] = '\0';
      local_444.szDescription[0x1ef] = '\0';
      local_444.szDescription[0x1f0] = '\0';
      local_444.szDescription[0x1f1] = '\0';
      local_444.szDescription[0x1f2] = '\0';
      local_444.szDescription[499] = '\0';
      local_444.szDescription[500] = '\0';
      local_444.szDescription[0x1f5] = '\0';
      local_444.szDescription[0x1f6] = '\0';
      local_444.szDescription[0x1f7] = '\0';
      local_444.guidDeviceIdentifier.Data4[0] = '\0';
      local_444.guidDeviceIdentifier.Data4[1] = '\0';
      local_444.guidDeviceIdentifier.Data4[2] = '\0';
      local_444.guidDeviceIdentifier.Data4[3] = '\0';
      local_444.guidDeviceIdentifier.Data4[4] = '\x01';
      local_444.guidDeviceIdentifier.Data4[5] = '\0';
      local_444.guidDeviceIdentifier.Data4[6] = '\0';
      local_444.guidDeviceIdentifier.Data4[7] = '\0';
      piVar8 = (int *)*puVar7;
      uVar2 = (**(code **)(*piVar8 + 0xc))(piVar8,local_444.szDescription + 0x1d8);
      uVar2 = (uVar2 == 0) - 1 & uVar2;
    }
    uVar2 = (uVar2 == 0) - 1 & uVar2;
    if (uVar2 != 0) goto LAB_005218bf;
    debug_log(s_Setting_up_viewport_005dd8bc);
    uVar2 = d3d_create_viewport();
    if ((int)uVar2 < 0) {
      debug_log(s____Failed_with_code__x_0059c344,uVar2);
      goto LAB_005218bf;
    }
    debug_log(s____Passed_0059c338);
    debug_log(s_Setting_current_viewport_005dd8a0);
    uVar2 = (**(code **)(*(int *)*local_18 + 0x34))
                      ((int *)*local_18,*(undefined4 *)(local_14 + 0x64c));
    if ((int)uVar2 < 0) {
      debug_log(s____Failed_with_code__x_0059c344,uVar2);
      goto LAB_005218bf;
    }
    debug_log(s____Passed_0059c338);
    uVar2 = 0;
    _DAT_00afc328 = 0;
    DAT_00afc2ec = 0;
    DAT_00afc2f8 = 0;
    DAT_00afc2f0 = 0;
    DAT_00afc2e8 = 0;
    if (*(int *)(local_14 + 0x121c) != 0) {
      piVar8 = (int *)(local_14 + 0x1630);
      iVar3 = local_14 + 0x1220;
      do {
        if (piVar8[-3] == 8) {
          _DAT_00afc328 = iVar3;
        }
        iVar1 = DAT_00afc2ec;
        if ((piVar8[-1] == 5) && (piVar8[1] == 5)) {
          if (*piVar8 == 6) {
            DAT_00afc2f0 = iVar3;
          }
          if ((*piVar8 == 5) && (iVar1 = iVar3, piVar8[2] == 1)) {
            iVar1 = DAT_00afc2ec;
            DAT_00afc2f8 = iVar3;
          }
        }
        DAT_00afc2ec = iVar1;
        if ((((piVar8[-1] == 4) && (*piVar8 == 4)) && (piVar8[1] == 4)) && (piVar8[2] == 4)) {
          DAT_00afc2e8 = iVar3;
        }
        uVar2 = uVar2 + 1;
        piVar8 = piVar8 + 0xf;
        iVar3 = iVar3 + 0x20;
      } while (uVar2 < *(uint *)(local_14 + 0x121c));
    }
    *(undefined4 *)(local_14 + 0x1da0) = 0;
    iVar3 = DAT_00afc2f0;
    if ((DAT_00afc2f0 != 0) || (iVar3 = DAT_00afc2ec, DAT_00afc2ec != 0)) {
      *(int *)(local_14 + 0x1da0) = iVar3;
    }
    *(undefined4 *)(local_14 + 0x1da4) = 0;
    iVar3 = DAT_00afc2f0;
    if ((DAT_00afc2f0 != 0) || (iVar3 = DAT_00afc2ec, DAT_00afc2ec != 0)) {
      *(int *)(local_14 + 0x1da4) = iVar3;
    }
    iVar3 = *(int *)(local_14 + 0x1214);
    *(undefined4 *)(local_14 + 0x6c8) = 0;
    if ((((*(byte *)(local_14 + 0xd2a) & 0x40) != 0) && ((*(byte *)(local_14 + 0xd31) & 2) != 0)) &&
       ((*(byte *)(iVar3 + 0x84) & 8) != 0)) {
      *(undefined4 *)(local_14 + 0x6c8) = 1;
      OutputDebugStringA(s_SetupTranspMode_____Colorkeying_d_005dd590);
    }
    if (((*(byte *)(iVar3 + 0x81) & 0x10) != 0) && ((*(byte *)(iVar3 + 0x84) & 4) != 0)) {
      *(uint *)(local_14 + 0x6c8) = *(uint *)(local_14 + 0x6c8) | 2;
      OutputDebugStringA(s_SetupTranspMode_____Alpha_blend_d_005dd564);
    }
    if ((*(byte *)(iVar3 + 0x7c) & 0x10) != 0) {
      *(uint *)(local_14 + 0x6c8) = *(uint *)(local_14 + 0x6c8) | 4;
      OutputDebugStringA(s_SetupTranspMode_____Alpha_test_d_005dd538);
    }
    FUN_005218d0();
    uVar2 = (*(uint *)(iVar5 + 0x90) & 4) >> 2;
    *(uint *)(local_14 + 0x6d4) = uVar2;
    if (uVar2 != 0) {
      debug_log(s_Device_can_clamp_005dd88c);
    }
    *(uint *)(local_14 + 0x6dc) = (*(uint *)(iVar5 + 0x80) & 0x200) >> 9;
    if (*(int *)(local_14 + 0x640) == 1) {
      *(undefined4 *)(local_14 + 0x6dc) = 0;
    }
    if (*(int *)(local_14 + 0x6dc) != 0) {
      debug_log(s_Device_can_gouraud_shade_specula_005dd868);
    }
    uVar2 = (*(uint *)(iVar5 + 0x80) & 8) >> 3;
    *(uint *)(local_14 + 0x6e0) = uVar2;
    if (uVar2 != 0) {
      debug_log(s_Device_can_gouraud_shade_colour_005dd844);
    }
    *(uint *)(local_14 + 0x6e4) = (*(uint *)(iVar5 + 0x80) & 0x4000) >> 0xe;
    if (*(int *)(local_14 + 0x640) == 2) {
      *(undefined4 *)(local_14 + 0x6e4) = 0;
    }
    if (*(int *)(local_14 + 0x6e4) != 0) {
      debug_log(s_Device_can_gouraud_shade_alpha_005dd824);
    }
    if ((*(byte *)(iVar5 + 0x6e) & 2) != 0) {
      debug_log(s_Device_can_do_anisotropic_filter_005dd7fc);
    }
    if ((*(byte *)(iVar5 + 0x6d) & 4) != 0) {
      debug_log(s_Device_can_antialias_tris__sort_d_005dd7d0);
    }
    if ((*(byte *)(iVar5 + 0x6d) & 8) != 0) {
      debug_log(s_Device_can_antialias_tris__sort_i_005dd7a0);
    }
    uVar2 = *(uint *)(iVar5 + 0x88) & 0x10;
    *(uint *)(local_14 + 0x6d8) = uVar2;
    if (uVar2 == 0) {
      pcVar10 = s_Device_does_NOT_support_mipmappi_005dd760;
    }
    else {
      pcVar10 = s_Device_supports_mipmapping_005dd784;
    }
    debug_log(pcVar10);
    if (*(int *)(local_14 + 0x640) == 2) {
      *(undefined4 *)(local_14 + 0xcf8) = 4;
LAB_00521656:
      *(undefined4 *)(local_14 + 0xcfc) = 0;
    }
    else {
      if ((*(uint *)(iVar5 + 0x6c) & 0x20) == 0) {
        if ((*(uint *)(iVar5 + 0x6c) & 0x40) == 0) {
          *(undefined4 *)(local_14 + 0xcf8) = 0;
        }
        else {
          *(undefined4 *)(local_14 + 0xcf8) = 4;
        }
        goto LAB_00521656;
      }
      *(undefined4 *)(local_14 + 0xcf8) = 4;
      *(undefined4 *)(local_14 + 0xcfc) = 4;
    }
    iVar5 = 1 << (*(byte *)(local_14 + 0xcf8) & 0x1f);
    *(float *)(local_14 + 0xd00) = _DAT_0058fc4c / (float)iVar5;
    local_18 = (undefined4 *)(1 << (*(byte *)(local_14 + 0xcfc) & 0x1f));
    *(float *)(local_14 + 0xd04) = _DAT_0058fc4c / (float)(int)local_18;
    debug_log(s_Device_subpixel_resolution____1__005dd728,iVar5,local_18);
    if (((*(int *)(local_14 + 0x1da0) == 0) || (*(int *)(local_14 + 0x1da8) == 0)) ||
       ((*(int *)(local_14 + 0x1dac) == 0 || (*(int *)(local_14 + 0x1da4) == 0)))) {
      debug_log(s_Fatal_error__device_does_not_sup_005dd6e4);
      uVar2 = 1;
      goto LAB_005218bf;
    }
    HVar4 = (*direct_draw_surface->lpVtbl->QueryInterface)
                      (direct_draw_surface,(IID *)IID_IDirectDrawColorControl,
                       (void **)(local_14 + 0x6f0));
    if (HVar4 < 0) {
      debug_log(s_Could_not_query_colour_control_005dd6c4);
    }
    *(undefined4 *)(local_14 + 0xd10) = 0;
    if (ui_struct->uv_related == 8) {
      DAT_005d54e0 = 1;
    }
    if (((DAT_005d54e0 == 0) && ((*(byte *)(local_14 + 0xd2e) & 2) != 0)) &&
       (HVar4 = (*direct_draw_surface->lpVtbl->QueryInterface)
                          (direct_draw_surface,(IID *)&IID_IDirectDrawGammaControl,
                           (void **)(local_14 + 0x6f4)), -1 < HVar4)) {
      debug_log(s_Gamma_ramp_detected_and_utilised_005dd6a0);
      (*ui_struct->dd_gamma_control->lpVtbl->GetGammaRamp)
                (ui_struct->dd_gamma_control,0,(LPDDGAMMARAMP)(local_14 + 0x6f8));
      if ((*(byte *)(local_14 + 0xd2e) & 0x10) != 0) {
        debug_log(s_Colorific__Device_has_gamma_cali_005dd674);
        *(undefined4 *)(local_14 + 0xd10) = 1;
      }
    }
    else {
      debug_log(s_Gamma_ramp_not_supported_005dd658);
      *(undefined4 *)(local_14 + 0x6f4) = 0;
    }
    debug_log(s_Setting_up_renderstates_005dd63c);
    set_render_states();
  }
  bVar9 = (*(byte *)(local_14 + 0xd2d) & 8) == 0;
  if (bVar9) {
    debug_log(s_Device_requires_page_locking_for_005dd614);
  }
  landscape_surface_page_locked = (uint)bVar9;
  iVar5 = *(int *)(local_14 + 0x640);
  if (((iVar5 == 4) || (iVar5 == 1)) || (iVar5 == 6)) {
    debug_log(s_Device_cannot_filter_alpha_005dd5f8);
    *(undefined4 *)(local_14 + 0xd14) = 0;
  }
  else {
    debug_log(s_Assuming_Device_can_filter_alpha_005dd5d4);
    *(undefined4 *)(local_14 + 0xd14) = 1;
  }
  if (*(int *)(local_14 + 0x640) == 8) {
    level_flags_2 = level_flags_2 | 0x80000000;
  }
  debug_log(s_Creating_mouse_surface_005dd5bc);
  uVar2 = create_mouse_surface();
  if ((int)uVar2 < 0) {
    debug_log(s____Failed_with_code__x_0059c344,uVar2);
  }
  else {
    debug_log(s____Passed_0059c338);
    uVar2 = 0;
  }
LAB_005218bf:
  *unaff_FS_OFFSET = local_10;
  return uVar2;
}
