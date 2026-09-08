/* Ghidra 12.1.3 pseudocode; entry 00527b40; get_font_sprite_width_render_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 get_font_sprite_width_render_2(undefined4 param_1)

{
  undefined1 local_8 [4];
  undefined4 uStack_4;

  (**(code **)(text_render_vtable + 8))(font_sprites_for_render,local_8,param_1);
  return uStack_4;
}
