/* Ghidra 12.1.3 pseudocode; entry 00450f30; FUN_00450f30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00450f30(undefined4 param_1,undefined4 param_2,int param_3,uint param_4)

{
  int iVar1;
  ushort uVar2;

  iVar1 = (int)player_tribe_num;
  if (((((game_state.level_flags & 0x20) == 0) && (draw_mode != 2)) && (DAT_0089ce36 == '\0')) &&
     ((DAT_0089c6e7 != '\t' && (DAT_0089c6e7 != '\x0f')))) {
    param_4 = param_3 << 0x10 | param_4;
    uVar2 = CONCAT11((char)((ushort)game_state.tribes_array[iVar1].y >> 8),
                     (char)((ushort)game_state.tribes_array[iVar1].x >> 8)) & 0xfefe;
    switch(param_1) {
    case 0:
      set_tribe_command(game_state.tribes_array[iVar1].tribe_num,0x7d,param_4,uVar2);
      return;
    case 1:
      set_tribe_command(game_state.tribes_array[iVar1].tribe_num,0x53,param_4,uVar2);
      return;
    case 2:
      set_tribe_command(game_state.tribes_array[iVar1].tribe_num,0x54,param_4,uVar2);
      return;
    case 3:
      set_tribe_command(game_state.tribes_array[iVar1].tribe_num,0x55,param_4,uVar2);
      return;
    case 4:
      set_tribe_command(game_state.tribes_array[iVar1].tribe_num,0x48,0,uVar2);
      return;
    case 5:
      set_tribe_command(game_state.tribes_array[iVar1].tribe_num,0x72,param_4,uVar2);
    }
  }
  return;
}
