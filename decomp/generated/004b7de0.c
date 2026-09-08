/* Ghidra 12.1.3 pseudocode; entry 004b7de0; init_lightning.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

uint init_lightning(void)

{
  DDPIXELFORMAT *pDVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  undefined2 *puVar5;
  uint uVar6;
  uint uVar7;
  _DDSURFACEDESC *p_Var8;
  undefined1 local_4a8 [12];
  char local_49c;
  char local_498;
  char local_494;
  char local_490;
  byte local_48c;
  byte local_488;
  byte local_484;
  byte local_480;
  int iStack_470;
  _DDSURFACEDESC local_46c;
  uint local_400 [256];

  debug_log(s_Initialising_lightning_005d458c);
  pDVar1 = ui_struct->ef1;
  if ((pDVar1->field3_0xc).dwRGBBitCount != 0x10) {
    return 0;
  }
  DAT_005d3d2c = 1;
  uVar2 = create_dd_surface(ui_struct->direct_draw,0x20,0x20,0,pDVar1,0x1800,&dd_surface_lightning);
  if (uVar2 == 0) {
    count_ones_and_zeroes(pDVar1,local_4a8);
    uVar2 = 0;
    do {
      uVar7 = uVar2 + 1;
      local_400[uVar2] =
           ((uVar2 >> 2) + 0xc0 >> (8U - local_494 & 0x1f)) << (local_484 & 0x1f) |
           (uVar2 >> (8U - local_490 & 0x1f)) << (local_480 & 0x1f) |
           (uVar2 >> (8U - local_498 & 0x1f)) << (local_488 & 0x1f) |
           (uVar2 >> (8U - local_49c & 0x1f)) << (local_48c & 0x1f);
      uVar2 = uVar7;
    } while (uVar7 < 0x100);
    p_Var8 = &local_46c;
    for (iVar4 = 0x1b; iVar4 != 0; iVar4 = iVar4 + -1) {
      p_Var8->dwSize = 0;
      p_Var8 = (_DDSURFACEDESC *)&p_Var8->dwFlags;
    }
    local_46c.dwSize = 0x6c;
    uVar2 = (*dd_surface_lightning->lpVtbl->Lock)
                      (dd_surface_lightning,(LPRECT)0x0,&local_46c,0x821,(HANDLE)0x0);
    if (uVar2 == 0) {
      uVar2 = 0;
      do {
        uVar6 = 0;
        puVar5 = (undefined2 *)(iStack_470 * uVar2 + local_46c.field4_0x10.lPitch);
        uVar7 = uVar2;
        if (0xf < uVar2) {
          uVar7 = 0x1f - uVar2;
        }
        do {
          uVar3 = uVar6;
          if (0xf < uVar6) {
            uVar3 = 0x1f - uVar6;
          }
          uVar6 = uVar6 + 1;
          *puVar5 = (short)local_400[uVar7 * uVar3 + -5];
          puVar5 = puVar5 + 1;
        } while (uVar6 < 0x20);
        uVar2 = uVar2 + 1;
      } while (uVar2 < 0x20);
      uVar2 = (*dd_surface_lightning->lpVtbl->Unlock)
                        (dd_surface_lightning,(LPVOID)local_46c.field4_0x10);
      if (uVar2 == 0) {
        uVar2 = d3d_create_material_for_texture_block(dd_surface_lightning,0,0);
        uVar2 = (uVar2 == 0) - 1 & uVar2;
      }
    }
  }
  return uVar2;
}
