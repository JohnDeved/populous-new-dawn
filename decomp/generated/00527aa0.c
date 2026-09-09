/* Ghidra 12.1.3 pseudocode; entry 00527aa0; set_text_render.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 set_text_render(undefined4 *param_1,undefined4 param_2)

{
  int iVar1;

  if ((text_render_vtable != (undefined4 *)0x0) &&
     (*(code **)((int)text_render_vtable + 4) != (code *)0x0)) {
    (**(code **)((int)text_render_vtable + 4))(font_sprites_for_render,param_1,param_2);
  }
  text_render_vtable = param_1;
  if ((code *)*param_1 == (code *)0x0) {
    font_sprites_for_render = param_2;
  }
  else {
    iVar1 = (*(code *)*param_1)(&font_sprites_for_render,param_2);
    if (iVar1 != 0) {
      text_render_vtable = (undefined4 *)0x0;
      return 0xffffffff;
    }
  }
  return 0;
}
