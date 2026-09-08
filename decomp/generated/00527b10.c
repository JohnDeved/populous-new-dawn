/* Ghidra 12.1.3 pseudocode; entry 00527b10; get_font_sprite_render_width.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 get_font_sprite_render_width(undefined4 param_1)

{
  undefined4 local_8 [2];

  (**(code **)(text_render_vtable + 8))(font_sprites_for_render,local_8,param_1);
  return local_8[0];
}
