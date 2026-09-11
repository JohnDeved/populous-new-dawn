/* Ghidra 12.1.3 pseudocode; entry 004386d0; FUN_004386d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004386d0(void)

{
  DAT_00895e9d = 0;
  DAT_00895e9c = 1;
  DAT_00895ea0._0_1_ =
       *(undefined1 *)
        (player_tribe_num * 0xc65 + 0x89da89 +
        *(char *)((int)game_state.tribes_array[player_tribe_num].field1341_0x8bf + 1) * 10);
  return;
}
