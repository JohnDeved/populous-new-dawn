/* Ghidra 12.1.3 pseudocode; entry 0041edb0; add_tribe_unit_rect.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_tribe_unit_rect(uint *param_1,undefined2 param_2)

{
  ushort *puVar1;
  uint uVar2;
  bool bVar3;
  int iVar4;
  uint uVar5;
  unit_struct *puVar6;
  byte local_2;
  byte bStack_1;

  bVar3 = true;
  uVar5 = 0xffffffff;
  puVar6 = (unit_struct *)0x0;
  if ((((byte)level_flags & 4) != 0) && ((*param_1 & 8) == 0)) {
    bVar3 = false;
  }
  if (!bVar3) {
    return;
  }
  bVar3 = false;
  uVar2 = *param_1;
  if ((uVar2 & 0x80) == 0) {
    if ((uVar2 & 0x200) == 0) {
      if ((uVar2 & 0x400) != 0) {
        bVar3 = true;
        if (unit_land_array[(ushort)param_1[2] & 0x3ff] != (unit_struct *)0x0) {
          uVar5 = (uint)(byte)tribe_icon_offset
                              [(char)unit_land_array[(ushort)param_1[2] & 0x3ff]->tribe_index * 4];
        }
        puVar6 = (unit_struct *)0x0;
      }
    }
    else {
      puVar6 = unit_land_array[(ushort)param_1[2] & 0x3ff];
      if (puVar6 == (unit_struct *)0x0) goto LAB_0041eea0;
      bVar3 = true;
      uVar5 = (uint)(byte)tribe_icon_offset[(char)puVar6->tribe_index * 4];
    }
  }
  else {
    bVar3 = true;
    if ((uVar2 & 0x100) == 0) {
      uVar5 = (uint)(byte)tribe_icon_offset[player_tribe_num * 4];
    }
    else if (((byte)game_state.offset_counter & 1) == 0) {
      uVar5 = (uint)(byte)tribe_icon_offset[player_tribe_num * 4];
    }
    else {
      bVar3 = false;
      uVar5 = (uint)default_icon_offset;
    }
  }
  if ((puVar6 != (unit_struct *)0x0) && (iVar4 = can_show_unit_icon(puVar6,param_1), iVar4 == 0)) {
    return;
  }
LAB_0041eea0:
  if (uVar5 != 0xffffffff) {
    bStack_1 = (byte)((ushort)param_2 >> 8);
    local_2 = (byte)param_2;
    iVar4 = tex_struct_is_point_visible((uint)local_2 << 8,(uint)bStack_1 << 8);
    if (iVar4 != 0) {
      if (bVar3) {
        add_colored_rect_global_storage(local_2 >> 1,bStack_1 >> 1,uVar5);
      }
      else {
        add_colored_rect_local_storage(local_2 >> 1,bStack_1 >> 1,uVar5);
      }
      if (puVar6 != (unit_struct *)0x0) {
        puVar1 = &(puVar6->object).flags;
        *(byte *)puVar1 = (byte)*puVar1 | 1;
      }
    }
  }
  return;
}
