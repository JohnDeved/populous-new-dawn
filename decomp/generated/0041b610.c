/* Ghidra 12.1.3 pseudocode; entry 0041b610; FUN_0041b610.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041b610(char param_1)

{
  int iVar1;

  if ((((game_state.level_flags & 2) == 0) && (DAT_0089bb77 == '\0')) &&
     (((byte)opened_files_flags & 0x10) == 0)) {
    iVar1 = (int)player_tribe_num;
    DAT_0089bb6d = game_state.tribes_array[iVar1].x;
    DAT_0089bb6f = game_state.tribes_array[iVar1].y;
    DAT_0089bb73 = game_state.tribes_array[iVar1].angle_1;
    DAT_0089bb69 = *(undefined2 *)&game_state.tribes_array[param_1].field_0x911;
    DAT_0089bb6b = *(undefined2 *)&game_state.tribes_array[param_1].field_0x913;
    DAT_0089bb77 = '\x01';
    DAT_0089bb76 = 0;
    DAT_0089bb71 = 0xffff;
    DAT_0089bb75 = 1;
  }
  return;
}
