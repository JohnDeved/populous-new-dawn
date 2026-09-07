/* Ghidra 12.1.3 pseudocode; entry 00449320; FUN_00449320.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449320(void)

{
  short *psVar1;
  code *pcVar2;
  char cVar3;
  int iVar4;
  uint uVar5;
  byte *pbVar6;
  char *pcVar7;
  char *pcVar8;
  undefined4 local_4;

  if (((game_state._838239_1_ & 1) != 0) && (((byte)land_flags_1 & 2) == 0)) {
    if (game_state._838236_1_ == '\0') {
      for (pbVar6 = (byte *)(game_state.start_14 + (uint)game_state.start_15 * 2 + 0x46);
          (((game_state._838239_1_ & 8) == 0 &&
           ((int)(uint)game_state.start_15 < (int)game_state.start_15_count)) &&
          ((*pbVar6 != 0 && (*(short *)(pbVar6 + 4) <= (short)game_state._838248_2_))));
          pbVar6 = pbVar6 + 8) {
        game_state._838238_1_ = game_state._838238_1_ | '\x01' << (*pbVar6 & 0x1f);
        *(undefined2 *)(&game_state.field_0xccb6c + (uint)*pbVar6 * 4) = *(undefined2 *)(pbVar6 + 6)
        ;
        *(undefined2 *)(&game_state.start_16 + (uint)*pbVar6 * 4) = 0;
        if (*(code **)(&DAT_0059cd40 + (uint)*pbVar6 * 8) != (code *)0x0) {
          (**(code **)(&DAT_0059cd40 + (uint)*pbVar6 * 8))(pbVar6);
        }
        game_state.start_15 = game_state.start_15 + 1;
      }
      if (*(char *)(game_state.start_14 + (uint)game_state.start_15 * 2 + 0x46) == '\0') {
        game_state._838239_1_ = game_state._838239_1_ | 0x48;
      }
      uVar5 = 1;
      do {
        if ((1 << ((byte)uVar5 & 0x1f) & (uint)(byte)game_state._838238_1_) != 0) {
          local_4 = uVar5 & 0xff;
          pcVar2 = *(code **)(local_4 * 8 + 0x59cd44);
          if (pcVar2 == (code *)0x0) {
            cVar3 = '\x01';
          }
          else {
            cVar3 = (*pcVar2)();
          }
          *(short *)(&game_state.start_16 + local_4 * 4) =
               *(short *)(&game_state.start_16 + local_4 * 4) + 1;
          if (cVar3 != '\0') {
            game_state._838238_1_ = game_state._838238_1_ & ~('\x01' << ((byte)uVar5 & 0x1f));
          }
        }
        uVar5 = uVar5 + 1;
      } while ((int)uVar5 < 7);
      game_state._838248_2_ = game_state._838248_2_ + 1;
      if (((game_state._838239_1_ & 8) != 0) && (game_state._838238_1_ == '\0')) {
        game_state._838239_1_ = game_state._838239_1_ & 0xfe;
        FUN_0049cfa0(1);
        psVar1 = &game_state.tribes_array[player_tribe_num].field9_0x34;
        if (*psVar1 != 0) {
          *psVar1 = 0;
          FUN_00479f00(0xc,0,0);
        }
        FUN_004af1c0(0x40);
      }
      if (((game_state._838239_1_ & 0x40) != 0) && ((game_state._838239_1_ & 0x80) == 0)) {
        local_4 = CONCAT31(local_4._1_3_,
                           (char)((ushort)game_state.tribes_array[player_tribe_num].x >> 8)) &
                  0xfffffffe;
        local_4 = CONCAT22(local_4._2_2_,
                           CONCAT11((char)((ushort)game_state.tribes_array[player_tribe_num].y >> 8)
                                    ,(undefined1)local_4)) & 0xfffffeff;
        iVar4 = FUN_00450590(local_4,game_state._842014_4_);
        if (iVar4 < 0x91) {
          FUN_004af1c0(0x40);
          game_state._838239_1_ = game_state._838239_1_ | 0x80;
          return;
        }
      }
    }
    else {
      DAT_0059cd3c = DAT_0059cd3c + maybe_framerate;
      DAT_0059cd3c = DAT_0059cd3c / 2;
      game_state._838236_1_ = game_state._838236_1_ + -1;
      if (game_state._838236_1_ == '\0') {
        game_state._838237_1_ = SUB41(DAT_0059cd3c,0);
        game_state._838248_2_ = 0;
        if ((char)game_state._838237_1_ < '\b') {
          game_state._838237_1_ = 8;
        }
        if ('\x18' < (char)game_state._838237_1_) {
          game_state._838237_1_ = 0x18;
        }
        pcVar7 = &game_state.start_15_1;
        do {
          if (*pcVar7 == '\0') break;
          pcVar8 = pcVar7 + 8;
          *(short *)(pcVar7 + 4) =
               (short)(((int)(char)game_state._838237_1_ * (int)*(short *)(pcVar7 + 4)) / 10);
          *(short *)(pcVar7 + 6) =
               (short)(((int)(char)game_state._838237_1_ * (int)*(short *)(pcVar7 + 6)) / 10);
          pcVar7 = pcVar8;
        } while (pcVar8 < &game_state.start_16);
        if (((draw_mode == 2) || (DAT_0089ce36 != '\0')) && (DAT_0089bbf7 != '\x01')) {
          DAT_0089ce36 = '\0';
          DAT_0089ce35 = 0;
          DAT_005fe420 = 0;
          DAT_0089ce34 = 0;
          FUN_0041cdc0((int)(short)game_state.tribes_array[player_tribe_num].angle_1);
          DAT_0089c6eb = 0;
          FUN_0041d4b0(0);
        }
        psVar1 = &game_state.tribes_array[player_tribe_num].field9_0x34;
        *psVar1 = *psVar1 << 6;
      }
    }
  }
  return;
}
