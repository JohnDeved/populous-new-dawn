/* Ghidra 12.1.3 pseudocode; entry 00485660; load_level_cpatr.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_cpatr(int param_1)

{
  int iVar1;
  int iVar2;
  cpatr_struct *pcVar3;
  level_hdr_mem_616 *plVar4;
  undefined4 *puVar5;
  cpatr_struct *pcVar6;
  undefined1 local_224 [4];
  undefined1 local_220 [272];
  char local_110 [272];

  if (param_1 != 0x36) {
    plVar4 = &level_hdr_mem;
    for (iVar1 = 0x9a; iVar1 != 0; iVar1 = iVar1 + -1) {
      (plVar4->s).spells = 0;
      plVar4 = (level_hdr_mem_616 *)&(plVar4->s).field1_0x4;
    }
    get_global_file_path(local_220,s_LEVELS_0059cd2c,0);
    _sprintf(local_110,s__s__s_03d__s_00599838,local_220,s_LEVL2_00599848,param_1,s_HDR_00599830);
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,local_110);
    iVar1 = read_file_to_mem(global_string_buffer,&level_hdr_mem,0xfffffff,local_224);
    if (iVar1 != 0) {
      memcpy_1(local_220,s_LEVELS_0059cd2c,0);
      _sprintf(local_110,s__s__s_03d__s_00599838,local_220,s_LEVL2_00599848,param_1,s_HDR_00599830);
      reset_global_palettes();
      no_file_message();
      file_name_validation(global_string_buffer,local_110);
      iVar1 = read_file_to_mem(global_string_buffer,&level_hdr_mem,0xfffffff,local_224);
      if (iVar1 != 0) {
        level_free_exit(0x1a);
      }
    }
    iVar2 = 0;
    puVar5 = (undefined4 *)&level_hdr_mem.s.field_0x14;
    for (iVar1 = 8; iVar1 != 0; iVar1 = iVar1 + -1) {
      *puVar5 = 0;
      puVar5 = puVar5 + 1;
    }
    if (0 < (int)(level_hdr_mem.tribe_nums - 1)) {
      pcVar3 = &cpatr_mem;
      do {
        pcVar6 = pcVar3;
        for (iVar1 = 0x24; iVar1 != 0; iVar1 = iVar1 + -1) {
          *(undefined4 *)pcVar6 = 0;
          pcVar6 = (cpatr_struct *)&pcVar6->field_0x4;
        }
        get_global_file_path(local_220,s_LEVELS_0059cd2c,0);
        _sprintf(local_110,s__s__s_03d__s_00599838,local_220,s_CPATR_005a1e48,
                 (uint)*(byte *)((int)level_hdr_mem.pos_array + iVar2 + -0xb),s_DAT_00599850);
        reset_global_palettes();
        no_file_message();
        file_name_validation(global_string_buffer,local_110);
        iVar1 = read_file_to_mem(global_string_buffer,pcVar3,0xfffffff,local_224);
        if (iVar1 != 0) {
          memcpy_1(local_220,s_LEVELS_0059cd2c,0);
          _sprintf(local_110,s__s__s_03d__s_00599838,local_220,s_CPATR_005a1e48,
                   (uint)*(byte *)((int)level_hdr_mem.pos_array + iVar2 + -0xb),s_DAT_00599850);
          reset_global_palettes();
          no_file_message();
          file_name_validation(global_string_buffer,local_110);
          iVar1 = read_file_to_mem(global_string_buffer,pcVar3,0xfffffff,local_224);
          if (iVar1 != 0) {
            level_free_exit(0x1a);
          }
        }
        iVar2 = iVar2 + 1;
        pcVar6 = pcVar3;
        for (iVar1 = 0xc; iVar1 != 0; iVar1 = iVar1 + -1) {
          *(undefined4 *)pcVar6 = 0;
          pcVar6 = (cpatr_struct *)&pcVar6->field_0x4;
        }
        pcVar3 = pcVar3 + 1;
      } while (iVar2 < (int)(level_hdr_mem.tribe_nums - 1));
    }
    load_cpscr();
  }
  return;
}
