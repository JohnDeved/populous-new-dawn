/* Ghidra 12.1.3 pseudocode; entry 0040b170; FUN_0040b170.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040b170(int param_1)

{
  byte bVar1;
  short sVar2;
  uint uVar3;
  short *psVar4;

  bVar1 = *(byte *)(param_1 + 0x2b);
  if ((unit_type_array_building[bVar1].field_0x49 & 0x20) != 0) {
    uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
    if (game_state.pseudo_random_val % 3 == 1) {
      sVar2 = (char)unit_type_array_building[bVar1].field_0x33 + 0x77;
    }
    else if (game_state.pseudo_random_val % 3 == 2) {
      sVar2 = (char)unit_type_array_building[bVar1].field_0x33 + 0x83;
    }
    else {
      sVar2 = (char)unit_type_array_building[bVar1].field_0x33 + 0x6b;
    }
    psVar4 = (short *)(param_1 + 99);
    *psVar4 = sVar2;
    *psVar4 = *psVar4 + *(char *)(param_1 + 0x2f) * 3;
    return;
  }
  sVar2 = *(short *)(unit_type_array_building + bVar1);
  *(short *)(param_1 + 99) = sVar2;
  if ((unit_type_array_building[bVar1].field_0x49 & 0x40) != 0) {
    *(short *)(param_1 + 99) = *(char *)(param_1 + 0x2f) + sVar2;
  }
  return;
}
