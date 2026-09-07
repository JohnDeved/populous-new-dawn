/* Ghidra 12.1.3 pseudocode; entry 004b6820; init_sprites.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

int init_sprites(void)

{
  texture_cache_36B *ptVar1;
  palette_struct *ppVar2;
  HRESULT HVar3;
  int iVar4;
  undefined4 uVar5;
  LPDIRECTDRAWSURFACE pIVar6;
  DDPIXELFORMAT *pDVar7;
  texture_block *ptVar8;
  sprite_file_ext **ppsVar9;
  undefined4 uVar10;
  uint uVar11;
  undefined4 *unaff_FS_OFFSET;
  LPDIRECTDRAWSURFACE local_94;
  undefined4 local_90;
  undefined4 local_8c;
  texture_block *local_88;
  LPDIRECTDRAWSURFACE local_70;
  undefined4 local_6c;
  undefined4 local_68;
  texture_block *local_64;
  _DDSCAPS local_50;
  undefined4 local_4c;
  undefined4 local_48;
  undefined4 local_44;
  undefined4 local_40;
  undefined4 local_3c;
  _union_3350 local_38;
  _union_3351 local_34;
  _union_3353 local_30;
  _union_3354 local_2c;
  _union_3350 local_28;
  _union_3351 local_24;
  _union_3353 local_20;
  DWORD local_1c;
  DDPIXELFORMAT *local_18;
  texture_cache_36B *local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_004b6d4b;
  *unaff_FS_OFFSET = &local_10;
  debug_log(s_Initialising_sprite_stuff_005d4434);
  local_18 = ui_struct->ef1;
  pDVar7 = local_18;
  if (*(int *)(ui_struct->d3 + 0x78) == 1) {
    pDVar7 = ui_struct->pixel_format_1;
  }
  local_14 = operator_new(0xc);
  local_8 = 0;
  ppVar2 = (palette_struct *)0x0;
  if (local_14 != (texture_cache_36B *)0x0) {
    local_38 = local_18->field4_0x10;
    local_34 = local_18->field5_0x14;
    local_30 = local_18->field6_0x18;
    local_2c = local_18->field7_0x1c;
    local_28 = pDVar7->field4_0x10;
    local_24 = pDVar7->field5_0x14;
    local_20 = pDVar7->field6_0x18;
    local_1c = (pDVar7->field7_0x1c).dwRGBAlphaBitMask;
    ppVar2 = (palette_struct *)init_palette_struct(pal0_mem,al0_mem,&local_28,&local_38);
  }
  local_8 = 0xffffffff;
  uVar10 = 3;
  uVar5 = 8;
  local_44 = 0x40;
  local_40 = 0x18;
  local_4c = 0;
  local_48 = 0;
  local_3c = 4;
  if (ui_struct->uv_related == 2) {
    uVar10 = 1;
    uVar5 = 0x20;
    local_44 = 0x60;
  }
  local_2c.dwRGBAlphaBitMask = 0x1000;
  texture_palette_struct_4 = ppVar2;
  sprite_palette_struct = ppVar2;
  sprite_palette_struct_2 = ppVar2;
  HVar3 = (*ui_struct->direct_draw2->lpVtbl->GetAvailableVidMem)
                    (ui_struct->direct_draw2,(LPDDSCAPS)&local_2c,&local_1c,(LPDWORD)&local_14);
  if (-1 < HVar3) {
    debug_log(s_Texture_RAM_available____d_bytes_005d3fd0,local_14,local_1c);
  }
  debug_log(s_Creating_old_Sprite_Cache_005d4418);
  iVar4 = init_texture_cache_2
                    (ui_struct->direct_draw,pDVar7,*(undefined4 *)(ui_struct->d3 + 0x6c),uVar10,
                     uVar5,&local_44,-(uint)(*(int *)(ui_struct->d3 + 0x78) == 1) & (uint)&local_4c)
  ;
  if (iVar4 == 0) {
    local_2c.dwRGBAlphaBitMask = 0x1000;
    HVar3 = (*ui_struct->direct_draw2->lpVtbl->GetAvailableVidMem)
                      (ui_struct->direct_draw2,(LPDDSCAPS)&local_2c,&local_1c,(LPDWORD)&local_14);
    if (-1 < HVar3) {
      debug_log(s_Texture_RAM_available____d_bytes_005d3fd0,local_14,local_1c);
    }
    debug_log(s_Creating_new_Sprite_Cache_005d43fc);
    iVar4 = init_texture_cache(ui_struct->direct_draw,pDVar7,
                               -(uint)(*(int *)(ui_struct->d3 + 0x78) == 1) & (uint)&local_4c);
    if (iVar4 == 0) {
      iVar4 = init_texture_cache(ui_struct->direct_draw,local_18,0);
      if (iVar4 == 0) {
        if (DAT_005d210c == 0) {
          sprite_texture_units_count = 6;
        }
        else {
          sprite_texture_units_count = 8;
        }
        uVar11 = 0;
        sprite_texture_alpha_units_count = sprite_texture_units_count;
        if (sprite_texture_units_count != 0) {
          local_14 = sprite_texture_cache_global.array_36b;
          ptVar8 = sprite_texture_units;
          do {
            debug_log(s_Creating_tex_page__d_005d43e4,uVar11);
            local_50.dwCaps = 0x1000;
            HVar3 = (*ui_struct->direct_draw2->lpVtbl->GetAvailableVidMem)
                              (ui_struct->direct_draw2,&local_50,&local_2c.dwRGBAlphaBitMask,
                               &local_1c);
            if (-1 < HVar3) {
              debug_log(s_Texture_RAM_available____d_bytes_005d3fd0,local_1c,
                        local_2c.dwRGBAlphaBitMask);
            }
            iVar4 = process_texture(0x80,0x80,pDVar7,0,&sprite_texture_cache_global);
            if (iVar4 != 0) goto LAB_004b6d3a;
            local_94 = ptVar8->d3d_surface;
            local_90 = ptVar8->d3d_texture_handle;
            local_8c = ptVar8->material_handle;
            uVar11 = uVar11 + 1;
            local_88 = ptVar8;
            process_texture_2(&local_94);
            ptVar1 = local_14 + 1;
            ptVar8->d3d_surface_2 = (LPDIRECTDRAWSURFACE)local_14;
            ptVar8 = ptVar8 + 1;
            local_14 = ptVar1;
          } while (uVar11 < sprite_texture_units_count);
        }
        uVar11 = 0;
        if (sprite_texture_alpha_units_count != 0) {
          pIVar6 = (LPDIRECTDRAWSURFACE)0x9b9938;
          ptVar8 = sprite_texture_alpha_units;
          do {
            debug_log(s_Creating_alpha_tex_page__d_005d43c8,uVar11);
            local_2c.dwRGBAlphaBitMask = 0x1000;
            HVar3 = (*ui_struct->direct_draw2->lpVtbl->GetAvailableVidMem)
                              (ui_struct->direct_draw2,(LPDDSCAPS)&local_2c,&local_1c,
                               (LPDWORD)&local_14);
            if (-1 < HVar3) {
              debug_log(s_Texture_RAM_available____d_bytes_005d3fd0,local_14,local_1c);
            }
            iVar4 = process_texture(0x80,0x80,local_18,0,&sprite_texture_alpha_cache_global);
            if (iVar4 != 0) goto LAB_004b6d3a;
            local_70 = ptVar8->d3d_surface;
            local_6c = ptVar8->d3d_texture_handle;
            local_68 = ptVar8->material_handle;
            uVar11 = uVar11 + 1;
            local_64 = ptVar8;
            process_texture_2(&local_70);
            ptVar8->d3d_surface_2 = pIVar6;
            ptVar8 = ptVar8 + 1;
            pIVar6 = pIVar6 + 9;
          } while (uVar11 < sprite_texture_alpha_units_count);
        }
        iVar4 = create_sprite_bank(ui_struct->direct_draw,hfx_0_mem,
                                   *(undefined4 *)(ui_struct->d3 + 0x6c),
                                   &landscape_texture_storage_009bc2c0,&sprite_texture_cache_global,
                                   &sprite_texture_alpha_cache_global);
        if (iVar4 == 0) {
          iVar4 = create_sprite_bank(ui_struct->direct_draw,hspr_0_mem,
                                     *(undefined4 *)(ui_struct->d3 + 0x6c),
                                     &landscape_texture_storage_009bc2c0,
                                     &sprite_texture_cache_global,&sprite_texture_alpha_cache_global
                                    );
          if (iVar4 == 0) {
            iVar4 = create_sprite_bank(ui_struct->direct_draw,point_0_mem,
                                       *(undefined4 *)(ui_struct->d3 + 0x6c),
                                       &landscape_texture_storage_009bc2c0,
                                       &sprite_texture_cache_global,
                                       &sprite_texture_alpha_cache_global);
            if (iVar4 == 0) {
              iVar4 = create_sprite_bank(ui_struct->direct_draw,&igmslidf_sprite_file_ext,
                                         *(undefined4 *)(ui_struct->d3 + 0x6c),
                                         &landscape_texture_storage_009bc2c0,
                                         &sprite_texture_cache_global,
                                         &sprite_texture_alpha_cache_global);
              if (iVar4 == 0) {
                iVar4 = get_font_type();
                if (iVar4 == 0) {
                  ppsVar9 = font_sprite_addr_array;
                  do {
                    if (*ppsVar9 != (sprite_file_ext *)0x0) {
                      iVar4 = create_sprite_bank(ui_struct->direct_draw,*ppsVar9,
                                                 *(undefined4 *)(ui_struct->d3 + 0x6c),
                                                 &landscape_texture_storage_009bc2c0,
                                                 &sprite_texture_cache_global,
                                                 &sprite_texture_alpha_cache_global);
                      if (iVar4 != 0) goto LAB_004b6d3a;
                    }
                    ppsVar9 = ppsVar9 + 1;
                  } while (ppsVar9 < null_ARRAY_009848d0);
                }
                iVar4 = 0;
              }
            }
          }
        }
      }
    }
  }
LAB_004b6d3a:
  *unaff_FS_OFFSET = local_10;
  return iVar4;
}
