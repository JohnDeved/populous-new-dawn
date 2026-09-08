/* Ghidra 12.1.3 pseudocode; entry 004e4f40; FUN_004e4f40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e4f40(void)

{
  byte bVar1;
  char cVar2;
  int iVar3;
  uint uVar4;
  char *pcVar5;
  byte *pbVar6;

  if ((((game_state.offset_counter_2 & 0xf) == 0) && (0x10 < game_state.offset_counter_2)) &&
     (((byte)land_flags_1 & 8) == 0)) {
    iVar3 = 0;
    pcVar5 = &game_state.field_0xc3587;
    do {
      if ((*pcVar5 != '\0') &&
         (((uint)(ushort)game_state._800570_2_ & 1 << ((char)iVar3 + 9U & 0x1f)) == 0)) {
        FUN_004e5030(0x9608aa,(int)pcVar5[-1],iVar3 + 9,iVar3 + 0xe);
      }
      pcVar5 = pcVar5 + 4;
      iVar3 = iVar3 + 1;
    } while (pcVar5 < (char *)((int)&game_state.array_56b_4[0].spells + 1));
    cVar2 = '\0';
    pbVar6 = &game_state.field_0xc3588;
    do {
      bVar1 = pbVar6[-1];
      if ((bVar1 != 0) && (uVar4 = 1 << (cVar2 + 0xeU & 0x1f), (load_level_flags & uVar4) != 0)) {
        if (bVar1 == 1) {
          game_state.array_56b_4[0].spells =
               game_state.array_56b_4[0].spells | 1 << (*pbVar6 & 0x1f);
        }
        else if (bVar1 == 2) {
          game_state.array_56b_4[0].field1_0x4 =
               game_state.array_56b_4[0].field1_0x4 | 1 << (*pbVar6 & 0x1f);
        }
        else if (bVar1 == 3) {
          game_state.array_56b_4[0]._52_2_ =
               game_state.array_56b_4[0]._52_2_ | 1 << (*pbVar6 & 0x1f);
        }
        load_level_flags = load_level_flags & ~uVar4;
      }
      pbVar6 = pbVar6 + 4;
      cVar2 = cVar2 + '\x01';
    } while (pbVar6 < (byte *)((int)&game_state.array_56b_4[0].spells + 2));
  }
  return;
}
