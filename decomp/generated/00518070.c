/* Ghidra 12.1.3 pseudocode; entry 00518070; FUN_00518070.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00518070(ushort param_1)

{
  uint *puVar1;
  undefined2 uVar2;
  undefined4 uVar3;
  char cVar4;
  uint uVar5;
  int iVar6;
  int iVar7;
  undefined4 uVar8;
  undefined2 unaff_retaddr;

  uVar3 = game_state._755280_4_;
  uVar2 = game_state._755258_2_;
  uVar8 = 0;
  uVar5 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
  iVar7 = uVar5 * 4;
  puVar1 = &game_state.level_data[0].flags + uVar5;
  if ((*(uint *)(game_state._755280_4_ + 0x10) & 0x10007) == 0) {
    if ((*puVar1 & 0x200) != 0) {
      if ((*(byte *)(game_state._755280_4_ + 0xf) & 0x20) == 0) {
        uVar8 = 1;
      }
      else {
        iVar7 = get_adjacent_unit(game_state._755280_4_,0);
        if ((iVar7 == 0) ||
           (((&game_state.level_data[0].unit_index_2)[uVar5 * 2] & 0x3ff) !=
            *(ushort *)(iVar7 + 0x24))) {
          return 1;
        }
      }
      return uVar8;
    }
    if ((((*puVar1 & 4) == 0) &&
        (iVar6 = FUN_0044f600(CONCAT22(unaff_retaddr,param_1) & 0xfffffefe), iVar6 <= (short)uVar2))
       && ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar7] & 0xf)) & 1)
           != 0)) {
      return 0;
    }
    return 1;
  }
  if ((((*puVar1 & 4) != 0) ||
      (iVar6 = FUN_0044f600(CONCAT22(unaff_retaddr,param_1) & 0xfffffefe), (short)uVar2 < iVar6)) ||
     ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar7] & 0xf)) & 1) == 0)
     ) {
    return 1;
  }
  if ((*(byte *)((int)&game_state.level_data[0].flags + iVar7 + 1) & 2) == 0) {
    return 0;
  }
  cVar4 = FUN_00517f10(uVar3,puVar1);
  if (cVar4 == '\0') {
    return 0;
  }
  return 1;
}
