/* Ghidra 12.1.3 pseudocode; entry 004b4ff0; d3d_destroy_res.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void d3d_destroy_res(void)

{
  temp_sprite_struct *ptVar1;
  IDirectDrawSurface *This;
  int iVar2;
  temp_sprite_struct **pptVar3;
  IDirectDrawSurface **ppIVar4;

  debug_log(s_Enter_D3D_DestroyResources___005d3e20);
  iVar2 = get_font_type();
  if (iVar2 != 0) {
    clear_texture_cache_ptr();
  }
  debug_log(s_Enter_D3D_DeinitWorldViewStuff___005d3e64);
  deinit_d3d_1();
  debug_log(s_Exit_D3D_DeinitWorldViewStuff___005d3e40);
  debug_log(s_Enter_D3D_DeinitNormalViewStuff__005d3f18);
  DAT_005ce0d0 = 0;
  debug_log(s_Exit_D3D_DeinitNormalViewStuff___005d3ef4);
  destroy_landscape_textures();
  debug_log(s_Enter_D3D_DeinitWater___005d40a8);
  deinit_texture_block();
  if (water_surface != (int *)0x0) {
    (**(code **)(*water_surface + 8))(water_surface);
    water_surface = (int *)0x0;
  }
  water_initialized = 0;
  debug_log(s_Exit_D3D_DeinitWater___005d4090);
  debug_log(s_Enter_D3D_DeinitSky___005d3d30);
  deinit_texture_block();
  deinit_texture_block();
  deinit_texture_block();
  sky_initialized = 0;
  debug_log(s_Enter_D3D_DeinitSky___005d3d30);
  deinit_texture_block();
  if (test_texture_surface != (IDirectDrawSurface *)0x0) {
    (*test_texture_surface->lpVtbl->Release)(test_texture_surface);
    test_texture_surface = (IDirectDrawSurface *)0x0;
  }
  deinit_texture_block();
  if (insect_texture_surface != (IDirectDrawSurface *)0x0) {
    (*insect_texture_surface->lpVtbl->Release)(insect_texture_surface);
    insect_texture_surface = (IDirectDrawSurface *)0x0;
  }
  if (DAT_005d3d2c != 0) {
    deinit_texture_block();
    if (dd_surface_lightning != (IDirectDrawSurface *)0x0) {
      (*dd_surface_lightning->lpVtbl->Release)(dd_surface_lightning);
      dd_surface_lightning = (IDirectDrawSurface *)0x0;
    }
    DAT_005d3d2c = 0;
  }
  release_dd_surface_texture_3();
  debug_log(s_Enter_D3D_DeinitMap___005d4078);
  deinit_texture_block();
  if (landscape_surface_page_locked != 0) {
    if (minimap_surface == (LPDIRECTDRAWSURFACE4)0x0) goto LAB_004b51b8;
    (*minimap_surface->lpVtbl->PageUnlock)(minimap_surface,0);
  }
  if (minimap_surface != (LPDIRECTDRAWSURFACE4)0x0) {
    (*minimap_surface->lpVtbl->Release)(minimap_surface);
    minimap_surface = (LPDIRECTDRAWSURFACE4)0x0;
  }
LAB_004b51b8:
  if (minimap_ddsurface_2 != (LPDIRECTDRAWSURFACE)0x0) {
    (*minimap_ddsurface_2->lpVtbl->Release)(minimap_ddsurface_2);
    minimap_ddsurface_2 = (LPDIRECTDRAWSURFACE)0x0;
  }
  if (minimap_ddsurface_1 != (LPDIRECTDRAWSURFACE)0x0) {
    (*minimap_ddsurface_1->lpVtbl->Release)(minimap_ddsurface_1);
    minimap_ddsurface_1 = (LPDIRECTDRAWSURFACE)0x0;
  }
  ppIVar4 = anibl0_surfaces_array;
  pptVar3 = bl320_sprite_bank_1;
  debug_log(s_Exit_D3D_DeinitMap___005d4060);
  do {
    ptVar1 = *pptVar3;
    if (ptVar1 != (temp_sprite_struct *)0x0) {
      ptVar1->add_to_surface = &PTR_blit_sprite_to_surface_0058f784;
      free_2(ptVar1);
    }
    This = *ppIVar4;
    *pptVar3 = (temp_sprite_struct *)0x0;
    if (This != (IDirectDrawSurface *)0x0) {
      (*This->lpVtbl->Release)(This);
      *ppIVar4 = (IDirectDrawSurface *)0x0;
    }
    ppIVar4 = ppIVar4 + 1;
    pptVar3 = pptVar3 + 1;
  } while (pptVar3 < bl320_sprite_bank_2);
  free_landscape_texture_storage_dyn_mem();
  destroy_sprites();
  destroy_all_textures();
  _DAT_005ce0c8 = 0;
  free_2(texture_mem_start);
  texture_mem_start = (texture_mem_struct *)0x0;
  FUN_0047c770();
  debug_log(s_Exit_D3D_DestroyResources___005d3e00);
  is_world_view = -1;
  return;
}
