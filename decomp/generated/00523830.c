/* Ghidra 12.1.3 pseudocode; entry 00523830; update_sky_array.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void update_sky_array(void)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  uint uVar5;
  int iVar6;
  int iVar7;

  iVar1 = (int)player_tribe_num;
  iVar2 = (int)(short)game_state.tribes_array[iVar1].angle_1;
  iVar6 = iVar2 - sky_angle_2;
  if (0x400 < iVar6) {
    iVar6 = iVar6 + -0x800;
  }
  if (iVar6 < -0x400) {
    iVar6 = iVar6 + 0x800;
  }
  iVar4 = (int)game_state.tribes_array[iVar1].x;
  iVar3 = (((uint)(sky_tick_counter * 9) >> 9) - (int)game_state.tribes_array[iVar1].y) + sky_cam_y;
  iVar7 = (((uint)(sky_tick_counter * 0x11) >> 9) - iVar4) + sky_cam_x;
  sky_cam_y = (int)game_state.tribes_array[iVar1].y;
  if (0x8000 < iVar7) {
    iVar7 = iVar7 + -0x10000;
  }
  if (iVar7 < -0x8000) {
    iVar7 = iVar7 + 0x10000;
  }
  if (0x8000 < iVar3) {
    iVar3 = iVar3 + -0x10000;
  }
  if (iVar3 < -0x8000) {
    iVar3 = iVar3 + 0x10000;
  }
  uVar5 = sky_angle_1 - (int)(short)game_state.tribes_array[iVar1].angle_1 & 0x7ff;
  sky_cam_accu_x =
       sky_cam_accu_x +
       ((uint)((longlong)iVar7 * (longlong)maybe_cos[uVar5]) >> 0x10 |
       (int)((ulonglong)((longlong)iVar7 * (longlong)maybe_cos[uVar5]) >> 0x20) << 0x10) +
       ((uint)((longlong)iVar3 * (longlong)maybe_sin[uVar5]) >> 0x10 |
       (int)((ulonglong)((longlong)iVar3 * (longlong)maybe_sin[uVar5]) >> 0x20) << 0x10);
  sky_cam_accu_y =
       sky_cam_accu_y +
       (((uint)((longlong)iVar3 * (longlong)maybe_cos[uVar5]) >> 0x10 |
        (int)((ulonglong)((longlong)iVar3 * (longlong)maybe_cos[uVar5]) >> 0x20) << 0x10) -
       ((uint)((longlong)iVar7 * (longlong)maybe_sin[uVar5]) >> 0x10 |
       (int)((ulonglong)((longlong)iVar7 * (longlong)maybe_sin[uVar5]) >> 0x20) << 0x10));
  sky_angle_1 = sky_angle_1 + (iVar6 >> 1);
  sky_angle_1 = sky_angle_1 & 0x7ff;
  sky_angle_2 = iVar2;
  sky_cam_x = iVar4;
  fill_sky_array(sky_angle_1,(sky_cam_accu_x & 0xffff) << 9,(sky_cam_accu_y & 0xffff) << 9);
  return;
}
