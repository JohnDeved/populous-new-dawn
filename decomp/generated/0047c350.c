/* Ghidra 12.1.3 pseudocode; entry 0047c350; FUN_0047c350.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0047c392) */
/* WARNING: Removing unreachable block (ram,0x0047c398) */
/* WARNING: Removing unreachable block (ram,0x0047c3b4) */
/* WARNING: Removing unreachable block (ram,0x0047c3b8) */
/* WARNING: Removing unreachable block (ram,0x0047c46c) */
/* WARNING: Removing unreachable block (ram,0x0047c472) */
/* WARNING: Removing unreachable block (ram,0x0047c48e) */
/* WARNING: Removing unreachable block (ram,0x0047c492) */

void FUN_0047c350(byte param_1,char param_2,char param_3)

{
  unit_struct *puVar1;
  bool bVar2;

  if (param_2 == '\0') {
    if ((land_flags_1._1_1_ & 8) == 0) {
                    /* WARNING: Could not recover jumptable at 0x0047c465. Too many branches */
                    /* WARNING: Treating indirect jump as call */
      (*(code *)(&PTR_LAB_0047c528)[DAT_0047c57e])();
      return;
    }
  }
  else {
    if ((land_flags_1._1_1_ & 8) == 0) {
                    /* WARNING: Could not recover jumptable at 0x0047c38b. Too many branches */
                    /* WARNING: Treating indirect jump as call */
      (*(code *)(&PTR_LAB_0047c4c4)[DAT_0047c51b])();
      return;
    }
    if (param_3 != '\0') {
      bVar2 = false;
      for (puVar1 = game_state.tribes_array[player_tribe_num].person_units;
          puVar1 != (unit_struct *)0x0; puVar1 = puVar1->next_unit) {
        if ((*(byte *)&puVar1->loc_1_x & '\x01' << (param_1 & 0x1f)) != 0) {
          bVar2 = true;
          break;
        }
      }
      if (bVar2) {
        FUN_00417ca0(&puVar1->pos,0xffffffff,0);
        FUN_00504590(puVar1,0);
      }
    }
  }
  if (('\0' < (char)param_1) && ((&DAT_0089d167)[(char)param_1] != -1)) {
    (&DAT_0089d167)[(char)param_1] = '\x06';
  }
  return;
}
