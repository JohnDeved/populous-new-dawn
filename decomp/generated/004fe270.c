/* Ghidra 12.1.3 pseudocode; entry 004fe270; render_char_outer.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint render_char_outer(int param_1,int param_2,int param_3)

{
  uint uVar1;
  int iVar2;
  int iVar3;
  uint uVar4;

  iVar2 = get_font_type();
  if (iVar2 != 0) {
    iVar2 = get_font_type();
    if (iVar2 == 0) {
      iVar2 = get_font_sprite_render_width(param_3);
    }
    else {
      iVar2 = get_font_sprite_width_global();
    }
    iVar3 = get_font_type();
    if (iVar3 == 0) {
      iVar3 = get_font_sprite_width_render_2(param_3);
    }
    else {
      iVar3 = get_font_sprite_size();
    }
    uVar4 = render_char((short)param_1 - (short)(DAT_00a69070 - ((iVar2 >> 1) + param_1) >> 5),
                        (short)param_2 - (short)(DAT_00a69074 - ((iVar3 >> 1) + param_2) >> 5),
                        param_3);
    return uVar4;
  }
  uVar4 = param_3 - 0x20;
  if ((int)uVar4 < 0) {
    uVar4 = 0;
  }
  uVar1 = font_struct_ptr->sprite->sprite_num - 1;
  if (uVar1 < uVar4) {
    uVar4 = uVar1;
  }
  FUN_00459d00(param_1,param_2,font_struct_ptr->sprite->mem_start + uVar4 * 8);
  return (uint)*(ushort *)(font_struct_ptr->sprite->mem_start + 4 + uVar4 * 8);
}
