/* Ghidra 12.1.3 pseudocode; entry 0041b550; FUN_0041b550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041b550(char param_1,int param_2,int param_3)

{
  if (param_1 != -1) {
    *(int *)(&game_state.field_0xccc4e + (param_2 + param_1 * 0xc) * 4) =
         *(int *)(&game_state.field_0xccc4e + (param_2 + param_1 * 0xc) * 4) + param_3;
  }
  return;
}
