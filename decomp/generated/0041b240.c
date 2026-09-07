/* Ghidra 12.1.3 pseudocode; entry 0041b240; FUN_0041b240.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_0041b240(char param_1,char param_2)

{
  int iVar1;
  int iVar2;
  uint uVar3;
  int iVar4;
  int iVar5;

  iVar2 = (int)param_1;
  uVar3 = iVar2 * 0xb & 0xffffff00;
  iVar5 = 200;
  if ((game_state.tribes_array[iVar2].field_0x941 & 0x40) == 0) {
    iVar4 = (int)*(short *)(game_state.tribes_array[iVar2].field1414_0x969 + 0x31) *
            (int)unit_type_array_person[3].conv;
    iVar1 = (int)*(short *)&game_state.tribes_array[iVar2].field_0xa31 *
            (int)unit_type_array_person[5].conv +
            (int)*(short *)&game_state.tribes_array[iVar2].field_0xa33 *
            (int)unit_type_array_person[6].conv +
            (int)*(short *)((int)game_state.tribes_array[iVar2].field1414_0x969 + 0xc6) *
            (int)unit_type_array_person[4].conv +
            (int)*(short *)((int)game_state.tribes_array[iVar2].field1414_0x969 + 0xc2) *
            (int)unit_type_array_person[2].conv + 1 + iVar4;
    if (param_2 == '\0') {
      iVar4 = (int)*(short *)((int)game_state.tribes_array[iVar2].field1446_0xb7d + 6) *
              (int)(short)unit_type_array_building[3]._58_2_;
      iVar5 = (int)*(short *)((int)game_state.tribes_array[iVar2].field1446_0xb7d + 2) *
              (int)(short)unit_type_array_building[1]._58_2_ +
              (int)*(short *)(game_state.tribes_array[iVar2].field1446_0xb7d + 1) *
              (int)(short)unit_type_array_building[2]._58_2_ + iVar4 +
              *(int *)&game_state.tribes_array[iVar2].field_0x921;
      if (200 < iVar5) {
        iVar5 = 200;
      }
    }
    uVar3 = CONCAT31((int3)((uint)iVar4 >> 8),iVar1 < iVar5);
  }
  return uVar3;
}
