/* Ghidra 12.1.3 pseudocode; entry 004ea550; FUN_004ea550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004ea550(int param_1,byte *param_2,char *param_3)

{
  short sVar1;
  short sVar2;
  undefined4 in_EAX;
  undefined2 uVar4;
  int iVar3;
  game_state_unit_struct_1 *pgVar5;
  int iVar6;
  int iVar7;
  short local_2;

  sVar1 = *(short *)(param_1 + 99);
  uVar4 = (undefined2)((uint)in_EAX >> 0x10);
  local_2 = 0;
  if ((sVar1 != 0) &&
     (uVar4 = (undefined2)((uint)(sVar1 * 0x1b) >> 0x10),
     (game_state.unit_related_array_1[sVar1].flag & 4) != 0)) {
    local_2 = sVar1;
  }
  sVar2 = local_2;
  if (local_2 == 0) {
    iVar7 = (int)(short)game_state._755256_2_;
    iVar3 = (short)game_state._755254_2_ * 0x1b;
    uVar4 = (undefined2)((uint)iVar3 >> 0x10);
    pgVar5 = game_state.unit_related_array_1 + (short)game_state._755254_2_;
    while (sVar2 = local_2, iVar7 != 0) {
      if (pgVar5 < &game_state.field_0xb8b1e) {
        pgVar5 = (game_state_unit_struct_1 *)&game_state.field_0xc3501;
      }
      iVar7 = iVar7 + -1;
      if ((pgVar5->counter != 0) && ((pgVar5->flag & 4) == 0)) {
        iVar3 = ((int)(pgVar5 + -0x15ecc) + 0x46) / 0x6d;
        uVar4 = (undefined2)((uint)iVar3 >> 0x10);
        sVar2 = (short)iVar3 + 1;
        iVar3 = CONCAT22(uVar4,sVar2);
        if (sVar1 != sVar2) {
          if ((((pgVar5->coord_1 == *param_2) && (param_2[1] == pgVar5->coord_2)) &&
              (pgVar5->coord_3 == *param_3)) && (pgVar5->coord_4 == param_3[1])) break;
          if (((pgVar5->coord_3 == *param_3) && (pgVar5->coord_4 == param_3[1])) &&
             (((pgVar5->flag & 3) == 0 && (*(short *)(param_1 + 0x9f) == 0)))) {
            iVar6 = (uint)(byte)pgVar5->coord_1 - (uint)*param_2;
            if (iVar6 < 0) {
              iVar6 = -iVar6;
            }
            if (0x80 < iVar6) {
              iVar6 = 0x100 - iVar6;
            }
            if (iVar6 < 3) {
              iVar6 = (uint)(byte)pgVar5->coord_2 - (uint)param_2[1];
              if (iVar6 < 0) {
                iVar6 = -iVar6;
              }
              if (0x80 < iVar6) {
                iVar6 = 0x100 - iVar6;
              }
              if (iVar6 < 3) break;
            }
          }
        }
      }
      uVar4 = (undefined2)((uint)iVar3 >> 0x10);
      pgVar5 = pgVar5 + -1;
    }
  }
  local_2 = sVar2;
  return CONCAT22(uVar4,local_2);
}
