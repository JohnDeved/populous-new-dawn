/* Ghidra 12.1.3 pseudocode; entry 00449670; FUN_00449670.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449670(int param_1)

{
  ushort uVar1;
  short sVar2;
  short sVar3;
  ushort uVar4;
  uint uVar5;
  uint uVar6;
  uint uVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  ushort local_6;

  uVar1 = *(ushort *)(param_1 + 2);
  sVar2 = *(short *)(param_1 + 6);
  local_6 = uVar1 & 0xfefe;
  game_state._842014_4_ = ZEXT24(uVar1);
  iVar9 = 0;
  iVar8 = 0x969d26;
  iVar10 = 0x969cfe;
  do {
    if (iVar9 == 0) {
      sVar3 = game_state.tribes_array[player_tribe_num].x;
    }
    else {
      sVar3 = game_state.tribes_array[player_tribe_num].y;
    }
    uVar4 = local_6 >> 8;
    if (iVar9 == 0) {
      uVar4 = uVar1 & 0xfe;
    }
    uVar6 = (int)(short)((uVar4 + 1) * 0x100) - (int)sVar3;
    uVar5 = uVar6;
    if ((int)uVar6 < 0) {
      uVar5 = -uVar6;
    }
    uVar7 = uVar6;
    if (((uVar5 & 0x8000) != 0) && (uVar7 = uVar5 - 0x10000, (int)uVar6 < 1)) {
      uVar7 = 0x10000 - uVar5;
    }
    iVar9 = iVar9 + 1;
    FUN_0044a070(uVar7,(int)sVar2,iVar10,iVar8);
    iVar8 = iVar8 + 8;
    iVar10 = iVar10 + 0x14;
  } while (iVar9 < 2);
  return;
}
