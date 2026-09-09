/* Ghidra 12.1.3 pseudocode; entry 004935c0; FUN_004935c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004935c0(char *param_1,ushort param_2,undefined2 param_3,int param_4)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  undefined4 *puVar7;
  ushort local_2;

  iVar3 = -1;
  local_2 = param_2 & 0xfefe;
  iVar5 = *param_1 * 0x18;
  iVar4 = -1;
  if ((((&game_state.field_0x9d62b)[iVar5] & 1) != 0) &&
     (*(ushort *)(&game_state.field_0x9d62c + iVar5) == local_2)) {
    iVar4 = (int)*param_1;
  }
  if (iVar4 != -1) goto LAB_0049371e;
  iVar5 = 0;
  iVar6 = 0x93a7a0;
  do {
    if ((*(byte *)(iVar6 + 3) & 1) == 0) {
      if (iVar3 == -1) {
        iVar3 = iVar5;
      }
    }
    else {
      iVar1 = iVar5;
      if (*(ushort *)(iVar6 + 4) == local_2) break;
    }
    iVar5 = iVar5 + 1;
    iVar6 = iVar6 + 0x18;
    iVar1 = iVar4;
  } while (iVar5 < 0x78);
  iVar4 = iVar1;
  if (iVar4 != -1) goto LAB_0049371e;
  if (iVar3 != -1) {
    iVar5 = iVar3 * 0x18;
    puVar7 = (undefined4 *)(&game_state.field_0x9d628 + iVar5);
    for (iVar4 = 6; iVar4 != 0; iVar4 = iVar4 + -1) {
      *puVar7 = 0;
      puVar7 = puVar7 + 1;
    }
    (&game_state.field_0x9d629)[iVar5] = 5;
    (&game_state.field_0x9d62b)[iVar5] = (&game_state.field_0x9d62b)[iVar5] | 1;
    *(ushort *)(&game_state.field_0x9d62c + iVar5) = local_2;
    uVar2 = 3;
    *(undefined2 *)(&game_state.field_0x9d62e + iVar5) = param_3;
    game_state._644600_4_ = game_state._644600_4_ + 1;
    (&game_state.field_0x9d62b)[iVar5] = (&game_state.field_0x9d62b)[iVar5] | 2;
    game_state._644604_4_ = game_state._644604_4_ + 1;
    game_state._644612_4_ = 1;
    game_state._644616_4_ = 3;
    game_state._644624_4_ = 1;
    game_state._644620_4_ = 2;
    iVar4 = iVar3;
    if ((int)game_state._644608_4_ < 1000) {
      if ((int)game_state._644608_4_ < 500) {
        if (299 < (int)game_state._644608_4_) {
          uVar2 = 1;
          goto LAB_00493714;
        }
      }
      else {
        game_state._644616_4_ = 1;
        game_state._644624_4_ = 2;
      }
    }
    else {
LAB_00493714:
      game_state._644616_4_ = 1;
      game_state._644624_4_ = uVar2;
    }
  }
  if (iVar4 == -1) {
    return -1;
  }
LAB_0049371e:
  *param_1 = (char)iVar4;
  if (param_4 == 0) {
    (&game_state.field_0x9d62a)[iVar4 * 0x18] = 0xff;
    *(undefined2 *)(&game_state.field_0x9d638 + iVar4 * 0x18) = 0;
    return iVar4;
  }
  (&game_state.field_0x9d62a)[iVar4 * 0x18] = *(undefined1 *)(param_4 + 0x2f);
  *(undefined2 *)(&game_state.field_0x9d638 + iVar4 * 0x18) = *(undefined2 *)(param_4 + 0x24);
  return iVar4;
}
