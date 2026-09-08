/* Ghidra 12.1.3 pseudocode; entry 00442920; FUN_00442920.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00442920(int param_1,int param_2)

{
  int iVar1;
  int iVar2;

  iVar1 = (int)player_tribe_num;
  iVar2 = iVar1 * 0xb;
  if ((level_flags_1._2_1_ & 0x10) != 0) {
    iVar2 = (int)(DAT_0089c6a9 * param_1 + (DAT_0089c6a9 * param_1 >> 0x1f & 0xffU)) >> 8;
    param_1 = iVar2;
  }
  move_pos_angle_length
            (iVar1 * 0xc65 + 0x89d1ec,
             CONCAT22((short)((uint)iVar2 >> 0x10),game_state.tribes_array[iVar1].angle_1),param_1);
  FUN_004e9d70(param_1,0x8000);
  if ((level_flags_2._1_1_ & 4) == 0) {
    DAT_008926c9 = 0;
    return;
  }
  DAT_008926c9 = (short)(param_2 * param_1 + (param_2 * param_1 >> 0x1f & 0xffU) >> 8);
  return;
}
