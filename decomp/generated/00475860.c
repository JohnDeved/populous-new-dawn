/* Ghidra 12.1.3 pseudocode; entry 00475860; FUN_00475860.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00475860(int param_1)

{
  bool bVar1;
  int iVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  undefined4 local_30;
  undefined4 local_28;
  undefined4 local_24;
  undefined4 local_4;

  local_28 = (int)DAT_0087cac8;
  local_24 = (int)DAT_0087caca;
  iVar5 = (int)DAT_0087cac4;
  iVar6 = (int)DAT_0087cac6;
  if (unit_index_1 != 0) {
    bVar1 = true;
    if (((uint)*(ushort *)(param_1 + 0x24) == (int)DAT_0089bc20) &&
       ((sprite_animation_counter & 1) == 0)) {
      bVar1 = false;
    }
    if (bVar1) {
      local_30 = 2;
      iVar2 = sprite_animation_counter % 0xc + (sprite_animation_counter % 6) * -2;
      if (iVar2 < 0) {
        iVar2 = -iVar2;
      }
      uVar3 = (uint)(byte)(0xf - (char)iVar2);
    }
    else {
      local_30 = 4;
      uVar3 = CONCAT31((int3)(char)((ushort)DAT_0089bc20 >> 8),0xf);
    }
    set_vertex_palette_color();
    vertices_flags = vertices_flags | 8;
    if (local_30 != 0) {
      local_4 = local_30;
      do {
        set_indexed_value_from_system_palette(uVar3);
        set_texture_4(iVar5,iVar6,iVar5 + 6,iVar6);
        set_indexed_value_from_system_palette(uVar3);
        set_texture_4(iVar5,iVar6,iVar5,iVar6 + 6);
        iVar2 = local_28 + iVar5;
        set_indexed_value_from_system_palette(uVar3);
        set_texture_4(iVar2 + -6,iVar6,iVar2,iVar6);
        set_indexed_value_from_system_palette(uVar3);
        set_texture_4(iVar2,iVar6,iVar2,iVar6 + 6);
        iVar4 = local_24 + iVar6;
        set_indexed_value_from_system_palette(uVar3);
        iVar6 = iVar6 + -1;
        set_texture_4(iVar5,iVar4,iVar5 + 6,iVar4);
        set_indexed_value_from_system_palette(uVar3);
        set_texture_4(iVar5,iVar4 + -6,iVar5,iVar4);
        iVar5 = iVar5 + -1;
        set_indexed_value_from_system_palette(uVar3);
        set_texture_4(iVar2 + -6,iVar4,iVar2,iVar4);
        set_indexed_value_from_system_palette(uVar3);
        set_texture_4(iVar2,iVar4 + -6,iVar2,iVar4);
        local_28 = local_28 + 2;
        local_24 = local_24 + 2;
        local_4 = local_4 + -1;
      } while (local_4 != 0);
    }
    set_vertex_palette_color();
    vertices_flags = vertices_flags & 0xfffffff7;
  }
  return;
}
