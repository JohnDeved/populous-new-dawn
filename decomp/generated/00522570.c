/* Ghidra 12.1.3 pseudocode; entry 00522570; draw_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 draw_1(void)

{
  bool bVar1;
  int iVar2;
  int iVar3;
  short *psVar4;
  int iVar5;
  wchar_t local_100 [128];

  iVar2 = d3d_reinit_mode();
  if (iVar2 < 0) {
    return 0;
  }
  if (DAT_005cd920 == 0) goto LAB_0052260d;
  FUN_00430bd0();
  if (DAT_006841e7 == -1) {
LAB_005225e5:
    if (DAT_006841e7 != -1) {
      global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
           global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x20000;
    }
  }
  else {
    FUN_00430e40();
    if (DAT_006841e7 != -1) {
      global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
           global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x200;
      goto LAB_005225e5;
    }
  }
  DAT_005cd920 = 0;
LAB_0052260d:
  set_d3d_device_to_texture_mem_struct();
  DAT_005da078 = 0;
  set_render_state_2();
  if (draw_mode == 0) {
    draw_sky();
    set_viewport_2((int)vconfig_struct_0088f004.x,(int)vconfig_struct_0088f004.y);
    DAT_00895fb0 = 0;
    if (DAT_00895fb1 != '\0') {
      DAT_00895fb1 = DAT_00895fb1 + -1;
    }
    DAT_0098db2c = 0;
    tribe_ptr = game_state.tribes_array + player_tribe_num;
    clear_land_draw_state();
    draw_land();
    reset_viewport();
  }
  else if (draw_mode == 2) {
    draw_sky();
    set_viewport_2((int)vconfig_struct_0088f004.x,(int)vconfig_struct_0088f004.y);
    clear_object_cache_internals();
    draw_globe();
  }
  FUN_0049c960();
  FUN_00480ea0();
  if (((byte)land_flags_1 & 4) == 0) {
    FUN_00431110();
    FUN_0044ac00();
  }
  empty_func();
  render_land_ui_1();
  FUN_00480ea0();
  render_some_text_5();
  mld_turn();
  render_some_text_4();
  iVar2 = FUN_00451370();
  if ((((iVar2 == 0) && (iVar2 = FUN_00451370(), iVar2 == 0)) && ((level_flags_1._3_1_ & 0x80) == 0)
      ) && (draw_mode != 2)) {
    render_land_ui_animted_sprites();
  }
  else {
    iVar2 = FUN_00451370();
    if (iVar2 == 0) {
      iVar2 = FUN_00451370();
      if (iVar2 != 0) {
        render_text_current_ms();
      }
    }
    else {
      FUN_0045e730();
    }
  }
  if ((DAT_0089ce6c == '\x01') || (DAT_0089ce6c == '\x02')) {
    add_polygon_rect_sprite(DAT_0089ce68);
  }
  render_text_and_sprites_per_tribe();
  if ((game_state.level_flags & 2) != 0) {
    FUN_0047aaa0();
    clear_unicode_render_str();
    if (DAT_00897988 != '\0') {
      iVar2 = get_font_type();
      if (iVar2 == 0) {
        set_font_render_default();
      }
      else {
        set_font_sprite_size();
      }
      _swprintf(local_100,u__s_00599970);
      iVar2 = get_font_type();
      iVar5 = (int)screen_height;
      if (iVar2 == 0) {
        iVar2 = get_font_sprite_width_render_2();
      }
      else {
        iVar2 = get_font_sprite_size();
      }
      iVar3 = get_font_type();
      if (iVar3 == 0) {
        set_indexed_value_from_system_palette(palette_index_1);
        render_text_unicode(0,iVar5 - iVar2,local_100);
      }
      else {
        render_text_unicode_2(0,iVar5 - iVar2);
      }
    }
  }
  if (((game_state.level_flags & 0x20) != 0) &&
     ((DAT_00897986 != '\0' || (0x77 < game_state._842010_4_ - game_state.offset_counter_2)))) {
    iVar2 = get_font_type();
    if (iVar2 == 0) {
      set_font_render_default();
    }
    else {
      set_font_sprite_size();
    }
    _swprintf(local_100,u__s___2_2d_005ddcd4);
    iVar5 = (int)vconfig_struct_0088f004.x;
    iVar2 = get_font_type();
    if (iVar2 == 0) {
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(iVar5,0,local_100);
    }
    else {
      render_text_unicode_2(iVar5,0);
    }
  }
  render_some_text_1();
  render_resync_text();
  some_text_rendering_2();
  if (((byte)opened_files_flags & 4) == 0) {
    bVar1 = false;
    iVar5 = 0x89d1c8;
    iVar2 = 4;
    do {
      if (*(char *)(iVar5 + 0xc20) != '\0') {
        iVar3 = 0;
        psVar4 = (short *)(iVar5 + 0x67b);
        do {
          if (0 < *psVar4) {
            bVar1 = true;
            break;
          }
          psVar4 = psVar4 + 0x57;
          iVar3 = iVar3 + 1;
        } while (iVar3 < 3);
      }
      iVar5 = iVar5 + 0xc65;
      iVar2 = iVar2 + -1;
    } while (iVar2 != 0);
    if (bVar1) {
      render_per_tribe_text();
    }
  }
  if ((load_level_flags._3_1_ & 1) != 0) {
    iVar2 = get_font_type();
    if (iVar2 == 0) {
      set_font_render_default();
    }
    else {
      set_font_sprite_size();
    }
    _swprintf(local_100,u__lx_005ddccc);
    palette_index_1 = DAT_0089c6f6;
    iVar2 = get_font_type();
    if (iVar2 == 0) {
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(2,2,local_100);
    }
    else {
      render_text_unicode_2(2,2);
    }
  }
  render_some_text_3();
  if ((level_flags_1._3_1_ & 0x80) != 0) {
    FUN_004581c0();
  }
  empty_func();
  DAT_005da078 = 1;
  if (is_world_view == 0) {
    landscape_texture_blt_to_surface();
  }
  if (sky_mem_end_1 != 0) {
    blit_minimap();
    sky_mem_end_1 = 0;
  }
  draw_textures();
  draw_stored_polygons();
  init_texture_mem_struct_1();
  draw_texture_mem();
  end_scene();
  allocated_textures_num = allocated_textures_num + 1;
  return 1;
}
