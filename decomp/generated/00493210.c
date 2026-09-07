/* Ghidra 12.1.3 pseudocode; entry 00493210; get_font_type.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 get_font_type(void)

{
  if ((8 < font_type) && (font_type < 0xc)) {
    return 1;
  }
  return 0;
}
