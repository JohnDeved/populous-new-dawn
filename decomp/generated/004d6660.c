/* Ghidra 12.1.3 pseudocode; entry 004d6660; FUN_004d6660.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d6660(int param_1)

{
  short sVar1;
  uint uVar2;
  uint uVar3;

  uVar3 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].
                          field_0x4 >> 2;
  if (uVar3 == 0) {
    uVar3 = 1;
  }
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  game_state.pseudo_random_val = uVar2 >> 0xd | uVar2 * 0x80000;
  sVar1 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].field_0x4 +
          (short)(game_state.pseudo_random_val % uVar3);
  *(short *)(param_1 + 0x5f) = sVar1;
  if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
    *(short *)(param_1 + 0x5f) = sVar1 * 2;
  }
  return;
}
