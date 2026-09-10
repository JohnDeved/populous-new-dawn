/* Ghidra 12.1.3 pseudocode; entry 00409140; FUN_00409140.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00409140(int param_1,int param_2)

{
  undefined1 *puVar1;
  char cVar2;
  ushort local_2;

  cVar2 = *(char *)(param_2 + 0x2f);
  if (((level_flags_2._3_1_ & 4) == 0) && ((*(byte *)(param_1 + 0x14) & 0x80) == 0)) {
    *(short *)(param_1 + 0x9e) =
         *(short *)(param_1 + 0x9e) +
         (ushort)((byte)unit_type_array_person[*(byte *)(param_2 + 0x2b)].field_0x16 >> 2);
    if (cVar2 != -1) {
      *(char *)(param_1 + 0xaf) = cVar2;
    }
    if ((*(char *)(param_1 + 0x2f) == player_tribe_num) && (DAT_0089ce60 == '\0')) {
      DAT_0089ce60 = '\x01';
      local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                         (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
      _DAT_0089c6e5 = local_2;
      puVar1 = &game_state.tribes_array[player_tribe_num].field_0x93d;
      *(uint *)puVar1 = *(uint *)puVar1 | 0x8000;
    }
  }
  return;
}
