/* Ghidra 12.1.3 pseudocode; entry 004527d0; get_font_sprite_width_global.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char get_font_sprite_width_global(ushort param_1)

{
  if ((param_1 < 0x100) && (font_sprite_size == '\f')) {
    return '\a';
  }
  return font_sprite_size;
}
