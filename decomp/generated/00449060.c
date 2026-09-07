/* Ghidra 12.1.3 pseudocode; entry 00449060; FUN_00449060.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449060(char param_1)

{
  if (param_1 != '\0') {
    game_state._838239_1_ = game_state._838239_1_ | 0x10;
    return;
  }
  game_state._838239_1_ = game_state._838239_1_ & 0xef;
  return;
}
