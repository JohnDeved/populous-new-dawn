/* Ghidra 12.1.3 pseudocode; entry 004e9dd0; FUN_004e9dd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e9dd0(int param_1,undefined4 *param_2)

{
  undefined4 uVar1;
  uint uVar2;
  short sVar3;
  int iVar4;

  iVar4 = (int)*(short *)(param_1 + 99);
  if (iVar4 != 0) {
    *(undefined2 *)(param_1 + 99) = 0;
    *(undefined1 *)(param_1 + 0x67) = 0;
    sVar3 = game_state.unit_related_array_1[iVar4].counter;
    if (((0 < sVar3) &&
        (sVar3 = sVar3 + -1, game_state.unit_related_array_1[iVar4].counter = sVar3, sVar3 < 1)) &&
       (game_state._755256_2_ = game_state._755256_2_ + -1,
       (game_state.unit_related_array_1[iVar4].flag & 4) == 0)) {
      game_state.unit_related_array_1[iVar4].flag = 0;
    }
  }
  *(undefined4 *)(param_1 + 0x4f) = *param_2;
  uVar1 = *param_2;
  uVar2 = *(uint *)(param_1 + 0xc);
  *(undefined4 *)(param_1 + 0x53) = uVar1;
  *(undefined4 *)(param_1 + 0x57) = uVar1;
  *(uint *)(param_1 + 0xc) = uVar2 | 0x1000;
  *(uint *)(param_1 + 0xc) = uVar2 & 0xffffff7f | 0x1000;
  return;
}
