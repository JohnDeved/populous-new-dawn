/* Ghidra 12.1.3 pseudocode; entry 00486160; level_copy_4.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void level_copy_4(void)

{
  undefined4 *puVar1;
  int iVar2;
  int iVar3;
  cpatr_struct *pcVar4;
  level_hdr_mem_616 *plVar5;
  undefined4 *puVar6;
  cpatr_struct *pcVar7;
  struct_56B *psVar8;
  struct_56B *psVar9;

  iVar3 = 0;
  game_state._800134_4_ = 0;
  game_state._800138_4_ = 0;
  game_state._800142_4_ = 0;
  psVar8 = game_state.array_56b_4;
  for (iVar2 = 0x38; iVar2 != 0; iVar2 = iVar2 + -1) {
    psVar8->spells = 0;
    psVar8 = (struct_56B *)&psVar8->field1_0x4;
  }
  puVar1 = (undefined4 *)&game_state.field_0xc3672;
  for (iVar2 = 0x30; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar1 = 0;
    puVar1 = puVar1 + 1;
  }
  game_state._800562_4_ = 0;
  game_state._800566_4_ = 0;
  game_state._800570_4_ = 0;
  plVar5 = &level_hdr_mem;
  psVar8 = game_state.array_56b_4;
  for (iVar2 = 0xe; iVar2 != 0; iVar2 = iVar2 + -1) {
    psVar8->spells = (plVar5->s).spells;
    plVar5 = (level_hdr_mem_616 *)&(plVar5->s).field1_0x4;
    psVar8 = (struct_56B *)&psVar8->field1_0x4;
  }
  if (0 < (int)(level_hdr_mem.tribe_nums - 1)) {
    psVar8 = game_state.array_56b_4;
    puVar1 = (undefined4 *)&cpatr_mem.field_0x50;
    do {
      psVar8 = psVar8 + 1;
      puVar6 = puVar1;
      psVar9 = psVar8;
      for (iVar2 = 0xe; iVar2 != 0; iVar2 = iVar2 + -1) {
        psVar9->spells = *puVar6;
        puVar6 = puVar6 + 1;
        psVar9 = (struct_56B *)&psVar9->field1_0x4;
      }
      iVar3 = iVar3 + 1;
      puVar1 = puVar1 + 0x24;
    } while (iVar3 < (int)(level_hdr_mem.tribe_nums - 1));
  }
  iVar2 = 0;
  if (level_hdr_mem.tribe_nums != 1 && -1 < (int)(level_hdr_mem.tribe_nums - 1)) {
    puVar1 = game_state.start_n1;
    pcVar4 = &cpatr_mem;
    do {
      pcVar7 = pcVar4;
      puVar6 = puVar1;
      for (iVar3 = 0xc; iVar3 != 0; iVar3 = iVar3 + -1) {
        *puVar6 = *(undefined4 *)pcVar7;
        pcVar7 = (cpatr_struct *)&pcVar7->field_0x4;
        puVar6 = puVar6 + 1;
      }
      puVar1 = puVar1 + 0xc;
      iVar2 = iVar2 + 1;
      pcVar4 = pcVar4 + 1;
    } while (iVar2 < (int)(level_hdr_mem.tribe_nums - 1));
  }
  game_state.spscr_ptr = level_hdr_mem.spscr_ptr;
  return;
}
