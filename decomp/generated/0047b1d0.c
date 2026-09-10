/* Ghidra 12.1.3 pseudocode; entry 0047b1d0; FUN_0047b1d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0047b25f) */
/* WARNING: Removing unreachable block (ram,0x0047b265) */
/* WARNING: Removing unreachable block (ram,0x0047b281) */
/* WARNING: Removing unreachable block (ram,0x0047b289) */

undefined1 FUN_0047b1d0(int param_1,undefined4 param_2,char param_3)

{
  bool bVar1;
  undefined1 uVar2;
  int iVar3;
  int iVar4;
  ushort *puVar5;
  undefined1 local_1;

  local_1 = 0;
  switch(*(undefined1 *)(param_1 + 0x2a)) {
  case 1:
    if (*(char *)(param_1 + 0x2f) != player_tribe_num) {
      iVar4 = (int)player_tribe_num;
      iVar3 = FUN_004de720(param_1);
      if (iVar3 != iVar4) {
        return 0;
      }
      if ((land_flags_1._1_1_ & 8) != 0) {
        return 0;
      }
                    /* WARNING: Could not recover jumptable at 0x0047b258. Too many branches */
                    /* WARNING: Treating indirect jump as call */
      uVar2 = (*(code *)(&PTR_LAB_0047b3fc)[DAT_0047b45a])();
      return uVar2;
    }
    local_1 = FUN_00504060(param_1,param_2);
    if (param_3 == '\0') {
      return local_1;
    }
    goto LAB_0047b3c1;
  default:
    goto switchD_0047b1f7_caseD_2;
  case 4:
    bVar1 = true;
    iVar3 = 0;
    if (*(char *)(param_1 + 0x9e) != '\0') {
      bVar1 = false;
      if ('\0' < (char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8) {
        puVar5 = (ushort *)(param_1 + 0x7a);
        do {
          if (bVar1) goto LAB_0047b31c;
          if ((unit_land_array[*puVar5] != (unit_struct *)0x0) &&
             (unit_land_array[*puVar5]->tribe_index == player_tribe_num)) {
            bVar1 = true;
          }
          puVar5 = puVar5 + 1;
          iVar3 = iVar3 + 1;
        } while (iVar3 < (char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8);
      }
    }
    if (!bVar1) {
      return 0;
    }
LAB_0047b31c:
    local_1 = FUN_00504060(param_1,param_2);
    break;
  case 5:
    if (*(byte *)(param_1 + 0x2b) == 9) {
      iVar3 = FUN_00508f70(param_1);
      if (iVar3 == 0) {
        return 0;
      }
      if (*(int *)(iVar3 + 0x9a) < 1) {
        return 0;
      }
      local_1 = FUN_00504060(param_1,param_2);
    }
    else {
      if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags_1 & 4) == 0) {
        return 0;
      }
      local_1 = FUN_00504060(param_1,param_2);
    }
    break;
  case 10:
    if (*(char *)(param_1 + 0x2b) != '\x10') {
      return 0;
    }
    local_1 = FUN_00504060(param_1,param_2);
  }
  if (param_3 != '\0') {
LAB_0047b3c1:
    FUN_004afff0(0,*(undefined2 *)(param_1 + 0x24));
  }
switchD_0047b1f7_caseD_2:
  return local_1;
}
