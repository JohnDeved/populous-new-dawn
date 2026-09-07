/* Ghidra 12.1.3 pseudocode; entry 004c2d80; FUN_004c2d80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004c2d80(int param_1)

{
  char cVar1;

  cVar1 = *(char *)(param_1 + 0x2f);
  if ((game_state.tribes_array[cVar1].field_0x93f & 8) == 0) {
    if ((*(char *)(param_1 + 0x2c) == '\x16') || (*(char *)(param_1 + 0x2c) == '\x03')) {
      return 0;
    }
    if (game_state.tribes_array[cVar1].field_0xc5e != '\0') {
      return 0;
    }
    if (game_state.tribes_array[cVar1].field_0xc1f == '\x01') {
      if (((*(byte *)(param_1 + 0xc) & 3) != 0) || ((*(byte *)(param_1 + 0x11) & 4) != 0)) {
        return 0;
      }
      if (game_state.tribes_array[cVar1].field_0x5bd != '\0') {
        return 0;
      }
    }
    else if (((*(byte *)(param_1 + 0xc) & 3) != 0) || ((*(byte *)(param_1 + 0x11) & 4) != 0)) {
      return 0;
    }
  }
  return 1;
}
