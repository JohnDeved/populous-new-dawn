/* Ghidra 12.1.3 pseudocode; entry 0049a630; get_wchar_str_pixel_len.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int get_wchar_str_pixel_len(short *param_1)

{
  short sVar1;
  int iVar2;
  int iVar3;

  iVar3 = 0;
  sVar1 = *param_1;
  while (sVar1 != 0) {
    sVar1 = *param_1;
    iVar2 = get_font_type();
    if (iVar2 == 0) {
      iVar2 = get_font_sprite_render_width(sVar1);
    }
    else {
      iVar2 = get_font_sprite_width_global();
    }
    iVar3 = iVar3 + iVar2;
    param_1 = param_1 + 1;
    sVar1 = *param_1;
  }
  return iVar3;
}
