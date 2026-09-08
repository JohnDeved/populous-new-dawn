/* Ghidra 12.1.3 pseudocode; entry 00402e30; FUN_00402e30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00402e30(int param_1)

{
  if ((game_state.level_flags & 2) == 0) {
    return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
  }
  if (*(byte *)(param_1 + 0x2b) == 7) {
    return 0x27;
  }
  return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
}
