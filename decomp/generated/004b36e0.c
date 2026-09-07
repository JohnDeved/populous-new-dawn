/* Ghidra 12.1.3 pseudocode; entry 004b36e0; FUN_004b36e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004b36e0(short param_1,char param_2)

{
  char cVar1;
  int iVar2;
  undefined4 *puVar3;

  if ((opened_files_flags & 0x21) == 0) {
    DAT_0059d110 = 1;
    opened_files_flags = opened_files_flags & 0xbfff;
    FUN_0049cf90(2);
    DAT_0098f74a = param_1;
    _DAT_0098f712 = (uint)DAT_0089d161;
    DAT_0098f750 = param_2;
    DAT_0089d161 = 0xe;
    cVar1 = read_rddata_2((int)param_1);
    if (cVar1 != '\0') {
      opened_files_flags = opened_files_flags | 0x24;
      return;
    }
    DAT_0059d110 = 0;
    if ((opened_files_flags & 0x300) != 0) {
      opened_files_flags = opened_files_flags & 0xfcff;
      close_handle(rddata_file_handle);
    }
    if ((opened_files_flags & 0xc00) != 0) {
      opened_files_flags = opened_files_flags & 0xf3ff;
      close_handle(rddata_file_descriptor);
    }
    opened_files_flags = opened_files_flags & 0xff03;
    FUN_0042c8f0();
    vconfig_index_start = 0;
    update_vfconfig();
    if (draw_mode == 2) {
      FUN_00418890();
    }
    FUN_00417c00(0);
    DAT_0089c6a9 = 0x30;
    level_flags_1 = level_flags_1 | 0x100000;
    puVar3 = &DAT_0098f6ec;
    for (iVar2 = 7; iVar2 != 0; iVar2 = iVar2 + -1) {
      *puVar3 = 0;
      puVar3 = puVar3 + 1;
    }
    *(undefined2 *)puVar3 = 0;
    DAT_0098f73e = 0;
    DAT_0098f742 = 0;
    FUN_004b47b0();
    FUN_00479f00(10,(short)player_tribe_num,0);
    if ((opened_files_flags & 8) == 0) {
      if ((DAT_0098f750 != '\x03') && (DAT_0098f750 != '\x02')) {
        FUN_00479f00(8,0,0xffffffff);
      }
      level_flags_1 = level_flags_1 & 0xfff7ffff;
      FUN_004af1c0(1);
    }
    else {
      FUN_00479f00(8,0,1);
      level_flags_1 = level_flags_1 | 0x80000;
      FUN_004af0a0(0x20);
    }
    FUN_0049cf90(2);
    DAT_009845a0 = 0;
    DAT_009846e8 = 0;
    FUN_00417c00(0);
    level_flags_1 = level_flags_1 & 0xffefffff;
    puVar3 = &DAT_0098f6ec;
    for (iVar2 = 7; iVar2 != 0; iVar2 = iVar2 + -1) {
      *puVar3 = 0;
      puVar3 = puVar3 + 1;
    }
    *(undefined2 *)puVar3 = 0;
    FUN_00477780(0);
    opened_files_flags = opened_files_flags | 0x4000;
    DAT_0089d161 = DAT_0098f712;
    FUN_0049cfa0(2);
    if (('\x01' < DAT_0098f750) && (DAT_0098f750 < '\x04')) {
      set_interface_state_2_3(7);
    }
    DAT_0098f750 = 0;
    load_level_flags = load_level_flags & 0xfbffffff;
    FUN_004194f0();
  }
  return;
}
