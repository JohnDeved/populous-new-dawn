/* Ghidra 12.1.3 pseudocode; entry 0041b3f0; FUN_0041b3f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0041b3f0(char param_1,char param_2)

{
  int iVar1;

  iVar1 = (int)param_1;
  iVar1 = ((((int)*(short *)&game_state.tribes_array[iVar1].field_0xa31 *
             (int)unit_type_array_person[5].conv +
             (int)*(short *)&game_state.tribes_array[iVar1].field_0xa33 *
             (int)unit_type_array_person[6].conv +
             (int)*(short *)((int)game_state.tribes_array[iVar1].field1414_0x969 + 0xc6) *
             (int)unit_type_array_person[4].conv +
             (int)*(short *)((int)game_state.tribes_array[iVar1].field1414_0x969 + 0xc2) *
             (int)unit_type_array_person[2].conv +
            (int)*(short *)(game_state.tribes_array[iVar1].field1414_0x969 + 0x31) *
            (int)unit_type_array_person[3].conv) * 4 + 4) * 5) / 200;
  if (iVar1 < 0) {
    iVar1 = 0;
  }
  if (0x13 < iVar1) {
    iVar1 = 0x13;
  }
  iVar1 = (&DAT_005aa47c)[iVar1] * (int)*(short *)&unit_type_array_building[param_2].field_0x3c;
  return (int)(iVar1 + (iVar1 >> 0x1f & 0xffU)) >> 8;
}
