/* Ghidra 12.1.3 pseudocode; entry 0044a1f0; parameterize_by_screen_width.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int parameterize_by_screen_width(int param_1)

{
  return (int)(screen_width * param_1 + (screen_width * param_1 >> 0x1f & 0xffffU)) >> 0x10;
}
