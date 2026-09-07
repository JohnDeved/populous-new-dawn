/* Ghidra 12.1.3 pseudocode; entry 00511340; FUN_00511340.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00511340(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  uint uVar3;
  unit_struct *puVar4;
  int iVar5;
  int iVar6;

  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x13;
    init_unit_class(param_1);
  }
  *(undefined1 *)(param_1 + 0x3a) = 0x34;
  *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffef;
  *(undefined2 *)(param_1 + 0x6c) = 32000;
  uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar2 = uVar3 >> 0xd;
  game_state.pseudo_random_val = uVar2 | uVar3 * 0x80000;
  iVar5 = 0;
  puVar4 = (unit_struct *)0x0;
  *(byte *)(param_1 + 0x72) = (byte)uVar2 & 3;
  iVar6 = 0xfffffff;
  for (puVar1 = swamp_effect_units; puVar1 != (unit_struct *)0x0; puVar1 = puVar1->next_unit) {
    if (puVar1->tribe_index == *(char *)(param_1 + 0x2f)) {
      iVar5 = iVar5 + 1;
      if (*(short *)&puVar1->field_0x6c < iVar6) {
        puVar4 = puVar1;
        iVar6 = (int)*(short *)&puVar1->field_0x6c;
      }
    }
  }
  if (0x1d < iVar5) {
    FUN_004ef180(puVar4);
  }
  return;
}
