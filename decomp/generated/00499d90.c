/* Ghidra 12.1.3 pseudocode; entry 00499d90; FUN_00499d90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00499d90(uint param_1,undefined4 param_2)

{
  char cVar1;
  bool bVar2;
  undefined1 unaff_retaddr;
  char local_5;
  char local_4;
  undefined1 uStack_3;
  short local_2;

  if (((byte)land_flags_1 & 8) != 0) {
    return;
  }
  if (((byte)opened_files_flags & 0x10) != 0) {
    return;
  }
  if ((game_state.level_flags & 2) != 0) {
    return;
  }
  if ((land_flags_1._3_1_ & 6) != 0) {
    return;
  }
  if ((level_hdr_savegame_mem._5008_4_ & param_1) != 0) {
    return;
  }
  cVar1 = FUN_00499f40(param_1,&uStack_3,&local_5,&local_4,&local_2);
  if ((((byte)level_flags_2 & 8) == 0) || (bVar2 = false, cVar1 != '\0')) {
    bVar2 = true;
  }
  if (!bVar2) {
    return;
  }
  if (local_5 != '\0') {
    level_hdr_savegame_mem._5008_4_ = level_hdr_savegame_mem._5008_4_ | param_1;
  }
  if (cVar1 != '\0') {
    if (cVar1 == '\x01') {
      FUN_0044d7f0(CONCAT13(unaff_retaddr,_uStack_3),0,(short)maybe_framerate * 3);
      return;
    }
    return;
  }
  FUN_00430bd0(3);
  if (DAT_006841e7 != -1) {
    FUN_00430e40(DAT_006841e7,param_2);
  }
  if (local_4 == '\0') {
    global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 & 0xfffffffe;
    if (DAT_006841e7 == -1) goto LAB_00499ee6;
    global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 & 0xfffffdff;
  }
  else if (DAT_006841e7 != -1) {
    FUN_00430f30(DAT_006841e7,0x30);
    if (DAT_006841e7 == -1) goto LAB_00499ee6;
    global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x200;
  }
  if (DAT_006841e7 != -1) {
    global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[DAT_006841e7].field24_0x21 | 0x20000;
  }
LAB_00499ee6:
  if ((0 < local_2) && (DAT_006841e7 != -1)) {
    *(short *)&global_struct_45B_ARRAY_00683b92[DAT_006841e7].field_0x1c = -local_2;
    return;
  }
  return;
}
