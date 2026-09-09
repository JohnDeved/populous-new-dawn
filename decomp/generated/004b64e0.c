/* Ghidra 12.1.3 pseudocode; entry 004b64e0; init_minimap.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

int init_minimap(void)

{
  int iVar1;
  int iVar2;
  int iVar3;
  undefined4 uVar4;
  DDPIXELFORMAT *pDVar5;
  DWORD *pDVar6;
  undefined4 *puVar7;
  undefined4 auStack_20 [8];

  debug_log(s_Enter_D3D_InitMap___005d43b0);
  iVar1 = (ui_struct->f4[1] * 100) / 0x280;
  iVar3 = ui_struct->f4[2] * 0x60;
  iVar2 = iVar3 / 0x1e0;
  if (iVar1 <= iVar2) {
    iVar1 = iVar2;
  }
  map_struct_3 = 2;
  while (iVar1 = iVar1 >> 1, iVar1 != 0) {
    map_struct_3 = map_struct_3 << 1;
  }
  pDVar5 = ui_struct->pixel_format_1;
  pDVar6 = &DAT_00993060;
  for (iVar1 = 8; iVar1 != 0; iVar1 = iVar1 + -1) {
    *pDVar6 = pDVar5->dwSize;
    pDVar5 = (DDPIXELFORMAT *)&pDVar5->dwFlags;
    pDVar6 = pDVar6 + 1;
  }
  uVar4 = CONCAT22((short)((uint)(iVar3 % 0x1e0) >> 0x10),(undefined2)map_struct_3);
  iVar3 = create_dd_surface(ui_struct->direct_draw,uVar4,uVar4,*(undefined4 *)(ui_struct->d3 + 0x6c)
                            ,&DAT_00993060,0x1800,&minimap_ddsurface_2);
  if (iVar3 == 0) {
    (*minimap_ddsurface_2->lpVtbl->QueryInterface)
              (minimap_ddsurface_2,(IID *)&IID_IDirectDrawSurface4,&minimap_surface);
    if (landscape_surface_page_locked != 0) {
      (*minimap_surface->lpVtbl->PageLock)(minimap_surface,0);
    }
    iVar3 = d3d_create_material_for_texture_block
                      (minimap_ddsurface_2,0,*(int *)(ui_struct->d3 + 0x84) != 0);
    if (iVar3 == 0) {
      if (((byte)DAT_00993064 & 0x20) == 0) {
        puVar7 = auStack_20;
        for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
          *puVar7 = 0;
          puVar7 = puVar7 + 1;
        }
        auStack_20[0] = 0x20;
        auStack_20[3] = 8;
        auStack_20[1] = 0x60;
        uVar4 = CONCAT22((short)((uint)auStack_20 >> 0x10),(undefined2)map_struct_3);
        iVar3 = create_dd_surface(ui_struct->direct_draw,uVar4,uVar4,
                                  *(undefined4 *)(ui_struct->d3 + 0x6c),auStack_20,0x1800,
                                  &minimap_ddsurface_1);
        if (iVar3 != 0) {
          return iVar3;
        }
      }
      else {
        minimap_ddsurface_1 = (LPDIRECTDRAWSURFACE)minimap_ddsurface_2;
        (*minimap_ddsurface_2->lpVtbl->AddRef)(minimap_ddsurface_2);
      }
      init_d3d_struct(minimap_ddsurface_1,&minimap_d3d_struct);
      debug_log(s_Exit_OK_D3D_InitMap___005d4398);
      iVar3 = 0;
    }
  }
  return iVar3;
}
