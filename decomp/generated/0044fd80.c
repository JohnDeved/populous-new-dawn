/* Ghidra 12.1.3 pseudocode; entry 0044fd80; FUN_0044fd80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0044fd80(int param_1,int param_2)

{
  ushort uVar1;
  int iVar2;
  int iVar3;
  ushort *puVar4;

  iVar2 = 0;
  if (0 < param_2) {
    puVar4 = (ushort *)(param_1 + 4);
    iVar3 = param_2;
    do {
      uVar1 = *puVar4;
      puVar4 = puVar4 + 4;
      iVar2 = iVar2 + (short)(&game_state.level_data[0].height)
                             [((uVar1 & 0xfe) * 2 | uVar1 & 0xfe00) * 2];
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
  }
  return iVar2 / param_2;
}
