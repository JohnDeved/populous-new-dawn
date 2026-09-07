/* Ghidra 12.1.3 pseudocode; entry 00449920; FUN_00449920.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449920(int param_1)

{
  char cVar1;
  short sVar2;
  int iVar3;
  uint uVar4;

  game_state._838602_4_ = game_state._838662_4_;
  game_state._838238_1_ = game_state._838238_1_ & 0xef;
  sVar2 = calc_angular_diff_shortest
                    (CONCAT22(player_tribe_num >> 7,*(undefined2 *)(param_1 + 2)),
                     CONCAT22((short)((uint)(player_tribe_num * 0xb) >> 0x10),
                              game_state.tribes_array[player_tribe_num].angle_1));
  uVar4 = (uint)sVar2;
  sVar2 = calc_abs_angular_diff
                    (CONCAT22(player_tribe_num >> 7,*(undefined2 *)(param_1 + 2)),
                     CONCAT22((short)((uint)(player_tribe_num * 0x319) >> 0x10),
                              game_state.tribes_array[player_tribe_num].angle_1));
  iVar3 = (int)sVar2;
  cVar1 = *(char *)(param_1 + 1);
  if ((cVar1 != '\0') && ((('\0' < cVar1 && (iVar3 < 0)) || ((cVar1 < '\0' && (0 < iVar3)))))) {
    iVar3 = -iVar3;
    uVar4 = 0x800 - uVar4 & 0x7ff;
  }
  FUN_0044a070(iVar3 * uVar4,(int)(short)game_state._838516_2_,0x969d36,0x969d4a);
  return;
}
