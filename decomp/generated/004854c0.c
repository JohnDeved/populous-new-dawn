/* Ghidra 12.1.3 pseudocode; entry 004854c0; load_level_hdr_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_hdr_2(undefined4 param_1)

{
  int iVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;
  int *piVar4;
  level_hdr_mem_616 *plVar5;
  undefined4 *puVar6;
  int local_228;
  undefined1 local_224 [4];
  undefined1 local_220 [272];
  char local_110 [272];

  plVar5 = &level_hdr_mem;
  for (iVar1 = 0x9a; iVar1 != 0; iVar1 = iVar1 + -1) {
    (plVar5->s).spells = 0;
    plVar5 = (level_hdr_mem_616 *)&(plVar5->s).field1_0x4;
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
  puVar2 = (undefined4 *)&level_hdr_mem.s.field_0x14;
  for (iVar1 = 8; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar2 = 0;
    puVar2 = puVar2 + 1;
  }
  local_228 = 0;
  puVar2 = (undefined4 *)&cpatr_mem.field_0x50;
  piVar4 = (int *)&game_state.start_12;
  do {
    plVar5 = &level_hdr_mem;
    puVar6 = puVar2;
    for (iVar1 = 0xe; iVar1 != 0; iVar1 = iVar1 + -1) {
      *puVar6 = (plVar5->s).spells;
      plVar5 = (level_hdr_mem_616 *)&(plVar5->s).field1_0x4;
      puVar6 = puVar6 + 1;
    }
    puVar3 = puVar2 + 0x24;
    clear_cpscr_item(local_228);
    puVar2[0xe] = 0;
    puVar6 = puVar2 + -0x14;
    for (iVar1 = 0xc; iVar1 != 0; iVar1 = iVar1 + -1) {
      *puVar6 = 0;
      puVar6 = puVar6 + 1;
    }
    puVar2[0xf] = 0;
    local_228 = local_228 + 1;
    *piVar4 = (int)(piVar4 + -0x440);
    puVar2 = puVar3;
    piVar4 = piVar4 + 0xc42;
  } while (puVar3 < (undefined4 *)((int)&DAT_0089bba7 + 2));
  return;
}
