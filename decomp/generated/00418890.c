/* Ghidra 12.1.3 pseudocode; entry 00418890; FUN_00418890.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00418890(void)

{
  if (((byte)level_flags & 8) != 0) {
    return;
  }
  if (draw_mode == 2) {
    FUN_0041fb10();
    FUN_0041d450(100000,0xe);
    return;
  }
  if (DAT_0089c6e7 == '\t') {
    set_data_to_rddata_chunk(0x6c,(DAT_0098e908 & 0x100) != 0,minimap_state_and_cache);
    FUN_00443d30(player_tribe_num * 0xc65 + 0x89d1c8,&rddata_chunk_data_0089798d);
  }
  else {
    if (DAT_0089c6e7 != '\a') goto LAB_0041891b;
    FUN_004b9150();
    FUN_004ba5d0();
  }
  FUN_004b00c0();
LAB_0041891b:
  if (DAT_0089ce36 != '\0') {
    return;
  }
  DAT_0089ce36 = 0xb;
  return;
}
