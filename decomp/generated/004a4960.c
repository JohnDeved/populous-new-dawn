/* Ghidra 12.1.3 pseudocode; entry 004a4960; draw_main.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void draw_main(void)

{
  bool bVar1;
  char cVar2;
  int iVar3;
  undefined4 uVar4;

  bVar1 = false;
  DAT_0089d163 = 0;
  if (interface_state_3 == '\x01') {
    current_frame_buffer = '\0';
    update_screen_2(0,0,0);
    update_screen_4(1);
    load_files();
    if (((byte)level_flags & 8) == 0) {
      load_watdisp_2();
    }
    else {
      load_watdisp_1();
    }
    vconfig_index = get_vconfig_index((int)screen_width,(int)screen_height);
    update_vfconfig();
    load_hspr((int)(char)vconfig_struct_0088f004._86_1_,(int)screen_width,(int)screen_height);
    set_interface_state_3(3);
    set_draw_mode(CONCAT22(player_tribe_num >> 7,draw_mode),player_tribe_num * 0xc65 + 0x89d1c8);
    inc_tribes_commands();
    clear_temp_tribe_command_buffer();
    if (DAT_00895db0 != '\0') {
      FUN_0048b3e0();
    }
    if (draw_mode != 2) {
      sound_func_1();
    }
  }
  else {
    if (interface_state_3 != '\x04') {
      if (interface_state_3 != '\x05') goto LAB_004a4ac0;
      set_interface_state_3(4);
    }
    d3d_destroy_res();
    FUN_0049cfa0(0xff);
    free_watdisp_and_others();
    if (game_state._275116_1_ == '\0') {
      set_interface_state_3_1();
    }
    bVar1 = true;
    maybe_sound_1(1);
    FUN_0048b8d0();
    current_frame_buffer = '\0';
    update_screen_2(0,0,0);
  }
LAB_004a4ac0:
  if ((((DAT_00895dbb == 0) && (draw_mode != 2)) && (DAT_0089ce36 == '\0')) &&
     (DAT_00895db1 == '\x01')) {
    sound_func_1();
  }
  if (!bVar1) {
    FUN_0044bb80();
    FUN_004b1f10();
    FUN_004314c0();
    FUN_00449320();
    FUN_004afa70();
    FUN_004b0080();
    if ((level_flags_1._3_1_ & 0x80) == 0) {
      FUN_004aa4e0();
    }
    else {
      thunk_FUN_00458bd0();
      FUN_00458130();
    }
    if (((interface_state_2 == '\n') || (interface_state_3 == '\x05')) ||
       (interface_state_3 == '\x04')) {
      update_screen_4(0);
    }
    else {
      process_video_commands();
      set_player_matrix_coords();
      set_player_transform_matrix();
      FUN_004b8f50();
      copy_tribe_commands_from_buffer();
      main_loop_outer();
      units_clear_flag_bit_0();
      FUN_0041bae0();
      FUN_004b4760();
      FUN_0041b6d0();
      FUN_00418950();
      FUN_00417510();
      FUN_00417b70();
      FUN_00418270();
      FUN_00417c40();
      FUN_00419a90();
      FUN_00504920();
      FUN_004f1270(1);
      FUN_0041c050();
      FUN_00520250();
      FUN_0041c120();
      FUN_0048a900();
      FUN_004803f0();
      iVar3 = FUN_004b2670();
      if ((iVar3 != 0) &&
         ((((land_flags_1 & 8) == 0 || (DAT_0089569d == '\0')) || (game_state.offset_counter != 0)))
         ) {
        FUN_00420040();
        if ((land_flags_1 & 0x800000) == 0) {
          iVar3 = draw_1();
          if (iVar3 == 0) {
            land_flags_1 = land_flags_1 | 0x800000;
          }
          if (DAT_005cd91c == 0) {
            back_buffer_locks_num = back_buffer_locks_num + 1;
            lock_global_sem();
            uVar4 = get_d3d_struct_ptr(0);
            iVar3 = surface_lock(uVar4);
            is_surface_locked = iVar3 == 0;
            uVar4 = get_d3d_struct_ptr();
            set_surface_mem_global(uVar4);
            iVar3 = get_d3d_struct_ptr();
            surface_mem_index = (undefined2)*(undefined4 *)(iVar3 + 0x24);
            iVar3 = get_d3d_struct_ptr();
            surface_mem_height = (undefined2)*(undefined4 *)(iVar3 + 0x20);
            draw_framerate();
            dump_info();
            uVar4 = get_d3d_struct_ptr();
            unlock_surface(uVar4);
            is_surface_locked = 0;
            unlock_global_sem();
          }
        }
        FUN_004ee770();
      }
      FUN_00489770();
      FUN_004f1270(0);
      FUN_0047f6d0();
      FUN_004a2960();
      if ((land_flags_1 & 8) != 0) {
        if ((land_flags_1 & 0x20) == 0) {
          FUN_00445580();
        }
        else {
          clear_tribe_session(1);
        }
      }
      if ((level_flags_1._2_1_ & 8) != 0) {
        current_frame_buffer = 0;
        update_screen_2(0,0,0);
        return;
      }
      cVar2 = FUN_0047a8b0();
      if (current_frame_buffer != cVar2) {
        current_frame_buffer = cVar2;
        update_screen_2(cVar2 * 8 + point_0_end,0,0);
        return;
      }
    }
  }
  return;
}
