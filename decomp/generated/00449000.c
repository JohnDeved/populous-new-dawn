/* Ghidra 12.1.3 pseudocode; entry 00449000; FUN_00449000.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449000(void)

{
  short *psVar1;

  game_state._838239_1_ = game_state._838239_1_ & 0xfe;
  FUN_0049cfa0(1);
  psVar1 = &game_state.tribes_array[player_tribe_num].field9_0x34;
  if (*psVar1 != 0) {
    *psVar1 = 0;
    FUN_00479f00(0xc,0,0);
  }
  FUN_004af1c0(0x40);
  return;
}
