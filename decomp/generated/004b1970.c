/* Ghidra 12.1.3 pseudocode; entry 004b1970; create_and_set_palette.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


HRESULT __fastcall create_and_set_palette(int param_1)

{
  undefined4 uVar1;
  HRESULT HVar2;
  uint uVar3;
  HDC hdc;
  undefined1 *puVar4;
  int iVar5;
  undefined4 *puVar6;
  _DDSURFACEDESC *p_Var7;
  undefined4 *puVar8;
  _DDSURFACEDESC local_6c;

  p_Var7 = &local_6c;
  for (iVar5 = 0x1b; iVar5 != 0; iVar5 = iVar5 + -1) {
    p_Var7->dwSize = 0;
    p_Var7 = (_DDSURFACEDESC *)&p_Var7->dwFlags;
  }
  local_6c.dwSize = 0x6c;
  HVar2 = (*direct_draw_surface_back->lpVtbl->GetSurfaceDesc)(direct_draw_surface_back,&local_6c);
  if (HVar2 == 0) {
    uVar3 = (local_6c.ddckCKSrcBlt.dwColorSpaceHighValue & 0x20) >> 5;
    *(uint *)(param_1 + 0xc0) = uVar3;
    if (uVar3 == 0) {
      puVar6 = (undefined4 *)(param_1 + 0x10c);
      puVar8 = system_palette_mem;
      for (iVar5 = 0x100; iVar5 != 0; iVar5 = iVar5 + -1) {
        *puVar8 = *puVar6;
        puVar6 = puVar6 + 1;
        puVar8 = puVar8 + 1;
      }
      HVar2 = 0;
    }
    else {
      hdc = GetDC((HWND)0x0);
      GetSystemPaletteEntries(hdc,0,0x100,(LPPALETTEENTRY)&system_palette);
      ReleaseDC((HWND)0x0,hdc);
      uVar3 = 10;
      if (display_created != 0) {
        uVar3 = 1;
      }
      if (uVar3 < 0x100 - uVar3) {
        puVar8 = (undefined4 *)(param_1 + 0x10c + uVar3 * 4);
        puVar6 = (undefined4 *)(&system_palette + uVar3 * 4);
        iVar5 = uVar3 * -2 + 0x100;
        do {
          uVar1 = *puVar8;
          puVar8 = puVar8 + 1;
          *puVar6 = uVar1;
          puVar6 = puVar6 + 1;
          iVar5 = iVar5 + -1;
        } while (iVar5 != 0);
      }
      if (display_created == 0) {
        puVar4 = system_palette_array_1;
        do {
          *puVar4 = 0x40;
          puVar4 = puVar4 + 4;
        } while (puVar4 < system_palette_array_2);
        puVar4 = system_palette_array_2;
        do {
          *puVar4 = 0x41;
          puVar4 = puVar4 + 4;
        } while (puVar4 < system_palette_array_3);
        puVar4 = system_palette_array_3;
        do {
          *puVar4 = 0x40;
          puVar4 = puVar4 + 4;
        } while (puVar4 < system_palette_array_3 + 0x28);
      }
      else {
        system_palette_array_1[0] = 0x40;
        puVar4 = system_palette_array_1 + 4;
        do {
          *puVar4 = 0x41;
          puVar4 = puVar4 + 4;
        } while (puVar4 < system_palette_array_3 + 0x24);
        system_palette_array_3[0x24] = 0x40;
      }
      puVar6 = (undefined4 *)(param_1 + 0xb4);
      HVar2 = (**(code **)(**(int **)(param_1 + 4) + 0x14))
                        (*(int **)(param_1 + 4),0xc,&system_palette,puVar6,0);
      if (((HVar2 == 0) &&
          (HVar2 = (*direct_draw_surface_back->lpVtbl->SetPalette)
                             (direct_draw_surface_back,(LPDIRECTDRAWPALETTE)*puVar6), HVar2 == 0))
         && (HVar2 = (*direct_draw_surface->lpVtbl->SetPalette)
                               (direct_draw_surface,(LPDIRECTDRAWPALETTE)*puVar6), HVar2 == 0)) {
        *(undefined4 *)(param_1 + 0xc4) = 1;
        puVar6 = (undefined4 *)&system_palette;
        puVar8 = system_palette_mem;
        for (iVar5 = 0x100; iVar5 != 0; iVar5 = iVar5 + -1) {
          *puVar8 = *puVar6;
          puVar6 = puVar6 + 1;
          puVar8 = puVar8 + 1;
        }
        return 0;
      }
    }
  }
  return HVar2;
}
