/* Ghidra 12.1.3 pseudocode; entry 0042b590; load_level_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_3(undefined4 param_1,undefined4 param_2,undefined4 param_3)

{
  int iVar1;
  tribe_struct_1506_b *ptVar2;
  undefined4 *puVar3;

  clear_level_global_vars();
  set_pal0_mem_2();
  sunlight_init_default();
  clear_level_data_fields_flags_ph_c();
  ptVar2 = tribe_commands;
  for (iVar1 = 0x5e2; iVar1 != 0; iVar1 = iVar1 + -1) {
    ptVar2->next_empty = 0;
    ptVar2->counter = 0;
    ptVar2 = (tribe_struct_1506_b *)&ptVar2->empty;
  }
  game_state.offset_counter = 0;
  clear_temp_tribe_command_buffer();
  inc_tribes_commands();
  clear_struct_1();
  game_state._841986_2_ = 0;
  DAT_00895ebb = 0;
  game_state._841984_2_ = 1;
  DAT_00895ebc = 0;
  puVar3 = &DAT_0064f4a0;
  for (iVar1 = 1999; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  *(undefined1 *)puVar3 = 0;
  puVar3 = (undefined4 *)&game_state.field_0xcd942;
  for (iVar1 = 0x800; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  puVar3 = (undefined4 *)&game_state.field_0xcf942;
  for (iVar1 = 0x800; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  DAT_0089ce5c = 200;
  DAT_0089ce5e = 200;
  DAT_0089ce5d = 0;
  DAT_0089ce5f = 0;
  load_level(param_1,param_2,param_3);
  set_landscape_c_4_and_texture(0,0x40);
  set_landscape_flags_2_flag_2();
  return;
}
