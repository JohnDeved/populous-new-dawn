/* Ghidra 12.1.3 pseudocode; entry 004a5d70; render_some_text_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void render_some_text_3(int param_1,int param_2)

{
  int iVar1;
  int iVar2;
  wchar_t local_100 [128];

  if ((((byte)level_flags_1 & 0x20) == 0) && (((byte)game_state.field95396_0xcd6e8 & 2) != 0)) {
    iVar1 = get_font_type();
    if (iVar1 == 0) {
      set_font_render_default();
    }
    else {
      set_font_sprite_size();
    }
    iVar1 = get_font_type();
    if (iVar1 == 0) {
      iVar1 = get_font_sprite_width_render_2();
    }
    else {
      iVar1 = get_font_sprite_size();
    }
    if (param_2 < iVar1 >> 1) {
      param_2 = iVar1 >> 1;
    }
    _swprintf(local_100,u__02d__02d_005cdb30);
    iVar1 = get_font_type();
    if (iVar1 == 0) {
      iVar1 = get_font_sprite_render_width();
    }
    else {
      iVar1 = get_font_sprite_width_global();
    }
    iVar2 = get_wchar_str_pixel_len();
    param_1 = param_1 - (iVar2 + iVar1);
    iVar1 = get_font_type();
    if (iVar1 != 0) {
      render_text_unicode_2(param_1,param_2);
      return;
    }
    set_indexed_value_from_system_palette(palette_index_1);
    render_text_unicode(param_1,param_2,local_100);
  }
  return;
}
