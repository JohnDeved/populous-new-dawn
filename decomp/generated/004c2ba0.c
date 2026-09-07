/* Ghidra 12.1.3 pseudocode; entry 004c2ba0; check_struct_56B_field_16.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 check_struct_56B_field_16(int param_1,int param_2)

{
  undefined1 uVar1;

  uVar1 = 0;
  if ((param_2 != 0) &&
     ((game_state.array_56b_4[param_1].field10_0x10 & 1 << ((char)param_2 - 1U & 0x1f)) == 0)) {
    uVar1 = 1;
  }
  return uVar1;
}
