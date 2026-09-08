/* Ghidra 12.1.3 pseudocode; entry 004424b0; FUN_004424b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004424b0(byte param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;

  land_flags_1 = land_flags_1 & 0xffffbfff;
  if ((param_1 & 0x3f) != 0) {
    if ((param_1 & 0x30) != 0) {
      FUN_00417c00(0);
      FUN_00419a60(0,0,0);
      DAT_0089ce35 = 0;
      if (maybe_framerate < 0x14) {
        DAT_008926c7 = 0x20;
      }
      else {
        DAT_008926c7 = (short)(0x280 / (longlong)maybe_framerate);
      }
      if ((param_1 & 0x20) == 0) {
        DAT_008926c7 = -DAT_008926c7;
      }
    }
    if ((param_1 & 3) != 0) {
      game_state._838940_1_ = 0;
      game_state._838943_1_ = game_state._838943_1_ & 0xfd;
      FUN_00448fa0();
      land_flags_1 = land_flags_1 | 0x4000;
      DAT_0089bc17 = 0;
      if ((param_1 & 0x40) == 0) {
        if (maybe_framerate < 0x14) {
          DAT_008926c9 = 0x180;
        }
        else {
          DAT_008926c9 = (short)(0x1e00 / (longlong)maybe_framerate);
        }
      }
      else if (maybe_framerate < 0x14) {
        DAT_008926c9 = 0x600;
      }
      else {
        DAT_008926c9 = (short)(0x1e00 / (longlong)maybe_framerate) << 2;
      }
      if ((param_1 & 1) == 0) {
        DAT_008926c9 = -DAT_008926c9;
      }
      add_globe_tex_struct_x_y(0,(int)DAT_008926c9);
    }
    if ((param_1 & 0xc) != 0) {
      game_state._838940_1_ = 0;
      game_state._838943_1_ = game_state._838943_1_ & 0xfd;
      FUN_00448fa0();
      land_flags_1 = land_flags_1 | 0x4000;
      DAT_0089bc17 = 0;
      if ((param_1 & 0x40) == 0) {
        if (maybe_framerate < 0x14) {
          DAT_008926cb = 0x180;
        }
        else {
          DAT_008926cb = (short)(0x1e00 / (longlong)maybe_framerate);
        }
      }
      else if (maybe_framerate < 0x14) {
        DAT_008926cb = 0x600;
      }
      else {
        DAT_008926cb = (short)(0x1e00 / (longlong)maybe_framerate) << 2;
      }
      if ((param_1 & 4) == 0) {
        DAT_008926cb = -DAT_008926cb;
      }
      add_globe_tex_struct_x_y(-(int)DAT_008926cb,0);
    }
  }
  iVar2 = DAT_00895dad * 8 + 0x78;
  if (iVar2 < 0) {
    iVar2 = 0;
  }
  if (0xff < iVar2) {
    iVar2 = 0xff;
  }
  if (DAT_008926c7 != 0) {
    iVar3 = (int)DAT_008926c7;
    if ((level_flags_1._2_1_ & 0x10) != 0) {
      iVar3 = (int)(iVar3 * DAT_0089c6a9 + (iVar3 * DAT_0089c6a9 >> 0x1f & 0xffU)) >> 8;
    }
    game_state.tribes_array[player_tribe_num].angle_1 =
         game_state.tribes_array[player_tribe_num].angle_1 + (short)iVar3 & 0x7ff;
    FUN_004e9d60(-iVar3,0x800);
    _render_state_flags = _render_state_flags | 0x80;
    if ((level_flags_2._1_1_ & 4) == 0) {
      DAT_008926c7 = 0;
    }
    else {
      DAT_008926c7 = (short)(iVar3 * iVar2 + (iVar3 * iVar2 >> 0x1f & 0xffU) >> 8);
    }
  }
  if (DAT_008926c9 != 0) {
    iVar1 = (int)player_tribe_num;
    iVar3 = iVar1 * 0xb;
    iVar4 = (int)DAT_008926c9;
    if ((level_flags_1._2_1_ & 0x10) != 0) {
      iVar3 = DAT_0089c6a9 * DAT_008926c9;
      iVar3 = (int)(iVar3 + (iVar3 >> 0x1f & 0xffU)) >> 8;
      iVar4 = iVar3;
    }
    move_pos_angle_length
              (iVar1 * 0xc65 + 0x89d1ec,
               CONCAT22((short)((uint)iVar3 >> 0x10),game_state.tribes_array[iVar1].angle_1),iVar4);
    FUN_004e9d70(iVar4,0x8000);
    if ((level_flags_2._1_1_ & 4) == 0) {
      DAT_008926c9 = 0;
    }
    else {
      DAT_008926c9 = (short)(iVar4 * iVar2 + (iVar4 * iVar2 >> 0x1f & 0xffU) >> 8);
    }
  }
  if (DAT_008926cb != 0) {
    iVar1 = (int)player_tribe_num;
    iVar3 = iVar1 * 0xb;
    iVar4 = (int)DAT_008926cb;
    if ((level_flags_1._2_1_ & 0x10) != 0) {
      iVar3 = DAT_0089c6a9 * DAT_008926cb;
      iVar3 = (int)(iVar3 + (iVar3 >> 0x1f & 0xffU)) >> 8;
      iVar4 = iVar3;
    }
    move_pos_angle_length
              (iVar1 * 0xc65 + 0x89d1ec,
               CONCAT22((short)((uint)iVar3 >> 0x10),game_state.tribes_array[iVar1].angle_1 + -0x200
                       ) & 0xffff07ff,iVar4);
    FUN_004e9d60(iVar4,0x8000);
    if ((level_flags_2._1_1_ & 4) != 0) {
      DAT_008926cb = (short)(iVar4 * iVar2 + (iVar4 * iVar2 >> 0x1f & 0xffU) >> 8);
      return;
    }
    DAT_008926cb = 0;
  }
  return;
}
