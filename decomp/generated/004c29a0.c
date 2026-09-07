/* Ghidra 12.1.3 pseudocode; entry 004c29a0; get_struct_56B_spell_type.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char get_struct_56B_spell_type(int param_1,int param_2)

{
  char cVar1;
  uint uVar2;
  byte bVar3;

  cVar1 = '\0';
  bVar3 = *(byte *)(param_1 + 0x96071e + param_2 * 0x38) & 0xf;
  if ((game_state.level_flags & 0x20) != 0) {
    if (((&DAT_005a80fe)[param_1 * 0x3e] != '\0') && (bVar3 != 0)) {
      return '\x03';
    }
    return '\0';
  }
  uVar2 = game_state.array_56b_4[param_2].spells & 1 << ((byte)param_1 & 0x1f);
  if ((uVar2 != 0) || (bVar3 != 0)) {
    if ((bVar3 == 0) && ((game_state.tribes_array[param_2].field_0x93d & 8) == 0)) {
      return (uVar2 == 0) + '\x01';
    }
    cVar1 = '\x03';
  }
  return cVar1;
}
