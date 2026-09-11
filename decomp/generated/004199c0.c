/* Ghidra 12.1.3 pseudocode; entry 004199c0; FUN_004199c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004199c0(undefined4 *param_1)

{
  undefined1 uVar1;
  int iVar2;

  iVar2 = (int)player_tribe_num;
  *param_1 = *(undefined4 *)&game_state.tribes_array[iVar2].x;
  *(undefined2 *)(param_1 + 1) = *(undefined2 *)&game_state.tribes_array[iVar2].field_0x28;
  *(undefined2 *)((int)param_1 + 10) = game_state.tribes_array[iVar2].angle_1;
  *(short *)((int)param_1 + 6) = (short)screen_coord_3_x;
  *(short *)(param_1 + 2) = (short)screen_coord_3_y;
  uVar1 = (undefined1)draw_mode;
  *(byte *)((int)param_1 + 0xd) = *(byte *)((int)param_1 + 0xd) | 1;
  *(undefined1 *)(param_1 + 3) = uVar1;
  return;
}
