/* Ghidra 12.1.3 pseudocode; entry 00448ec0; FUN_00448ec0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00448ec0(void)

{
  int iVar1;
  undefined4 *puVar2;

  puVar2 = (undefined4 *)&game_state.start_15;
  for (iVar1 = 0x6f; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar2 = 0;
    puVar2 = puVar2 + 1;
  }
  game_state._838239_1_ = game_state._838239_1_ | 0x10;
  return;
}
