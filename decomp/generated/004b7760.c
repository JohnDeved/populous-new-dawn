/* Ghidra 12.1.3 pseudocode; entry 004b7760; draw_textures.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 draw_textures(void)

{
  cached_sprite **ppcVar1;
  undefined1 uVar2;
  uint uVar3;
  uint uVar4;
  undefined4 uVar5;
  uint uVar6;
  texture_cache *ptVar7;
  texture_cache *local_100;
  undefined4 local_fc;
  undefined4 local_f8;
  undefined4 local_f4;
  undefined4 local_f0;
  undefined4 local_ec;
  undefined4 local_e8;

  if (DAT_00749700 != 0) {
    add_sky_texture_polygons(texture_mem_start);
  }
  if (DAT_0074978c != 0) {
    draw_texture_unit(sprite_texture_units,&sprite_texture_cache_global,0,0);
    draw_texture_unit(sprite_texture_alpha_units,&sprite_texture_alpha_cache_global,0,0xe6);
  }
  if (DAT_007498a4 != 0) {
    draw_texture_unit(textures_block_global,&lowres_texture_cache,0,0);
  }
  if (DAT_00749818 != 0) {
    add_sky_texture_polygons(texture_mem_start);
  }
  uVar6 = 0;
  if (DAT_00749a48 != 0) {
    ptVar7 = (texture_cache *)landscape_texture_blocks_mem;
    do {
      ppcVar1 = ptVar7->sprites;
      local_fc = 0;
      local_f8 = 0;
      local_f4 = 0x3f800000;
      local_f0 = 0x3f800000;
      local_ec = 0;
      local_e8 = 0;
      uVar3 = uVar6 >> 4;
      uVar4 = uVar6 & 0xf;
      uVar6 = uVar6 + 1;
      local_100 = ptVar7;
      FUN_004b7230((float)(uVar4 * 0x21),(float)(uVar3 * 0x21),0x42000000,0x42000000,&local_100);
      ptVar7 = (texture_cache *)(ppcVar1 + 0x14);
    } while ((texture_cache *)(ppcVar1 + 0x14) < &lowres_texture_cache);
  }
  DAT_005cd91c = DAT_00749930;
  if (DAT_007499bc != 0) {
    uVar5 = (*(code *)ui_struct->ui_vtable->f4)
                      (maybe_framerate,framerate_or_lowres_textures,texture_mem_start->max_vertices,
                       texture_mem_start->max_indices,texture_mem_start->data_capacity);
    _sprintf((char *)&local_100,s_BackBuffer_Locks____d_DrawPrim_c_005d446c,back_buffer_locks_num,
             texture_mem_start->draw_calls_num,texture_mem_start->non_zbuffer_primitives_num,
             texture_mem_start->num_vertices_drawn,uVar5);
    back_buffer_locks_num = 0;
    uVar2 = find_palette_min_element(system_palette_mem,0xff,0xff,0xff);
    add_polygon_multi_1(0x42480000,0x42480000,&local_100,0xffffffff,uVar2);
    add_polygon_many(texture_mem_start);
  }
  return 0;
}
