/* Ghidra 12.1.3 pseudocode; entry 00516eb0; FUN_00516eb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00516eb0(void)

{
  byte *pbVar1;
  byte bVar2;
  int iVar3;
  int iVar4;
  int local_804;
  undefined1 local_800 [512];
  undefined1 local_600 [512];
  undefined1 local_400 [512];
  undefined1 local_200 [512];

  if ((land_flags_1 & 8) != 0) {
    iVar3 = 0;
    do {
      local_804 = 0;
      bVar2 = (byte)iVar3;
      if ((&DAT_008956b7)[iVar3] == '\x01') {
        iVar4 = (int)(char)bVar2;
        pbVar1 = (byte *)((int)game_state.start_n1 + iVar4 + 0x9c);
        do {
          if (((land_flags_1 & 8) != 0) && (1 < game_state.offset_counter_2)) {
            printf_internal(local_400,DAT_0097303c,struct_g1_ARRAY_00894da6 + iVar4,
                            struct_g1_ARRAY_00894da6 + (char)(byte)local_804);
            set_tribe_str(iVar4 * 0xc65 + 0x89d1c8,local_400);
          }
          *pbVar1 = *pbVar1 & ~('\x01' << ((byte)local_804 & 0x1f));
          local_804 = local_804 + 1;
        } while (local_804 < 4);
        if (((land_flags_1 & 8) != 0) && (1 < game_state.offset_counter_2)) {
          printf_internal(local_200,DAT_00973038,struct_g1_ARRAY_00894da6 + iVar4,
                          struct_g1_ARRAY_00894da6 + iVar4);
          set_tribe_str(iVar4 * 0xc65 + 0x89d1c8,local_200);
        }
        *pbVar1 = *pbVar1 | '\x01' << (bVar2 & 0x1f);
      }
      else {
        do {
          if ((&DAT_008956b7)[local_804] == (&DAT_008956b7)[iVar3]) {
            if (((land_flags_1 & 8) != 0) && (1 < game_state.offset_counter_2)) {
              printf_internal(local_800,DAT_00973038,struct_g1_ARRAY_00894da6 + (char)bVar2,
                              struct_g1_ARRAY_00894da6 + (char)(byte)local_804);
              set_tribe_str((char)bVar2 * 0xc65 + 0x89d1c8,local_800);
            }
            pbVar1 = (byte *)((int)game_state.start_n1 + (char)bVar2 + 0x9c);
            *pbVar1 = *pbVar1 | '\x01' << ((byte)local_804 & 0x1f);
          }
          else {
            if (((land_flags_1 & 8) != 0) && (1 < game_state.offset_counter_2)) {
              printf_internal(local_600,DAT_0097303c,struct_g1_ARRAY_00894da6 + (char)bVar2,
                              struct_g1_ARRAY_00894da6 + (char)(byte)local_804);
              set_tribe_str((char)bVar2 * 0xc65 + 0x89d1c8,local_600);
            }
            pbVar1 = (byte *)((int)game_state.start_n1 + (char)bVar2 + 0x9c);
            *pbVar1 = *pbVar1 & ~('\x01' << ((byte)local_804 & 0x1f));
          }
          local_804 = local_804 + 1;
        } while (local_804 < 4);
      }
      iVar3 = iVar3 + 1;
    } while (iVar3 < 4);
  }
  return;
}
