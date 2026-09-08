/* Ghidra 12.1.3 pseudocode; entry 004ea3b0; unit_struct_set_index_to_array.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_struct_set_index_to_array(int param_1,short param_2)

{
  undefined1 *puVar1;
  int iVar2;

  iVar2 = (int)param_2;
  game_state._755254_2_ = param_2;
  if (game_state.unit_related_array_1[iVar2].counter < 1) {
    game_state._755256_2_ = game_state._755256_2_ + 1;
  }
  game_state.unit_related_array_1[iVar2].counter =
       game_state.unit_related_array_1[iVar2].counter + 1;
  *(undefined1 *)(param_1 + 0x67) = 0;
  *(short *)(param_1 + 99) = param_2;
  puVar1 = &game_state.unit_related_array_1[iVar2].flag;
  *puVar1 = *puVar1 & 0xfb;
  return;
}
