/* Ghidra 12.1.3 pseudocode; entry 0049daf0; FUN_0049daf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0049daf0(int param_1)

{
  short sVar1;
  ushort uVar2;
  bool bVar3;
  bool bVar4;
  char cVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  int *piVar11;
  int iVar12;
  uint uVar13;
  int iVar14;
  undefined1 *puVar15;
  int iVar16;
  int iVar17;
  int iVar18;
  uint uVar19;
  int iVar20;
  undefined *puVar21;
  uint local_b8;
  int local_b4;
  int local_b0;
  int local_a8;
  uint local_8c;
  char *local_70;
  undefined1 *local_6c;
  int local_40;
  int local_3c;
  int local_38;
  int local_34;
  int local_30;
  int local_2c;
  int local_28;
  int local_24;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;

  local_b8 = FUN_004c2fe0();
  local_b8 = local_b8 & 0xff;
  local_24 = 0;
  local_28 = 0;
  local_2c = 0;
  local_30 = 0;
  if (DAT_0098db08 != 0) {
    local_b8 = (uint)DAT_0098db08;
  }
  if (*(int *)(param_1 + 0x10) == 0) {
    return;
  }
  iVar6 = parameterize_by_screen_width();
  iVar7 = parameterize_by_screen_height();
  iVar8 = parameterize_by_screen_width();
  iVar9 = parameterize_by_screen_height();
  if (DAT_005cd2a0 != '\0') {
    uVar13 = (uint)*(ushort *)(hfx_0_addr + 0x1bc);
    if (screen_width != 0x280) {
      if (DAT_005ca944 != screen_width) {
        DAT_005ca944 = screen_width;
        DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
      }
      uVar13 = (int)(uVar13 * DAT_005ca948) >> 0x10;
    }
    iVar17 = 1;
    local_a8 = 1;
    iVar10 = (iVar8 - iVar6) + -2;
    local_6c = &DAT_0098db10;
    local_8c = uVar13;
    do {
      iVar20 = local_a8 + -1;
      for (iVar14 = iVar20 * iVar17 + local_8c; (iVar10 < iVar14 && ((int)uVar13 < iVar14));
          iVar14 = iVar14 - iVar20) {
        iVar17 = iVar17 + -1;
      }
      iVar14 = (iVar10 - ((int)(iVar10 * 2 + (iVar10 * 2 >> 0x1f & 3U)) >> 2)) - iVar14;
      iVar16 = iVar17;
      if ((0 < iVar20) && (iVar20 * iVar17 < iVar14)) {
        iVar16 = iVar14 / iVar20;
      }
      if (6 < iVar16) {
        iVar16 = 6;
      }
      iVar20 = (int)((iVar10 - iVar20 * iVar16) - local_8c) / 2;
      puVar15 = local_6c;
      iVar14 = local_a8;
      if (0 < local_a8) {
        do {
          *puVar15 = (char)iVar20;
          iVar20 = iVar20 + uVar13 + iVar16;
          iVar14 = iVar14 + -1;
          puVar15 = puVar15 + 1;
        } while (iVar14 != 0);
      }
      local_8c = local_8c + uVar13;
      local_a8 = local_a8 + 1;
      local_6c = local_6c + 5;
    } while (local_a8 < 6);
    iVar17 = 0;
    do {
      (&DAT_0098db24)[iVar17] = (&DAT_0098db24)[iVar17] + '\x01';
      iVar17 = iVar17 + 1;
    } while (iVar17 < 5);
    piVar11 = (int *)FUN_0044be00();
    local_20 = *piVar11;
    local_1c = piVar11[1];
    local_18 = piVar11[2];
    local_14 = piVar11[3];
    iVar17 = ((int)((local_18 - local_20) + (local_18 - local_20 >> 0x1f & 0xfU)) >> 4) + 1;
    iVar10 = (local_14 - local_1c) * 4;
    _DAT_0098db3c = (int)(iVar10 + (iVar10 >> 0x1f & 0x1fU)) >> 5;
    if (_DAT_0098db3c < 4) {
      _DAT_0098db3c = 4;
    }
    if (8 < _DAT_0098db3c) {
      _DAT_0098db3c = 8;
    }
    _DAT_0098db30 = local_20 + iVar17;
    _DAT_0098db38 = (local_18 - iVar17) + -1;
    _DAT_0098db34 = 0;
    DAT_005cd2a0 = '\0';
  }
  if (*(int *)(param_1 + 8) == 0) {
    vertices_flags = vertices_flags | 8;
  }
  else {
    vertices_flags = vertices_flags & 0xfffffff7;
  }
  bVar3 = false;
  if (((((game_state._4_4_ & 0x20) == 0) &&
       ((game_state.array_56b_4[player_tribe_num].spells & 1 << ((byte)local_b8 & 0x1f)) == 0)) &&
      (*(char *)(param_1 + 0x5a) != '\x04')) &&
     ((*(int *)(param_1 + 0x4f) != 0 && (*(int *)(param_1 + 99) != 0)))) {
    bVar3 = true;
  }
  if (bVar3) {
    puVar21 = &DAT_005cad10;
  }
  else {
    puVar21 = &DAT_005cacc8;
  }
  FUN_004a1dd0(param_1,puVar21);
  if (*(int *)(param_1 + 0x4f) == 0) goto LAB_0049e5a5;
  if (*(char *)(param_1 + 0x5a) == '\x04') {
    vertices_flags = vertices_flags | 8;
    uVar19 = (uint)*(ushort *)(hfx_0_addr + 0x2106);
    uVar13 = (uint)*(ushort *)(hfx_0_addr + 0x2104);
    if (screen_width != 0x280) {
      if (DAT_005ca944 != screen_width) {
        DAT_005ca944 = screen_width;
        DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
      }
      uVar19 = (int)(uVar19 * DAT_005ca948) >> 0x10;
      uVar13 = (int)(uVar13 * DAT_005ca948) >> 0x10;
    }
    add_polygon_rect_sprite_2
              ((iVar8 + iVar6) / 2 - (int)uVar13 / 2,(iVar7 + iVar9) / 2 - (int)uVar19 / 2,
               hfx_0_addr + 0x2100);
    goto LAB_0049e5a5;
  }
  if ((*(int *)(param_1 + 0x18) == 0) && (*(int *)(param_1 + 0x1c) == 0)) {
    bVar4 = false;
  }
  else {
    bVar4 = true;
  }
  iVar17 = struct_56B_get_spell_array_val();
  if (*(int *)(param_1 + 8) == 0) {
LAB_0049df06:
    sVar1 = *(short *)(&DAT_005a80e2 + local_b8 * 0x3e);
LAB_0049df0d:
    local_b0 = sVar1 * 8 + hfx_0_addr;
  }
  else {
    if (bVar4) {
      sVar1 = *(short *)(&DAT_005a80e4 + local_b8 * 0x3e);
      goto LAB_0049df0d;
    }
    local_b0 = *(short *)(&DAT_005a80e0 + local_b8 * 0x3e) * 8 + hfx_0_addr;
    iVar10 = check_struct_56B_field_16();
    if ((iVar10 == 0) && (iVar17 == 0)) goto LAB_0049df06;
  }
  local_b4 = local_b8 * 0x3e;
  iVar17 = iVar9 - iVar7;
  iVar10 = (int)(iVar17 + (iVar17 >> 0x1f & 0xfU)) >> 4;
  uVar2 = *(ushort *)(hfx_0_addr + 0x1be);
  iVar7 = iVar7 + iVar10;
  uVar13 = game_state._4_4_ & 0x20;
  iVar14 = FUN_004c2d50();
  iVar20 = struct_56B_get_spell_array_val();
  iVar18 = 0;
  iVar16 = FUN_004c2ae0();
  local_70 = &DAT_0098db0b + iVar14 * 5;
  if (0 < iVar14) {
    do {
      if (iVar18 < iVar20) {
        iVar12 = 0x41;
        if (iVar16 <= iVar18) {
          iVar12 = (-(uint)(uVar13 == 0) & 0xfffffff5) + 0x41;
        }
      }
      else if (bVar3) {
        iVar12 = 0x43 - (uint)!bVar4;
      }
      else {
        iVar12 = (-(uint)!bVar4 & 0xfffffff3) + 0x44;
      }
      if ((screen_width != 0x280) && (DAT_005ca944 != screen_width)) {
        DAT_005ca944 = screen_width;
        DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
      }
      iVar18 = iVar18 + 1;
      add_polygon_rect_sprite_2(*local_70 + iVar6,iVar7,iVar12 * 8 + hfx_0_addr);
      local_70 = local_70 + 1;
    } while (iVar18 < iVar14);
  }
  iVar16 = ((int)((iVar8 - iVar6) + (iVar8 - iVar6 >> 0x1f & 0xfU)) >> 4) + 1;
  local_2c = (int)(iVar17 * 4 + (iVar17 * 4 >> 0x1f & 0x1fU)) >> 5;
  if (local_2c < 4) {
    local_2c = 4;
  }
  if (8 < local_2c) {
    local_2c = 8;
  }
  local_24 = (iVar9 - (iVar10 + 1)) + -1;
  local_2c = local_24 - local_2c;
  local_30 = iVar6 + iVar16;
  local_28 = (iVar8 - iVar16) + -1;
  uVar13 = (uint)*(ushort *)(local_b0 + 6);
  uVar19 = (uint)*(ushort *)(local_b0 + 4);
  if (screen_width != 0x280) {
    if (DAT_005ca944 != screen_width) {
      DAT_005ca944 = screen_width;
      DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
    }
    uVar13 = (int)(uVar13 * DAT_005ca948) >> 0x10;
    uVar19 = (int)(uVar19 * DAT_005ca948) >> 0x10;
  }
  add_polygon_rect_sprite_2
            ((iVar8 + iVar6) / 2 - (int)uVar19 / 2,
             (int)(local_2c + (uint)uVar2 + iVar7) / 2 - (int)uVar13 / 2,local_b0);
  cVar5 = FUN_004c2ca0();
  if ((((cVar5 != '\0') && ((game_state._4_4_ & 0x20) == 0)) &&
      ((game_state.array_56b_4[player_tribe_num].spells & 1 << ((byte)local_b8 & 0x1f)) != 0)) &&
     (((iVar6 = check_struct_56B_field_16(), iVar6 != 0 &&
       (iVar6 = 0, *(int *)(param_1 + 0x18) == 0)) && (*(int *)(param_1 + 0x1c) == 0)))) {
    iVar8 = *(int *)((int)&DAT_005a80d4 + local_b4);
    iVar10 = (int)player_tribe_num;
    local_34 = 0;
    local_38 = 0;
    local_3c = 0;
    local_40 = 0;
    iVar9 = *(int *)(iVar10 * 0xc65 + 0x89db31 + local_b8 * 4);
    iVar16 = (local_28 - local_30) + -2;
    draw_hfx_ingame_window();
    local_3c = local_2c + 1;
    local_34 = local_24 + -1;
    local_40 = local_30 + 1;
    iVar17 = iVar8 / iVar16;
    iVar7 = iVar8 / iVar16;
    while (iVar18 = iVar17, iVar16 < iVar18) {
      iVar6 = iVar6 + 1;
      iVar7 = iVar18;
      iVar17 = iVar18 / iVar16;
    }
    iVar6 = 0xf0 - iVar6;
    local_38 = local_28;
    for (; iVar7 < iVar8; iVar7 = iVar16 * iVar7) {
      if (0xef < iVar6) {
        iVar6 = 0xef;
      }
      local_38 = ((iVar9 % iVar7) * iVar16) / iVar7;
      if (iVar16 < local_38) {
        local_38 = iVar16;
      }
      local_38 = local_40 + local_38;
      FUN_004525d0(iVar6);
      FUN_00516890(&local_40);
      iVar6 = iVar6 + 1;
    }
    if (((iVar20 < iVar14) && (*(int *)&game_state.tribes_array[iVar10].field_0x951 != 0)) &&
       ((*(short *)(game_state.tribes_array[iVar10].field1414_0x969 + 0x27) == 0 &&
        (uVar19 = pseudo_random * 0x24a1 + 0x24df, uVar13 = uVar19 >> 0xd,
        pseudo_random = uVar13 | uVar19 * 0x80000, ((byte)uVar13 & 7) == 1)))) {
      uVar19 = pseudo_random * 0x24a1 + 0x24df;
      uVar13 = uVar19 >> 0xd;
      pseudo_random = uVar13 | uVar19 * 0x80000;
      iVar6 = local_38 - (uint)(*(ushort *)(hfx_0_addr + (uVar13 & 3) * 8 + 0x28a4) >> 1);
      vertices_flags = vertices_flags | 8;
      set_vertex_palette_color();
      add_polygon_rect_sprite(iVar6);
      set_vertex_palette_color();
      vertices_flags = vertices_flags & 0xfffffff7;
    }
    local_38 = iVar16;
    if (0 < iVar8) {
      local_38 = (iVar16 * iVar9) / iVar8;
    }
    if (iVar16 < local_38) {
      local_38 = iVar16;
    }
    local_38 = local_40 + local_38;
    set_indexed_value_from_system_palette
              (CONCAT31(player_tribe_num >> 7,global_palette_indexes_2[player_tribe_num * 5 + 4]));
    FUN_00516890(&local_40);
  }
LAB_0049e5a5:
  vertices_flags = vertices_flags & 0xfffffff7;
  return;
}
