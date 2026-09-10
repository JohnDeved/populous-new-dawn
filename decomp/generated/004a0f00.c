/* Ghidra 12.1.3 pseudocode; entry 004a0f00; FUN_004a0f00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a0f00(int param_1)

{
  int iVar1;

  iVar1 = *(int *)(param_1 + 99);
  if (draw_mode != 2) {
    if (iVar1 != 7) {
      if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
         ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
        func_0x00450f30(1,0,iVar1,0);
        return;
      }
      if (((DAT_009845ae == '\0') || (DAT_009846ae != '\0')) &&
         ((DAT_0098462e == '\0' || (DAT_0098472e != '\0')))) {
        func_0x00450f30(0,0,iVar1,0);
        return;
      }
      func_0x00450f30(5,0,iVar1,0);
      return;
    }
    if (game_state.tribes_array[player_tribe_num].shaman != (unit_struct *)0x0) {
      game_state.tribes_array[0]._2365_4_ = game_state.tribes_array[0]._2365_4_ | 0x800;
      if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
         ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
        func_0x00450f30(1,0,7,0);
        return;
      }
      func_0x00450f30(0,0,7,0);
    }
  }
  return;
}
