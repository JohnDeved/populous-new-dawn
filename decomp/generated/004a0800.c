/* Ghidra 12.1.3 pseudocode; entry 004a0800; FUN_004a0800.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a0800(int param_1)

{
  undefined1 *puVar1;
  undefined1 uVar2;
  int iVar3;
  int iVar4;
  byte bVar5;
  short *psVar6;
  int iVar7;
  int iVar8;
  uint uVar9;
  wchar_t *_Format;
  undefined1 *puStack_240;
  int iStack_23c;
  int iStack_238;
  int iStack_234;
  undefined1 *puStack_230;
  int iStack_22c;
  int iStack_228;
  int iStack_224;
  undefined1 *puStack_220;
  int iStack_21c;
  int iStack_218;
  int iStack_214;
  undefined1 *puStack_210;
  int iStack_20c;
  int iStack_208;
  int iStack_204;
  wchar_t awStack_200 [256];

  iStack_234 = 0;
  iStack_238 = 0;
  iStack_23c = 0;
  puStack_240 = (undefined1 *)0x0;
  iStack_214 = 0;
  iStack_218 = 0;
  iStack_21c = 0;
  puStack_220 = (undefined1 *)0x0;
  if (*(int *)(param_1 + 0x10) != 0) {
    puStack_210 = (undefined1 *)parameterize_by_screen_width();
    iStack_20c = parameterize_by_screen_height();
    iStack_208 = parameterize_by_screen_width();
    iStack_204 = parameterize_by_screen_height();
    FUN_004a1dd0(param_1,&DAT_005caba8);
    iVar3 = (int)player_tribe_num;
    if ((game_state.tribes_array[iVar3].field_0x93d & 0x80) == 0) {
      iVar7 = 0;
      psVar6 = (short *)((int)game_state.tribes_array[iVar3].field1414_0x969 + 0xc2);
      iVar3 = 5;
      do {
        iVar7 = iVar7 + *psVar6;
        psVar6 = psVar6 + 1;
        iVar3 = iVar3 + -1;
      } while (iVar3 != 0);
    }
    else {
      iVar7 = 0;
      psVar6 = (short *)&game_state.tribes_array[iVar3].field_0xa3d;
      iVar3 = 5;
      do {
        iVar7 = iVar7 + *psVar6;
        psVar6 = psVar6 + 1;
        iVar3 = iVar3 + -1;
      } while (iVar3 != 0);
    }
    iVar3 = get_font_type();
    if (iVar3 == 0) {
      set_font_render_default();
    }
    else {
      set_font_sprite_size();
    }
    if (iVar7 < 100) {
      _Format = u__02d_005cd2c8;
    }
    else {
      _Format = u__03d_005cd2d4;
    }
    _swprintf(awStack_200,_Format);
    iVar7 = iStack_204;
    puStack_230 = puStack_210;
    palette_index_1 = 0;
    iStack_22c = iStack_20c;
    iStack_228 = iStack_208;
    iVar8 = iStack_204 + -10;
    iStack_224 = iStack_204;
    iVar4 = get_font_type();
    iVar3 = iStack_228;
    puVar1 = puStack_230;
    if (iVar4 == 0) {
      iVar7 = get_wchar_str_pixel_len();
      iVar4 = get_font_type();
      if (iVar4 == 0) {
        puStack_230 = &stack0xfffffdac;
        set_indexed_value_from_system_palette(palette_index_1);
        render_text_unicode((int)(short)(puVar1 + ((iVar3 - iVar7) - (int)puVar1) / 2),iVar8,
                            awStack_200);
      }
      else {
        render_text_unicode_2(puVar1 + ((iVar3 - iVar7) - (int)puVar1) / 2,iVar8);
      }
    }
    else {
      iVar4 = FUN_00452490();
      uVar9 = (iVar3 - iVar4) - (int)puVar1;
      FUN_00452610(CONCAT22((ushort)(uVar9 >> 0x11),(short)(uVar9 >> 1) + (short)puVar1),iVar7 + -9)
      ;
    }
    DAT_005cae94 = func_0x0041b330();
    DAT_005cae98 = func_0x0041b380();
    iStack_23c = iStack_20c + 4;
    puStack_240 = puStack_210 + 4;
    iStack_238 = iStack_208 + -4;
    iStack_234 = iVar8;
    draw_hfx_ingame_window();
    uVar2 = DAT_0089c6f7;
    bVar5 = 2;
    if ((screen_width < 0x280) && (screen_height < 0x1e0)) {
      bVar5 = 1;
    }
    uVar9 = (uint)bVar5;
    iStack_23c = iStack_23c + uVar9;
    iStack_234 = iStack_234 - uVar9;
    puStack_240 = puStack_240 + uVar9;
    iStack_238 = iStack_238 - uVar9;
    if (DAT_005cae98 < DAT_005cae94) {
      puStack_230 = &stack0xfffffdac;
      set_indexed_value_from_system_palette(global_palette_indexes);
      FUN_00516890(&puStack_240);
      puStack_220 = puStack_240;
      iStack_218 = iStack_238;
      iStack_214 = iStack_234;
      iStack_21c = iStack_234 + ((iStack_23c - iStack_234) * DAT_005cae98) / DAT_005cae94;
      if (iStack_21c == iStack_234) {
        iStack_21c = iStack_21c + -1;
      }
      puStack_230 = &stack0xfffffdac;
      FUN_004525d0(uVar2);
      FUN_00516890(&puStack_220);
      return;
    }
    uVar2 = DAT_0089c6f6;
    if ((((sprite_animation_counter._1_1_ & 1) != 0) &&
        (((byte)sprite_animation_counter & 0x20) != 0)) &&
       (((byte)sprite_animation_counter & 4) != 0)) {
      uVar2 = DAT_0089c6f7;
    }
    puStack_230 = &stack0xfffffdac;
    FUN_004525d0(uVar2);
    FUN_00516890(&puStack_240);
  }
  return;
}
