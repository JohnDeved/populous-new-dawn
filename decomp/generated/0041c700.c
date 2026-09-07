/* Ghidra 12.1.3 pseudocode; entry 0041c700; FUN_0041c700.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0041c700(int param_1,int param_2)

{
  int iVar1;
  int iVar2;
  vconfig_struct *pvVar3;
  ushort uVar4;
  int iVar5;
  vconfig_struct *pvVar6;

  if (param_1 != 0) {
    iVar2 = param_1;
    if (param_1 < 0) {
      iVar2 = -param_1;
    }
    iVar1 = (int)vconfig_index;
    iVar5 = 2;
    if (param_1 < 1) {
      iVar5 = 3;
    }
    iVar5 = iVar5 + iVar1 * 5;
    if ((vconfig_dat_mem[iVar1 * 5].field58_0x5d == '\0') &&
       (vconfig_dat_mem[iVar5].field58_0x5d == '\0')) {
      vconfig_struct_0088f004.field58_0x5d = '\0';
    }
    else {
      vconfig_struct_0088f004.field58_0x5d = '\x01';
    }
    vconfig_struct_0088f004.field1_0x4 = 0x32;
    if ((param_2 == param_1) || (param_1 + param_2 == 0)) {
      vconfig_struct_0088f004.field1_0x4 = vconfig_dat_mem[iVar5].field1_0x4;
    }
    if (vconfig_struct_0088f004.field58_0x5d == '\0') {
      level_flags_1 = level_flags_1 & 0xfffffeff;
    }
    else {
      level_flags_1 = level_flags_1 | 0x100;
    }
    vconfig_struct_0088f004.field0_0x0 =
         ((vconfig_dat_mem[iVar5].field0_0x0 - vconfig_dat_mem[iVar1 * 5].field0_0x0) * iVar2) /
         param_2 + vconfig_dat_mem[iVar1 * 5].field0_0x0;
    vconfig_struct_0088f004.matrix_related =
         ((vconfig_dat_mem[iVar5].matrix_related - vconfig_dat_mem[iVar1 * 5].matrix_related) *
         iVar2) / param_2 + vconfig_dat_mem[iVar1 * 5].matrix_related;
    vconfig_struct_0088f004.angle_2 =
         (short)((((int)vconfig_dat_mem[iVar5].angle_2 - (int)vconfig_dat_mem[iVar1 * 5].angle_2) *
                 iVar2) / param_2) + vconfig_dat_mem[iVar1 * 5].angle_2;
    vconfig_struct_0088f004.field21_0x2c =
         (short)((((int)vconfig_dat_mem[iVar5].field21_0x2c -
                  (int)vconfig_dat_mem[iVar1 * 5].field21_0x2c) * iVar2) / param_2) +
         vconfig_dat_mem[iVar1 * 5].field21_0x2c;
    vconfig_struct_0088f004.surface_mem_height_related =
         (short)((((int)vconfig_dat_mem[iVar5].surface_mem_height_related -
                  (int)vconfig_dat_mem[iVar1 * 5].surface_mem_height_related) * iVar2) / param_2) +
         vconfig_dat_mem[iVar1 * 5].surface_mem_height_related;
    update_surface_mem_offset();
    vconfig_struct_0088f004.field49_0x54 = 0;
    calc_mesh_bounds_1(vconfig_struct_0088f004.field1_0x4);
    _render_state_flags = _render_state_flags | 0x80;
    return;
  }
  vconfig_index_start = 0;
  pvVar3 = vconfig_dat_mem + vconfig_index * 5;
  pvVar6 = &vconfig_struct_0088f004;
  for (iVar2 = 0x17; iVar2 != 0; iVar2 = iVar2 + -1) {
    pvVar6->field0_0x0 = pvVar3->field0_0x0;
    pvVar3 = (vconfig_struct *)&pvVar3->field1_0x4;
    pvVar6 = (vconfig_struct *)&pvVar6->field1_0x4;
  }
  *(short *)&pvVar6->field0_0x0 = (short)pvVar3->field0_0x0;
  FUN_00417980(vconfig_struct_0088f004.matrix_related);
  uVar4 = DAT_0089c6c3 & 0xff;
  if ((((byte)land_flags_1 & 4) == 0) && ((load_level_flags._1_1_ & 2) == 0)) {
    iVar2 = FUN_0044bb80();
  }
  else {
    iVar2 = 0;
  }
  if (((int)((uint)uVar4 * 0x10) < screen_width - iVar2) &&
     ((int)((uint)uVar4 * 0x10) < (int)screen_height)) {
    vconfig_struct_0088f004.x = (short)iVar2 + uVar4 * 8;
    vconfig_struct_0088f004.width_2 = (short)(screen_width - iVar2) + uVar4 * -0x10;
    vconfig_struct_0088f004.height_2 = screen_height + uVar4 * -0x10;
    vconfig_struct_0088f004.y = uVar4 * 8;
    DAT_0089c6c3 = uVar4;
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
