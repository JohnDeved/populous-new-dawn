/* Ghidra 12.1.3 pseudocode; entry 00524a30; draw_sky.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void draw_sky(char param_1)

{
  int iVar1;
  undefined4 *puVar2;
  int local_30 [9];
  int local_c;
  int local_8;
  int local_4;

  if (param_1 == '\0') {
    if ((level_flags_2._1_1_ & 0x80) != 0) {
      if (sky_lens_loaded == 0) {
        reset_global_palettes();
        no_file_message();
        file_name_validation(global_string_buffer,s_data_skylens_dat_005ddd18);
        read_file_to_mem(global_string_buffer,skylens_mem,0x41d0,local_30);
        update_sky_array();
        sky_lens_loaded = 1;
      }
      update_sky_array();
      add_sky_lens_polygons(1);
      goto LAB_00524bf9;
    }
    if (sky_type != 1) {
      add_sky_lens_polygons(0);
      goto LAB_00524bf9;
    }
    puVar2 = pal0_mem + DAT_0089ce32;
    FUN_00522100((uint)CONCAT12(*(undefined1 *)puVar2,
                                CONCAT11(*(undefined1 *)((int)puVar2 + 1),
                                         *(undefined1 *)((int)puVar2 + 2))));
    local_30[2] = (int)screen_width;
    local_30[3] = (int)screen_height;
  }
  else if (param_1 == '\x01') {
    puVar2 = pal0_mem + DAT_0089ce32;
    FUN_00522100((uint)CONCAT12(*(undefined1 *)puVar2,
                                CONCAT11(*(undefined1 *)((int)puVar2 + 1),
                                         *(undefined1 *)((int)puVar2 + 2))));
    local_30[2] = (int)screen_width;
    local_30[3] = (int)screen_height;
  }
  else {
    if (param_1 != '\x02') goto LAB_00524bf9;
    puVar2 = pal0_mem + DAT_0089ce32;
    FUN_00522100((uint)CONCAT12(*(undefined1 *)puVar2,
                                CONCAT11(*(undefined1 *)((int)puVar2 + 1),
                                         *(undefined1 *)((int)puVar2 + 2))));
    local_30[2] = (int)screen_width;
    local_30[3] = (int)screen_height;
  }
  local_30[1] = 0;
  local_30[0] = 0;
  d3d_clear_viewport(1,local_30);
LAB_00524bf9:
  if (sky_counter != 0) {
    local_30[0] = 0x30;
    local_30[1] = 0x48;
    local_30[2] = 0x60;
    local_30[3] = 0x48;
    local_30[4] = 0;
    local_30[5] = 0;
    local_30[6] = 0;
    local_30[7] = 0;
    iVar1 = (uint)(byte)global_palette_indexes_2[DAT_0089d165 * 5] * 4;
    local_30[8] = (int)vconfig_struct_0088f004.x;
    local_8 = (int)vconfig_struct_0088f004.width_2 + (int)vconfig_struct_0088f004.x;
    local_c = (int)vconfig_struct_0088f004.y;
    local_4 = surface_mem_offset / (int)screen_width + (int)vconfig_struct_0088f004.y;
    add_skylense_polygon_global
              (local_30 + 8,
               (local_30[sky_counter & 3] << 0x10 |
               (uint)*(byte *)((int)system_palette_mem + iVar1 + 1)) << 8 |
               (uint)*(byte *)(system_palette_mem + (byte)global_palette_indexes_2[DAT_0089d165 * 5]
                              ) << 0x10 | (uint)*(byte *)((int)system_palette_mem + iVar1 + 2));
    vertices_flags = vertices_flags & 0xffffffe7;
  }
  return;
}
