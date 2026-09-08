/* Ghidra 12.1.3 pseudocode; entry 00517100; set_render_state_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

int set_render_state_2(void)

{
  int iVar1;
  DWORD DVar2;

  iVar1 = begin_scene();
  if ((iVar1 == -0x7789fe3e) || (-1 < iVar1)) {
    d3d_clear_viewport(2,0);
    (*ui_struct->d3d_device->lpVtbl->SetRenderState)(ui_struct->d3d_device,D3DRENDERSTATE_ZENABLE,1)
    ;
    (*ui_struct->d3d_device->lpVtbl->SetRenderState)
              (ui_struct->d3d_device,D3DRENDERSTATE_ZWRITEENABLE,1);
    (*ui_struct->d3d_device->lpVtbl->SetRenderState)
              (ui_struct->d3d_device,D3DRENDERSTATE_ALPHABLENDENABLE,0);
    (*ui_struct->d3d_device->lpVtbl->SetRenderState)
              (ui_struct->d3d_device,D3DRENDERSTATE_ALPHATESTENABLE,0);
    if (DAT_005d54cc == 0) {
      DVar2 = 0;
    }
    else {
      DVar2 = 2;
    }
    (*ui_struct->d3d_device->lpVtbl->SetRenderState)
              (ui_struct->d3d_device,D3DRENDERSTATE_ANTIALIAS,DVar2);
    if (texture_min_mag_value != 0) {
      DAT_005d56ec = DAT_005d56ec | 0x20;
      DAT_005d56e8 = DAT_005d56e8 & 0xffffffdf;
      return 0;
    }
    DAT_005d56ec = DAT_005d56ec | 0x20;
    DAT_005d56e8 = DAT_005d56e8 | 0x20;
    iVar1 = 0;
  }
  return iVar1;
}
