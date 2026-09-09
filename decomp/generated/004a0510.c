/* Ghidra 12.1.3 pseudocode; entry 004a0510; FUN_004a0510.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a0510(int param_1)

{
  short sVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  uint uVar7;
  int iVar8;
  uint uVar9;
  wchar_t *_Format;
  wchar_t awStack_200 [256];

  if (*(int *)(param_1 + 0x10) != 0) {
    iVar2 = parameterize_by_screen_width();
    iVar3 = parameterize_by_screen_height();
    iVar4 = parameterize_by_screen_width();
    iVar5 = parameterize_by_screen_height();
    if (*(int *)(param_1 + 8) == 0) {
      vertices_flags = vertices_flags | 8;
    }
    else {
      vertices_flags = vertices_flags & 0xfffffff7;
    }
    FUN_004a1dd0(param_1,&DAT_005caba8);
    if ((*(int *)(param_1 + 8) != 0) && (*(int *)(param_1 + 0x4f) != 0)) {
      if ((*(int *)(param_1 + 0x18) != 0) || (iVar6 = 0, *(int *)(param_1 + 0x1c) != 0)) {
        iVar6 = 1;
      }
      iVar8 = (*(int *)(param_1 + 0x4f) + iVar6) * 8 + hfx_0_addr;
      iVar6 = player_tribe_num * 0xc65;
      if ((game_state.tribes_array[player_tribe_num].field_0x93d & 0x80) == 0) {
        sVar1 = *(short *)(iVar6 + 0x89dbef + *(int *)(param_1 + 99) * 2);
      }
      else {
        sVar1 = *(short *)(iVar6 + 0x89dc01 + *(int *)(param_1 + 99) * 2);
      }
      iVar6 = get_font_type();
      if (iVar6 == 0) {
        set_font_render_default();
      }
      else {
        set_font_sprite_size();
      }
      if (sVar1 < 100) {
        _Format = u__02d_005cd2c8;
      }
      else {
        _Format = u__03d_005cd2d4;
      }
      _swprintf(awStack_200,_Format);
      uVar9 = (uint)*(ushort *)(iVar8 + 4);
      uVar7 = (uint)*(ushort *)(iVar8 + 6);
      if (screen_width != 0x280) {
        if (DAT_005ca944 != screen_width) {
          DAT_005ca944 = screen_width;
          DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
        }
        uVar7 = (int)(uVar7 * DAT_005ca948) >> 0x10;
        uVar9 = (int)(uVar9 * DAT_005ca948) >> 0x10;
      }
      add_polygon_rect_sprite_2
                ((iVar4 + iVar2) / 2 - (int)uVar9 / 2,(iVar3 + iVar5) / 2 - (int)(uVar7 + 8) / 2,
                 iVar8);
      if (sVar1 != 0) {
        iVar5 = iVar5 + -10;
        palette_index_1 = 0;
        iVar3 = get_font_type();
        if (iVar3 == 0) {
          iVar3 = get_wchar_str_pixel_len();
          iVar2 = iVar2 + ((iVar4 - iVar3) - iVar2) / 2;
          iVar3 = get_font_type();
          if (iVar3 == 0) {
            set_indexed_value_from_system_palette(palette_index_1);
            render_text_unicode((int)(short)iVar2,iVar5,awStack_200);
          }
          else {
            render_text_unicode_2(iVar2,iVar5);
          }
        }
        else {
          iVar3 = FUN_00452490();
          uVar7 = (iVar4 - iVar3) - iVar2;
          FUN_00452610(CONCAT22((ushort)(uVar7 >> 0x11),(short)(uVar7 >> 1) + (short)iVar2),
                       CONCAT22((short)((uint)iVar5 >> 0x10),(short)iVar5 + 1));
        }
      }
    }
    vertices_flags = vertices_flags & 0xfffffff7;
  }
  return;
}
