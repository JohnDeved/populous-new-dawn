/* Ghidra 12.1.3 pseudocode; entry 00417510; FUN_00417510.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00417510(void)

{
  int iVar1;
  int iVar2;
  ushort uVar3;
  int iVar4;
  vconfig_struct *pvVar5;
  vconfig_struct *pvVar6;

  if (DAT_0089ce34 != '\0') {
    DAT_0089d172 = (byte)((int)(maybe_framerate * 3 + (maybe_framerate * 3 >> 0x1f & 3U)) >> 2) &
                   0xfe;
    if ((char)DAT_0089d172 < '\b') {
      DAT_0089d172 = 8;
    }
    if (' ' < (char)DAT_0089d172) {
      DAT_0089d172 = 0x20;
    }
    if ((level_flags_1 & 0x100000) != 0) {
      DAT_0089d172 = (byte)(((int)(char)DAT_0089d172 << 8) / DAT_0089c6a9);
    }
    iVar2 = vconfig_index * 5 + (int)vconfig_index_start;
    iVar4 = (int)(char)DAT_0089d172;
    if (DAT_0089ce34 == iVar4) {
      uVar3 = DAT_0089c6c3 & 0xff;
      if (((land_flags_1 & 4) == 0) && ((load_level_flags._1_1_ & 2) == 0)) {
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
      vconfig_struct_0088f004.field41_0x44 = vconfig_dat_mem[iVar2].field41_0x44;
      vconfig_struct_0088f004.field42_0x46 = vconfig_dat_mem[iVar2].field42_0x46;
      vconfig_struct_0088f004.field43_0x48 = vconfig_dat_mem[iVar2].field43_0x48;
      vconfig_struct_0088f004.field44_0x4a = vconfig_dat_mem[iVar2].field44_0x4a;
      vconfig_struct_0088f004.field45_0x4c = vconfig_dat_mem[iVar2].field45_0x4c;
      vconfig_struct_0088f004.field46_0x4e = vconfig_dat_mem[iVar2].field46_0x4e;
      vconfig_struct_0088f004.field47_0x50 = vconfig_dat_mem[iVar2].field47_0x50;
      vconfig_struct_0088f004.field48_0x52 = vconfig_dat_mem[iVar2].field48_0x52;
      vconfig_struct_0088f004._85_1_ = 0;
      if ((DAT_0088f0bf == '\0') && (vconfig_dat_mem[iVar2].field58_0x5d == '\0')) {
        vconfig_struct_0088f004.field58_0x5d = '\0';
      }
      else {
        vconfig_struct_0088f004.field58_0x5d = '\x01';
      }
      if (vconfig_struct_0088f004.field58_0x5d == '\0') {
        level_flags_1 = level_flags_1 & 0xfffffeff;
      }
      else {
        level_flags_1 = level_flags_1 | 0x100;
      }
      vconfig_struct_0088f004.field1_0x4 = 0x32;
    }
    vconfig_struct_0088f004.field49_0x54 = '\0';
    if ('\x01' < DAT_0089ce34) {
      vconfig_struct_0088f004.field0_0x0 =
           vconfig_struct_0088f004.field0_0x0 +
           (vconfig_dat_mem[iVar2].field0_0x0 - vconfig_struct_0088f004.field0_0x0) /
           (DAT_0089ce34 + -1);
      vconfig_struct_0088f004.matrix_related =
           vconfig_struct_0088f004.matrix_related +
           (vconfig_dat_mem[iVar2].matrix_related - vconfig_struct_0088f004.matrix_related) /
           (DAT_0089ce34 + -1);
      vconfig_struct_0088f004.angle_2 =
           vconfig_struct_0088f004.angle_2 +
           (short)(((int)vconfig_dat_mem[iVar2].angle_2 - (int)vconfig_struct_0088f004.angle_2) /
                  (DAT_0089ce34 + -1));
      vconfig_struct_0088f004.field5_0x14 =
           vconfig_struct_0088f004.field5_0x14 +
           (vconfig_dat_mem[iVar2].field5_0x14 - vconfig_struct_0088f004.field5_0x14) /
           (DAT_0089ce34 + -1);
      vconfig_struct_0088f004.field4_0x10 =
           vconfig_struct_0088f004.field4_0x10 +
           (vconfig_dat_mem[iVar2].field4_0x10 - vconfig_struct_0088f004.field4_0x10) /
           (DAT_0089ce34 + -1);
      vconfig_struct_0088f004.field3_0xc =
           vconfig_struct_0088f004.field3_0xc +
           (vconfig_dat_mem[iVar2].field3_0xc - vconfig_struct_0088f004.field3_0xc) /
           (DAT_0089ce34 + -1);
      vconfig_struct_0088f004._52_2_ =
           vconfig_struct_0088f004._52_2_ +
           (short)(((int)*(short *)&vconfig_dat_mem[iVar2].field_0x34 -
                   (int)(short)vconfig_struct_0088f004._52_2_) / (DAT_0089ce34 + -1));
      vconfig_struct_0088f004.surface_mem_height_related =
           vconfig_struct_0088f004.surface_mem_height_related +
           (short)(((int)vconfig_dat_mem[iVar2].surface_mem_height_related -
                   (int)vconfig_struct_0088f004.surface_mem_height_related) / (DAT_0089ce34 + -1));
    }
    if ((int)DAT_0089ce34 <= iVar4 + -1) {
      vconfig_struct_0088f004._42_2_ =
           vconfig_struct_0088f004._42_2_ +
           (short)(((int)*(short *)&vconfig_dat_mem[iVar2].field_0x2a -
                   (int)(short)vconfig_struct_0088f004._42_2_) / (int)DAT_0089ce34);
      vconfig_struct_0088f004.field21_0x2c =
           vconfig_struct_0088f004.field21_0x2c +
           (short)(((int)vconfig_dat_mem[iVar2].field21_0x2c -
                   (int)vconfig_struct_0088f004.field21_0x2c) / (int)DAT_0089ce34);
    }
    FUN_00417980(vconfig_struct_0088f004.matrix_related);
    update_surface_mem_offset();
    calc_mesh_bounds_1(vconfig_struct_0088f004.field1_0x4);
    _render_state_flags = _render_state_flags | 0x80;
    DAT_0089ce34 = DAT_0089ce34 + -1;
    if (DAT_0089ce34 == '\0') {
      land_flags_1 = land_flags_1 & 0xffefffff;
      pvVar5 = vconfig_dat_mem + vconfig_index * 5 + (int)vconfig_index_start;
      pvVar6 = &vconfig_struct_0088f004;
      for (iVar2 = 0x17; iVar2 != 0; iVar2 = iVar2 + -1) {
        pvVar6->field0_0x0 = pvVar5->field0_0x0;
        pvVar5 = (vconfig_struct *)&pvVar5->field1_0x4;
        pvVar6 = (vconfig_struct *)&pvVar6->field1_0x4;
      }
      *(short *)&pvVar6->field0_0x0 = (short)pvVar5->field0_0x0;
      FUN_00417980(vconfig_struct_0088f004.matrix_related);
      uVar3 = DAT_0089c6c3 & 0xff;
      if (((land_flags_1 & 4) == 0) && ((load_level_flags._1_1_ & 2) == 0)) {
        iVar2 = FUN_0044bb80();
      }
      else {
        iVar2 = 0;
      }
      if (((int)((uint)uVar3 * 0x10) < screen_width - iVar2) &&
         ((int)((uint)uVar3 * 0x10) < (int)screen_height)) {
        vconfig_struct_0088f004.x = (short)iVar2 + uVar3 * 8;
        vconfig_struct_0088f004.width_2 = (short)(screen_width - iVar2) + uVar3 * -0x10;
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
      }
      else {
        level_flags_1 = level_flags_1 | 0x100;
      }
      set_player_transform_matrix();
    }
  }
  return;
}
