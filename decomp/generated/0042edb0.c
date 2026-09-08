/* Ghidra 12.1.3 pseudocode; entry 0042edb0; draw_globe_map_stars.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void __thiscall draw_globe_map_stars(int param_1,int param_2,undefined4 param_3,uint param_4)

{
  _union_3451 _Var1;
  _union_3449 *p_Var2;
  uint uVar3;
  uint uVar4;
  D3DTLVERTEX *pDVar5;
  D3DTLVERTEX *pDVar6;
  uint local_24;
  uint local_20;
  uint local_1c;
  uint local_18;
  uint local_14;
  int local_10;
  int local_c;

  if (DAT_0059c990 == 0) {
    DAT_0059c990 = 1;
    if (param_2 != 0) {
      p_Var2 = &globe_map_stars_vertices[0].sz;
      do {
        p_Var2->sz = 0.9999;
        param_2 = param_2 + -1;
        ((_union_3450 *)(p_Var2 + 1))->rhw = 0.9999;
        ((_union_3453 *)(p_Var2 + 4))->tu = 0.0;
        ((_union_3454 *)(p_Var2 + 5))->tv = 0.0;
        ((_union_3452 *)(p_Var2 + 3))->specular = 0;
        ((_union_3451 *)(p_Var2 + 2))->color = 0xffffffff;
        p_Var2 = p_Var2 + 8;
      } while (param_2 != 0);
    }
  }
  uVar4 = 0;
  local_10 = 0;
  local_c = 1000;
  pDVar5 = globe_map_stars_vertices;
  do {
    uVar4 = uVar4 + 1 & 0xf;
    uVar3 = param_4 * 0x24a1 + 0x24df;
    local_14 = uVar3 >> 0xd | uVar3 * 0x80000;
    uVar3 = local_14 * 0x24a1 + 0x24df;
    local_18 = uVar3 >> 0xd | uVar3 * 0x80000;
    uVar3 = local_18 * 0x24a1 + 0x24df;
    param_4 = uVar3 >> 0xd | uVar3 * 0x80000;
    local_1c = param_4;
    calc_star_location(((local_14 & 0x7fff80) >> 7) + *(int *)(param_1 + 0x5c + uVar4 * 4),
                       ((local_18 & 0x7fff80) >> 7) + *(int *)(param_1 + 0x9c + uVar4 * 4),&local_20
                       ,&local_24);
    pDVar6 = pDVar5;
    if (((-1 < (int)(local_24 | local_20)) && ((int)local_20 < *(int *)(param_1 + 8))) &&
       ((int)local_24 < *(int *)(param_1 + 0xc))) {
      pDVar6 = pDVar5 + 1;
      local_10 = local_10 + 1;
      _Var1 = *(_union_3451 *)(globe_map_stars_colors + ((param_4 & 0x7fff80) >> 7 & 7));
      (pDVar6->sx).sx = (float)(int)local_20;
      pDVar5[1].sy.sy = (float)(int)local_24;
      pDVar5[1].color = _Var1;
    }
    local_c = local_c + -1;
    pDVar5 = pDVar6;
  } while (local_c != 0);
  (*ui_struct->d3d_device->lpVtbl->SetRenderState)
            (ui_struct->d3d_device,D3DRENDERSTATE_TEXTUREHANDLE,0);
  (*ui_struct->d3d_device->lpVtbl->DrawPrimitive)
            (ui_struct->d3d_device,D3DPT_POINTLIST,D3DVT_TLVERTEX,globe_map_stars_vertices,local_1c,
             0xc);
  return;
}
