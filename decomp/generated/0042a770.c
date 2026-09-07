/* Ghidra 12.1.3 pseudocode; entry 0042a770; load_hspr.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

char load_hspr(int param_1,int param_2,int param_3)

{
  bool bVar1;
  int iVar2;
  sprite_container *psVar3;
  char local_1;

  iVar2 = (int)DAT_0059c76c;
  local_1 = '\x01';
  if (param_1 == iVar2) {
    return '\x01';
  }
  if (-1 < DAT_0059c76c) {
    if (iVar2 == 0) {
      psVar3 = &data_hspr0_0_dat_sprite2;
LAB_0042a7ae:
      free_sprite_array(psVar3);
    }
    else if (iVar2 == 1) {
      psVar3 = &data_hspr0_0_dat_sprite;
      goto LAB_0042a7ae;
    }
    DAT_0059c76c = -1;
    if (vstart_related != (vstart_struct *)0x0) {
      free_1(vstart_related);
      vstart_related = (vstart_struct *)0x0;
      vstart_related_tail = (vfra_struct *)0x0;
    }
    if (vfra_related_2 != (vfra_struct_2 *)0x0) {
      free_1(vfra_related_2);
      vfra_related_2 = (vfra_struct_2 *)0x0;
      vfra_related_2_tail = (vfra_struct *)0x0;
    }
    if (vfra_related != (undefined2 *)0x0) {
      free_1(vfra_related);
      vfra_related = (undefined2 *)0x0;
      vfra_related_tail = 0;
    }
    if (vspr_0_loaded != 0) {
      free_sprite_2(&DATA_VSPR_0_INF_sprite);
      vspr_0_loaded = 0;
      vspr_related = 0;
    }
    if (vele_0_mem != (vele_struct *)0x0) {
      free_sprite_2(&DATA_VELE_0_ANI_sprite);
      vele_0_mem = (vele_struct *)0x0;
      vele_0_end = 0;
    }
    set_global_resources(0);
  }
  free_landscape_texture_memory();
  param_2 = param_2 * param_3;
  iVar2 = param_2;
  if (param_2 < 0xfa01) {
    iVar2 = 64000;
  }
  if (param_2 < 0xc8001) {
    param_2 = 0xc8000;
  }
  if (param_1 == 0) {
    psVar3 = &data_hspr0_0_dat_sprite2;
    _BScreen_sprite2.obj_size = iVar2;
    _PolyPool_sprite.obj_size = param_2;
  }
  else {
    if (param_1 != 1) goto LAB_0042a8d0;
    psVar3 = &data_hspr0_0_dat_sprite;
    _BScreen_sprite.obj_size = iVar2;
    _PolyPool_sprite1.obj_size = param_2;
  }
  local_1 = load_sprite_array(psVar3);
LAB_0042a8d0:
  if (local_1 != '\0') {
    DAT_0059c76c = (char)param_1;
    set_polypool_mem_ptr_2(big_temp_buffer,0xc8000);
    bVar1 = 0x4afff < (int)screen_width * (int)screen_height;
    if (bVar1) {
      screen_res_high = 2;
    }
    else {
      screen_res_high = 1;
    }
    _DAT_0089c67d = (uint)!bVar1;
    _DAT_0089c679 = (uint)bVar1;
    set_font_sprite_sizes();
    FUN_0042b940();
    _DAT_008926e7 = 0;
    _DAT_008926e9 = 0;
    _DAT_008926eb = 0xa0;
    _DAT_008926ed = 0xa0;
    _DAT_008926ef = 10;
    _DAT_008926f1 = 10;
    if ((int)screen_width * (int)screen_height < 0x4b000) {
      _DAT_008926eb = 0x50;
      _DAT_008926ed = 0x50;
      _DAT_008926ef = 5;
      _DAT_008926f1 = 5;
    }
    FUN_004afb00();
    if (draw_mode == 2 || (draw_mode == 1 || DAT_0089c6c3 != 0)) {
      iVar2 = (int)surface_mem_height;
    }
    else {
      iVar2 = (int)vconfig_struct_0088f004.surface_mem_height_related;
      if (iVar2 < 0) {
        iVar2 = 0;
      }
      if (surface_mem_height < iVar2) {
        iVar2 = (int)surface_mem_height;
      }
    }
    surface_mem_offset = surface_mem_index * iVar2;
    FUN_00431e60();
    local_1 = load_vele();
    if (local_1 != '\0') {
      set_global_resources(1);
    }
    DAT_005cd2a0 = 1;
    DAT_0089bb87 = 0;
    FUN_00410bd0();
  }
  return local_1;
}
