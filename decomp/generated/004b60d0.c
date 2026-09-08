/* Ghidra 12.1.3 pseudocode; entry 004b60d0; init_sky.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 init_sky(undefined4 param_1,ushort param_2,ushort param_3)

{
  DDPIXELFORMAT *pDVar1;
  uint uVar2;
  int iVar3;
  uint uVar4;
  int *local_84 [2];
  uint local_7c;
  undefined4 *local_78 [2];
  int local_70;
  int local_6c;
  uint local_50;
  uint local_4c;
  undefined1 local_28 [40];

  debug_log(s_Enter_D3D_InitSky___005d4344);
  if (sky_initialized == 0) {
    iVar3 = load_sprite_or_image
                      (&dsky_filename_template_xb,3,3,ui_struct->pixel_format_1,
                       &sky_texture_block_xb);
    if ((*(int *)(ui_struct->field34_0x6fc + 0x618) == 0) || (iVar3 == 0)) {
      sky_type = 1;
      uVar4 = (uint)param_2;
      uVar2 = (uint)param_3;
      local_50 = uVar4;
      local_4c = uVar2;
      init_surface_mem(uVar4,uVar2,&DAT_00d05b80,param_1,0);
      local_7c = uVar2;
      init_surface_mem(uVar4,uVar2,&DAT_00d05b50,0,0);
      alloc_surface_mem();
      for (uVar4 = (uint)(local_70 * local_6c) >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
        *local_78[0] = 0;
        local_78[0] = local_78[0] + 1;
      }
      for (uVar4 = local_70 * local_6c & 3; uVar4 != 0; uVar4 = uVar4 - 1) {
        *(undefined1 *)local_78[0] = 0;
        local_78[0] = (undefined4 *)((int)local_78[0] + 1);
      }
      FUN_004306a0(&local_50,local_78,pal0_mem);
      surface_mem_downscale(local_78,2,2);
      local_84[0] = (int *)0x0;
      create_dd_surface(ui_struct->direct_draw,param_2 >> 2,param_3 >> 2,0,ui_struct->pixel_format_1
                        ,0x1800,local_84);
      clear_surface_mem();
      surface_mem_lock(local_84[0],local_28);
      FUN_004306a0(local_78,local_28,0);
      surface_mem_unlock(local_84[0]);
      d3d_create_material_for_texture_block(local_84[0],0,0);
      if (local_84[0] != (int *)0x0) {
        (**(code **)(*local_84[0] + 8))(local_84[0]);
        local_84[0] = (int *)0x0;
      }
      free_surface_mem();
    }
    else {
      pDVar1 = ui_struct->ef1;
      sky_type = 0;
      iVar3 = load_sprite_or_image(&dsky_filename_template_x1,2,2,pDVar1,&sky_texture_block_x1);
      if (iVar3 != 0) {
        iVar3 = load_sprite_or_image(0x9915a0,2,2,pDVar1,&sky_texture_block_x2);
        if (iVar3 == 0) {
          deinit_texture_block();
        }
        else {
          sky_type = 2;
        }
      }
    }
    sky_initialized = 1;
  }
  debug_log(s_Exit_OK_D3D_InitSky___005d432c);
  return 0;
}
