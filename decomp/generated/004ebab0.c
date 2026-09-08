/* Ghidra 12.1.3 pseudocode; entry 004ebab0; FUN_004ebab0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004ebab0(int param_1)

{
  byte bVar1;
  ushort uVar2;
  int iVar3;
  ushort *puVar4;
  uint uVar5;
  undefined1 uVar6;
  int iVar7;

  iVar3 = (int)*(short *)(param_1 + 99);
  uVar6 = 1;
  bVar1 = game_state.unit_related_array_1[iVar3].flag;
  if ((bVar1 & 1) == 0) {
    if ((bVar1 & 2) != 0) {
      uVar5 = (uint)(byte)game_state.unit_related_array_1[iVar3].sub_array_counter;
      if (uVar5 == 0) {
        puVar4 = (ushort *)&game_state.unit_related_array_1[iVar3].coord_1;
      }
      else {
        puVar4 = (ushort *)(iVar3 * 0x6d + 0x955c31 + uVar5 * 4);
      }
      iVar3 = FUN_004663c0(param_1,((*puVar4 & 0xfe) * 2 | *puVar4 & 0xfe00) * 4 + 0x8a03e4);
      if (iVar3 == 0) {
        uVar6 = 0;
      }
    }
  }
  else {
    uVar5 = (uint)(byte)game_state.unit_related_array_1[iVar3].sub_array_counter;
    if (uVar5 == 0) {
      if ((game_state.unit_related_array_1[iVar3].field_0x6 != '\0') &&
         (uVar2._0_1_ = game_state.unit_related_array_1[iVar3].coord_1,
         uVar2._1_1_ = game_state.unit_related_array_1[iVar3].coord_2,
         iVar3 = FUN_004663c0(param_1,((uVar2 & 0xfe) * 2 | uVar2 & 0xfe00) * 4 + 0x8a03e4),
         iVar3 == 0)) {
        return 0;
      }
    }
    else {
      iVar7 = (int)*(char *)(param_1 + 0x67);
      puVar4 = (ushort *)(iVar3 * 0x6d + 0x955c35 + iVar7 * 4);
      if (iVar7 < (int)uVar5) {
        while ((char)puVar4[1] == '\0') {
          iVar7 = iVar7 + 1;
          puVar4 = puVar4 + 2;
          if ((int)uVar5 <= iVar7) {
            return 1;
          }
        }
        iVar3 = FUN_004663c0(param_1,((*puVar4 & 0xfe) * 2 | *puVar4 & 0xfe00) * 4 + 0x8a03e4);
        if (iVar3 == 0) {
          return 0;
        }
      }
    }
  }
  return uVar6;
}
