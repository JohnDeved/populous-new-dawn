/* Ghidra 12.1.3 pseudocode; entry 004ec390; FUN_004ec390.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ec390(void)

{
  int iVar1;
  short *psVar2;

  psVar2 = (short *)&game_state.field_0xb8a61;
  iVar1 = 8;
  do {
    if (*psVar2 != 0) {
      *psVar2 = *psVar2 + -1;
    }
    psVar2 = psVar2 + 5;
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  return;
}
