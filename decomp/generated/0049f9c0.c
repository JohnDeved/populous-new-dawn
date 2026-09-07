/* Ghidra 12.1.3 pseudocode; entry 0049f9c0; FUN_0049f9c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0049f9c0(int param_1)

{
  short sVar1;
  uint uVar2;
  byte bVar3;
  undefined3 uVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  int local_49;
  undefined1 uStack_45;
  int local_44;
  undefined1 *local_38;
  int local_34;
  undefined1 *local_30;
  int local_2c;
  undefined1 *local_28;
  int local_24;
  undefined1 *local_20;
  undefined1 *local_1c;
  char local_18 [8];
  undefined1 local_10 [16];

  bVar3 = 0;
  iVar5 = (int)*(char *)(param_1 + 0x20);
  DAT_006841a9 = DAT_00683b78;
  DAT_006841ad = *(undefined4 *)(param_1 + 4);
  DAT_006841b9 = DAT_00683b7c;
  DAT_006841bd = *(undefined4 *)(param_1 + 8);
  _DAT_00684182 = 1;
  _DAT_0068417a = 1;
  if (((*(uint *)(param_1 + 0x21) & 2) != 0) ||
     (((*(uint *)(param_1 + 0x21) & 0x10) != 0 &&
      (((DAT_0089bb81 == '\x02' || (DAT_0089bb81 == '\x03')) &&
       (((int)global_struct_45B_ARRAY_00683b92 - param_1) / 0x2d + (int)DAT_0089bb85._1_1_ == 0)))))
     ) {
    bVar3 = 1;
  }
  DAT_0068418e = (uint)bVar3;
  DAT_0068418a = (uint)bVar3;
  _DAT_0068417e = (uint)((*(byte *)(param_1 + 0x21) & 4) != 0);
  iVar6 = parameterize_by_screen_width();
  iVar7 = parameterize_by_screen_height();
  iVar8 = parameterize_by_screen_width();
  local_49._1_3_ = (undefined3)iVar8;
  uVar4 = local_49._1_3_;
  local_49 = iVar8 << 8;
  uStack_45 = (undefined1)((uint)iVar8 >> 0x18);
  iVar9 = parameterize_by_screen_height();
  iVar10 = get_font_type();
  if (iVar10 == 0) {
    set_font_render_default();
  }
  else {
    set_font_sprite_size();
  }
  FUN_004a1dd0(&DAT_00684172,&DAT_005caba8);
  uVar2 = *(uint *)(param_1 + 0x21);
  *(uint *)(param_1 + 0x21) = uVar2 & 0xfffffffd;
  if ((uVar2 & 0x20) != 0) {
    local_38 = (undefined1 *)0x5;
    add_polygon_rect_sprite((iVar6 + -1 + iVar8) - (uint)*(ushort *)(hfx_0_addr + 0x58c));
  }
  if (*(char *)(param_1 + 0x1f) != '\0') {
    local_49 = CONCAT31(uVar4,(&DAT_005a89c3)[*(char *)(param_1 + 0x1f) * 5]);
    local_38 = (undefined1 *)((int)(iVar8 + (iVar8 >> 0x1f & 0xfU)) >> 4);
    if ((int)local_38 < 3) {
      local_38 = (undefined1 *)0x3;
    }
    iVar10 = iVar8 + (int)local_38 * -2;
    local_44 = (int)(iVar9 + (iVar9 >> 0x1f & 7U)) >> 3;
    if (local_44 < 5) {
      local_44 = 5;
    }
    local_28 = (undefined1 *)((iVar8 - iVar10) / 2 + iVar6);
    vertices_flags = vertices_flags | 0x10;
    local_34 = ((iVar9 - (int)local_38) - local_44) + iVar7;
    local_30 = local_28 + iVar10;
    local_44 = local_44 + local_34;
    local_38 = local_28;
    local_2c = local_44;
    local_24 = local_34;
    local_20 = local_30;
    set_indexed_value_from_system_palette(local_49);
    FUN_00516890(&local_38);
    vertices_flags = vertices_flags & 0xffffffef;
    local_38 = local_28;
    local_1c = &stack0xffffff9c;
    vertices_flags = vertices_flags | 4;
    local_30 = local_20;
    local_34 = local_24;
    local_2c = local_44;
    set_indexed_value_from_system_palette(local_49);
    FUN_00516890(&local_38);
    vertices_flags = vertices_flags & 0xfffffffb;
  }
  iVar8 = (&DAT_0059cb05)[iVar5 * 7];
  if (iVar8 == 1) {
    iVar5 = get_font_type();
    if (iVar5 == 0) {
      iVar5 = get_font_sprite_render_width();
    }
    else {
      iVar5 = get_font_sprite_width_global();
    }
    iVar8 = get_font_type();
    if (iVar8 == 0) {
      iVar8 = get_font_sprite_width_render_2();
    }
    else {
      iVar8 = get_font_sprite_size();
    }
    _sprintf(local_18,s__c_005cd2c4);
    copy_wchar();
    iVar10 = get_font_type();
    if (iVar10 != 0) {
      iVar8 = (iVar9 - iVar8) / 2;
      iVar5 = (CONCAT13(uStack_45,local_49._1_3_) - iVar5) / 2;
      render_text_unicode_2
                (CONCAT22((short)((uint)iVar5 >> 0x10),(short)iVar5 + (short)iVar6),
                 CONCAT22((short)((uint)iVar8 >> 0x10),(short)iVar8 + (short)iVar7));
      return;
    }
    local_38 = &stack0xffffff9c;
    set_indexed_value_from_system_palette(palette_index_1);
    render_text_unicode((CONCAT13(uStack_45,local_49._1_3_) - iVar5) / 2 + iVar6,
                        (iVar9 - iVar8) / 2 + iVar7,local_10);
    return;
  }
  if (iVar8 == 2) {
    if ((DAT_0068418a == 0) && (DAT_0068418e == 0)) {
      sVar1 = *(short *)(&DAT_005a80e0 + *(char *)(param_1 + 0x1e) * 0x3e);
    }
    else {
      sVar1 = *(short *)(&DAT_005a80e4 + *(char *)(param_1 + 0x1e) * 0x3e);
    }
    add_polygon_rect_sprite
              ((int)(CONCAT13(uStack_45,local_49._1_3_) -
                    (uint)*(ushort *)(sVar1 * 8 + hfx_0_addr + 4)) / 2 + iVar6);
    return;
  }
  if (iVar8 != 3) {
    return;
  }
  if ((DAT_0068418a == 0) && (DAT_0068418e == 0)) {
    sVar1 = (&DAT_0059cb09)[iVar5 * 0xe];
  }
  else {
    sVar1 = (&DAT_0059cb0b)[iVar5 * 0xe];
  }
  add_polygon_rect_sprite
            ((int)(CONCAT13(uStack_45,local_49._1_3_) -
                  (uint)*(ushort *)(sVar1 * 8 + hfx_0_addr + 4)) / 2 + iVar6);
  return;
}
