/* Ghidra 12.1.3 pseudocode; entry 0041fce0; set_texture_minimap.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Type propagation algorithm not settling */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void set_texture_minimap(void)

{
  float fVar1;
  float fVar2;
  void *pvVar3;
  int iVar4;
  int iVar5;
  DDSCAPS *pDVar6;
  DDSCAPS *pDVar7;
  _DDSURFACEDESC *p_Var8;
  undefined4 local_fc;
  undefined4 local_f8;
  undefined4 local_f4;
  undefined4 uStack_f0;
  _DDSURFACEDESC local_ec;
  _union_3349 a_Stack_80 [10];
  float fStack_58;
  DWORD DStack_3c;
  float fStack_38;
  int iStack_8;
  float fStack_4;

  if (landscape_texture_minimap_rect == (void *)0x0) {
    local_f4 = 0;
    local_ec.dwSize = 0;
    local_fc = 0;
    local_f8 = 0;
    calc_landscape_width_height(&local_f4,&local_ec,&local_fc,&local_f8);
    if ((landscape_flags_2 & 2) != 0) {
      set_landscape_texture_minimap_full(local_fc,local_f8);
    }
    if (landscape_texture_minimap_rect == (void *)0x0) {
      landscape_texture_minimap_rect = _malloc(0x10000);
    }
    landscape_flags_2 = landscape_flags_2 & 0xfffffffe;
    set_landscape_minimap_texture(local_fc,local_f8);
    FUN_004202d0(landscape_texture_minimap_rect,local_fc,local_f8);
  }
  pvVar3 = landscape_texture_minimap_rect;
  p_Var8 = &local_ec;
  for (iVar5 = 0x1b; iVar5 != 0; iVar5 = iVar5 + -1) {
    p_Var8->dwSize = 0;
    p_Var8 = (_DDSURFACEDESC *)&p_Var8->dwFlags;
  }
  local_ec.dwSize = 0x6c;
  (*(minimap_texture_block.block.d3d_surface_2)->lpVtbl->Lock)
            (minimap_texture_block.block.d3d_surface_2,(LPRECT)0x0,&local_ec,0x21,(HANDLE)0x0);
  texture_copy_to_surface_memory
            (pvVar3,iStack_8 + 7U & 0xfffffff8,fStack_4,0x100,local_ec.field4_0x10.lPitch,uStack_f0)
  ;
  (*(minimap_texture_block.block.d3d_surface_2)->lpVtbl->Unlock)
            (minimap_texture_block.block.d3d_surface_2,(LPVOID)0x0);
  texture_block_surface_blit();
  iVar4 = 0x7ff - ((ushort)game_state.tribes_array[player_tribe_num].angle_1 & 0x7ff);
  local_ec.ddpfPixelFormat.dwFourCC = 0;
  local_ec.ddpfPixelFormat.field3_0xc.dwRGBBitCount = 0;
  iVar5 = maybe_sin[iVar4];
  iVar4 = maybe_cos[iVar4];
  a_Stack_80[2] = (_union_3349)0x0;
  a_Stack_80[1] = (_union_3349)(float)iStack_8;
  a_Stack_80[9] = (_union_3349)(float)iStack_8;
  fStack_58 = (float)(int)fStack_4;
  fStack_38 = (float)(int)fStack_4;
  DStack_3c = 0;
  pDVar6 = &local_ec.ddsCaps;
  do {
    fVar1 = *(float *)(pDVar6 + -6) - (float)(iStack_8 >> 1);
    fVar2 = (float)*(_union_3349 *)(pDVar6 + -5) - (float)((int)fStack_4 >> 1);
    pDVar7 = pDVar6 + 8;
    pDVar6->dwCaps = (DWORD)*(float *)(pDVar6 + -6);
    *(_union_3349 *)(pDVar6 + 1) = *(_union_3349 *)(pDVar6 + -5);
    pDVar6->dwCaps =
         (DWORD)((float)iVar5 * _DAT_0058f128 * fVar2 + (float)iVar4 * _DAT_0058f128 * fVar1);
    pDVar6[1] = (DDSCAPS)(-(fVar1 * (float)iVar5 * _DAT_0058f128) +
                         (float)iVar4 * _DAT_0058f128 * fVar2);
    pDVar6->dwCaps = (DWORD)((float)pDVar6->dwCaps * (float)_DAT_0058f130);
    pDVar6[1] = (DDSCAPS)(*(float *)(pDVar6 + 1) * (float)_DAT_0058f130);
    pDVar6->dwCaps = (DWORD)((float)pDVar6->dwCaps + (float)(iStack_8 >> 1));
    pDVar6[1] = (DDSCAPS)(*(float *)(pDVar6 + 1) + (float)((int)fStack_4 >> 1));
    pDVar6->dwCaps = (DWORD)((float)pDVar6->dwCaps / (float)map_struct_3);
    pDVar6[1] = (DDSCAPS)(*(float *)(pDVar6 + 1) / (float)map_struct_3);
    ((_union_3354 *)(pDVar6 + -1))->dwRGBAlphaBitMask = 0;
    ((_union_3353 *)(pDVar6 + -2))->dwBBitMask = 0xffffffff;
    pDVar6 = pDVar7;
  } while (pDVar7 < &fStack_4);
  add_polygon_quad_texture_a0
            (&local_ec.ddpfPixelFormat.dwFourCC,a_Stack_80 + 1,a_Stack_80 + 9,&DStack_3c,
             &minimap_texture_block,0xa0);
  return;
}
