/* Ghidra 12.1.3 pseudocode; entry 0049d070; FUN_0049d070.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0049d070(int param_1)

{
  undefined4 local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  local_4 = 0;
  local_8 = 0;
  local_c = 0;
  local_10 = 0;
  FUN_00523560(player_tribe_num * 0xc65 + 0x89d1c8);
  local_10 = parameterize_by_screen_width(*(undefined4 *)(param_1 + 0x37));
  local_c = parameterize_by_screen_height(*(undefined4 *)(param_1 + 0x3b));
  local_8 = parameterize_by_screen_width(*(int *)(param_1 + 0x47) + *(int *)(param_1 + 0x37));
  local_4 = parameterize_by_screen_height(*(int *)(param_1 + 0x4b) + *(int *)(param_1 + 0x3b));
  if (screen_width < 0x201) {
    draw_hfx_ingame_window(&local_10,&DAT_005cab48);
    return;
  }
  draw_hfx_ingame_window(&local_10,&DAT_005cab30);
  return;
}
