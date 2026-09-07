/* Ghidra 12.1.3 pseudocode; entry 0044fa30; clear_level_data_fields_flags_ph_c.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void clear_level_data_fields_flags_ph_c(void)

{
  land_pos *plVar1;
  int iVar2;

  iVar2 = 0x4000;
  plVar1 = game_state.level_data;
  do {
    plVar1->flags = plVar1->flags & 0xfffffffb;
    plVar1->unit_shadow = plVar1->unit_shadow & 0xf0;
    plVar1->unit_index_2 = plVar1->unit_index_2 & 0x3ff;
    iVar2 = iVar2 + -1;
    plVar1 = plVar1 + 1;
  } while (iVar2 != 0);
  return;
}
