/* Ghidra 12.1.3 pseudocode; entry 00449d80; FUN_00449d80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00449ee5) */
/* WARNING: Removing unreachable block (ram,0x00449eef) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_00449d80(void)

{
  undefined2 *puVar1;
  short sVar2;
  undefined2 uVar3;
  ushort uVar4;
  short sVar5;
  uint uVar6;
  int iVar7;
  uint uVar8;
  undefined4 uStack_4;

  sVar2 = (short)game_state._838524_2_ / 2;
  if ((short)game_state._838522_2_ < sVar2) {
    iVar7 = (int)(short)game_state._838522_2_;
    if (((game_state._838670_4_ & 0x7fffffff) != 0) || ((game_state._838658_4_ & 0x7fffffff) != 0))
    {
      if ((float)game_state._838670_4_ <= (float)iVar7) {
        if ((float)game_state._838674_4_ <= (float)iVar7) {
          game_state._838662_4_ = (float)(sVar2 - iVar7) * (float)game_state._838654_4_;
        }
        else {
          game_state._838662_4_ = game_state._838658_4_;
        }
      }
      else {
        game_state._838662_4_ =
             (float)game_state._838650_4_ * (float)iVar7 + (float)game_state._838666_4_;
      }
      game_state._838662_4_ = (float)game_state._838662_4_ + (float)_DAT_0058f2f0;
    }
    iVar7 = (int)player_tribe_num;
    uVar3 = __ftol();
    game_state.tribes_array[iVar7].angle_1 = uVar3;
  }
  else {
    if (game_state._838522_2_ == sVar2) {
      game_state._838658_4_ = ABS((float)game_state._838662_4_);
      game_state._838650_4_ = ABS((float)game_state._838650_4_);
    }
    uStack_4 = (ushort)game_state._838646_2_ & 0xfffffefe;
    uVar8 = (uint)(ushort)(((byte)uStack_4 + 1) * 0x100 -
                          game_state.tribes_array[player_tribe_num].x);
    uVar6 = (uint)(ushort)((uStack_4._1_1_ + 1) * 0x100 -
                          game_state.tribes_array[player_tribe_num].y);
    if (0x7fff < uVar8) {
      uVar8 = uVar8 - 0x10000;
    }
    if (0x7fff < uVar6) {
      uVar6 = uVar6 - 0x10000;
    }
    uVar4 = calc_angle_quadrant(uVar8,-uVar6);
    sVar2 = calc_angular_diff_shortest
                      (uVar4 & 0x7ff,
                       CONCAT22((short)((uint)(player_tribe_num * 0xb) >> 0x10),
                                game_state.tribes_array[player_tribe_num].angle_1));
    sVar5 = calc_abs_angular_diff
                      (uVar4 & 0x7ff,
                       CONCAT22((short)((uint)(player_tribe_num * 0x319) >> 0x10),
                                game_state.tribes_array[player_tribe_num].angle_1));
    game_state._838658_4_ = (float)game_state._838658_4_ + (float)game_state._838650_4_;
    if (_DAT_0058f2f8 < (float)game_state._838658_4_) {
      game_state._838658_4_ = 0x43800000;
    }
    if ((float)game_state._838658_4_ < (float)(int)sVar2) {
      sVar2 = __ftol();
    }
    puVar1 = &game_state.tribes_array[player_tribe_num].angle_1;
    *puVar1 = *puVar1 + sVar2 * sVar5;
  }
  iVar7 = (int)player_tribe_num;
  _render_state_flags = _render_state_flags | 0x80;
  puVar1 = &game_state.tribes_array[iVar7].angle_1;
  *puVar1 = *puVar1 & 0x7ff;
  return CONCAT31((int3)(CONCAT22((short)((uint)(iVar7 * 0xb) >> 0x10),game_state._838524_2_) >> 8),
                  (short)game_state._838524_2_ <= (short)game_state._838522_2_);
}
