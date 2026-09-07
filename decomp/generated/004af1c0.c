/* Ghidra 12.1.3 pseudocode; entry 004af1c0; FUN_004af1c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004af1c0(uint param_1)

{
  bool bVar1;
  uint uVar2;
  int iVar3;
  undefined4 *puVar4;
  undefined1 local_c [12];

  uVar2 = level_flags_1;
  if (DAT_005cdb78 == '\0') {
    bVar1 = true;
    DAT_0089c6b5 = 0;
    level_flags_1 = level_flags_1 & 0xfbffffff;
    DAT_0089c6b1 = DAT_0089c6b1 & ~param_1;
    if (((param_1 & 1) == 0) && (DAT_0089c6b1 != 0)) {
      bVar1 = false;
    }
    if (bVar1) {
      DAT_0089c6b1 = 0;
      if ((uVar2 & 0x10000000) != 0) {
        level_flags_1 = uVar2 & 0xcbffffff;
        do {
          iVar3 = FUN_00526c10(local_c);
        } while (iVar3 != 0);
        puVar4 = &DAT_0098e928;
        for (iVar3 = 0x40; iVar3 != 0; iVar3 = iVar3 + -1) {
          *puVar4 = 0;
          puVar4 = puVar4 + 1;
        }
        puVar4 = (undefined4 *)&DAT_00984591;
        for (iVar3 = 0x40; iVar3 != 0; iVar3 = iVar3 + -1) {
          *puVar4 = 0;
          puVar4 = puVar4 + 1;
        }
        puVar4 = (undefined4 *)&DAT_00984691;
        for (iVar3 = 0x40; iVar3 != 0; iVar3 = iVar3 + -1) {
          *puVar4 = 0;
          puVar4 = puVar4 + 1;
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
        DAT_0098e908 = DAT_0098e908 & 0xf3ff;
        DAT_0098e910 = 0;
        DAT_0089ce6c = 0;
      }
      iVar3 = (int)player_tribe_num;
      if ((0 < *(int *)&game_state.tribes_array[iVar3].field_0x92d) ||
         (0 < *(int *)&game_state.tribes_array[iVar3].field_0x931)) {
        FUN_0047a550(0xc,iVar3 * 0xc65 + 0x89d1c8);
        return;
      }
    }
  }
  else {
    level_flags_1 = level_flags_1 | 0x4000000;
    DAT_0089c6b5 = DAT_0089c6b5 | param_1;
  }
  return;
}
