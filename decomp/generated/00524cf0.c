/* Ghidra 12.1.3 pseudocode; entry 00524cf0; render_land_ui_animted_sprites.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void render_land_ui_animted_sprites(void)

{
  unit_struct *puVar1;
  bool bVar2;
  bool bVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  int iVar7;
  int iVar8;
  char cVar9;
  int iVar10;
  unit_struct *puVar11;
  uint uVar12;
  uint uVar13;
  bool bVar14;
  int iVar15;
  uint local_5c;
  int local_50;
  uint local_40 [16];

  iVar8 = screen_coord_3_y;
  iVar7 = screen_coord_3_x;
  uVar13 = 0;
  bVar14 = false;
  bVar6 = false;
  bVar4 = false;
  local_50 = 0;
  bVar5 = false;
  bVar3 = true;
  if (sprite_animation_counter < DAT_00d05310) {
    DAT_00d05310 = sprite_animation_counter;
  }
  if (((((game_state._4_4_ & 0x20) == 0) || ((minimap_state_and_cache._2_1_ & 1) == 0)) ||
      ((DAT_0089c6e7 != '\0' && (DAT_0089c6e7 != '\r')))) ||
     (bVar2 = true, (DAT_0098e908._1_1_ & 8) == 0)) {
    bVar2 = false;
  }
  if ((level_flags_1 & 0x10080000) == 0) {
    if (!bVar2) {
      switch(DAT_0089c6e7) {
      case '\a':
      case '\t':
      case '\f':
      case '\r':
      case '\x10':
      case '\x11':
        goto code_r0x00524db5;
      default:
        return;
      }
    }
  }
  else if (!bVar2) {
    return;
  }
  cVar9 = FUN_004c2830();
  if (cVar9 != '\0') {
    return;
  }
  add_polygon_rect_sprite(iVar7);
  return;
code_r0x00524db5:
  switch(DAT_0089c6e7) {
  case '\a':
    uVar13 = (uint)*(ushort *)
                    &unit_type_array_building[*(short *)(&DAT_005a8858 + DAT_00895de0 * 0x12)].
                     field_0x10;
    if (((land_flags_1._2_1_ & 0x20) != 0) || ((globe_update_flags & 1) == 0)) {
      bVar14 = true;
    }
    local_50 = 0xd;
    break;
  case '\t':
    bVar4 = true;
    break;
  case '\f':
  case '\x10':
    bVar5 = true;
    bVar4 = true;
    uVar12 = (uint)*(byte *)((int)&DAT_00895ea0 + (uint)DAT_00895e9d);
    if (uVar12 == 0) {
      bVar3 = false;
    }
    else {
      bVar14 = DAT_00895e9b == '\0';
      uVar13 = (uint)*(ushort *)(&DAT_005a7dbd + uVar12 * 0x16);
      if (uVar12 == 7) {
        puVar11 = (unit_struct *)0x0;
        if (((unit_index_1 != 0) &&
            (puVar1 = unit_land_array[unit_index_1], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
           (puVar1->unit_class != '\0')) {
          puVar11 = puVar1;
        }
        if (((puVar11 != (unit_struct *)0x0) && (puVar11->unit_class == '\x05')) &&
           (puVar11->unit_type == '\v')) {
LAB_00524f49:
          uVar13 = uVar13 + 1;
        }
      }
      else if (uVar12 == 0x16) {
        puVar11 = (unit_struct *)0x0;
        if (((unit_index_2 != 0) &&
            (puVar1 = unit_land_array[unit_index_2], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
           (puVar1->unit_class != '\0')) {
          puVar11 = puVar1;
        }
        if (puVar11 == (unit_struct *)0x0) {
          for (puVar11 = unit_land_array
                         [(short)(&game_state.level_data[0].unit_index)
                                 [((_minimap_centre_x & 0xfe) * 2 | _minimap_centre_x & 0xfe00) * 2]
                         ]; puVar11 != (unit_struct *)0x0;
              puVar11 = unit_land_array[puVar11->next_unit_index]) {
            if ((puVar11->unit_class == '\x04') && (puVar11->unit_type == '\x01'))
            goto LAB_00524f49;
          }
        }
        else if ((puVar11->unit_class == '\x04') && (puVar11->unit_type == '\x01'))
        goto LAB_00524f49;
      }
      iVar10 = uVar13 * 4;
      if ((char)(&DAT_005add62)[iVar10] <= DAT_005ddcc4) {
        DAT_005ddcc4 = '\0';
        DAT_005ddcc8 = '\x01';
      }
      uVar13 = (int)DAT_005ddcc4 + (int)*(short *)(&DAT_005add60 + iVar10);
      if ((!bVar14) &&
         (local_5c = (sprite_animation_counter - DAT_00d05310) * 0x100,
         (uint)((maybe_framerate << 8) / 0xc) < local_5c)) {
        DAT_00d05310 = sprite_animation_counter;
        if ((&DAT_005add63)[iVar10] == '\x01') {
          DAT_005ddcc4 = DAT_005ddcc4 + DAT_005ddcc8;
          if (DAT_005ddcc8 < '\x01') {
            if (DAT_005ddcc4 < '\0') {
              DAT_005ddcc4 = DAT_005ddcc4 + '\x02';
              DAT_005ddcc8 = '\x01';
            }
          }
          else if ((char)(&DAT_005add62)[iVar10] <= DAT_005ddcc4) {
            DAT_005ddcc4 = DAT_005ddcc4 + -2;
            DAT_005ddcc8 = -1;
          }
        }
        else {
          DAT_005ddcc4 = DAT_005ddcc4 + '\x01';
          if ((char)(&DAT_005add62)[iVar10] <= DAT_005ddcc4) {
            DAT_005ddcc4 = '\0';
          }
        }
      }
      local_50 = (int)(char)(&DAT_005a7dc8)[uVar12 * 0x16];
    }
    goto LAB_005250f4;
  case '\r':
    if ((DAT_0089ce81 == '\0') ||
       (((game_state._4_4_ & 0x20) != 0 && ((DAT_0098e908._1_1_ & 8) != 0)))) {
      bVar3 = false;
    }
    else {
      iVar10 = DAT_0089ce81 * 0x3e;
      uVar13 = (uint)*(short *)(&DAT_005a80dc + iVar10);
      if (((globe_update_flags & 1) == 0) ||
         (iVar10 = FUN_004c24f0(CONCAT31((int3)((uint)iVar10 >> 8),player_tribe_num),1,
                                (int)DAT_0089ce81), iVar10 < 0)) {
        bVar6 = true;
      }
      iVar10 = FUN_004c28a0();
      if (iVar10 != 3) {
        bVar6 = true;
      }
    }
  }
  uVar12 = local_40[0];
LAB_005250f4:
  bVar2 = true;
  if ((((0 < (int)uVar12) && (iVar10 = FUN_0044b060(), iVar10 != 0)) && (uVar12 != 0x10)) &&
     (uVar12 != 0x22)) {
    bVar2 = false;
  }
  iVar10 = 0;
  if (!bVar3) {
    return;
  }
  uVar12 = local_40[0];
  if (bVar4) {
    if (*(int *)&game_state.tribes_array[player_tribe_num].field_0x931 == 0) {
      bVar3 = false;
    }
    if (bVar3) {
      local_5c = 0xfffffffe;
      _swprintf((wchar_t *)local_40,u__d_0059994c);
      iVar10 = get_font_type();
      if (iVar10 != 0) {
        convert_font_symbols_str();
      }
      iVar10 = get_wchar_str_pixel_len();
      iVar10 = iVar10 + 0xc;
      uVar12 = 0xf;
    }
  }
  if (uVar13 != 0) {
    if (bVar14) {
      if (bVar5) {
        add_polygon_rect_sprite(iVar10 + iVar7);
        if (!bVar2) goto LAB_0052532a;
        local_50 = iVar10 + iVar7 + local_50;
      }
      else {
        add_polygon_rect_sprite(iVar7);
        if (!bVar2) goto LAB_0052532a;
        local_50 = local_50 + iVar7;
      }
    }
    else {
      iVar15 = iVar7;
      if (bVar5) {
        iVar15 = iVar10 + iVar7;
      }
      add_polygon_rect_sprite(iVar15);
      if ((((!bVar2) || (!bVar6)) ||
          ((add_polygon_rect_sprite((uint)(byte)(&DAT_005a810c)[DAT_0089ce81 * 0x3e] + iVar7),
           (game_state._4_4_ & 0x20) != 0 ||
           (((globe_update_flags & 1) == 0 || (DAT_0089c6e7 != '\r')))))) ||
         (iVar10 = FUN_004c24f0(player_tribe_num,1,(int)DAT_0089ce81), iVar10 != -2))
      goto LAB_0052532a;
      local_50 = iVar7 + 0x1f;
    }
    add_polygon_rect_sprite(local_50);
  }
LAB_0052532a:
  if ((!bVar4) || (!bVar3)) {
    return;
  }
  iVar10 = get_font_type();
  if (iVar10 == 0) {
    set_font_render_default();
  }
  else {
    set_font_sprite_size();
  }
  iVar10 = get_font_type();
  if (iVar10 != 0) {
    palette_index_1 = DAT_0089c6f6;
  }
  iVar10 = get_font_type();
  if (iVar10 != 0) {
    render_text_unicode_2((short)uVar12 + (short)iVar7,(short)local_5c + (short)iVar8);
    return;
  }
  set_indexed_value_from_system_palette(palette_index_1);
  render_text_unicode(uVar12 + iVar7,local_5c + iVar8,local_40);
  return;
}
