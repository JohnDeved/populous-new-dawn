/* Ghidra 12.1.3 pseudocode; entry 0041ad70; FUN_0041ad70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041ad70(char param_1,int *param_2,int *param_3,int *param_4)

{
  char cVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int *piVar6;
  short *psVar7;
  int local_14;
  int local_10;
  int local_c;
  int local_8;

  local_10 = 0;
  iVar4 = 1;
  piVar6 = &DAT_005a8112;
  psVar7 = &DAT_005a810e;
  local_c = 0;
  local_8 = 0;
  local_14 = 0;
  do {
    if ((*psVar7 != 0) &&
       (iVar5 = (int)param_1,
       (game_state.array_56b_4[iVar5].spells & 1 << ((byte)iVar4 & 0x1f)) != 0)) {
      cVar1 = FUN_004c2ca0(iVar4);
      if (cVar1 != '\0') {
        iVar2 = FUN_004c2d50(iVar4);
        iVar3 = struct_56B_get_spell_array_val(iVar5,iVar4);
        if (iVar3 < iVar2) {
          iVar5 = check_struct_56B_field_16(iVar5,iVar4);
          if (iVar5 == 0) {
            local_c = local_c + 1;
          }
          else {
            local_10 = local_10 + 1;
            if (local_14 < *piVar6) {
              local_14 = *piVar6;
              local_8 = iVar4;
            }
          }
        }
      }
    }
    piVar6 = (int *)((int)piVar6 + 0x3e);
    iVar4 = iVar4 + 1;
    psVar7 = psVar7 + 0x1f;
  } while (piVar6 < (int *)0x5a85eb);
  if (param_2 != (int *)0x0) {
    *param_2 = local_10;
  }
  if (param_3 != (int *)0x0) {
    *param_3 = local_c;
  }
  if (param_4 != (int *)0x0) {
    *param_4 = local_8;
  }
  return;
}
