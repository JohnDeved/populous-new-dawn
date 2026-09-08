/* Ghidra 12.1.3 pseudocode; entry 004a4450; main_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 main_3(void)

{
  char cVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  char *pcVar5;
  char *pcVar6;
  undefined4 *unaff_FS_OFFSET;
  bool bVar7;
  undefined1 local_124 [128];
  CHAR local_a4 [123];
  undefined4 local_29;
  undefined4 local_25;
  DWORD local_18;
  int local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_004a4924;
  *unaff_FS_OFFSET = &local_10;
  iVar2 = init_form_registry();
  if (iVar2 != 0) {
    read_registry_1();
    DAT_0089c650 = 2;
    load_level_flags = load_level_flags | 0x100;
    uVar3 = 0xffffffff;
    pcVar5 = s_____005cda9c;
    do {
      pcVar6 = pcVar5;
      if (uVar3 == 0) break;
      uVar3 = uVar3 - 1;
      pcVar6 = pcVar5 + 1;
      cVar1 = *pcVar5;
      pcVar5 = pcVar6;
    } while (cVar1 != '\0');
    uVar3 = ~uVar3;
    pcVar5 = pcVar6 + -uVar3;
    pcVar6 = (char *)&DAT_0089c48e;
    for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
      *(undefined4 *)pcVar6 = *(undefined4 *)pcVar5;
      pcVar5 = pcVar5 + 4;
      pcVar6 = pcVar6 + 4;
    }
    for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
      *pcVar6 = *pcVar5;
      pcVar5 = pcVar5 + 1;
      pcVar6 = pcVar6 + 1;
    }
    read_reg_video(1);
    empty_4();
    read_dirs();
    if (DAT_0089c6f1 != '\0') {
      level_free_exit(DAT_0089c6f1);
    }
    clear_config();
    load_config00();
    cVar1 = init_lang(font_type);
    if (cVar1 == '\0') {
      level_free_exit(0x1c);
    }
    FUN_0049a690(local_124,DAT_00972fd8);
    FUN_0052a7b0(local_124);
    FUN_0049a690(&DAT_0089c48e,landscape_string_src_1);
    init_d3d();
    select_video_device();
    iVar2 = create_mutex();
    if (iVar2 == 1) {
      free_lang();
      free_font_array();
    }
    else {
      if (font_type == 0xb) {
        sprite_container_005a3b30.path[0xc] = '3';
      }
      init_all();
joined_r0x004a4586:
      if ((DAT_0089c6f2 == '\0') && (iVar2 = FUN_0052a780(), iVar2 == 0)) {
        local_18 = GetTickCount();
        iVar2 = FUN_0049cfe0();
        DAT_0098e7cc = local_18 + (int)(1000 / (longlong)iVar2);
        DAT_0098e7e0 = local_18 + (int)(1000 / (ulonglong)(longlong)(int)(uint)DAT_0089ce62);
        update_palettes_6();
        FUN_00489e10();
        iVar2 = FUN_004b2670();
        if (iVar2 == 0) goto code_r0x004a45ee;
        if (DAT_005cd958 == 0) {
          process_cmd(0x9a,0,0);
          FUN_004a9c50();
          FUN_0048b890();
          call_sound_func();
          DAT_005cd958 = 1;
          local_14 = 1;
        }
        goto LAB_004a4666;
      }
      current_frame_buffer = 0;
      update_screen_2(0,0,0);
      level_flags_1 = level_flags_1 | 4;
      if (((byte)land_flags_1 & 8) != 0) {
        clear_tribe_session(0);
      }
      bVar7 = false;
      FUN_004a9bf0();
      update_screen_4(0);
      shutdown_network();
      FUN_004f1900();
      FUN_004f17d0();
      FUN_00500540();
      free_all_dtr();
      free_fonts();
      free_pls();
      write_config00();
      write_vconfig_dat_ver();
      free_lang();
      deinit_sound();
      free_resources();
      free_objs_sprites();
      free_shapes();
      CoUninitialize();
      free_landscape_texture_memory();
      if (DAT_0059991c != 0) {
        FUN_0052a480();
        local_8 = 0;
        iVar2 = reg_close(PTR_s_Populous__The_Beginning_005cd954,0);
        if (iVar2 == 0) {
          iVar2 = FUN_0052a2e0(s_Matchmaker_URL_005cdaa8,local_a4,0x80,0);
          bVar7 = iVar2 == 0;
          reg_close_key();
        }
        if (bVar7) {
          ShellExecuteA((HWND)0x0,s_open_005cdaa0,local_a4,(LPCSTR)0x0,(LPCSTR)0x0,1);
        }
        local_8 = 0xffffffff;
        Unwind_004a492e();
      }
      if (DAT_005cd928 != 0) {
        MessageBoxW((HWND)0x0,error_str,DAT_00972fd8,0);
      }
      CloseHandle(mutex_handle);
    }
  }
  *unaff_FS_OFFSET = local_10;
  return 1;
code_r0x004a45ee:
  if (DAT_005cd958 == 1) {
    FUN_0048b850();
    call_sound_func_2();
    FUN_00418810();
    DAT_005cd958 = 0;
  }
  FUN_0052a710();
  do {
    iVar2 = FUN_00526c10((int)&local_25 + 1);
  } while (iVar2 != 0);
  if (((byte)land_flags_1 & 8) != 0) {
LAB_004a4666:
    if (ui_struct->f4[3] != 0) {
      update_palettes_5(0);
    }
    iVar2 = FUN_004b2670();
    if (iVar2 != 0) {
      (*(code *)ui_struct->ui_vtable->f2)();
    }
    if (local_14 == 1) {
      if ((((screen_width == 0x200) && (screen_height == 0x180)) &&
          (iVar2 = always_returns_0(), iVar2 != 0)) && (interface_state == '\x02')) {
        local_29 = 0;
        local_25 = local_25 & 0xffffff00;
        FUN_0052b1e0(0,local_25);
      }
      local_14 = 0;
    }
    maybe_update_framerate();
    if (((interface_state != '\x02') && (interface_state != '\a')) && (interface_state != '\n')) {
      FUN_0047ad90();
    }
    FUN_0047ffb0();
    sprite_animation_counter = sprite_animation_counter + 1;
    uVar3 = 1;
    do {
      uVar4 = uVar3 + 1;
      *(byte *)(uVar3 + 0x897985) = (byte)(game_state.offset_counter / uVar3) & 1;
      uVar3 = uVar4;
    } while ((int)uVar4 < 8);
    FUN_004a2660();
    update_bl320_sprites();
    switch(interface_state) {
    case '\x02':
      draw_main();
      break;
    case '\a':
      draw_fe();
      break;
    case '\n':
      draw_solar_system_view();
      break;
    case '\v':
      draw_debug();
      break;
    case '\f':
      draw_debug_2();
    }
    FUN_0049c960();
    update_palettes();
    iVar2 = FUN_004b2670();
    if (iVar2 != 0) {
      update_screen(0);
    }
    cVar1 = FUN_0049cfc0();
    if (cVar1 == '\0') {
      do {
        local_18 = GetTickCount();
      } while ((int)local_18 < DAT_0098e7e0);
    }
    else {
      iVar2 = FUN_0049cfe0();
      do {
        local_18 = GetTickCount();
      } while ((int)local_18 < DAT_0098e7cc);
      if (iVar2 < maybe_framerate) {
        maybe_framerate = iVar2;
      }
    }
  }
  goto joined_r0x004a4586;
}
