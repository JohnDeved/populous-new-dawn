/* Ghidra 12.1.3 pseudocode; entry 004c2d50; FUN_004c2d50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004c2d50(int param_1)

{
  if ((game_state.level_flags & 0x20) != 0) {
    return (&DAT_005a80fe)[param_1 * 0x3e];
  }
  return (&DAT_005a80fd)[param_1 * 0x3e];
}
