/* Ghidra 12.1.3 pseudocode; entry 004b43f0; FUN_004b43f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004b43f0(void)

{
  int iVar1;
  int iVar2;
  uint uVar3;
  undefined4 local_8;
  undefined2 local_4;

  iVar1 = (int)player_tribe_num;
  if ((opened_files_flags & 8) == 0) {
    uVar3 = 0;
    if (((DAT_0098f708 & 1) == 0) && (DAT_0098f6ec != 0)) {
      uVar3 = 1;
      if (DAT_0098f6ec < 0x26) {
        if (DAT_0098f6ec < -0x25) {
          DAT_0098f6ec = DAT_0098f6ec + 0x26;
        }
        else {
          DAT_0098f6ec = 0;
        }
      }
      else {
        DAT_0098f6ec = DAT_0098f6ec + -0x26;
      }
    }
    if (((DAT_0098f708 & 2) == 0) && (DAT_0098f6f0 != 0)) {
      uVar3 = uVar3 | 2;
      if (DAT_0098f6f0 < 0x26) {
        if (DAT_0098f6f0 < -0x25) {
          DAT_0098f6f0 = DAT_0098f6f0 + 0x26;
        }
        else {
          DAT_0098f6f0 = 0;
        }
      }
      else {
        DAT_0098f6f0 = DAT_0098f6f0 + -0x26;
      }
    }
    if (((DAT_0098f708 & 4) == 0) && (DAT_0098f6f4 != 0)) {
      uVar3 = uVar3 | 4;
      if (DAT_0098f6f4 < 2) {
        if (DAT_0098f6f4 < -1) {
          DAT_0098f6f4 = DAT_0098f6f4 + 2;
        }
        else {
          DAT_0098f6f4 = 0;
        }
      }
      else {
        DAT_0098f6f4 = DAT_0098f6f4 + -2;
      }
    }
    if (((DAT_0098f708 & 8) == 0) && (DAT_0098f6f8 != 0)) {
      uVar3 = uVar3 | 8;
      if (DAT_0098f6f8 < 0x28) {
        if (DAT_0098f6f8 < -0x27) {
          DAT_0098f6f8 = DAT_0098f6f8 + 0x28;
        }
        else {
          DAT_0098f6f8 = 0;
        }
      }
      else {
        DAT_0098f6f8 = DAT_0098f6f8 + -0x28;
      }
    }
    if (((DAT_0098f708 & 8) != 0) || ((uVar3 & 8) != 0)) {
      DAT_0098f706 = 0;
    }
    if (DAT_0098f706 < 0x51) {
      DAT_0098f706 = DAT_0098f706 + 1;
    }
    else if ((DAT_0098f6fc != 0) &&
            (((DAT_0098f6ec != 0 || (DAT_0098f6f0 != 0)) || (DAT_0098f6f4 != 0)))) {
      uVar3 = uVar3 | 8;
      if (DAT_0098f6fc < 1) {
        DAT_0098f6f8 = 0x28;
      }
      else {
        DAT_0098f6f8 = -0x28;
      }
    }
    if (DAT_0098f709 != '\0') {
      DAT_0098f6f8 = 0xf0;
      uVar3 = uVar3 | 8;
    }
    DAT_0098f708 = DAT_0098f708 | (byte)uVar3;
    _DAT_0098f72a = _DAT_0098f72a | uVar3;
  }
  if ((DAT_0098f708 & 0xf) == 0) {
    return;
  }
  if ((opened_files_flags & 8) != 0) goto LAB_004b46ee;
  local_8._0_2_ = game_state.tribes_array[iVar1].x;
  local_8._2_2_ = game_state.tribes_array[iVar1].y;
  local_4 = *(undefined2 *)&game_state.tribes_array[iVar1].field_0x28;
  move_pos_angle_length
            (&local_8,CONCAT22((short)(DAT_0098f6ec >> 0x14),DAT_0098f704 + 0x200) & 0xffff07ff,
             DAT_0098f6ec >> 4);
  move_pos_angle_length
            (&local_8,CONCAT22((short)(DAT_0098f6f0 >> 0x14),DAT_0098f704) & 0xffff07ff,
             DAT_0098f6f0 >> 4);
  DAT_0098f700 = (short)local_8;
  DAT_0098f702 = local_8._2_2_;
  DAT_0098f704 = game_state.tribes_array[iVar1].angle_1 + (short)(DAT_0098f6f4 >> 2) & 0x7ff;
  iVar2 = DAT_0098f6f8 >> 2;
  if (DAT_0098f709 == '\0') {
LAB_004b46a2:
    DAT_0098f6fc = DAT_0098f6fc + iVar2;
  }
  else if (iVar2 < DAT_0098f6fc) {
    DAT_0098f6fc = DAT_0098f6fc - iVar2;
  }
  else {
    if (-DAT_0098f6fc != iVar2 && DAT_0098f6fc <= -iVar2) goto LAB_004b46a2;
    DAT_0098f709 = '\0';
    DAT_0098f6fc = 0;
    DAT_0098f6f8 = 0;
  }
  if (DAT_0098f6fc < -0x2000) {
    DAT_0098f6fc = -0x2000;
  }
  if (0x2000 < DAT_0098f6fc) {
    DAT_0098f6fc = 0x2000;
  }
  if ((DAT_0098f6fc == -0x2000) || (DAT_0098f6fc == 0x2000)) {
    DAT_0098f6f8 = 0;
  }
LAB_004b46ee:
  game_state.tribes_array[iVar1].x = DAT_0098f700;
  game_state.tribes_array[iVar1].y = DAT_0098f702;
  game_state.tribes_array[iVar1].angle_1 = DAT_0098f704;
  game_state.tribes_array[iVar1].field9_0x34 = (short)(DAT_0098f6fc >> 3);
  if ((DAT_0098f708 & 4) != 0) {
    _render_state_flags = _render_state_flags | 0x80;
  }
  if ((DAT_0098f708 & 8) != 0) {
    FUN_0041c700(DAT_0098f6fc >> 3,0x400);
  }
  return;
}
