/* Ghidra 12.1.3 pseudocode; entry 0042c790; load_level_upper.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_upper(void)

{
  undefined1 uVar1;
  undefined1 uVar2;
  undefined1 uVar3;
  undefined4 uVar4;
  int iVar5;
  level_hdr_mem_616 *plVar6;
  struct_56B *psVar7;
  tribe_struct_1506_b *ptVar8;
  undefined4 *puVar9;

  load_level_cpatr((int)level_number);
  game_state.num_tribes = level_hdr_mem.tribe_nums;
  game_state._858439_1_ = level_hdr_mem.tribe_nums;
  if ((load_level_flags._3_1_ & 0x10) == 0) {
    level_copy_4();
  }
  else {
    uVar4 = level_number_to_index((int)level_number);
    level_copy_1(uVar4);
    plVar6 = &level_hdr_mem;
    psVar7 = game_state.array_56b_4;
    for (iVar5 = 0xe; iVar5 != 0; iVar5 = iVar5 + -1) {
      psVar7->spells = (plVar6->s).spells;
      plVar6 = (level_hdr_mem_616 *)&(plVar6->s).field1_0x4;
      psVar7 = (struct_56B *)&psVar7->field1_0x4;
    }
    level_hdr_savegame_mem[0x1396] = (undefined1)uVar4;
  }
  uVar3 = level_hdr_mem.level_flags;
  uVar2 = level_hdr_mem.obj_num;
  uVar1 = level_hdr_mem.level_num;
  clear_level_global_vars();
  set_pal0_mem_2();
  sunlight_init_default();
  clear_level_data_fields_flags_ph_c();
  ptVar8 = tribe_commands;
  for (iVar5 = 0x5e2; iVar5 != 0; iVar5 = iVar5 + -1) {
    ptVar8->next_empty = 0;
    ptVar8->counter = 0;
    ptVar8 = (tribe_struct_1506_b *)&ptVar8->empty;
  }
  game_state.offset_counter = 0;
  clear_temp_tribe_command_buffer();
  inc_tribes_commands();
  clear_struct_1();
  DAT_00895ebb = 0;
  DAT_00895ebc = 0;
  game_state._841984_2_ = 1;
  game_state._841986_2_ = 0;
  puVar9 = &DAT_0064f4a0;
  for (iVar5 = 1999; iVar5 != 0; iVar5 = iVar5 + -1) {
    *puVar9 = 0;
    puVar9 = puVar9 + 1;
  }
  *(undefined1 *)puVar9 = 0;
  puVar9 = (undefined4 *)&game_state.field_0xcd942;
  for (iVar5 = 0x800; iVar5 != 0; iVar5 = iVar5 + -1) {
    *puVar9 = 0;
    puVar9 = puVar9 + 1;
  }
  puVar9 = (undefined4 *)&game_state.field_0xcf942;
  for (iVar5 = 0x800; iVar5 != 0; iVar5 = iVar5 + -1) {
    *puVar9 = 0;
    puVar9 = puVar9 + 1;
  }
  DAT_0089ce5c = 200;
  DAT_0089ce5e = 200;
  DAT_0089ce5d = 0;
  DAT_0089ce5f = 0;
  load_level(uVar1,uVar2,uVar3);
  set_landscape_c_4_and_texture(0,0x40);
  set_landscape_flags_2_flag_2();
  return;
}
