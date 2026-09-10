/* Ghidra 12.1.3 pseudocode; entry 004a1010; FUN_004a1010.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a1010(int param_1)

{
  int iVar1;

  iVar1 = *(int *)(param_1 + 99);
  if ((iVar1 == 7) && (game_state.tribes_array[player_tribe_num].shaman != (unit_struct *)0x0)) {
    game_state.tribes_array[0]._2365_4_ = game_state.tribes_array[0]._2365_4_ | 0x1000;
  }
  if (((DAT_009845bb == '\0') || (DAT_009846bb != '\0')) &&
     ((DAT_009845c7 == '\0' || (DAT_009846c7 != '\0')))) {
    func_0x004de810(iVar1,0,0);
    return;
  }
  func_0x004de810(iVar1,0,1);
  return;
}
