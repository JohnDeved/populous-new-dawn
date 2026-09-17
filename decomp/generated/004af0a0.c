/* Ghidra 12.1.3 pseudocode; entry 004af0a0; FUN_004af0a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004af0a0(uint param_1)

{
  uint uVar1;
  int iVar2;
  undefined4 *puVar3;
  undefined1 local_c [12];

  uVar1 = level_flags_1;
  if (DAT_005cdb78 == '\0') {
    DAT_0089c6b5 = 0;
    level_flags_1 = level_flags_1 & 0xf7ffffff;
    DAT_0089c6b1 = DAT_0089c6b1 | param_1;
    if ((uVar1 & 0x10000000) == 0) {
      level_flags_1 = level_flags_1 | 0x10000000;
      do {
        iVar2 = FUN_00526c10(local_c);
      } while (iVar2 != 0);
      puVar3 = &DAT_0098e928;
      for (iVar2 = 0x40; iVar2 != 0; iVar2 = iVar2 + -1) {
        *puVar3 = 0;
        puVar3 = puVar3 + 1;
      }
      puVar3 = (undefined4 *)&DAT_00984591;
      for (iVar2 = 0x40; iVar2 != 0; iVar2 = iVar2 + -1) {
        *puVar3 = 0;
        puVar3 = puVar3 + 1;
      }
      puVar3 = (undefined4 *)&DAT_00984691;
      for (iVar2 = 0x40; iVar2 != 0; iVar2 = iVar2 + -1) {
        *puVar3 = 0;
        puVar3 = puVar3 + 1;
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
      return;
    }
  }
  else {
    level_flags_1 = level_flags_1 | 0x8000000;
    DAT_0089c6b5 = DAT_0089c6b5 | param_1;
  }
  return;
}
