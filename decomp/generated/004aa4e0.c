/* Ghidra 12.1.3 pseudocode; entry 004aa4e0; FUN_004aa4e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004aa4e0(void)

{
  uint uVar1;
  uint uVar2;
  char cVar3;
  int iVar4;
  undefined4 *puVar5;
  byte bVar6;
  undefined1 local_c [12];

  iVar4 = FUN_004b2670();
  if (iVar4 != 0) {
    bVar6 = (DAT_0098e91c & 3) != 0;
    if ((DAT_0098e91c & 0xc) != 0) {
      bVar6 = bVar6 | 2;
    }
    if ((DAT_0098e91c & 0x30) != 0) {
      bVar6 = bVar6 | 4;
    }
    puVar5 = (undefined4 *)FUN_004ffb90();
    screen_coord_3_x = *puVar5;
    screen_coord_3_y = puVar5[1];
    FUN_004ad9a0();
    if ((level_flags_1 & 0x10000000) == 0) {
      puVar5 = (undefined4 *)FUN_004ffb90();
      DAT_00684208 = *puVar5;
      DAT_0068420c = puVar5[1];
      DAT_0059cd80 = (uint)DAT_0098ea18;
      DAT_0059cd84 = (uint)DAT_0098ea19;
      FUN_0044b130();
      cVar3 = FUN_0044db60();
      if (cVar3 == '\0') {
        iVar4 = FUN_0044b060();
        if (iVar4 == 0) {
          FUN_004af340();
        }
        FUN_0044b070();
        FUN_0044b090();
      }
      set_input_command_handler(&PTR_FUN_005cdb98,0,0);
      uVar2 = DAT_0089c6b5;
      uVar1 = level_flags_1;
      if ((level_flags_1 & 0x8000000) != 0) {
        if (DAT_005cdb78 == '\0') {
          DAT_0089c6b5 = 0;
          level_flags_1 = level_flags_1 & 0xf7ffffff;
          DAT_0089c6b1 = DAT_0089c6b1 | uVar2;
          if ((uVar1 & 0x10000000) == 0) {
            level_flags_1 = level_flags_1 | 0x10000000;
            do {
              iVar4 = FUN_00526c10(local_c);
            } while (iVar4 != 0);
            puVar5 = &DAT_0098e928;
            for (iVar4 = 0x40; iVar4 != 0; iVar4 = iVar4 + -1) {
              *puVar5 = 0;
              puVar5 = puVar5 + 1;
            }
            puVar5 = (undefined4 *)&DAT_00984591;
            for (iVar4 = 0x40; iVar4 != 0; iVar4 = iVar4 + -1) {
              *puVar5 = 0;
              puVar5 = puVar5 + 1;
            }
            puVar5 = (undefined4 *)&DAT_00984691;
            for (iVar4 = 0x40; iVar4 != 0; iVar4 = iVar4 + -1) {
              *puVar5 = 0;
              puVar5 = puVar5 + 1;
            }
            global_data_3 = 0;
            _DAT_00984568 = 0;
            _DAT_00984564 = 0;
            DAT_0098456c = 0;
            DAT_00984574 = 0;
            _DAT_00984570 = 0;
            if (DAT_0089c6e7 == '\a') {
              FUN_004b9150();
              FUN_004ba5d0();
            }
            FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
            DAT_0098e910 = 0;
            DAT_0089ce6c = 0;
            DAT_0098e908 = DAT_0098e908 & 0xf3ff;
          }
        }
        else {
          level_flags_1 = level_flags_1 | 0x8000000;
        }
      }
      if ((level_flags_1 & 0x4000000) != 0) {
        FUN_004af1c0(DAT_0089c6b5);
      }
      FUN_00489520(&DAT_0098e928,bVar6);
      FUN_004adbb0();
      screen_shot_1();
      FUN_0041ce30();
    }
    else {
      FUN_0044db60();
      set_input_command_handler(&PTR_FUN_005cdb98,0,0);
      uVar2 = DAT_0089c6b5;
      uVar1 = level_flags_1;
      if ((level_flags_1 & 0x8000000) != 0) {
        if (DAT_005cdb78 == '\0') {
          DAT_0089c6b5 = 0;
          level_flags_1 = level_flags_1 & 0xf7ffffff;
          DAT_0089c6b1 = DAT_0089c6b1 | uVar2;
          if ((uVar1 & 0x10000000) == 0) {
            level_flags_1 = level_flags_1 | 0x10000000;
            do {
              iVar4 = FUN_00526c10(local_c);
            } while (iVar4 != 0);
            puVar5 = &DAT_0098e928;
            for (iVar4 = 0x40; iVar4 != 0; iVar4 = iVar4 + -1) {
              *puVar5 = 0;
              puVar5 = puVar5 + 1;
            }
            puVar5 = (undefined4 *)&DAT_00984591;
            for (iVar4 = 0x40; iVar4 != 0; iVar4 = iVar4 + -1) {
              *puVar5 = 0;
              puVar5 = puVar5 + 1;
            }
            puVar5 = (undefined4 *)&DAT_00984691;
            for (iVar4 = 0x40; iVar4 != 0; iVar4 = iVar4 + -1) {
              *puVar5 = 0;
              puVar5 = puVar5 + 1;
            }
            global_data_3 = 0;
            _DAT_00984568 = 0;
            _DAT_00984564 = 0;
            DAT_0098456c = 0;
            DAT_00984574 = 0;
            _DAT_00984570 = 0;
            if (DAT_0089c6e7 == '\a') {
              FUN_004b9150();
              FUN_004ba5d0();
            }
            FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
            DAT_0098e910 = 0;
            DAT_0098e908 = DAT_0098e908 & 0xf3ff;
            DAT_0089ce6c = 0;
          }
        }
        else {
          level_flags_1 = level_flags_1 | 0x8000000;
        }
      }
      if ((level_flags_1 & 0x4000000) != 0) {
        FUN_004af1c0(DAT_0089c6b5);
      }
    }
    opened_files_flags = opened_files_flags & 0xbfff;
    iVar4 = FUN_00451370(2);
    if ((iVar4 == 0) || (global_data_3 == 0)) {
      iVar4 = FUN_00451370(4);
      if ((iVar4 != 0) && (global_data_3 != 0)) {
        FUN_00486b40();
      }
    }
    else {
      FUN_0045ea00();
    }
    land_flags_1 = land_flags_1 & 0xfffff7ff;
    DAT_00984898 = 0;
    global_data_3 = 0;
    _DAT_00984568 = 0;
    _DAT_00984564 = 0;
    DAT_0098456c = 0;
    DAT_00984574 = 0;
    _DAT_00984570 = 0;
  }
  return;
}
