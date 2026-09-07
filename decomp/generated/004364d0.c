/* Ghidra 12.1.3 pseudocode; entry 004364d0; FUN_004364d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004364d0(int param_1,char param_2)

{
  char cVar1;
  ushort uVar2;
  unit_struct *puVar3;
  short sVar4;
  int iVar5;
  uint uVar6;
  unit_struct *puVar7;
  uint uVar8;

  if (param_2 < '\0') {
    uVar2 = *(ushort *)(param_1 + 0x9b);
  }
  else {
    uVar2 = *(ushort *)(param_1 + 0x8b + param_2 * 2);
  }
  if (uVar2 != 0) {
    iVar5 = FUN_004da1d0(param_1);
    if (iVar5 != 0) {
      puVar7 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x89) != 0) &&
          (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x89)],
          (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
        puVar7 = puVar3;
      }
      if (puVar7 != (unit_struct *)0x0) {
        FUN_0051ff40(puVar7);
      }
    }
    iVar5 = (uint)uVar2 * 10;
    if (*(char *)((int)(game_state.sunlight_array + 0x32) + iVar5) == '\a') {
      *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 0x80;
    }
    else if (*(char *)((int)(game_state.sunlight_array + 0x32) + iVar5) == '\x1e') {
      cVar1 = *(char *)(param_1 + 0x2f);
      game_state.tribes_array[cVar1].field_0x91b = 1;
      sVar4 = *(short *)&game_state.tribes_array[cVar1].field_0x917 + -1;
      *(short *)&game_state.tribes_array[cVar1].field_0x917 = sVar4;
      if (sVar4 < 1) {
        *(undefined2 *)&game_state.tribes_array[cVar1].field_0x917 = 0;
        puVar7 = game_state.tribes_array[cVar1].shaman;
        if ((puVar7 != (unit_struct *)0x0) && (puVar7->field36_0x5f != 0)) {
          uVar8 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)puVar7->some_index].
                                  field_0x4 >> 2;
          if (uVar8 == 0) {
            uVar8 = 1;
          }
          uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          game_state.pseudo_random_val = uVar6 >> 0xd | uVar6 * 0x80000;
          sVar4 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)puVar7->some_index].
                             field_0x4 + (short)(game_state.pseudo_random_val % uVar8);
          puVar7->field36_0x5f = sVar4;
          if ((*(byte *)((int)&puVar7->flags_3 + 2) & 8) != 0) {
            puVar7->field36_0x5f = sVar4 * 2;
          }
        }
      }
    }
    sVar4 = *(short *)((int)(game_state.sunlight_array + 0x32) + iVar5 + 2) + -1;
    *(short *)((int)(game_state.sunlight_array + 0x32) + iVar5 + 2) = sVar4;
    if (sVar4 == 0) {
      game_state._841986_2_ = game_state._841986_2_ + -1;
      if (*(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar5 + 4) != 0) {
        FUN_004ef180(unit_land_array
                     [*(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar5 + 4)]);
      }
    }
    if (param_2 < '\0') {
      *(undefined2 *)(param_1 + 0x9b) = 0;
    }
    else {
      *(undefined2 *)(param_1 + 0x8b + param_2 * 2) = 0;
    }
  }
  *(undefined1 *)(param_1 + 0xa7) = 0;
  FUN_00501be0(param_1);
  return;
}
