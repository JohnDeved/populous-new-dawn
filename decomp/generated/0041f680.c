/* Ghidra 12.1.3 pseudocode; entry 0041f680; FUN_0041f680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041f680(int param_1,int param_2,int param_3,undefined4 param_4,undefined4 param_5,
                 int param_6)

{
  int iVar1;
  int iVar2;
  undefined4 uVar3;
  undefined4 uStack_34;
  undefined4 uStack_30;
  undefined1 *local_18;
  int local_14;
  int local_10;
  int local_c;
  undefined1 *local_8;
  undefined1 *local_4;

  if ((*(char *)(param_1 + 0x2f) == player_tribe_num) && ((*(byte *)(param_1 + 0x11) & 8) != 0)) {
    vertices_flags = vertices_flags | 8;
  }
  switch(param_4) {
  case 1:
    uStack_30 = 1;
    uStack_34 = param_5;
    uVar3 = FUN_005255b0(param_2,param_3,3);
    if (param_6 == 0) break;
    uStack_34 = CONCAT31((int3)((uint)uVar3 >> 8),DAT_0089c6f5);
    uVar3 = 3;
    goto LAB_0041fa84;
  case 2:
    uStack_30 = 1;
    uStack_34 = param_5;
    uVar3 = FUN_005255b0(param_2,param_3,3);
    if (param_6 == 0) break;
    uStack_34 = CONCAT31((int3)((uint)uVar3 >> 8),DAT_0089c6f5);
    uVar3 = 3;
    goto LAB_0041fa84;
  case 3:
    local_18 = (undefined1 *)&uStack_34;
    iVar2 = param_2 + 3;
    iVar1 = param_2 + -3;
    set_indexed_value_from_system_palette(param_5);
    add_polygons_globe_no_texture(iVar1,param_3,param_2,param_3 + -3,iVar2,param_3);
    set_indexed_value_from_system_palette(param_5);
    add_polygons_globe_no_texture(iVar1,param_3,param_2,param_3 + 3,iVar2,param_3);
    if (param_6 != 0) {
      local_18 = (undefined1 *)&uStack_34;
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      set_texture_4(iVar1,param_3,param_2,param_3 + -3);
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      set_texture_4(param_2,param_3 + -3,iVar2,param_3);
      local_8 = (undefined1 *)&uStack_34;
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      set_texture_4(iVar2,param_3,param_2,param_3 + 3);
      local_4 = (undefined1 *)&uStack_34;
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      set_texture_4(param_2,param_3 + 3,iVar1,param_3);
    }
    break;
  case 4:
    local_18 = (undefined1 *)(param_2 + -4);
    local_10 = param_2 + 4;
    local_14 = param_3 + -2;
    local_c = param_3 + 2;
    set_indexed_value_from_system_palette(param_5);
    FUN_005169e0(&local_18);
    local_18 = (undefined1 *)(param_2 + -2);
    local_10 = param_2 + 2;
    local_14 = param_3 + -4;
    local_8 = (undefined1 *)&uStack_34;
    local_c = param_3 + 4;
    set_indexed_value_from_system_palette(param_5);
    FUN_005169e0(&local_18);
    if (param_6 != 0) {
      local_18 = (undefined1 *)(param_2 + -4);
      local_10 = param_2 + 4;
      local_14 = param_3 + -2;
      local_c = param_3 + 2;
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      FUN_005168c0(&local_18);
      local_14 = param_3 + -4;
      local_18 = (undefined1 *)(param_2 + -2);
      local_c = param_3 + 4;
      local_8 = (undefined1 *)&uStack_34;
      local_10 = param_2 + 2;
      set_indexed_value_from_system_palette(CONCAT31((int3)((uint)local_18 >> 8),DAT_0089c6f5));
      FUN_005168c0(&local_18);
    }
    break;
  case 5:
    local_18 = (undefined1 *)&uStack_34;
    iVar2 = param_3 + 4;
    set_indexed_value_from_system_palette(param_5);
    add_polygons_globe_no_texture(param_2 + -4,iVar2,param_2,param_3 + -4,param_2 + 4,iVar2);
    if (param_6 != 0) {
      local_18 = (undefined1 *)&uStack_34;
      vertices_flags = vertices_flags | 4;
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      add_polygons_globe_no_texture(param_2 + -5,iVar2,param_2 + -1,param_3 + -4,param_2 + 3,iVar2);
      vertices_flags = vertices_flags & 0xfffffffb;
    }
    break;
  case 6:
    local_18 = (undefined1 *)(param_2 + -4);
    local_14 = param_3 + -4;
    local_10 = param_2 + 4;
    local_c = param_3 + 4;
    set_indexed_value_from_system_palette(param_5);
    FUN_005169e0(&local_18);
    if (param_6 != 0) {
      local_18 = (undefined1 *)(param_2 + -4);
      local_14 = param_3 + -4;
      local_10 = param_2 + 4;
      local_c = param_3 + 4;
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      FUN_005168c0(&local_18);
    }
    break;
  case 7:
    uStack_30 = 1;
    uStack_34 = param_5;
    uVar3 = FUN_005255b0(param_2,param_3,4);
    if (param_6 == 0) break;
    uStack_34 = CONCAT31((int3)((uint)uVar3 >> 8),DAT_0089c6f5);
    uVar3 = 4;
    goto LAB_0041fa84;
  case 8:
    uStack_30 = 1;
    uStack_34 = param_5;
    uVar3 = FUN_005255b0(param_2,param_3,6);
    if (param_6 == 0) break;
    uStack_34 = CONCAT31((int3)((uint)uVar3 >> 8),DAT_0089c6f5);
    uVar3 = 6;
LAB_0041fa84:
    uStack_30 = 0;
    FUN_005255b0(param_2,param_3,uVar3);
  }
  vertices_flags = vertices_flags & 0xfffffff7;
  return;
}
