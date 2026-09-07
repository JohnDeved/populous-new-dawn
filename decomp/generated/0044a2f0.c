/* Ghidra 12.1.3 pseudocode; entry 0044a2f0; render_land_ui_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void render_land_ui_1(void)

{
  undefined4 *puVar1;
  undefined2 uVar2;
  ushort uVar3;
  ushort uVar4;
  undefined2 uVar5;
  unit_struct *puVar6;
  undefined2 uVar7;
  bool bVar8;
  texture_mem_struct *ptVar9;
  short sVar10;
  int iVar11;
  short *psVar12;
  int iVar13;
  unit_struct *puVar14;
  uint uVar15;
  int iVar16;
  uint uVar17;
  uint uVar18;
  undefined2 *puVar19;
  int iVar20;
  undefined2 *puVar21;
  wchar_t *pwVar22;
  size_t _Count;
  int *piVar23;
  ushort local_31a;
  ushort local_318;
  ushort uStack_316;
  undefined2 local_314;
  int local_310;
  uint local_30c;
  uint local_308;
  int local_304;
  undefined4 local_300;
  int iStack_2fc;
  int local_2f8;
  uint local_2e8;
  int local_2cc [115];
  undefined1 local_100 [256];

  sVar10 = 0x3a;
  iVar11 = get_font_type();
  if (iVar11 != 0) {
    sVar10 = FUN_00453920();
  }
  if (DAT_00684218 == 0) {
    DAT_0068b69d = 0;
    return;
  }
  if (DAT_0068b69d == 0) {
    DAT_0068b69d = 0;
    return;
  }
  iVar11 = FUN_00451370();
  if (iVar11 != 0) {
    DAT_0068b69d = 0;
    return;
  }
  if (((byte)level_flags_1 & 0x20) != 0) {
    DAT_0068b69d = 0;
    return;
  }
  if (DAT_0068b6a1 == 0) {
    DAT_0068b69d = 0;
    return;
  }
  bVar8 = true;
  local_30c = (uint)screen_width;
  local_308 = (uint)screen_height;
  palette_index_1 = 0x50;
  iVar11 = get_font_type();
  if (iVar11 == 0) {
    set_font_render_default();
  }
  else {
    set_font_sprite_size();
  }
  iVar11 = get_level_flag_0x40000();
  if (iVar11 == 0) {
    iVar11 = CONCAT22(local_300._2_2_,(wchar_t)local_300);
  }
  else {
    iVar11 = 0;
    if (DAT_0068b6a1 != sVar10) {
      psVar12 = &DAT_0068b6a1;
      do {
        if (*psVar12 == 0) break;
        psVar12 = psVar12 + 1;
        iVar11 = iVar11 + 1;
      } while (*psVar12 != sVar10);
    }
    iVar20 = 7 - iVar11;
    iVar13 = wstr_len();
    iVar16 = iVar13 + 6;
    local_300._0_2_ = L' ';
    if (font_type == 9) {
      local_300._0_2_ = L'ꅀ';
    }
    else if (font_type == 10) {
      local_300._0_2_ = L'ꆡ';
    }
    else if (font_type == 0xb) {
      local_300._0_2_ = L'腀';
    }
    if (0 < iVar20) {
      if (6 < iVar16) {
        puVar19 = &DAT_0068b6a1 + iVar16;
        puVar21 = &DAT_0068b6a1 + (iVar16 - iVar20);
        iVar16 = iVar16 - iVar13;
        do {
          uVar2 = *puVar21;
          puVar21 = puVar21 + -1;
          *puVar19 = uVar2;
          puVar19 = puVar19 + -1;
        } while ((undefined2 *)((int)&DAT_0068b6ad + 1) < puVar19);
      }
      if (iVar11 <= iVar16) {
        pwVar22 = &DAT_0068b6a1 + iVar16;
        for (iVar11 = (iVar16 - iVar11) + 1; iVar11 != 0; iVar11 = iVar11 + -1) {
          *pwVar22 = (wchar_t)local_300;
          pwVar22 = pwVar22 + -1;
        }
      }
      iVar11 = 6;
      iVar20 = iVar20 / 2;
      if (iVar20 < 7) {
        puVar21 = &DAT_0068b6ad + -iVar20;
        puVar19 = &DAT_0068b6ad;
        iVar20 = 7 - iVar20;
        iVar11 = 6 - iVar20;
        do {
          uVar2 = *puVar21;
          puVar21 = puVar21 + -1;
          *puVar19 = uVar2;
          puVar19 = puVar19 + -1;
          iVar20 = iVar20 + -1;
        } while (iVar20 != 0);
      }
      if (-1 < iVar11) {
        pwVar22 = &DAT_0068b6a1 + iVar11;
        for (iVar16 = iVar11 + 1; iVar16 != 0; iVar16 = iVar16 + -1) {
          *pwVar22 = (wchar_t)local_300;
          pwVar22 = pwVar22 + -1;
        }
      }
    }
    _Count = 0;
    _swprintf((wchar_t *)&local_300,(wchar_t *)&DAT_0059cd88);
    if (font_type == 9) {
      local_300._0_2_ = L'ꅀ';
    }
    else if (font_type == 10) {
      local_300._0_2_ = L'ꆡ';
    }
    else if (font_type == 0xb) {
      local_300._0_2_ = L'腀';
    }
    if (DAT_0068b6a1 != sVar10) {
      psVar12 = &DAT_0068b6a1;
      do {
        if (*psVar12 == 0) break;
        psVar12 = psVar12 + 1;
        _Count = _Count + 1;
      } while (*psVar12 != sVar10);
    }
    if ((int)_Count < 0x101) {
      _wcsncpy((wchar_t *)&local_300,&DAT_0068b6a1,_Count);
      *(undefined2 *)((int)&local_300 + _Count * 2) = 0;
      iVar11 = get_wchar_str_pixel_len();
    }
    else {
      iVar11 = 0;
    }
  }
  iVar16 = get_wchar_str_pixel_len();
  iVar13 = get_font_type();
  if (iVar13 == 0) {
    local_310 = get_font_sprite_width_render_2();
  }
  else {
    local_310 = get_font_sprite_size();
  }
  iVar13 = get_font_type();
  if (iVar13 != 0) {
    local_310 = local_310 + 1;
  }
  iVar13 = get_level_flag_0x40000();
  if (iVar13 == 0) {
    iVar11 = (int)(local_30c * 2) / 5 + -10;
    local_318 = (ushort)((int)local_30c >> 3);
    uStack_316 = (ushort)((int)local_30c >> 0x13);
    iVar13 = iVar16 / 2;
    if (iVar11 < iVar16 / 2) {
      iVar13 = iVar11;
    }
    iVar13 = iVar13 + -0x3c;
    if (iVar13 < CONCAT22(uStack_316,local_318)) {
      iVar13 = CONCAT22(uStack_316,local_318);
    }
    piVar23 = &local_300;
    do {
      iVar11 = iVar13;
      puVar19 = &DAT_0068b6a1;
      *piVar23 = 0;
      do {
        puVar19 = (undefined2 *)FUN_0045ec10(&DAT_0068b6a1,puVar19,iVar11);
        iVar16 = get_wchar_str_pixel_len();
        iVar16 = iVar11 - iVar16;
        if (iVar16 < 0) {
          iVar16 = 100;
        }
        *piVar23 = *piVar23 + iVar16;
      } while (puVar19 != (undefined2 *)0x0);
      piVar23 = piVar23 + 1;
      iVar13 = iVar11 + 10;
    } while (piVar23 < local_2cc);
    iVar13 = 999999999;
    iVar16 = -1;
    iVar20 = 0;
    do {
      if ((int)(&local_300)[iVar20] < iVar13) {
        iVar16 = iVar20;
        iVar13 = (&local_300)[iVar20];
      }
      iVar20 = iVar20 + 1;
    } while (iVar20 < 0xd);
    if (iVar16 == -1) {
      iVar11 = iVar11 + -0x3c;
    }
    else {
      iVar11 = iVar11 + 10 + (iVar16 * 5 + -0x41) * 2;
    }
    if (iVar11 < CONCAT22(uStack_316,local_318)) {
      iVar11 = CONCAT22(uStack_316,local_318);
    }
    puVar19 = &DAT_0068b6a1;
    iVar16 = 0;
    do {
      iVar16 = iVar16 + 1;
      puVar19 = (undefined2 *)FUN_0045ec10(&DAT_0068b6a1,puVar19,iVar11);
    } while (puVar19 != (undefined2 *)0x0);
    local_304 = local_310;
    local_310 = iVar16 * local_310;
LAB_0044a74d:
    DAT_0068c6b7 = 0;
    iVar13 = DAT_0068c6b7;
  }
  else {
    iVar13 = DAT_0068c6b7;
    if (iVar11 < iVar16) {
      if (DAT_0068c6b3 < 1) {
        iVar13 = iVar11;
        if ((-iVar16 < DAT_0068c6b7) &&
           (iVar13 = DAT_0068c6b7,
           (uint)((maybe_framerate << 8) / 0xc) <
           (uint)((sprite_animation_counter - _DAT_00684200) * 0x100))) {
          DAT_0068c6b7 = DAT_0068c6b7 + -5;
          _DAT_00684200 = sprite_animation_counter;
          iVar13 = DAT_0068c6b7;
        }
      }
      else {
        DAT_0068c6b3 = DAT_0068c6b3 + -1;
        if (DAT_0068c6b3 == 0) {
          _DAT_00684200 = sprite_animation_counter;
          goto LAB_0044a74d;
        }
      }
    }
  }
  DAT_0068c6b7 = iVar13;
  if ((DAT_0068c6c0 & 0xc) == 0) {
    uVar17 = DAT_0068420c + 0x14;
    uVar15 = (DAT_00684208 - iVar11 / 2) + 8;
  }
  else {
    iVar16 = 0;
    uVar3 = tribe_ptr->x;
    uVar4 = tribe_ptr->y;
    puVar14 = (unit_struct *)0x0;
    if ((DAT_0068c6c0 & 4) == 0) {
      local_31a = DAT_0068c6bb & 0xfefe;
      local_318 = ((DAT_0068c6bb & 0xfe) + 1) * 0x100;
      uStack_316 = ((local_31a >> 8) + 1) * 0x100;
      local_314 = calc_point_height();
    }
    else {
      if (((DAT_0068c6bb != 0) &&
          (puVar6 = unit_land_array[DAT_0068c6bb], (*(byte *)&puVar6->flags_2 & 1) == 0)) &&
         (puVar6->unit_class != '\0')) {
        puVar14 = puVar6;
      }
      if (puVar14 == (unit_struct *)0x0) {
        bVar8 = false;
      }
      else {
        uVar5 = (puVar14->pos).x;
        uVar7 = (puVar14->pos).y;
        iVar16 = 0x200;
        local_314 = (puVar14->pos).z;
        local_318 = uVar5;
        uStack_316 = uVar7;
        if (puVar14->unit_class == '\x01') {
          iVar16 = 0x80;
        }
      }
    }
    if (bVar8) {
      move_pos_angle_length(&local_318);
      local_2e8 = 0;
      uVar17 = (uint)local_318 - (uint)uVar3;
      uVar15 = uVar17;
      if ((int)uVar17 < 0) {
        uVar15 = -uVar17;
      }
      uVar18 = uVar17;
      if (((uVar15 & 0x8000) != 0) && (uVar18 = uVar15 - 0x10000, (int)uVar17 < 1)) {
        uVar18 = 0x10000 - uVar15;
      }
      local_300._0_2_ = (wchar_t)((int)uVar18 >> 1);
      local_300._2_2_ = (short)((int)uVar18 >> 0x11);
      uVar17 = (uint)uStack_316 - (uint)uVar4;
      uVar15 = uVar17;
      if ((int)uVar17 < 0) {
        uVar15 = -uVar17;
      }
      uVar18 = uVar17;
      if (((uVar15 & 0x8000) != 0) && (uVar18 = uVar15 - 0x10000, (int)uVar17 < 1)) {
        uVar18 = 0x10000 - uVar15;
      }
      local_2f8 = (int)uVar18 >> 1;
      sVar10 = calc_point_height();
      iStack_2fc = sVar10 + iVar16;
      coord_global_convert();
      if ((local_2e8 & 0x1e) == 0) {
        uStack_316 = (short)minimap_interpolation_adj_1 >> 0xf;
        local_318 = minimap_interpolation_adj_1;
        uVar15 = __ftol();
        local_318 = minimap_interpolation_adj_2;
        uStack_316 = (short)minimap_interpolation_adj_2 >> 0xf;
        uVar17 = __ftol();
        goto LAB_0044a985;
      }
      bVar8 = false;
    }
    uVar15 = CONCAT22(local_300._2_2_,(wchar_t)local_300);
    uVar17 = CONCAT22(local_300._2_2_,(wchar_t)local_300);
  }
LAB_0044a985:
  if (bVar8) {
    if ((int)uVar15 < 0) {
      uVar15 = 0;
    }
    if ((int)local_30c < (int)uVar15) {
      uVar15 = local_30c;
    }
    if ((int)uVar17 < 0) {
      uVar17 = 0;
    }
    if ((int)local_308 < (int)uVar17) {
      uVar17 = local_308;
    }
    if ((int)local_30c <= (int)(iVar11 + uVar15)) {
      uVar15 = local_30c - iVar11;
    }
    if ((int)local_308 <= (int)(local_310 + uVar17)) {
      uVar17 = local_308 - local_310;
    }
    if (DAT_0068b6a1 != 0) {
      draw_ingame_window(uVar15,uVar17,iVar11);
      ptVar9 = texture_mem_start;
      puVar1 = &texture_mem_start->vertex_shift_x;
      *puVar1 = (float)uVar15;
      local_300._0_2_ = (wchar_t)uVar17;
      local_300._2_2_ = (short)(uVar17 >> 0x10);
      iStack_2fc = 0;
      vertex_shift_y = (float)uVar17;
      ptVar9->vertex_shift_y = vertex_shift_y;
      ptVar9 = texture_mem_start;
      vertex_shift_x = *puVar1;
      texture_mem_start->s7 = 0;
      ptVar9->s8 = 0;
      ptVar9->s9 = iVar11;
      ptVar9->s10 = local_310;
      iVar16 = get_level_flag_0x40000();
      if (iVar16 == 0) {
        puVar19 = &DAT_0068b6a1;
        iVar16 = 0;
        do {
          puVar19 = (undefined2 *)FUN_0045ec10(&DAT_0068b6a1,puVar19,iVar11);
          iVar13 = get_wchar_str_pixel_len();
          iVar20 = get_font_type();
          if (iVar20 == 0) {
            local_300 = &stack0xfffffccc;
            set_indexed_value_from_system_palette(palette_index_1);
            render_text_unicode((iVar11 - iVar13 >> 1) + DAT_0068c6b7,iVar16,local_100);
          }
          else {
            render_text_unicode_2
                      (CONCAT22((short)(iVar11 - iVar13 >> 0x11),
                                (short)(iVar11 - iVar13 >> 1) + (short)DAT_0068c6b7),iVar16);
          }
          iVar16 = iVar16 + local_304;
        } while (puVar19 != (undefined2 *)0x0);
      }
      else {
        iVar11 = get_font_type();
        if (iVar11 == 0) {
          local_300 = &stack0xfffffccc;
          set_indexed_value_from_system_palette(palette_index_1);
          render_text_unicode(DAT_0068c6b7,0,&DAT_0068b6a1);
        }
        else {
          render_text_unicode_2(DAT_0068c6b7,0);
        }
      }
      ptVar9 = texture_mem_start;
      puVar1 = &texture_mem_start->vertex_shift_x;
      *puVar1 = 0;
      ptVar9->vertex_shift_y = 0;
      ptVar9 = texture_mem_start;
      vertex_shift_x = *puVar1;
      iVar11 = (int)screen_height;
      iVar16 = (int)screen_width;
      vertex_shift_y = 0.0;
      texture_mem_start->s7 = 0;
      ptVar9->s8 = 0;
      ptVar9->s9 = iVar16;
      ptVar9->s10 = iVar11;
    }
  }
  DAT_0068b69d = 0;
  return;
}
