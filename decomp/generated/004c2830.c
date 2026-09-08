/* Ghidra 12.1.3 pseudocode; entry 004c2830; FUN_004c2830.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004c2830(void)

{
  int iVar1;
  undefined1 uVar2;
  undefined2 local_4;
  undefined2 local_2;

  uVar2 = 0;
  if (((game_state.level_flags & 0x20) != 0) && ((globe_update_flags & 1) != 0)) {
    local_4 = *(undefined2 *)&game_state.tribes_array[player_tribe_num].field_0x911;
    local_2 = *(undefined2 *)&game_state.tribes_array[player_tribe_num].field_0x913;
    iVar1 = calc_distance_toroidal(&local_4,&minimap_related_2);
    if (iVar1 <= DAT_005aa5e0) {
      uVar2 = 1;
    }
  }
  return uVar2;
}
