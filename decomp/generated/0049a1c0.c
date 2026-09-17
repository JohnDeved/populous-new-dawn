/* Ghidra 12.1.3 pseudocode; entry 0049a1c0; FUN_0049a1c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0049a1c0(void)

{
  undefined1 *puVar1;

  puVar1 = &game_state.tribes_array[player_tribe_num].field_0x93d;
  *(uint *)puVar1 = *(uint *)puVar1 | 0x40000;
  return;
}
