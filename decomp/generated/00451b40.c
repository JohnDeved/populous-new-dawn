/* Ghidra 12.1.3 pseudocode; entry 00451b40; set_font_sprite_size.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_font_sprite_size(sprite_struct_1 *param_1)

{
  DAT_006a9b1c = param_1;
  if (param_1 == font_2) {
    font_sprite_size = 0x10;
    return;
  }
  if (param_1 == font_3) {
    font_sprite_size = 0x18;
    return;
  }
  if (param_1 == font_4) {
    font_sprite_size = 0xc;
  }
  return;
}
