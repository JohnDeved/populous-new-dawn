/* Ghidra 12.1.3 pseudocode; entry 00453b30; load_fonts.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_fonts(void)

{
  int iVar1;
  int local_4;

  iVar1 = get_font_type();
  if (iVar1 != 0) {
    if (font_type == 9) {
      if (font_1 == 0) {
        load_font(s_data_fenew_b5fnt16_idx_0059cec8,&font_1,&local_4);
        font_file_size_half = local_4 / 2;
      }
      if (font_2 == (sprite_struct_1 *)0x0) {
        load_font(s_data_fenew_b5fnt16_bit_0059ceb0,&font_2,&local_4);
      }
      if (font_3 == (sprite_struct_1 *)0x0) {
        load_font(s__data_fenew_b5fnt24_bit_0059ce97 + 1,&font_3,&local_4);
        return;
      }
    }
    else if (font_type == 10) {
      if (font_1 == 0) {
        load_font(s_data_fenew_gbfnt16_idx_0059cf10,&font_1,&local_4);
        font_file_size_half = local_4 / 2;
      }
      if (font_2 == (sprite_struct_1 *)0x0) {
        load_font(s_data_fenew_gbfnt16_bit_0059cef8,&font_2,&local_4);
      }
      if (font_3 == (sprite_struct_1 *)0x0) {
        load_font(s_data_fenew_gbfnt24_bit_0059cee0,&font_3,&local_4);
        return;
      }
    }
    else {
      if (font_type != 0xb) {
        return;
      }
      if (font_4 == (sprite_struct_1 *)0x0) {
        load_font(s_data_fenew_font12j_fon_0059cf58,&font_4,&local_4);
      }
      if (font_2 == (sprite_struct_1 *)0x0) {
        load_font(s_data_fenew_font16j_fon_0059cf40,&font_2,&local_4);
      }
      if (font_3 == (sprite_struct_1 *)0x0) {
        load_font(s_data_fenew_font24j_fon_0059cf28,&font_3,&local_4);
      }
    }
  }
  return;
}
