/* Ghidra 12.1.3 pseudocode; entry 004baab0; FUN_004baab0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004baab0(int param_1,int param_2)

{
  undefined1 uVar1;

  uVar1 = 1;
  if (game_state.tribes_array[*(char *)(param_2 + 0x2f)].field_0xc1f == '\x01') {
    if (*(char *)(param_1 + 0x9e) == '\x04') {
      return 0;
    }
  }
  else if ((*(byte *)(param_2 + 0xe) & 0x80) != 0) {
    uVar1 = 0;
  }
  return uVar1;
}
