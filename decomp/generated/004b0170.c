/* Ghidra 12.1.3 pseudocode; entry 004b0170; clear_ui_struct_4.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __fastcall clear_ui_struct_4(int param_1)

{
  *(undefined4 *)(param_1 + 0xe8) = 0;
  FUN_004b1d80(param_1,s_An_unspecified_error_occurred_005cdc68);
  *(undefined4 *)(param_1 + 0x638) = 0;
  DAT_005cdc54 = 0;
  *(undefined4 *)(param_1 + 0x108) = 0;
  DAT_005cdc40 = 1;
  *(undefined4 *)(param_1 + 4) = 0;
  ui_struct_global = 0;
  display_modes_number = 0;
  display_created = 1;
  *(undefined4 *)(param_1 + 0x104) = 0;
  *(undefined4 *)(param_1 + 0xf0) = 0;
  direct_draw_surface = (LPDIRECTDRAWSURFACE)0x0;
  direct_draw_surface_back = (LPDIRECTDRAWSURFACE)0x0;
  direct_draw_clipper = (LPDIRECTDRAWCLIPPER)0x0;
  DAT_005cdc48 = 0;
  *(undefined4 *)(param_1 + 0xd0) = 0;
  *(undefined4 *)(param_1 + 0x634) = 0;
  *(undefined4 *)(param_1 + 0xd4) = 0;
  *(undefined4 *)(param_1 + 0xcc) = 0;
  *(undefined4 *)(param_1 + 0xc0) = 0;
  *(undefined4 *)(param_1 + 0xc4) = 0;
  *(undefined4 *)(param_1 + 0xb4) = 0;
  *(undefined4 *)(param_1 + 0xdc) = 0x100;
  *(undefined4 *)(param_1 + 0xe0) = 0x100;
  *(undefined4 *)(param_1 + 0x630) = 1;
  *(undefined4 *)(param_1 + 0x510) = 0;
  return;
}
