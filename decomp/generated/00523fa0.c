/* Ghidra 12.1.3 pseudocode; entry 00523fa0; render_text_and_sprites_per_tribe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void render_text_and_sprites_per_tribe(void)

{
  short sVar1;
  ushort uVar2;
  uint uVar3;
  bool bVar4;
  byte bVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  undefined1 **ppuVar9;
  undefined1 **ppuVar10;
  int iVar11;
  uint uVar12;
  ushort *puVar13;
  int iVar14;
  int iVar15;
  int iVar16;
  uint uVar17;
  int iVar18;
  short *psVar19;
  bool bVar20;
  uint local_420;
  int local_41c;
  int local_418;
  int local_414;
  uint local_410;
  int local_40c;
  int local_408;
  int local_404;
  undefined1 *local_400 [64];
  wchar_t local_300 [256];
  wchar_t local_100 [128];

  if ((((byte)level_flags_1 & 0x20) != 0) && ((load_level_flags._1_1_ & 2) == 0)) {
    iVar6 = (int)player_tribe_num;
    bVar20 = (land_flags_1 & 0x6000000) != 0;
    iVar7 = get_font_type();
    if (iVar7 == 0) {
      set_font_render_default();
    }
    else {
      set_font_sprite_size();
    }
    iVar11 = (int)vconfig_struct_0088f004.x +
             ((int)vconfig_struct_0088f004.width_2 - (int)DAT_008926f3) / 2;
    iVar7 = (int)vconfig_struct_0088f004.y +
            ((int)vconfig_struct_0088f004.height_2 - (int)DAT_008926f5) / 2;
    draw_hfx_sprites(iVar11,iVar7);
    iVar18 = iVar11 + DAT_008926fb;
    iVar14 = iVar7 + (int)DAT_00892705 + (int)DAT_008926fd;
    FUN_004c3c40(local_100);
    _swprintf(local_300,u__s_00599970);
    iVar16 = (int)DAT_008926f7;
    iVar8 = get_wchar_str_pixel_len();
    iVar8 = iVar18 + (iVar16 - iVar8) / 2;
    iVar16 = get_font_type();
    if (iVar16 == 0) {
      local_400[0] = &stack0xfffffba0;
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(iVar8,iVar14,local_300);
    }
    else {
      render_text_unicode_2(iVar8,iVar14);
    }
    iVar14 = iVar14 + DAT_00892707;
    if ((land_flags_1 & 8) == 0) {
      _swprintf(local_300,u__s__d__005dddbc);
    }
    else {
      _swprintf(local_300,u__s__d___s_005dddcc,landscape_string_src_1);
    }
    iVar16 = (int)DAT_008926f7;
    iVar8 = get_wchar_str_pixel_len();
    iVar8 = iVar18 + (iVar16 - iVar8) / 2;
    iVar16 = get_font_type();
    if (iVar16 == 0) {
      local_400[0] = &stack0xfffffba0;
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(iVar8,iVar14,local_300);
    }
    else {
      render_text_unicode_2(iVar8,iVar14);
    }
    iVar14 = iVar14 + DAT_00892707;
    _swprintf(local_100,u__s_00599970);
    printf_internal(local_300,u__s___s_005dddac);
    iVar16 = (int)DAT_008926f7;
    iVar8 = get_wchar_str_pixel_len();
    iVar8 = iVar18 + (iVar16 - iVar8) / 2;
    if ((bVar20) && (DAT_0089798b != '\0')) {
      printf_internal(local_300);
    }
    iVar16 = get_font_type();
    if (iVar16 == 0) {
      local_400[0] = &stack0xfffffba0;
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(iVar8,iVar14,local_300);
    }
    else {
      render_text_unicode_2(iVar8,iVar14);
    }
    uVar17 = DAT_008926ff + iVar18;
    iVar18 = DAT_00892701 + iVar18;
    iVar8 = (int)(DAT_00892707 / 2) + DAT_00892707 + iVar14;
    _swprintf(local_300,u__s_00599970);
    iVar16 = get_font_type();
    if (iVar16 == 0) {
      local_400[0] = &stack0xfffffba0;
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(uVar17,iVar8,local_300);
    }
    else {
      render_text_unicode_2(uVar17,iVar8);
    }
    if (((((land_flags_1 & 0x6000000) != 0) && ((land_flags_1 & 8) == 0)) ||
        ((load_level_flags._1_1_ & 2) != 0)) || (bVar4 = true, (land_flags_1 & 2) != 0)) {
      bVar4 = false;
    }
    iVar16 = game_state._838730_4_;
    if (bVar4) {
      measure_time();
      iVar16 = game_state._838730_4_;
      measure_time();
    }
    printf_internal(local_300,u____2_2ld__2_2ld__2_2ld_005ddd74,iVar16 / 3600000);
    iVar16 = get_font_type();
    if (iVar16 == 0) {
      local_400[0] = &stack0xfffffba0;
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(iVar18,iVar8,local_300);
    }
    else {
      render_text_unicode_2(iVar18,iVar8);
    }
    psVar19 = &DAT_005add30;
    iVar16 = DAT_00892707 + iVar8;
    sVar1 = DAT_005add30;
    while (sVar1 != 0) {
      if (*(char *)((int)psVar19 + 3) != '\0') {
        iVar16 = iVar16 + DAT_00892709;
      }
      _swprintf(local_300,u__s_00599970);
      iVar14 = get_font_type();
      if (iVar14 == 0) {
        local_400[0] = &stack0xfffffba0;
        set_indexed_value_from_system_palette(palette_index_1);
        render_text_unicode(uVar17,iVar16,local_300);
      }
      else {
        render_text_unicode_2(uVar17,iVar16);
      }
      iVar16 = iVar16 + DAT_00892707;
      psVar19 = psVar19 + 2;
      sVar1 = *psVar19;
    }
    printf_internal();
    iVar16 = get_wchar_str_pixel_len();
    psVar19 = &DAT_005add30;
    printf_internal();
    iVar8 = DAT_00892707 + iVar8;
    iVar14 = get_wchar_str_pixel_len();
    local_410 = iVar18 + iVar14;
    if (DAT_005add30 != 0) {
      local_420 = iVar6 * 0xc;
      do {
        if (*(char *)((int)psVar19 + 3) != '\0') {
          iVar8 = iVar8 + DAT_00892709;
        }
        iVar14 = get_font_type();
        if (iVar14 == 0) {
          local_400[0] = &stack0xfffffba0;
          set_indexed_value_from_system_palette(palette_index_1);
          render_text_unicode(iVar18,iVar8,local_100);
        }
        else {
          render_text_unicode_2(iVar18,iVar8);
        }
        printf_internal(local_300);
        iVar14 = get_wchar_str_pixel_len();
        iVar15 = local_410 + (iVar16 - iVar14) / 2;
        iVar14 = get_font_type();
        if (iVar14 == 0) {
          set_indexed_value_from_system_palette(palette_index_1);
          render_text_unicode(iVar15,iVar8,local_300);
        }
        else {
          render_text_unicode_2(iVar15,iVar8);
        }
        iVar8 = iVar8 + DAT_00892707;
        psVar19 = psVar19 + 2;
      } while (*psVar19 != 0);
    }
    if (game_state._858459_1_ != '\0') {
      uVar12 = (uint)*(ushort *)(hfx_0_addr + 0x2024);
      uVar2 = *(ushort *)(hfx_0_addr + 0x2026);
      if (DAT_0089270f == '\0') {
        iVar16 = (int)DAT_00892710 + uVar12;
        iVar18 = (int)DAT_008926f7 + DAT_00892703 * -2;
        if (iVar18 < (int)(((char)game_state._858455_1_ + -1) * iVar16 + uVar12)) {
          iVar16 = iVar18 / (int)(char)game_state._858455_1_;
        }
        DAT_0089270f = '\x01';
        DAT_0089270b = (short)iVar16;
      }
      iVar16 = 0;
      puVar13 = &DAT_005a80de;
      bVar5 = 0;
      local_410 = iVar6 * 0x30;
      uVar3 = *(uint *)(&game_state.field_0xccc76 + local_410);
      ppuVar9 = local_400;
      do {
        ppuVar10 = ppuVar9;
        if (((uVar3 & 1 << (bVar5 & 0x1f)) != 0) &&
           ((game_state._842002_4_ & 1 << (bVar5 & 0x1f)) != 0)) {
          ppuVar10 = ppuVar9 + 1;
          iVar16 = iVar16 + 1;
          *ppuVar9 = (undefined1 *)(uint)*puVar13;
        }
        puVar13 = puVar13 + 0x1f;
        bVar5 = bVar5 + 1;
        ppuVar9 = ppuVar10;
      } while (puVar13 < (ushort *)0x5a85f5);
      bVar5 = 1;
      puVar13 = (ushort *)&unit_type_array_building[1].field_0xa;
      local_420 = *(uint *)(&game_state.field_0xccc7a + local_410);
      ppuVar9 = local_400 + iVar16;
      do {
        ppuVar10 = ppuVar9;
        if (((local_420 & 1 << (bVar5 & 0x1f)) != 0) &&
           ((game_state._842006_4_ & 1 << (bVar5 & 0x1f)) != 0)) {
          ppuVar10 = ppuVar9 + 1;
          iVar16 = iVar16 + 1;
          *ppuVar9 = (undefined1 *)(uint)*puVar13;
        }
        puVar13 = puVar13 + 0x26;
        bVar5 = bVar5 + 1;
        ppuVar9 = ppuVar10;
      } while (puVar13 < &unit_type_array_building[0x13].field_0xb);
      iVar6 = (int)DAT_0089270b;
      iVar8 = iVar8 + DAT_00892711;
      iVar18 = 0;
      if ('\0' < (char)game_state._858459_1_) {
        iVar14 = (uint)uVar2 + iVar8;
        do {
          vertices_flags = vertices_flags | 8;
          local_420 = uVar17;
          local_41c = iVar8;
          local_418 = uVar12 + uVar17;
          local_414 = iVar14;
          set_indexed_value_from_system_palette(global_palette_indexes);
          FUN_00516890(&local_420);
          vertices_flags = vertices_flags & 0xfffffff7;
          vertices_flags = vertices_flags | 4;
          local_410 = uVar17;
          local_40c = iVar8;
          local_408 = uVar12 + uVar17;
          local_404 = iVar14;
          set_indexed_value_from_system_palette(DAT_0089c6f5);
          FUN_00516890(&local_410);
          vertices_flags = vertices_flags & 0xfffffffb;
          if (iVar18 < iVar16) {
            iVar15 = (int)local_400[iVar18] * 8 + hfx_0_addr;
          }
          else {
            iVar15 = hfx_0_addr + 0x2018;
          }
          iVar18 = iVar18 + 1;
          add_polygon_rect_sprite((int)(uVar12 - *(ushort *)(iVar15 + 4)) / 2 + uVar17);
          uVar17 = uVar17 + iVar6;
        } while (iVar18 < (char)game_state._858459_1_);
      }
    }
    if ((bVar20) && (DAT_00897989 != '\0')) {
      iVar8 = (int)DAT_008926f3;
      iVar6 = get_wchar_str_pixel_len();
      iVar11 = iVar11 + (iVar8 - iVar6) / 2;
      iVar7 = iVar7 + (int)(short)((int)((int)DAT_00892707 + ((int)DAT_00892707 >> 0x1f & 3U)) >> 2)
                      + (int)DAT_008926f5;
      if (screen_height < iVar7) {
        iVar7 = ((int)screen_height - (int)DAT_00892707) + -2;
      }
      iVar6 = get_font_type();
      if (iVar6 != 0) {
        render_text_unicode_2(iVar11,iVar7);
        return;
      }
      local_400[0] = &stack0xfffffba0;
      set_indexed_value_from_system_palette(palette_index_1);
      render_text_unicode(iVar11,iVar7,DAT_00972f90);
    }
  }
  return;
}
