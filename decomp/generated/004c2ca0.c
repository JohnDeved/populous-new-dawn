/* Ghidra 12.1.3 pseudocode; entry 004c2ca0; FUN_004c2ca0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004c2ca0(int param_1)

{
  if (((&DAT_005a80d0)[param_1 * 0x1f] == 2) && ((game_state.field2_0x5 & 1) == 0)) {
    return 0;
  }
  return 1;
}
