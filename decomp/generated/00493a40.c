/* Ghidra 12.1.3 pseudocode; entry 00493a40; FUN_00493a40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00493a40(void)

{
  int iVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;
  undefined4 *puVar4;

  puVar2 = (undefined4 *)&game_state.start_1;
  for (iVar1 = 0x6bdc; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar2 = 0;
    puVar2 = puVar2 + 1;
  }
  game_state._644612_4_ = 1;
  game_state._644616_4_ = 3;
  game_state._644620_4_ = 2;
  game_state._644624_4_ = 1;
  if ((int)game_state._644608_4_ < 1000) {
    if ((int)game_state._644608_4_ < 500) {
      if (299 < (int)game_state._644608_4_) {
        game_state._644616_4_ = 1;
        game_state._644624_4_ = 1;
      }
    }
    else {
      game_state._644616_4_ = 1;
      game_state._644624_4_ = 2;
    }
  }
  else {
    game_state._644616_4_ = 1;
    game_state._644624_4_ = 3;
  }
  puVar2 = (undefined4 *)&game_state.field_0x9d628;
  do {
    puVar3 = puVar2 + 6;
    puVar4 = puVar2;
    for (iVar1 = 6; iVar1 != 0; iVar1 = iVar1 + -1) {
      *puVar4 = 0;
      puVar4 = puVar4 + 1;
    }
    *(undefined1 *)((int)puVar2 + 1) = 5;
    puVar2 = puVar3;
  } while (puVar3 < game_state.unit_related_array_14B + 1);
  return;
}
