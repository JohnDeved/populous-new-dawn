/* Ghidra 12.1.3 pseudocode; entry 004ea460; update_gs_unit_related_array_item.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void update_gs_unit_related_array_item(int param_1)

{
  short sVar1;
  int iVar2;

  iVar2 = (int)*(short *)(param_1 + 99);
  if (iVar2 != 0) {
    *(undefined1 *)(param_1 + 0x67) = 0;
    *(undefined2 *)(param_1 + 99) = 0;
    sVar1 = game_state.unit_related_array_1[iVar2].counter;
    if (((0 < sVar1) &&
        (sVar1 = sVar1 + -1, game_state.unit_related_array_1[iVar2].counter = sVar1, sVar1 < 1)) &&
       (game_state._755256_2_ = game_state._755256_2_ + -1,
       (game_state.unit_related_array_1[iVar2].flag & 4) == 0)) {
      game_state.unit_related_array_1[iVar2].flag = 0;
    }
  }
  return;
}
