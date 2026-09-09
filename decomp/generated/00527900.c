/* Ghidra 12.1.3 pseudocode; entry 00527900; render_text_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void render_text_2(int param_1,int param_2,char *param_3,undefined4 param_4,undefined4 param_5)

{
  char cVar1;
  int iVar2;
  int iVar3;

  cVar1 = *param_3;
  iVar2 = param_1;
  while (cVar1 != '\0') {
    if (*param_3 == '\n') {
      iVar2 = get_font_sprite_width_render_2(0x20);
      param_2 = param_2 + iVar2;
      iVar2 = param_1;
    }
    else {
      iVar3 = (**(code **)(text_render_vtable + 0xc))
                        (font_sprites_for_render,iVar2,param_2,*param_3,param_4,param_5);
      iVar2 = iVar2 + iVar3;
    }
    param_3 = param_3 + 1;
    cVar1 = *param_3;
  }
  return;
}
