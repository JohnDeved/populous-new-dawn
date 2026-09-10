/* Ghidra 12.1.3 pseudocode; entry 004da170; FUN_004da170.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004da170(int param_1)

{
  if ((*(byte *)(param_1 + 0x11) & 0x10) != 0) {
    FUN_0048a050(param_1,0x35,0);
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffffefff;
    if ((game_state.tribes_array[player_tribe_num].field_0x93d & 8) != 0) {
      *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
      return;
    }
    if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
      *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
      return;
    }
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffef;
  }
  return;
}
