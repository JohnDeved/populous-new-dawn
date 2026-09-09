/* Ghidra 12.1.3 pseudocode; entry 00486240; level_process_hdr_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void level_process_hdr_1(void)

{
  byte bVar1;
  byte bVar2;
  byte bVar3;
  int iVar4;
  byte bVar5;
  struct_56B *psVar6;
  undefined4 *puVar7;
  undefined1 *puVar8;

  game_state._800134_4_ = 0;
  game_state._800138_4_ = 0;
  game_state._800142_4_ = 0;
  psVar6 = game_state.array_56b_4;
  for (iVar4 = 0x38; iVar4 != 0; iVar4 = iVar4 + -1) {
    psVar6->spells = 0;
    psVar6 = (struct_56B *)&psVar6->field1_0x4;
  }
  puVar7 = (undefined4 *)&game_state.field_0xc3672;
  for (iVar4 = 0x30; iVar4 != 0; iVar4 = iVar4 + -1) {
    *puVar7 = 0;
    puVar7 = puVar7 + 1;
  }
  game_state._800562_4_ = 0;
  puVar8 = &game_state.tribes_array[0].field_0xc5b;
  psVar6 = game_state.array_56b_4;
  game_state._800566_4_ = 0;
  game_state._800570_4_ = 0;
  bVar1 = DAT_0089bc61 & 1;
  bVar3 = DAT_0089bc61 & 0x40;
  game_state.spscr_ptr = (undefined *)0x0;
  bVar5 = DAT_0089bc61 & 0x20;
  bVar2 = DAT_0089bc61 & 0x80;
  do {
    psVar6->spells = DAT_0089bc2a;
    psVar6->field1_0x4 = DAT_0089bc2e;
    if (bVar1 == 0) {
      level_hdr_mem.level_flags = level_hdr_mem.level_flags & 0xfe;
    }
    else {
      level_hdr_mem.level_flags = level_hdr_mem.level_flags | 1;
    }
    *puVar8 = 0;
    if (bVar5 != 0) {
      *puVar8 = DAT_0089bc60;
    }
    if (bVar3 == 0) {
      level_hdr_mem.level_flags = level_hdr_mem.level_flags & 0xfb;
    }
    else {
      level_hdr_mem.level_flags = level_hdr_mem.level_flags | 4;
    }
    if (bVar2 == 0) {
      level_hdr_mem.level_flags = level_hdr_mem.level_flags & 0xf7;
    }
    else {
      level_hdr_mem.level_flags = level_hdr_mem.level_flags | 8;
    }
    puVar8 = puVar8 + 0xc65;
    psVar6 = psVar6 + 1;
  } while (psVar6 < &game_state.field_0xc3672);
  return;
}
