/* Ghidra 12.1.3 pseudocode; entry 004c2be0; FUN_004c2be0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c2be0(int param_1,char param_2)

{
  undefined4 *puVar1;

  puVar1 = &game_state.array_56b_4[param_1].field10_0x10;
  *puVar1 = *puVar1 & ~(1 << (param_2 - 1U & 0x1f));
  return;
}
