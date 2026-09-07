/* Ghidra 12.1.3 pseudocode; entry 00461510; process_tribe_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_tribe_1(void)

{
  int iVar1;
  char cVar2;
  byte local_1;

  if ((((byte)land_flags_1 & 2) == 0) && ((load_level_flags._1_1_ & 2) == 0)) {
    iVar1 = 0x89d1c8;
    cVar2 = '\x04';
    do {
      if ((*(char *)(iVar1 + 0xc20) != '\0') && (*(char *)(iVar1 + 0xc5e) != '\0')) {
        *(char *)(iVar1 + 0xc5e) = *(char *)(iVar1 + 0xc5e) + -1;
      }
      iVar1 = iVar1 + 0xc65;
      cVar2 = cVar2 + -1;
    } while (cVar2 != '\0');
    if (((game_state.level_flags & 0x20) == 0) && ((level_flags_2._2_1_ & 0x10) == 0)) {
      local_1 = 0;
      iVar1 = 0x89d1c8;
      if (game_state._858439_1_ != '\0') {
        do {
          cVar2 = FUN_00419480((uint)local_1);
          if ((cVar2 == '\0') && ((*(uint *)(iVar1 + 0x941) & 0x40) == 0)) {
            if (game_state.tribes_array[local_1].field_0xc1f == '\x01') {
              process_tribe_2();
            }
            else {
              FUN_004f6c20(iVar1);
            }
          }
          iVar1 = iVar1 + 0xc65;
          local_1 = local_1 + 1;
        } while (local_1 < (byte)game_state._858439_1_);
      }
    }
  }
  return;
}
