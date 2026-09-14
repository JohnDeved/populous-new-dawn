/* Ghidra 12.1.3 pseudocode; entry 0040bce0; FUN_0040bce0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0040bce0(char param_1)

{
  unit_struct *puVar1;

  for (puVar1 = game_state.tribes_array[param_1].building_units; puVar1 != (unit_struct *)0x0;
      puVar1 = puVar1->next_unit) {
    FUN_0040bd20(puVar1);
  }
  return 0;
}
