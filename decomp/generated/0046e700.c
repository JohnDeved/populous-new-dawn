/* Ghidra 12.1.3 pseudocode; entry 0046e700; clear_land_draw_state.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void clear_land_draw_state(undefined4 *param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;

  minimap_interpolation_adj_1 = *(short *)((int)param_1 + 0x22);
  minimap_interpolation_adj_2 = *(short *)(param_1 + 9);
  screen_width_2 = *(short *)((int)param_1 + 0x26);
  screen_height_2 = *(short *)(param_1 + 10);
  INT_0087ca74 = param_1[1];
  scaling_correction = *param_1;
  scaling_perspective_param = param_1[5];
  depth_offset = param_1[4];
  DAT_0087ca6c = param_1[3];
  DAT_0087ca70 = (int)*(short *)(param_1 + 0xd);
  screen_width_2_half = *(short *)((int)param_1 + 0x2a) + screen_width_2 / 2;
  screen_height_2_half = *(short *)(param_1 + 0xb) + screen_height_2 / 2;
  _DAT_0087ca94 = 0;
  _DAT_0087ca96 = 0;
  DAT_0087ca98 = 0;
  DAT_0087ca9a = 0;
  minimap_ref_1 = (short)screen_coord_3_x;
  DAT_0087caa0 = minimap_ref_1 - minimap_interpolation_adj_1;
  minimap_ref_2 = (short)screen_coord_3_y;
  DAT_0087caa2 = minimap_ref_2 - minimap_interpolation_adj_2;
  if (((byte)land_flags_1 & 1) != 0) {
    iVar4 = (int)minimap_interpolation_adj_1;
    iVar2 = minimap_ref_1 + -0x78;
    iVar5 = minimap_ref_2 + -0x78;
    iVar6 = minimap_ref_1 + 0x78;
    iVar3 = minimap_ref_2 + 0x78;
    if (iVar2 < iVar4) {
      iVar2 = iVar4;
    }
    iVar1 = screen_width_2 + iVar4;
    if (iVar1 < iVar2) {
      iVar2 = iVar1;
    }
    if (iVar6 < iVar4) {
      iVar6 = iVar4;
    }
    if (iVar1 < iVar6) {
      iVar6 = iVar1;
    }
    iVar4 = (int)minimap_interpolation_adj_2;
    if (iVar5 < iVar4) {
      iVar5 = iVar4;
    }
    iVar1 = screen_height_2 + iVar4;
    if (iVar1 < iVar5) {
      iVar5 = iVar1;
    }
    if (iVar3 < iVar4) {
      iVar3 = iVar4;
    }
    if (iVar1 < iVar3) {
      iVar3 = iVar1;
    }
    _DAT_0087ca94 = (short)iVar2;
    DAT_0087ca98 = (short)iVar6 - _DAT_0087ca94;
    _DAT_0087ca96 = (short)iVar5;
    DAT_0087ca9a = (short)iVar3 - _DAT_0087ca96;
    if (DAT_0087ca98 < 0) {
      DAT_0087ca98 = 0;
    }
    if (screen_width_2 < DAT_0087ca98) {
      DAT_0087ca98 = screen_width_2;
    }
    if (DAT_0087ca9a < 0) {
      DAT_0087ca9a = 0;
    }
    if (screen_height_2 < DAT_0087ca9a) {
      DAT_0087ca9a = screen_height_2;
    }
  }
  if (((_render_state_flags & 0x80) != 0) &&
     (_render_state_flags = _render_state_flags & 0xffffff7f, *(char *)(param_1 + 0x15) == '\x01'))
  {
    calc_mesh_bounds_2(param_1);
  }
  return;
}
