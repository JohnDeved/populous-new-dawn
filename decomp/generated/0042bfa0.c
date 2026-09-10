/* Ghidra 12.1.3 pseudocode; entry 0042bfa0; clear_level_global_vars.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void clear_level_global_vars(void)

{
  int iVar1;
  sunlight_struct *psVar2;
  undefined4 *puVar3;

  game_state.pseudo_random_val = 0x9d78afe;
  game_state._858461_1_ = 0;
  pseudo_random = 0x9d78afe;
  puVar3 = video_palette;
  for (iVar1 = 0x100; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  reset_palette_mem(video_palette,1);
  game_state.offset_counter = 0;
  game_state.offset_counter_2 = 0;
  game_state._858441_4_ = 0;
  game_state._858445_4_ = 0;
  game_state._858449_4_ = 0;
  puVar3 = null_ARRAY_00974110;
  for (iVar1 = 0x14; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  DAT_0089bb89 = 0;
  DAT_00895dac = 0;
  level_flags = level_flags | 0x10040;
  level_flags_2 = level_flags_2 & 0xffff9fff | 0x800010;
  puVar3 = (undefined4 *)&DAT_0089bb81;
  for (iVar1 = 0x1c; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  *(undefined2 *)puVar3 = 0;
  _DAT_0089bbf3 = 0;
  _DAT_0089bbf7 = 0;
  _DAT_0089bbfb = 0;
  DAT_0089ce36 = 0;
  DAT_0089ce35 = 0;
  _DAT_0089bbff = 0;
  _cam_1_x = 0;
  _cam_1_angle_related = 0;
  init_globe_structs();
  land_flags_1 = land_flags_1 & 0xffbfdfff;
  FUN_00475530();
  game_state.units_allocated = 0;
  game_state._858438_1_ = 0;
  game_state.start_24[0] = 0;
  game_state.start_24[1] = 0;
  game_state.start_24[2] = 0;
  game_state.start_24[3] = 0;
  game_state._841986_2_ = 0;
  PTR_008922d8 = (unit_struct *)0x0;
  game_state._841988_2_ = 0;
  vconfig_index_start = 0;
  draw_mode = 0;
  current_obj_num = 0xff;
  game_state._841984_2_ = 1;
  puVar3 = (undefined4 *)&game_state.field_0xccc16;
  for (iVar1 = 0xd; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  psVar2 = game_state.sunlight_array;
  for (iVar1 = 0x2fa; iVar1 != 0; iVar1 = iVar1 + -1) {
    psVar2->enabled = 0;
    psVar2->f1 = 0;
    psVar2->f2 = 0;
    psVar2->f3 = 0;
    psVar2 = (sunlight_struct *)&psVar2->x;
  }
  psVar2->enabled = 0;
  psVar2->f1 = 0;
  puVar3 = (undefined4 *)&game_state.field_0x9b6b8;
  for (iVar1 = 2000; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  puVar3 = &game_state.start_3;
  for (iVar1 = 0x2bd0; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  *(undefined2 *)puVar3 = 0;
  return;
}
