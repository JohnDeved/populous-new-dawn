/* Ghidra 12.1.3 pseudocode; entry 00449c40; FUN_00449c40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00449cbe) */
/* WARNING: Removing unreachable block (ram,0x00449cc8) */

void FUN_00449c40(int param_1)

{
  ushort uVar1;
  short sVar2;
  short sVar3;
  uint uVar4;
  uint uVar5;
  undefined2 uStack_2;

  game_state._838662_4_ = game_state._838602_4_;
  game_state._838238_1_ = game_state._838238_1_ & 0xfb;
  game_state._838646_2_ = *(undefined2 *)(param_1 + 2);
  uStack_2 = *(ushort *)(param_1 + 2) & 0xfffe;
  uVar1 = uStack_2;
  uStack_2._1_1_ = (byte)(uStack_2 >> 8) & 0xfe;
  uVar5 = (uint)(ushort)(uVar1 * 0x100 - game_state.tribes_array[player_tribe_num].x);
  uVar4 = (uint)(ushort)((ushort)uStack_2._1_1_ * 0x100 -
                        game_state.tribes_array[player_tribe_num].y);
  if (0x7fff < uVar5) {
    uVar5 = uVar5 - 0x10000;
  }
  if (0x7fff < uVar4) {
    uVar4 = uVar4 - 0x10000;
  }
  uVar1 = calc_angle_quadrant(uVar5,-uVar4);
  sVar2 = calc_angular_diff_shortest
                    (uVar1 & 0x7ff,
                     CONCAT22(player_tribe_num >> 7,
                              game_state.tribes_array[player_tribe_num].angle_1));
  sVar3 = calc_abs_angular_diff
                    (uVar1 & 0x7ff,
                     CONCAT22(player_tribe_num >> 7,
                              game_state.tribes_array[player_tribe_num].angle_1));
  FUN_0044a070((int)sVar3 * (int)sVar2,(int)((short)game_state._838524_2_ / 2),0x969d72,0x969d86);
  return;
}
