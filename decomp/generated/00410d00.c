/* Ghidra 12.1.3 pseudocode; entry 00410d00; load_level_4.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_4(void)

{
  undefined4 uVar1;
  int iVar2;
  level_hdr_mem_616 *plVar3;
  struct_56B *psVar4;

  fill_landscape_strings();
  game_state._4_4_ = game_state._4_4_ | 1;
  load_level_flags = load_level_flags & 0xfbffffff | 0x10000000;
  set_interface_state_2_3(2);
  load_level_cpatr((int)level_number);
  game_state.num_tribes = level_hdr_mem.tribe_nums;
  game_state._858439_1_ = level_hdr_mem.tribe_nums;
  clear_tribe_commands_2();
  clear_struct_1();
  inc_tribes_commands();
  clear_temp_tribe_command_buffer();
  if ((load_level_flags & 0x10000000) == 0) {
    level_copy_4();
  }
  else {
    uVar1 = level_number_to_index((int)level_number);
    level_copy_1(uVar1);
    plVar3 = &level_hdr_mem;
    psVar4 = game_state.array_56b_4;
    for (iVar2 = 0xe; iVar2 != 0; iVar2 = iVar2 + -1) {
      psVar4->spells = (plVar3->s).spells;
      plVar3 = (level_hdr_mem_616 *)&(plVar3->s).field1_0x4;
      psVar4 = (struct_56B *)&psVar4->field1_0x4;
    }
    level_hdr_savegame_mem[0x1396] = (undefined1)uVar1;
  }
  player_tribe_num = 0;
  load_level_3(level_hdr_mem.level_num,level_hdr_mem.obj_num,level_hdr_mem.level_flags);
  FUN_0042c730(0,0);
  level_hdr_savegame_mem._5008_4_ = level_hdr_savegame_mem._5008_4_ | 0x100;
  if (DAT_00895db0 != '\0') {
    FUN_0048b3e0();
  }
  sound_func_1();
  return;
}
