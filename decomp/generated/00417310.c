/* Ghidra 12.1.3 pseudocode; entry 00417310; update_vfconfig.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void update_vfconfig(void)

{
  int iVar1;
  vconfig_struct *pvVar2;
  ushort uVar3;
  vconfig_struct *pvVar4;

  pvVar2 = vconfig_dat_mem + vconfig_index * 5 + (int)vconfig_index_start;
  pvVar4 = &vconfig_struct_0088f004;
  for (iVar1 = 0x17; iVar1 != 0; iVar1 = iVar1 + -1) {
    pvVar4->field0_0x0 = pvVar2->field0_0x0;
    pvVar2 = (vconfig_struct *)&pvVar2->field1_0x4;
    pvVar4 = (vconfig_struct *)&pvVar4->field1_0x4;
  }
  *(short *)&pvVar4->field0_0x0 = (short)pvVar2->field0_0x0;
  FUN_00417980(vconfig_struct_0088f004.matrix_related);
  uVar3 = DAT_0089c6c3 & 0xff;
  if ((((byte)land_flags_1 & 4) == 0) && ((load_level_flags._1_1_ & 2) == 0)) {
    iVar1 = FUN_0044bb80();
  }
  else {
    iVar1 = 0;
  }
  if (((int)((uint)uVar3 * 0x10) < screen_width - iVar1) &&
     ((int)((uint)uVar3 * 0x10) < (int)screen_height)) {
    vconfig_struct_0088f004.x = (short)iVar1 + uVar3 * 8;
    vconfig_struct_0088f004.width_2 = (short)(screen_width - iVar1) + uVar3 * -0x10;
    vconfig_struct_0088f004.height_2 = screen_height + uVar3 * -0x10;
    vconfig_struct_0088f004.y = uVar3 * 8;
    DAT_0089c6c3 = uVar3;
  }
  if (vconfig_struct_0088f004.field49_0x54 == '\0') {
    calc_mesh_bounds_1(vconfig_struct_0088f004.field1_0x4);
  }
  else if (vconfig_struct_0088f004.field49_0x54 == '\x01') {
    tribe_ptr = game_state.tribes_array + player_tribe_num;
    set_vconfig_from_resolution(&vconfig_struct_0088f004);
    calc_mesh_bounds_2(&vconfig_struct_0088f004);
  }
  update_surface_mem_offset();
  if (vconfig_struct_0088f004.field58_0x5d == '\0') {
    level_flags_1 = level_flags_1 & 0xfffffeff;
    set_player_transform_matrix();
    return;
  }
  level_flags_1 = level_flags_1 | 0x100;
  set_player_transform_matrix();
  return;
}
