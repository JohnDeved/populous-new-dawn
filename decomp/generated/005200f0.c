/* Ghidra 12.1.3 pseudocode; entry 005200f0; get_unit_circle_length.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint get_unit_circle_length(int param_1)

{
  int iVar1;
  uint uVar2;

  if ((game_state.level_flags & 2) == 0) {
    iVar1 = (int)(short)((int)((int)*(short *)(param_1 + 0x41) +
                              ((int)*(short *)(param_1 + 0x41) >> 0x1f & 0x7fU)) >> 7);
    if (iVar1 < 0) {
      iVar1 = 0;
    }
    if (7 < iVar1) {
      iVar1 = 7;
    }
    uVar2 = (int)((&DAT_005aa558)[iVar1] * (uint)(byte)unit_type_array_person[6]._24_1_ +
                 ((int)((&DAT_005aa558)[iVar1] * (uint)(byte)unit_type_array_person[6]._24_1_) >>
                  0x1f & 0xffU)) >> 8;
    iVar1 = get_adjacent_unit(param_1,4);
    if (iVar1 != 0) {
      uVar2 = uVar2 + 4;
    }
    return uVar2 | 1;
  }
  return 0x13;
}
