/* Ghidra 12.1.3 pseudocode; entry 00451ba0; render_text_unicode_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void render_text_unicode_2(short param_1,undefined2 param_2,ushort *param_3,undefined4 param_4)

{
  ushort uVar1;
  ushort local_4;

  uVar1 = *param_3;
  while (uVar1 != 0) {
    uVar1 = *param_3;
    if (((uVar1 != 0x8170) && (uVar1 != 0x20)) && (uVar1 != 0xa3fd)) {
      if (DAT_005da078 == 0) {
        add_glyph(param_1,param_2,uVar1,param_4,font_sprite_size);
        local_4 = (ushort)font_sprite_size;
        if ((font_sprite_size == 0xc) && (*param_3 < 0x100)) {
          local_4 = 7;
        }
      }
      else if (font_sprite_size == 0xc) {
        local_4 = add_glyph_2(param_1,param_2,uVar1,param_4);
      }
      else if (font_sprite_size == 0x10) {
        local_4 = add_glyph_3(param_1,param_2,uVar1,param_4);
      }
      else if (font_sprite_size == 0x18) {
        local_4 = add_glyph_4(param_1,param_2,uVar1,param_4);
      }
      param_1 = param_1 + local_4;
    }
    param_3 = param_3 + 1;
    uVar1 = *param_3;
  }
  return;
}
