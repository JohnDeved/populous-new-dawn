/* Ghidra 12.1.3 pseudocode; entry 004860c0; level_copy_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void level_copy_3(int param_1)

{
  undefined4 uVar1;
  undefined4 uVar2;
  undefined *puVar3;
  int iVar4;
  undefined4 *puVar5;
  undefined4 *puVar6;
  int iVar7;
  struct_56B *psVar8;
  undefined4 *puVar9;
  undefined4 *puVar10;

  if (param_1 != 99) {
    iVar7 = 0;
    psVar8 = game_state.array_56b_4;
    puVar5 = &level_hdr_savegame_mem;
    for (iVar4 = 0xe; iVar4 != 0; iVar4 = iVar4 + -1) {
      *puVar5 = psVar8->spells;
      psVar8 = (struct_56B *)&psVar8->field1_0x4;
      puVar5 = puVar5 + 1;
    }
    if (level_hdr_mem.tribe_nums != 1 && -1 < (int)(level_hdr_mem.tribe_nums - 1)) {
      puVar5 = (undefined4 *)(&cpatr_mem_3 + param_1 * 0xa4);
      puVar6 = game_state.start_n1;
      do {
        puVar9 = puVar6;
        puVar10 = puVar5;
        for (iVar4 = 0xc; iVar4 != 0; iVar4 = iVar4 + -1) {
          *puVar10 = *puVar9;
          puVar9 = puVar9 + 1;
          puVar10 = puVar10 + 1;
        }
        puVar5 = puVar5 + 0xc;
        iVar7 = iVar7 + 1;
        puVar6 = puVar6 + 0xc;
      } while (iVar7 < (int)(level_hdr_mem.tribe_nums - 1));
    }
    uVar2 = game_state._800570_4_;
    uVar1 = game_state._800566_4_;
    *(undefined4 *)(&DAT_0089a401 + param_1 * 0xa4) = game_state._800562_4_;
    puVar3 = game_state.spscr_ptr;
    *(undefined4 *)(&DAT_0089a405 + param_1 * 0xa4) = uVar1;
    *(undefined4 *)(&DAT_0089a409 + param_1 * 0x52) = uVar2;
    *(undefined **)(&DAT_0089a4a1 + param_1 * 0xa4) = puVar3;
  }
  return;
}
