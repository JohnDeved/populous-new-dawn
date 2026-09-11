/* Ghidra 12.1.3 pseudocode; entry 00493770; FUN_00493770.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00493770(char *param_1,ushort param_2)

{
  int *piVar1;
  byte bVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  ushort local_2;

  local_2 = param_2 & 0xfefe;
  iVar5 = *param_1 * 0x18;
  iVar4 = -1;
  if ((((&game_state.field_0x9d62b)[iVar5] & 1) != 0) &&
     (*(ushort *)(&game_state.field_0x9d62c + iVar5) == local_2)) {
    iVar4 = (int)*param_1;
  }
  iVar5 = iVar4;
  if (iVar4 == -1) {
    iVar6 = 0;
    iVar3 = 0x93a7a0;
    do {
      if (((*(byte *)(iVar3 + 3) & 1) != 0) && (iVar5 = iVar6, *(ushort *)(iVar3 + 4) == local_2))
      break;
      iVar6 = iVar6 + 1;
      iVar3 = iVar3 + 0x18;
      iVar5 = iVar4;
    } while (iVar6 < 0x78);
    if (iVar5 == -1) {
      return;
    }
  }
  *param_1 = -1;
  iVar4 = iVar5 * 0x18;
  if (((&game_state.field_0x9d62b)[iVar5 * 0x18] & 2) != 0) {
    (&game_state.field_0x9d62b)[iVar4] = (&game_state.field_0x9d62b)[iVar5 * 0x18] & 0xfd;
    if (0 < (int)game_state._644604_4_) {
      game_state._644604_4_ = game_state._644604_4_ + -1;
    }
    game_state._644612_4_ = 1;
    game_state._644616_4_ = 3;
    game_state._644620_4_ = 2;
    game_state._644624_4_ = 1;
    if ((int)game_state._644608_4_ < 1000) {
      if ((int)game_state._644608_4_ < 500) {
        if (299 < (int)game_state._644608_4_) {
          game_state._644616_4_ = 1;
          game_state._644624_4_ = 1;
        }
      }
      else {
        game_state._644616_4_ = 1;
        game_state._644624_4_ = 2;
      }
    }
    else {
      game_state._644616_4_ = 1;
      game_state._644624_4_ = 3;
    }
  }
  iVar5 = *(int *)(&game_state.field_0x9d63c + iVar4);
  while (iVar5 != 0) {
    if ((*(byte *)(iVar5 + 4) & 2) == 0) {
      *(short *)(&game_state.field_0x9d632 + iVar4) =
           *(short *)(&game_state.field_0x9d632 + iVar4) + -1;
      game_state._644608_4_ = game_state._644608_4_ + -1;
    }
    *(byte *)(iVar5 + 4) = *(byte *)(iVar5 + 4) & 0xfe;
    piVar1 = (int *)(iVar5 + 10);
    if (*(int *)(iVar5 + 6) == 0) {
      *(int *)(&game_state.field_0x9d63c + iVar4) = *piVar1;
    }
    else {
      *(int *)(*(int *)(iVar5 + 6) + 10) = *piVar1;
    }
    if (*piVar1 != 0) {
      *(undefined4 *)(*piVar1 + 6) = *(undefined4 *)(iVar5 + 6);
    }
    *(short *)(&game_state.field_0x9d630 + iVar4) =
         *(short *)(&game_state.field_0x9d630 + iVar4) + -1;
    iVar5 = *piVar1;
  }
  bVar2 = (&game_state.field_0x9d62b)[iVar4];
  (&game_state.field_0x9d62b)[iVar4] = bVar2 & 0xfe;
  (&game_state.field_0x9d62b)[iVar4] = bVar2 & 0xf6;
  game_state._644600_4_ = game_state._644600_4_ + -1;
  return;
}
