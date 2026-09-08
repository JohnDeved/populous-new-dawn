/* Ghidra 12.1.3 pseudocode; entry 00480ea0; FUN_00480ea0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00480ea0(char param_1)

{
  bool bVar1;
  int iVar2;
  int iVar3;

  if (param_1 != '\0') {
    if ((DAT_00987a1e != '\0') && (iVar2 = FUN_00481290(&DAT_00987a10), iVar2 != 0)) {
      DAT_00987a1e = '\0';
    }
    return;
  }
  if ((DAT_00985b56 != '\0') && (iVar2 = FUN_00481290(&DAT_00985b48), iVar2 != 0)) {
    DAT_00985b56 = '\0';
  }
  bVar1 = false;
  if (DAT_00988a76 != '\0') {
    vertices_flags = vertices_flags | 8;
    set_vertex_palette_color(al0_mem + DAT_00988a7f * 0x1000);
    iVar3 = ((int)DAT_00988a7b + (int)DAT_00988a77) * 8 + hfx_0_addr;
    iVar2 = (uint)*(ushort *)(iVar3 + 6) * -0xb0;
    add_polygon_rect_sprite
              ((int)(short)DAT_00988a68 - (uint)(*(ushort *)(iVar3 + 4) >> 1),
               ((int)(iVar2 + (iVar2 >> 0x1f & 0xffU)) >> 8) + (int)DAT_00988a68._2_2_,iVar3);
    set_vertex_palette_color(&ghost0_mem);
    vertices_flags = vertices_flags & 0xfffffff7;
    DAT_00988a7d = DAT_00988a7d + -1;
    if (DAT_00988a7d < 1) {
      bVar1 = true;
    }
    else {
      DAT_00988a77 = DAT_00988a77 + 1;
      if (DAT_00988a79 <= DAT_00988a77) {
        DAT_00988a77 = 0;
      }
    }
    if (bVar1) {
      DAT_00988a76 = '\0';
    }
  }
  if ((DAT_00988a96 != '\0') && (iVar2 = FUN_00482290(&DAT_00988a88), iVar2 != 0)) {
    DAT_00988a96 = '\0';
  }
  if ((DAT_00986bae != '\0') && (iVar2 = FUN_004839f0(&DAT_00986ba0), iVar2 != 0)) {
    DAT_00986bae = '\0';
  }
  if ((DAT_0098c5b6 != '\0') && (iVar2 = FUN_00484320(&DAT_0098c5a8), iVar2 != 0)) {
    DAT_0098c5b6 = '\0';
  }
  if (((DAT_00988a96 == '\0') && (DAT_00986bae == '\0')) && (DAT_0098c5b6 == '\0')) {
    FUN_0049cfa0(4);
    return;
  }
  FUN_0049cf90(4);
  return;
}
